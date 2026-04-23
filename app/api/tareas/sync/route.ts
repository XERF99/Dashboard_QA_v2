// ── POST /api/tareas/sync
// Estrategia batch: deleteMany + findMany (IDs existentes) + createMany + Promise.all(updates)
// → 4 queries fijas en lugar de N+1 secuenciales.
import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { ValidationError, ForbiddenError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import type { Tarea } from "@/lib/types"

const SyncBodySchema = z.object({
  tareas: z
    .array(z.object({ id: z.string() }).passthrough())
    .max(2000, "No se pueden sincronizar más de 2000 tareas a la vez")
    .default([]),
})

export const POST = withAuth(async (request, payload) => {
  await requireRateLimit(request, "POST /api/tareas/sync", 10, 60_000)

  const parsed = SyncBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    throw new ValidationError("Payload inválido", parsed.error.issues.map(i => i.message))
  }
  const tareas = parsed.data.tareas as unknown as Tarea[]

  await prisma.$transaction(async (tx) => {
    const ids = tareas.map(t => t.id)

    if (ids.length === 0) return

    // Deletes se gestionan explícitamente desde los handlers (no deleteMany notIn)
    const existing = await tx.tarea.findMany({
      where: {
        id: { in: ids },
        // Workspace isolation: non-owner users can only sync tareas in their group
        ...(payload.grupoId ? { caso: { hu: { grupoId: payload.grupoId } } } : {}),
      },
      select: { id: true },
    })
    const existingSet = new Set(existing.map(t => t.id))

    const toCreate = tareas.filter(t => !existingSet.has(t.id))
    const toUpdate = tareas.filter(t => existingSet.has(t.id))

    if (toCreate.length > 0) {
      // For non-owner users, verify all new tareas belong to their workspace via casoPruebaId
      if (payload.grupoId && toCreate.some(t => t.casoPruebaId)) {
        const casosIds = [...new Set(toCreate.map(t => t.casoPruebaId).filter(Boolean))] as string[]
        const validCasos = await tx.casoPrueba.findMany({
          where: { id: { in: casosIds }, hu: { grupoId: payload.grupoId } },
          select: { id: true },
        })
        const validSet = new Set(validCasos.map(c => c.id))
        const unauthorized = toCreate.filter(t => t.casoPruebaId && !validSet.has(t.casoPruebaId))
        if (unauthorized.length > 0) {
          throw new ForbiddenError("Acceso denegado: tareas fuera del workspace")
        }
      }
      // skipDuplicates evita fallos si el caso padre aún no fue persistido (race con casos/sync)
      await tx.tarea.createMany({
        data: toCreate as unknown as Prisma.TareaUncheckedCreateInput[],
        skipDuplicates: true,
      })
    }

    await Promise.all(toUpdate.map(t =>
      tx.tarea.update({
        where: { id: t.id },
        data:  t as unknown as Prisma.TareaUncheckedUpdateInput,
      })
    ))
  })

  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ success: true, count: tareas.length })
})
