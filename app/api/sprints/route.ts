// ── GET  /api/sprints — listar todos (acepta ?activo=true para solo el activo)
// ── POST /api/sprints — crear nuevo sprint
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import {
  getAllSprints,
  getSprintActivo,
  createSprint,
} from "@/lib/backend/services/sprint.service"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const soloActivo = request.nextUrl.searchParams.get("activo") === "true"
  if (soloActivo) {
    const sprint = await getSprintActivo()
    return NextResponse.json({ sprint })
  }

  const sprints = await getAllSprints()
  return NextResponse.json({ sprints })
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { nombre, fechaInicio, fechaFin, objetivo } = body

  if (!nombre || !fechaInicio || !fechaFin) {
    return NextResponse.json(
      { error: "nombre, fechaInicio y fechaFin son requeridos" },
      { status: 400 }
    )
  }

  if (new Date(fechaInicio) >= new Date(fechaFin)) {
    return NextResponse.json(
      { error: "fechaInicio debe ser anterior a fechaFin" },
      { status: 400 }
    )
  }

  const sprint = await createSprint({ nombre, fechaInicio, fechaFin, objetivo })
  return NextResponse.json({ sprint }, { status: 201 })
}
