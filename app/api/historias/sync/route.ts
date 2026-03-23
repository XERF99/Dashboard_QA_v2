// ── POST /api/historias/sync
// Recibe el array completo de historias del frontend y sincroniza con la DB:
// upsert las que están en el array, elimina las que ya no están.
// Estrategia batch: deleteMany + findMany (IDs existentes) + createMany + Promise.all(updates)
// → 4 queries fijas en lugar de N+1 secuenciales.
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import type { HistoriaUsuario } from "@/lib/types"

const SyncBodySchema = z.object({
  historias: z.array(z.object({ id: z.string() }).passthrough()).default([]),
})

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const parsed = SyncBodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const historias = parsed.data.historias as unknown as HistoriaUsuario[]

  await prisma.$transaction(async (tx) => {
    const ids = historias.map(h => h.id)

    if (ids.length === 0) return

    // 1. Obtener IDs que ya existen en la BD (1 query)
    // Nota: los deletes se gestionan de forma explícita desde los handlers
    // para evitar borrar registros de otros usuarios en entornos multi-usuario.
    const existing = await tx.historiaUsuario.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    })
    const existingSet = new Set(existing.map(h => h.id))

    // 2. Separar en creates y updates
    const toCreate = historias
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(h => !existingSet.has(h.id))
      .map(({ casos, ...data }: HistoriaUsuario & { casos?: unknown }) => data)

    const toUpdate = historias.filter(h => existingSet.has(h.id))

    // 3. Insert en batch para los nuevos (1 query)
    if (toCreate.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await tx.historiaUsuario.createMany({ data: toCreate as any[] })
    }

    // 4. Updates en paralelo (N queries paralelas, no secuenciales)
    await Promise.all(toUpdate.map(h => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { casos, ...data } = h as HistoriaUsuario & { casos?: unknown }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return tx.historiaUsuario.update({ where: { id: h.id }, data: data as any })
    }))
  })

  invalidateMetricasCache()
  return NextResponse.json({ success: true, count: historias.length })
}
