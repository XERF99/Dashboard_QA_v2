// ── GET  /api/historias — listar todas
// ── POST /api/historias — crear nueva
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody } from "@/lib/backend/middleware/guards"
import { createHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { getAllHistorias, createHistoria } from "@/lib/backend/services/historia.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { audit } from "@/lib/backend/services/audit.service"
import { ValidationError } from "@/lib/backend/errors"

export const GET = withAuth(async (request, payload) => {
  const { searchParams } = new URL(request.url)
  const page        = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit       = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))
  const sprint      = searchParams.get("sprint")      ?? undefined
  const responsable = searchParams.get("responsable") ?? undefined
  const q           = searchParams.get("q")?.trim()    ?? undefined
  const cursor      = searchParams.get("cursor")       ?? undefined

  const result = await getAllHistorias(payload.grupoId, page, limit, { sprint, responsable, q, cursor })
  return NextResponse.json(result)
})

export const POST = withAuth(async (request, payload) => {
  await requireRateLimit(request, "POST /api/historias", 60, 60 * 60 * 1000, payload.sub)

  const value = await requireBody(request, createHistoriaSchema)

  const grupoId = value.grupoId ?? payload.grupoId
  if (!grupoId) throw new ValidationError("grupoId es requerido")

  const historia = await createHistoria({ ...value, grupoId })
  invalidateMetricasCache(grupoId)
  void audit({ actor: payload, action: "CREATE", resource: "historias", resourceId: historia.id, meta: { titulo: historia.titulo } })
  return NextResponse.json({ historia }, { status: 201 })
})
