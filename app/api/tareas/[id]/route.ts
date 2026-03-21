// ── GET    /api/tareas/[id]
// ── PUT    /api/tareas/[id]
// ── DELETE /api/tareas/[id]
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { updateTareaSchema } from "@/lib/backend/validators/tarea.validator"
import { getTareaById, updateTarea, deleteTarea } from "@/lib/backend/services/tarea.service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const tarea = await getTareaById(id)
  if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
  return NextResponse.json({ tarea })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const body = await request.json()
  const { error, value } = updateTareaSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const tarea = await updateTarea(id, value)
  return NextResponse.json({ tarea })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  await deleteTarea(id)
  return NextResponse.json({ success: true })
}
