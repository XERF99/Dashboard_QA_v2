// ── POST /api/casos/sync
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import type { CasoPrueba } from "@/lib/types"

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const casos: CasoPrueba[] = body.casos ?? []

  await prisma.$transaction(async (tx) => {
    const ids = casos.map(c => c.id)
    await tx.casoPrueba.deleteMany({ where: { id: { notIn: ids } } })

    for (const c of casos) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tareas, ...data } = c as CasoPrueba & { tareas?: unknown }
      await tx.casoPrueba.upsert({
        where:  { id: c.id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        update: data as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create: data as any,
      })
    }
  })

  return NextResponse.json({ success: true, count: casos.length })
}
