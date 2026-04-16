// ── GET  /api/casos — listar todos
// ── POST /api/casos — crear nuevo
import { NextRequest, NextResponse } from "next/server"
import { withAuth, checkHUAccess } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { createCasoSchema } from "@/lib/backend/validators/caso.validator"
import { getAllCasos, createCaso, getCasosByHU } from "@/lib/backend/services/caso.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { audit } from "@/lib/backend/services/audit.service"

export const GET = withAuth(async (request, payload) => {
  const { searchParams } = new URL(request.url)
  const huId  = searchParams.get("huId")
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")   || 1)
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "100") || 100))

  if (huId) {
    // Validar que la HU pertenezca al workspace del usuario (owner ve todo)
    if (payload.grupoId) {
      const hu = await checkHUAccess(huId, payload.grupoId)
      if (!hu) return NextResponse.json({ casos: [] })
    }
    const result = await getCasosByHU(huId, page, limit)
    return NextResponse.json(result)
  }

  const result = await getAllCasos(payload.grupoId, page, limit)
  return NextResponse.json(result)
})

export const POST = withAuth(async (request, payload) => {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "POST /api/casos"), 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (body === null) return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  const { error, value } = createCasoSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  // Verificar que la HU existe y pertenece al workspace
  const hu = await checkHUAccess(value.huId, payload.grupoId)
  if (!hu) {
    return NextResponse.json({ error: "La Historia de Usuario no existe o no pertenece a tu workspace" }, { status: 422 })
  }

  const caso = await createCaso(value)
  invalidateMetricasCache(payload.grupoId)
  void audit({ actor: payload, action: "CREATE", resource: "casos", resourceId: caso.id, meta: { titulo: caso.titulo, huId: caso.huId } })
  return NextResponse.json({ caso }, { status: 201 })
})
