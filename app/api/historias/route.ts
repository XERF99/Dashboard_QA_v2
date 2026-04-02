// ── GET  /api/historias — listar todas
// ── POST /api/historias — crear nueva
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { createHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { getAllHistorias, createHistoria } from "@/lib/backend/services/historia.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { logger } from "@/lib/backend/logger"
import { audit } from "@/lib/backend/services/audit.service"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { searchParams } = new URL(request.url)
  const page        = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit       = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))
  const sprint      = searchParams.get("sprint")      ?? undefined
  const responsable = searchParams.get("responsable") ?? undefined

  try {
    const result = await getAllHistorias(payload.grupoId, page, limit, { sprint, responsable })
    return NextResponse.json(result)
  } catch (e) {
    logger.error("GET /api/historias", "Error al obtener historias", e)
    const msg = e instanceof Error ? e.message : "Error al obtener historias"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  // Rate limiting: 60 creaciones por usuario por hora (sync importaciones incluidas)
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, `/api/historias:${payload.sub}`), 60, 60 * 60 * 1000)
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

  const body = await request.json()
  const { error, value } = createHistoriaSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  try {
    const historiaData = { ...value, grupoId: value.grupoId ?? payload.grupoId }
    const historia = await createHistoria(historiaData)
    invalidateMetricasCache(value.grupoId ?? payload.grupoId)
    void audit({ actor: payload, action: "CREATE", resource: "historias", resourceId: historia.id, meta: { titulo: historia.titulo } })
    return NextResponse.json({ historia }, { status: 201 })
  } catch (e) {
    logger.error("POST /api/historias", "Error al crear historia", e)
    const msg = e instanceof Error ? e.message : "Error al crear historia"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
