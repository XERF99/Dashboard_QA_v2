// ── GET  /api/sprints — listar todos (acepta ?activo=true para solo el activo)
// ── POST /api/sprints — crear nuevo sprint
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import {
  getAllSprints,
  getSprintActivo,
  createSprint,
} from "@/lib/backend/services/sprint.service"

const CreateSprintSchema = z.object({
  nombre:      z.string().min(1),
  fechaInicio: z.string().min(1),
  fechaFin:    z.string().min(1),
  objetivo:    z.string().optional(),
})

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const soloActivo = request.nextUrl.searchParams.get("activo") === "true"
  if (soloActivo) {
    const sprint = await getSprintActivo(payload.grupoId)
    return NextResponse.json({ sprint })
  }

  const sprints = await getAllSprints(payload.grupoId)
  return NextResponse.json({ sprints })
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const parsed = CreateSprintSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const { nombre, fechaInicio, fechaFin, objetivo } = parsed.data

  if (new Date(fechaInicio) >= new Date(fechaFin)) {
    return NextResponse.json(
      { error: "fechaInicio debe ser anterior a fechaFin" },
      { status: 400 }
    )
  }

  // grupoId requerido para no-owner; owner debe existir en el cuerpo si se pasa
  const grupoId = payload.grupoId
  if (!grupoId) {
    return NextResponse.json({ error: "Owner: especifica grupoId en el cuerpo" }, { status: 400 })
  }
  const sprint = await createSprint({ nombre, grupoId, fechaInicio, fechaFin, objetivo })
  return NextResponse.json({ sprint }, { status: 201 })
}
