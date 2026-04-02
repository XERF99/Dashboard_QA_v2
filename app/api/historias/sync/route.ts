// ── POST /api/historias/sync
// Recibe el array completo de historias del frontend y sincroniza con la DB:
// upsert las que están en el array, elimina las que ya no están.
// Estrategia batch: deleteMany + findMany (IDs existentes) + createMany + Promise.all(updates)
// → 4 queries fijas en lugar de N+1 secuenciales.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { prisma } from "@/lib/backend/prisma"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { logger } from "@/lib/backend/logger"
import type { HistoriaUsuario } from "@/lib/types"

const SyncBodySchema = z.object({
  historias: z
    .array(z.object({ id: z.string() }).passthrough())
    .max(500, "No se pueden sincronizar más de 500 historias a la vez")
    .default([]),
})

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "/api/historias/sync"), 30, 60_000)
  if (!rl.allowed) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Demasiadas peticiones. Intenta en un momento." },
      {
        status: 429,
        headers: {
          "Retry-After":           String(retryAfterSecs),
          "X-RateLimit-Limit":     "30",
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  // Solo usuarios con grupoId pueden sincronizar historias
  if (!payload.grupoId) {
    return NextResponse.json({ error: "Sin grupo asignado" }, { status: 403 })
  }
  const grupoId = payload.grupoId

  const parsed = SyncBodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const historias = parsed.data.historias as unknown as HistoriaUsuario[]

  try {
    await prisma.$transaction(async (tx) => {
      const ids = historias.map(h => h.id)

      if (ids.length === 0) return

      // 1. Obtener IDs que ya existen en la BD para este grupo (1 query)
      const existing = await tx.historiaUsuario.findMany({
        where: { id: { in: ids }, grupoId },
        select: { id: true },
      })
      const existingSet = new Set(existing.map(h => h.id))

      // 2. Separar en creates y updates
      const toCreate = historias
        .filter(h => !existingSet.has(h.id))
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(({ casos, ...data }: HistoriaUsuario & { casos?: unknown }) => ({
          ...data,
          grupoId, // el grupoId proviene del JWT, no del cliente
        }))

      const toUpdate = historias.filter(h => existingSet.has(h.id))

      // 3. Insert en batch para los nuevos (1 query)
      if (toCreate.length > 0) {
        await tx.historiaUsuario.createMany({
          data: toCreate as Prisma.HistoriaUsuarioUncheckedCreateInput[],
          skipDuplicates: true,
        })
      }

      // 4. Updates en paralelo (N queries paralelas, no secuenciales)
      await Promise.all(toUpdate.map(h => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { casos, ...data } = h as HistoriaUsuario & { casos?: unknown }
        return tx.historiaUsuario.update({
          where: { id: h.id },
          data:  data as Prisma.HistoriaUsuarioUncheckedUpdateInput,
        })
      }))
    })
  } catch (e) {
    logger.error("POST /api/historias/sync", "Error al sincronizar historias", e)
    const msg = e instanceof Error ? e.message : "Error al sincronizar"
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ success: true, count: historias.length })
}
