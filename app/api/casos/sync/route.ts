// ── POST /api/casos/sync
// Estrategia batch: deleteMany + findMany (IDs existentes) + createMany + Promise.all(updates)
// → 4 queries fijas en lugar de N+1 secuenciales.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import type { CasoPrueba } from "@/lib/types"

const SyncBodySchema = z.object({
  casos: z.array(z.object({ id: z.string() }).passthrough()).default([]),
})

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const parsed = SyncBodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const casos = parsed.data.casos as unknown as CasoPrueba[]

  await prisma.$transaction(async (tx) => {
    const ids = casos.map(c => c.id)

    if (ids.length === 0) return

    // Deletes se gestionan explícitamente desde los handlers (no deleteMany notIn)
    const existing = await tx.casoPrueba.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })
    const existingSet = new Set(existing.map(c => c.id))

    const toCreate = casos
      .filter(c => !existingSet.has(c.id))
      .map(({ tareas, ...data }: CasoPrueba & { tareas?: unknown }) => data)

    const toUpdate = casos.filter(c => existingSet.has(c.id))

    if (toCreate.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.casoPrueba.createMany({ data: toCreate as any[] })
    }

    await Promise.all(toUpdate.map(c => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tareas, ...data } = c as CasoPrueba & { tareas?: unknown }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return tx.casoPrueba.update({ where: { id: c.id }, data: data as any })
    }))
  })

  invalidateMetricasCache()
  return NextResponse.json({ success: true, count: casos.length })
}
