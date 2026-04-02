// ── PUT /api/auth/password ────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { cambiarPasswordSchema } from "@/lib/backend/validators/auth.validator"
import { cambiarPasswordService } from "@/lib/backend/services/auth.service"

export async function PUT(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  // Rate limiting: 10 intentos por usuario (sub) cada 15 minutos
  // Usa el sub del JWT como clave para no bloquear a todos los usuarios desde la misma IP
  const ip = getClientIp(request.headers)
  const { allowed, resetAt } = checkRateLimit(rlKey(ip, `/api/auth/password:${payload.sub}`), 10, 15 * 60 * 1000)
  if (!allowed) {
    const retryAfterSecs = Math.ceil((resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Demasiados intentos de cambio de contraseña. Intenta de nuevo en 15 minutos." },
      {
        status: 429,
        headers: {
          "Retry-After":           String(retryAfterSecs),
          "X-RateLimit-Limit":     "10",
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const body = await request.json()
  const { error, value } = cambiarPasswordSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json(
      { error: error.details.map(d => d.message).join(", ") },
      { status: 400 }
    )
  }

  const result = await cambiarPasswordService(payload.sub, value.actual, value.nueva)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
