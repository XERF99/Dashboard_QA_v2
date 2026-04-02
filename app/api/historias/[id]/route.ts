// ── GET    /api/historias/[id]
// ── PUT    /api/historias/[id]
// ── DELETE /api/historias/[id]
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { updateHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { updateHistoria, deleteHistoria } from "@/lib/backend/services/historia.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"
import { audit } from "@/lib/backend/services/audit.service"

// Fetches the full historia and checks workspace access in a single query.
// Owner (grupoId undefined) always has access.
// Returns null if not found or access denied.
async function getHistoriaIfAllowed(id: string, grupoId: string | undefined) {
  const historia = await prisma.historiaUsuario.findUnique({ where: { id }, include: { casos: true } })
  if (!historia) return null
  if (grupoId && historia.grupoId !== grupoId) return null
  return historia
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/historias/:id"), 200, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const { id } = await params

  try {
    const historia = await getHistoriaIfAllowed(id, payload.grupoId)
    if (!historia) return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 })
    return NextResponse.json({ historia })
  } catch (e) {
    logger.error("GET /api/historias/:id", "Error al obtener historia", e)
    const msg = e instanceof Error ? e.message : "Error al obtener historia"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  const existing = await getHistoriaIfAllowed(id, payload.grupoId)
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const body = await request.json()
  const { error, value } = updateHistoriaSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  try {
    const historia = await updateHistoria(id, value)
    invalidateMetricasCache(payload.grupoId)
    void audit({ actor: payload, action: "UPDATE", resource: "historias", resourceId: id })
    return NextResponse.json({ historia })
  } catch (e) {
    logger.error("PUT /api/historias/:id", "Error al actualizar historia", e)
    const msg = e instanceof Error ? e.message : "Error al actualizar historia"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  // Inline access check: just need grupoId, no include needed
  const h = await prisma.historiaUsuario.findUnique({ where: { id }, select: { grupoId: true } })
  if (!h || (payload.grupoId && h.grupoId !== payload.grupoId)) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  try {
    await deleteHistoria(id)
    invalidateMetricasCache(payload.grupoId)
    void audit({ actor: payload, action: "DELETE", resource: "historias", resourceId: id })
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error("DELETE /api/historias/:id", "Error al eliminar historia", e)
    const msg = e instanceof Error ? e.message : "Error al eliminar historia"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
