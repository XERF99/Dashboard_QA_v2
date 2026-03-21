// ── GET  /api/tareas — listar todas
// ── POST /api/tareas — crear nueva
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { createTareaSchema } from "@/lib/backend/validators/tarea.validator"
import { getAllTareas, createTarea, getTareasByCaso, getTareasByHU } from "@/lib/backend/services/tarea.service"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { searchParams } = new URL(request.url)
  const casoPruebaId = searchParams.get("casoPruebaId")
  const huId         = searchParams.get("huId")

  if (casoPruebaId) {
    const tareas = await getTareasByCaso(casoPruebaId)
    return NextResponse.json({ tareas })
  }
  if (huId) {
    const tareas = await getTareasByHU(huId)
    return NextResponse.json({ tareas })
  }

  const tareas = await getAllTareas()
  return NextResponse.json({ tareas })
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { error, value } = createTareaSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const tarea = await createTarea(value)
  return NextResponse.json({ tarea }, { status: 201 })
}
