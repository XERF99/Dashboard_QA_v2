// ── POST /api/auth/login ──────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { loginSchema } from "@/lib/backend/validators/auth.validator"
import { loginService } from "@/lib/backend/services/auth.service"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máximo 10 intentos por IP cada 15 minutos
    const ip = getClientIp(request.headers)
    const { allowed, resetAt } = checkRateLimit(rlKey(ip, "/api/auth/login"), 10, 15 * 60 * 1000)

    if (!allowed) {
      const retryAfterSecs = Math.ceil((resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos." },
        {
          status: 429,
          headers: {
            "Retry-After":       String(retryAfterSecs),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
          },
        }
      )
    }

    const body = await request.json()
    const { error, value } = loginSchema.validate(body, { abortEarly: false })
    if (error) {
      return NextResponse.json(
        { error: error.details.map(d => d.message).join(", ") },
        { status: 400 }
      )
    }

    const result = await loginService(value.email, value.password)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }

    const response = NextResponse.json({
      user:        result.user,
      debeCambiar: result.debeCambiar,
    })

    // Guardar token en cookie httpOnly
    response.cookies.set("tcs_token", result.token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 8, // 8 horas
      path:     "/",
    })

    return response
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
