// ── GET    /api/sprints/[id] — obtener sprint por id
// ── PUT    /api/sprints/[id] — actualizar sprint
// ── DELETE /api/sprints/[id] — eliminar sprint
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import {
  getSprintById,
  updateSprint,
  deleteSprint,
} from "@/lib/backend/services/sprint.service"

const UpdateSprintSchema = z.object({
  nombre:      z.string().min(1).optional(),
  fechaInicio: z.string().optional(),
  fechaFin:    z.string().optional(),
  objetivo:    z.string().optional(),
})

type Ctx = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Ctx) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const sprint = await getSprintById(id)
  if (!sprint) return NextResponse.json({ error: "Sprint no encontrado" }, { status: 404 })
  return NextResponse.json({ sprint })
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const parsed = UpdateSprintSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const { nombre, fechaInicio, fechaFin, objetivo } = parsed.data

  if (fechaInicio && fechaFin && new Date(fechaInicio) >= new Date(fechaFin)) {
    return NextResponse.json(
      { error: "fechaInicio debe ser anterior a fechaFin" },
      { status: 400 }
    )
  }

  const sprint = await updateSprint(id, { nombre, fechaInicio, fechaFin, objetivo })
  return NextResponse.json({ sprint })
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  await deleteSprint(id)
  return NextResponse.json({ success: true })
}
