// ── POST /api/tareas/sync
// Estrategia batch: deleteMany + findMany (IDs existentes) + createMany + Promise.all(updates)
// → 4 queries fijas en lugar de N+1 secuenciales.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import type { Tarea } from "@/lib/types"

const SyncBodySchema = z.object({
  tareas: z.array(z.object({ id: z.string() }).passthrough()).default([]),
})

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const parsed = SyncBodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const tareas = parsed.data.tareas as unknown as Tarea[]

  await prisma.$transaction(async (tx) => {
    const ids = tareas.map(t => t.id)

    if (ids.length === 0) return

    // Deletes se gestionan explícitamente desde los handlers (no deleteMany notIn)
    const existing = await tx.tarea.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })
    const existingSet = new Set(existing.map(t => t.id))

    const toCreate = tareas.filter(t => !existingSet.has(t.id))
    const toUpdate = tareas.filter(t => existingSet.has(t.id))

    if (toCreate.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.tarea.createMany({ data: toCreate as any[] })
    }

    await Promise.all(toUpdate.map(t =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tx.tarea.update({ where: { id: t.id }, data: t as any })
    ))
  })

  invalidateMetricasCache()
  return NextResponse.json({ success: true, count: tareas.length })
}
