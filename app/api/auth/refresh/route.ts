// ── POST /api/auth/refresh ────────────────────────────────
// Uses the httpOnly refresh token cookie to issue a new access token.
// The refresh token itself is also rotated (refresh token rotation).
import { NextRequest, NextResponse } from "next/server"
import { verifyToken, signToken, signRefreshToken } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers)
    const { allowed, resetAt } = checkRateLimit(rlKey(ip, "POST /api/auth/refresh"), 20, 15 * 60 * 1000)
    if (!allowed) {
      const retryAfterSecs = Math.ceil((resetAt - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Demasiados intentos. Intenta de nuevo mas tarde." },
        { status: 429, headers: { "Retry-After": String(retryAfterSecs), "X-RateLimit-Limit": "20", "X-RateLimit-Remaining": "0" } },
      )
    }

    const refreshToken = request.cookies.get("tcs_refresh")?.value
    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token" }, { status: 401 })
    }

    const payload = await verifyToken(refreshToken) as (Awaited<ReturnType<typeof verifyToken>> & { type?: string }) | null
    if (!payload || payload.type !== "refresh") {
      return NextResponse.json({ error: "Refresh token invalido o expirado" }, { status: 401 })
    }

    // Verify user is still active
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, nombre: true, rol: true, grupoId: true, activo: true, grupo: { select: { activo: true } } },
    })

    if (!dbUser || !dbUser.activo) {
      return NextResponse.json({ error: "Cuenta desactivada" }, { status: 403 })
    }

    if (dbUser.grupoId && (!dbUser.grupo || !dbUser.grupo.activo)) {
      return NextResponse.json({ error: "Grupo desactivado" }, { status: 403 })
    }

    const tokenPayload = {
      sub: dbUser.id,
      email: dbUser.email,
      nombre: dbUser.nombre,
      rol: dbUser.rol,
      grupoId: dbUser.grupoId ?? undefined,
    }

    // Issue new access + refresh tokens (rotation)
    const [newToken, newRefresh] = await Promise.all([
      signToken(tokenPayload),
      signRefreshToken(tokenPayload),
    ])

    const response = NextResponse.json({
      user: { id: dbUser.id, email: dbUser.email, nombre: dbUser.nombre, rol: dbUser.rol, grupoId: dbUser.grupoId },
    })

    const isProduction = process.env.NODE_ENV === "production"

    response.cookies.set("tcs_token", newToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 60 * 60 * 8,
      path: "/",
    })

    response.cookies.set("tcs_refresh", newRefresh, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/api/auth/refresh",
    })

    return response
  } catch (err) {
    logger.error("auth/refresh", "Error refreshing token", err instanceof Error ? err : undefined)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
