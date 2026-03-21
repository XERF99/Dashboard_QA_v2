// ── POST /api/historias/sync
// Recibe el array completo de historias del frontend y sincroniza con la DB:
// upsert las que están en el array, elimina las que ya no están.
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import type { HistoriaUsuario } from "@/lib/types"

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const historias: HistoriaUsuario[] = body.historias ?? []

  await prisma.$transaction(async (tx) => {
    const ids = historias.map(h => h.id)

    // Eliminar las que ya no existen
    await tx.historiaUsuario.deleteMany({ where: { id: { notIn: ids } } })

    // Upsert todas
    for (const h of historias) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { casos, ...data } = h as HistoriaUsuario & { casos?: unknown }
      await tx.historiaUsuario.upsert({
        where:  { id: h.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: data as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: data as any,
      })
    }
  })

  return NextResponse.json({ success: true, count: historias.length })
}
