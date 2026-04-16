// ── GET /api/config  — obtener configuración global
// ── PUT /api/config  — actualizar configuración (admin)
import { NextRequest, NextResponse } from "next/server"
import { withAuth, withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { updateConfigSchema } from "@/lib/backend/validators/config.validator"
import { getConfig, updateConfig } from "@/lib/backend/services/config.service"

export const GET = withAuth(async (request, payload) => {
  const config = await getConfig(payload.grupoId)
  return NextResponse.json({ config }, { headers: { "Cache-Control": "private, max-age=60" } })
})

export const PUT = withAuthAdmin(async (request, payload) => {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "PUT /api/config"), 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  if (body === null) return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 })
  const { error, value } = updateConfigSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const config = await updateConfig(payload.grupoId, value)
  return NextResponse.json({ config })
})
