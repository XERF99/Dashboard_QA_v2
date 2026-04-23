// ── POST /api/auth/refresh ────────────────────────────────
// Uses the httpOnly refresh token cookie to issue a new access token.
// The refresh token itself is also rotated (refresh token rotation).
import { NextResponse } from "next/server"
import { verifyToken, signToken, signRefreshToken } from "@/lib/backend/middleware/auth.middleware"
import { withErrorHandler } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { UnauthorizedError, ForbiddenError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"

export const POST = withErrorHandler(async (request) => {
  await requireRateLimit(request, "POST /api/auth/refresh", 20, 15 * 60 * 1000)

  const refreshToken = request.cookies.get("tcs_refresh")?.value
  if (!refreshToken) throw new UnauthorizedError("No refresh token")

  const payload = await verifyToken(refreshToken) as (Awaited<ReturnType<typeof verifyToken>> & { type?: string }) | null
  if (!payload || payload.type !== "refresh") {
    throw new UnauthorizedError("Refresh token invalido o expirado")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, nombre: true, rol: true, grupoId: true, activo: true, grupo: { select: { activo: true } } },
  })

  if (!dbUser || !dbUser.activo) throw new ForbiddenError("Cuenta desactivada")
  if (dbUser.grupoId && (!dbUser.grupo || !dbUser.grupo.activo)) throw new ForbiddenError("Grupo desactivado")

  const tokenPayload = {
    sub: dbUser.id,
    email: dbUser.email,
    nombre: dbUser.nombre,
    rol: dbUser.rol,
    grupoId: dbUser.grupoId ?? undefined,
  }

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
    maxAge: 60 * 60 * 24 * 7,
    path: "/api/auth/refresh",
  })

  return response
})
