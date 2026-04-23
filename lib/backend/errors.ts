// ═══════════════════════════════════════════════════════════════
//  Errores HTTP tipados
//
//  Los handlers de API lanzan estas excepciones en vez de construir
//  respuestas manuales con NextResponse.json. `withAuth` las captura
//  y mapea a la respuesta adecuada (status + body + headers).
//
//  Esto centraliza el formato de error, los códigos semánticos y
//  los headers de rate-limit (Retry-After, X-RateLimit-*).
//  Cada respuesta de error incluye `requestId` cuando hay uno en el
//  AsyncLocalStorage del logger (facilita correlación cliente↔servidor).
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/backend/logger"

const REQUEST_ID_HEADER = "x-request-id"

function buildResponse(
  body: Record<string, unknown>,
  init: { status: number; headers?: Record<string, string> },
): NextResponse {
  const requestId = getRequestId()
  if (requestId) body.requestId = requestId
  const headers = { ...(init.headers ?? {}) }
  if (requestId) headers[REQUEST_ID_HEADER] = requestId
  return NextResponse.json(body, { status: init.status, headers })
}

export abstract class HttpError extends Error {
  abstract readonly status: number
  readonly code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = this.constructor.name
    this.code = code
  }

  toResponse(): NextResponse {
    const body: Record<string, unknown> = { error: this.message }
    if (this.code) body.code = this.code
    return buildResponse(body, { status: this.status })
  }
}

export class UnauthorizedError extends HttpError {
  readonly status = 401
}

export class ForbiddenError extends HttpError {
  readonly status = 403
}

// Entidades con género gramatical femenino en español (para "no encontrada").
// El resto usa la forma masculina por defecto ("no encontrado").
const ENTIDADES_FEMENINAS = new Set([
  "Historia", "Tarea", "Notificación", "Cuenta", "Sesión",
])

export class NotFoundError extends HttpError {
  readonly status = 404
  constructor(entity = "Recurso") {
    const sufijo = ENTIDADES_FEMENINAS.has(entity) ? "a" : "o"
    super(`${entity} no encontrad${sufijo}`)
  }
}

export class ValidationError extends HttpError {
  readonly status = 400
  readonly details?: string[]

  constructor(message = "Datos inválidos", details?: string[]) {
    super(message)
    this.details = details
  }

  override toResponse(): NextResponse {
    const body: Record<string, unknown> = { error: this.message }
    if (this.details && this.details.length > 0) body.details = this.details
    return buildResponse(body, { status: this.status })
  }
}

export class ConflictError extends HttpError {
  readonly status = 409
}

export class UnprocessableEntityError extends HttpError {
  readonly status = 422
}

export class RateLimitError extends HttpError {
  readonly status = 429
  readonly resetAt: number
  readonly limit: number

  constructor(resetAt: number, limit: number) {
    super("Demasiadas peticiones. Intenta en un momento.")
    this.resetAt = resetAt
    this.limit   = limit
  }

  override toResponse(): NextResponse {
    const retryAfterSecs = Math.max(1, Math.ceil((this.resetAt - Date.now()) / 1000))
    return buildResponse(
      { error: this.message },
      {
        status: this.status,
        headers: {
          "Retry-After":           String(retryAfterSecs),
          "X-RateLimit-Limit":     String(this.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }
}
