// ── GET    /api/historias/[id]
// ── PUT    /api/historias/[id]
// ── DELETE /api/historias/[id]
import { NextRequest, NextResponse } from "next/server"
import { withAuth, checkHUAccess } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { updateHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { updateHistoria, deleteHistoria } from "@/lib/backend/services/historia.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { prisma } from "@/lib/backend/prisma"
import { audit } from "@/lib/backend/services/audit.service"

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/historias/:id"), 200, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const historia = await prisma.historiaUsuario.findUnique({ where: { id }, include: { casos: true } })
  if (!historia) return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 })
  if (payload.grupoId && historia.grupoId !== payload.grupoId) {
    return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 })
  }
  return NextResponse.json({ historia })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "PUT /api/historias/:id"), 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const existing = await checkHUAccess(id, payload.grupoId)
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const body = await request.json()
  const { error, value } = updateHistoriaSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const historia = await updateHistoria(id, value)
  invalidateMetricasCache(payload.grupoId)
  void audit({ actor: payload, action: "UPDATE", resource: "historias", resourceId: id })
  return NextResponse.json({ historia })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "DELETE /api/historias/:id"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const h = await checkHUAccess(id, payload.grupoId)
  if (!h) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  await deleteHistoria(id)
  invalidateMetricasCache(payload.grupoId)
  void audit({ actor: payload, action: "DELETE", resource: "historias", resourceId: id })
  return NextResponse.json({ success: true })
})
