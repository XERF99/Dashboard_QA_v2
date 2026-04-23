// ═══════════════════════════════════════════════════════════
//  NEXT.JS EDGE PROXY (Next 16+) — Centraliza la verificación
//  de autenticación para todos los endpoints de la API.
//  Rutas públicas (login, health) quedan exentas.
//  También genera y propaga `x-request-id` en cada request.
//
//  Convención: este archivo se llamaba `middleware.ts` hasta
//  Next.js 16. Desde v16 la convención oficial es `proxy.ts`
//  con la función exportada `proxy(request)`.
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

  if (origin) {
    try {
      const originHost = new URL(origin).host
      return originHost === host
    } catch { return false }
  }

  if (referer) {
    try {
      const refererHost = new URL(referer).host
      return refererHost === host
    } catch { return false }
  }

  return process.env.NODE_ENV !== "production"
}

// ── Request ID propagation ────────────────────────────────────
const REQUEST_ID_HEADER = "x-request-id"

function ensureRequestId(request: NextRequest): string {
  const existing = request.headers.get(REQUEST_ID_HEADER)
  if (existing && existing.length > 0 && existing.length <= 128) return existing
  return crypto.randomUUID()
}

function withRid(response: NextResponse, id: string): NextResponse {
  response.headers.set(REQUEST_ID_HEADER, id)
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = ensureRequestId(request)

  // Forward request headers downstream so handlers read the same requestId.
  const forwardedHeaders = new Headers(request.headers)
  forwardedHeaders.set(REQUEST_ID_HEADER, requestId)
  const nextOpts = { request: { headers: forwardedHeaders } }

  if (isPublic(pathname)) {
    return withRid(NextResponse.next(nextOpts), requestId)
  }

  if (MUTATING_METHODS.has(request.method) && !isValidOrigin(request)) {
    return withRid(
      NextResponse.json(
        { error: "Solicitud rechazada: origen no valido (CSRF)", requestId },
        { status: 403 },
      ),
      requestId,
    )
  }

  const contentLength = request.headers.get("content-length")
  if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
    return withRid(
      NextResponse.json(
        { error: "El cuerpo de la petición excede el límite permitido (1 MB)", requestId },
        { status: 413 },
      ),
      requestId,
    )
  }

  const token = extractToken(request)
  if (!token) {
    return withRid(
      NextResponse.json({ error: "No autenticado", requestId }, { status: 401 }),
      requestId,
    )
  }

  try {
    await jwtVerify(token, JWT_SECRET)
    return withRid(NextResponse.next(nextOpts), requestId)
  } catch {
    if (JWT_SECRET_PREVIOUS) {
      try {
        await jwtVerify(token, JWT_SECRET_PREVIOUS)
        return withRid(NextResponse.next(nextOpts), requestId)
      } catch { /* both secrets failed */ }
    }
    return withRid(
      NextResponse.json({ error: "Token inválido o expirado", requestId }, { status: 401 }),
      requestId,
    )
  }
}

export const config = {
  matcher: ["/api/((?!_next|favicon).*)"],
}
