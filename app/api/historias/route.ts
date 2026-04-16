// ── GET  /api/historias — listar todas
// ── POST /api/historias — crear nueva
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { createHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { getAllHistorias, createHistoria } from "@/lib/backend/services/historia.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { audit } from "@/lib/backend/services/audit.service"

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
  // Rate limiting: 60 creaciones por usuario por hora (sync importaciones incluidas)
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, `POST /api/historias:${payload.sub}`), 60, 60 * 60 * 1000)
  if (!rl.allowed) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Demasiadas solicitudes de creación. Intenta en un momento." },
      {
        status: 429,
        headers: {
          "Retry-After":           String(retryAfterSecs),
          "X-RateLimit-Limit":     "60",
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const body = await request.json().catch(() => null)
  if (body === null) return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  const { error, value } = createHistoriaSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const historiaData = { ...value, grupoId: value.grupoId ?? payload.grupoId }
  const historia = await createHistoria(historiaData)
  invalidateMetricasCache(value.grupoId ?? payload.grupoId)
  void audit({ actor: payload, action: "CREATE", resource: "historias", resourceId: historia.id, meta: { titulo: historia.titulo } })
  return NextResponse.json({ historia }, { status: 201 })
})
