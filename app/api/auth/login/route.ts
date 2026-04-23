// ── POST /api/auth/login ──────────────────────────────────
import { NextResponse } from "next/server"
import { loginSchema } from "@/lib/backend/validators/auth.validator"
import { loginService } from "@/lib/backend/services/auth.service"
import { signRefreshToken } from "@/lib/backend/middleware/auth.middleware"
import { withErrorHandler } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody } from "@/lib/backend/middleware/guards"
import { UnauthorizedError } from "@/lib/backend/errors"

export const POST = withErrorHandler(async (request) => {
  await requireRateLimit(request, "POST /api/auth/login", 10, 15 * 60 * 1000)

  const value = await requireBody(request, loginSchema)
  const result = await loginService(value.email, value.password)

  if (!result.success) throw new UnauthorizedError(result.error)

  const refreshToken = await signRefreshToken({
    sub:     result.user.id,
    email:   result.user.email,
    nombre:  result.user.nombre,
    rol:     result.user.rol,
    grupoId: result.user.grupoId ?? undefined,
  })

  const response = NextResponse.json({
    user:        result.user,
    debeCambiar: result.debeCambiar,
  })

  const isProduction = process.env.NODE_ENV === "production"

  response.cookies.set("tcs_token", result.token, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: "lax",
    maxAge:   60 * 60 * 8,
    path:     "/",
  })

  response.cookies.set("tcs_refresh", refreshToken, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: "strict",
    maxAge:   60 * 60 * 24 * 7,
    path:     "/api/auth/refresh",
  })

  return response
})
