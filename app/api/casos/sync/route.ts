// ── POST /api/casos/sync
// Estrategia batch: deleteMany + findMany (IDs existentes) + createMany + Promise.all(updates)
// → 4 queries fijas en lugar de N+1 secuenciales.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { prisma } from "@/lib/backend/prisma"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import type { CasoPrueba } from "@/lib/types"

const SyncBodySchema = z.object({
  casos: z
    .array(z.object({ id: z.string() }).passthrough())
    .max(1000, "No se pueden sincronizar más de 1000 casos a la vez")
    .default([]),
})

export const POST = withAuth(async (request, payload) => {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "POST /api/casos/sync"), 10, 60_000)
  if (!rl.allowed) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Demasiadas peticiones. Intenta en un momento." },
      {
        status: 429,
        headers: {
          "Retry-After":           String(retryAfterSecs),
          "X-RateLimit-Limit":     "10",
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const parsed = SyncBodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const casos = parsed.data.casos as unknown as CasoPrueba[]

  await prisma.$transaction(async (tx) => {
    const ids = casos.map(c => c.id)

    if (ids.length === 0) return

    // Deletes se gestionan explícitamente desde los handlers (no deleteMany notIn)
    const grupoFilter = payload.grupoId ? { hu: { grupoId: payload.grupoId } } : {}
    const existing = await tx.casoPrueba.findMany({
      where: { id: { in: ids }, ...grupoFilter },
      select: { id: true },
    })
    const existingSet = new Set(existing.map(c => c.id))

    const toCreate = casos
      .filter(c => !existingSet.has(c.id))
      .map(({ tareas, ...data }: CasoPrueba & { tareas?: unknown }) => data)

    const toUpdate = casos.filter(c => existingSet.has(c.id))

    if (toCreate.length > 0) {
      // Workspace isolation: validate that new casos' huIds belong to the caller's group
      if (payload.grupoId) {
        const huIds = [...new Set(toCreate.map(c => c.huId).filter(Boolean))] as string[]
        if (huIds.length > 0) {
          const validHUs = await tx.historiaUsuario.findMany({
            where: { id: { in: huIds }, grupoId: payload.grupoId },
            select: { id: true },
          })
          const validSet = new Set(validHUs.map(h => h.id))
          const unauthorized = toCreate.filter(c => c.huId && !validSet.has(c.huId))
          if (unauthorized.length > 0) {
            throw new Error("Acceso denegado: casos fuera del workspace")
          }
        }
      }
      // skipDuplicates evita fallos si la HU padre aún no fue persistida (race con historias/sync)
      await tx.casoPrueba.createMany({
        data: toCreate as unknown as Prisma.CasoPruebaUncheckedCreateInput[],
        skipDuplicates: true,
      })
    }

    await Promise.all(toUpdate.map(c => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tareas, ...data } = c as CasoPrueba & { tareas?: unknown }
      return tx.casoPrueba.update({
        where: { id: c.id },
        data:  data as unknown as Prisma.CasoPruebaUncheckedUpdateInput,
      })
    }))
  })

  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ success: true, count: casos.length })
})
