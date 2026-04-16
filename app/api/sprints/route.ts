// ── GET  /api/sprints — listar todos (acepta ?activo=true para solo el activo)
// ── POST /api/sprints — crear nuevo sprint
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
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
  grupoId:     z.string().optional(),  // owner lo provee en el body; non-owner usa el del JWT
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
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "POST /api/sprints"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const parsed = CreateSprintSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const { nombre, fechaInicio, fechaFin, objetivo, grupoId: bodyGrupoId } = parsed.data

  if (new Date(fechaInicio) >= new Date(fechaFin)) {
    return NextResponse.json(
      { error: "fechaInicio debe ser anterior a fechaFin" },
      { status: 400 }
    )
  }

  // Non-owner: grupoId del JWT. Owner: debe proveerlo en el body.
  const grupoId = payload.grupoId ?? bodyGrupoId
  if (!grupoId) {
    return NextResponse.json({ error: "grupoId es requerido" }, { status: 400 })
  }
  const sprint = await createSprint({ nombre, grupoId, fechaInicio, fechaFin, objetivo })
  return NextResponse.json({ sprint }, { status: 201 })
})
