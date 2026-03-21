// ═══════════════════════════════════════════════════════════
//  MIDDLEWARE DE AUTENTICACIÓN JWT
//  Verifica el token en el header Authorization o cookie.
//  Uso en API routes:
//    const payload = await requireAuth(request)
//    if (payload instanceof NextResponse) return payload
// ═══════════════════════════════════════════════════════════

import { jwtVerify, SignJWT } from "jose"
import { NextRequest, NextResponse } from "next/server"

const rawSecret = process.env.JWT_SECRET

if (!rawSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "[auth.middleware] JWT_SECRET no está definido. " +
    "Configura la variable de entorno antes de iniciar en producción."
  )
}

const JWT_SECRET = new TextEncoder().encode(
  rawSecret ?? "tcs-dashboard-dev-secret-only-for-local-dev"
)

export const JWT_EXPIRY = "8h"

export interface JWTPayload {
  sub: string      // user id
  email: string
  nombre: string
  rol: string
  iat?: number
  exp?: number
}

// ── Firmar un nuevo token ─────────────────────────────────
export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(JWT_SECRET)
}

// ── Verificar token y devolver payload ───────────────────
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// ── Extraer token del request (header o cookie) ──────────
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7)
  return request.cookies.get("tcs_token")?.value ?? null
}

// ── Guard: requiere autenticación ────────────────────────
export async function requireAuth(
  request: NextRequest
): Promise<JWTPayload | NextResponse> {
  const token = extractToken(request)
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }
  const payload = await verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
  }
  return payload
}

// ── Guard: requiere permiso de admin ─────────────────────
export async function requireAdmin(
  request: NextRequest
): Promise<JWTPayload | NextResponse> {
  const result = await requireAuth(request)
  if (result instanceof NextResponse) return result
  if (!["owner", "admin"].includes(result.rol)) {
    return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
  }
  return result
}
