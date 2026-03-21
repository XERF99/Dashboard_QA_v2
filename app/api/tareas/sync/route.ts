// ── POST /api/tareas/sync
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import type { Tarea } from "@/lib/types"

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const tareas: Tarea[] = body.tareas ?? []

  await prisma.$transaction(async (tx) => {
    const ids = tareas.map(t => t.id)
    await tx.tarea.deleteMany({ where: { id: { notIn: ids } } })

    for (const t of tareas) {
      await tx.tarea.upsert({
        where:  { id: t.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: t as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: t as any,
      })
    }
  })

  return NextResponse.json({ success: true, count: tareas.length })
}
