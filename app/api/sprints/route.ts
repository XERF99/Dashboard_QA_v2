// ── GET  /api/sprints — listar todos (acepta ?activo=true para solo el activo)
// ── POST /api/sprints — crear nuevo sprint
import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { ValidationError } from "@/lib/backend/errors"
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
  grupoId:     z.string().optional(),
})

export const GET = withAuth(async (request, payload) => {
  const { searchParams } = new URL(request.url)
  const soloActivo = searchParams.get("activo") === "true"

  if (soloActivo) {
    const sprint = await getSprintActivo(payload.grupoId)
    return NextResponse.json({ sprint })
  }

  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))
  const result = await getAllSprints(payload.grupoId, page, limit)
  return NextResponse.json(result)
})

export const POST = withAuth(async (request, payload) => {
  await requireRateLimit(request, "POST /api/sprints", 60, 60_000)

  const parsed = CreateSprintSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    throw new ValidationError("Payload inválido", parsed.error.issues.map(i => i.message))
  }
  const { nombre, fechaInicio, fechaFin, objetivo, grupoId: bodyGrupoId } = parsed.data

  if (new Date(fechaInicio) >= new Date(fechaFin)) {
    throw new ValidationError("fechaInicio debe ser anterior a fechaFin")
  }

  const grupoId = payload.grupoId ?? bodyGrupoId
  if (!grupoId) throw new ValidationError("grupoId es requerido")

  const sprint = await createSprint({ nombre, grupoId, fechaInicio, fechaFin, objetivo })
  return NextResponse.json({ sprint }, { status: 201 })
})
