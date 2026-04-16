// ═══════════════════════════════════════════════════════════
//  NEXT.JS EDGE MIDDLEWARE — Centraliza la verificación de
//  autenticación para todos los endpoints de la API.
//  Rutas públicas (login, health) quedan exentas.
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const rawSecret = process.env.JWT_SECRET
const JWT_SECRET = new TextEncoder().encode(
  rawSecret ?? "tcs-dashboard-dev-secret-only-for-local-dev"
)
const rawPrevious = process.env.JWT_SECRET_PREVIOUS
const JWT_SECRET_PREVIOUS = rawPrevious ? new TextEncoder().encode(rawPrevious) : null

// Rutas que NO requieren autenticación
const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/health",
]

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"))
}

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization")
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7)
  return request.cookies.get("tcs_token")?.value ?? null
}

// Maximum request body size (1 MB) — prevents large-payload DoS
const MAX_BODY_SIZE = 1 * 1024 * 1024

// Methods that mutate state and need CSRF protection
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  const host = request.headers.get("host")

  if (!host) return false

  // Accept if origin matches host
  if (origin) {
    try {
      const originHost = new URL(origin).host
      return originHost === host
    } catch { return false }
  }

  // Fallback to referer
  if (referer) {
    try {
      const refererHost = new URL(referer).host
      return refererHost === host
    } catch { return false }
  }

  // No origin or referer — block in production, allow in dev (for tools like curl/Postman)
  return process.env.NODE_ENV !== "production"
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // No proteger rutas públicas ni assets
  if (isPublic(pathname)) return NextResponse.next()

  // ── CSRF protection for mutating requests ──────────────────
  if (MUTATING_METHODS.has(request.method) && !isValidOrigin(request)) {
    return NextResponse.json(
      { error: "Solicitud rechazada: origen no valido (CSRF)" },
      { status: 403 },
    )
  }

  // ── Body size limit for mutating requests ────────────���─────
  const contentLength = request.headers.get("content-length")
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: "El cuerpo de la petición excede el límite permitido (1 MB)" },
      { status: 413 },
    )
  }

  const token = extractToken(request)
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch {
    // Fallback to previous secret during rotation window
    if (JWT_SECRET_PREVIOUS) {
      try {
        await jwtVerify(token, JWT_SECRET_PREVIOUS)
        return NextResponse.next()
      } catch { /* both secrets failed */ }
    }
    return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 })
  }
}

export const config = {
  matcher: ["/api/((?!_next|favicon).*)"],
}
