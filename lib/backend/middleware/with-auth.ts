import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin, type JWTPayload } from "./auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import { logger, runWithRequestId, getRequestId } from "@/lib/backend/logger"
import { HttpError } from "@/lib/backend/errors"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteParams = { params: Promise<any> }

type AuthHandler = (
  request: NextRequest,
  payload: JWTPayload,
  ctx?: RouteParams
) => Promise<NextResponse>

const REQUEST_ID_HEADER = "x-request-id"

function extractRequestId(request: NextRequest): string {
  // Defensive: tests sometimes use thin mocks without a `headers` property.
  const header = request.headers?.get?.(REQUEST_ID_HEADER)
  if (header && header.length > 0 && header.length <= 128) return header
  return crypto.randomUUID()
}

function applyRequestIdHeader(response: NextResponse, id: string): NextResponse {
  // Defensive: thin NextResponse mocks in tests may omit `headers`.
  if (response?.headers?.set && !response.headers.has?.(REQUEST_ID_HEADER)) {
    response.headers.set(REQUEST_ID_HEADER, id)
  }
  return response
}

function handleError(e: unknown, request: NextRequest): NextResponse {
  if (e instanceof HttpError) return e.toResponse()
  logger.error(request.nextUrl.pathname, "Unhandled error", e)
  const msg = e instanceof Error ? e.message : "Error interno"
  const requestId = getRequestId()
  const body: Record<string, unknown> = { error: msg }
  if (requestId) body.requestId = requestId
  return NextResponse.json(body, { status: 500 })
}

/**
 * Wraps an API route handler with authentication.
 * Eliminates the repetitive `requireAuth` + `instanceof NextResponse` pattern.
 */
export function withAuth(handler: AuthHandler) {
  return async (request: NextRequest, ctx?: RouteParams): Promise<NextResponse> => {
    const requestId = extractRequestId(request)
    return runWithRequestId(requestId, async () => {
      const payload = await requireAuth(request)
      if (payload instanceof NextResponse) return applyRequestIdHeader(payload, requestId)
      try {
        const res = await handler(request, payload, ctx)
        return applyRequestIdHeader(res, requestId)
      } catch (e) {
        return applyRequestIdHeader(handleError(e, request), requestId)
      }
    })
  }
}

/**
 * Wraps an API route handler with admin authentication.
 */
export function withAuthAdmin(handler: AuthHandler) {
  return async (request: NextRequest, ctx?: RouteParams): Promise<NextResponse> => {
    const requestId = extractRequestId(request)
    return runWithRequestId(requestId, async () => {
      const payload = await requireAdmin(request)
      if (payload instanceof NextResponse) return applyRequestIdHeader(payload, requestId)
      try {
        const res = await handler(request, payload, ctx)
        return applyRequestIdHeader(res, requestId)
      } catch (e) {
        return applyRequestIdHeader(handleError(e, request), requestId)
      }
    })
  }
}

type PublicHandler = (
  request: NextRequest,
  ctx?: RouteParams
) => Promise<NextResponse>

/**
 * Wraps a public (unauthenticated) route with the HttpError catch block,
 * matching `withAuth`'s error behavior without requiring auth.
 */
export function withErrorHandler(handler: PublicHandler) {
  return async (request: NextRequest, ctx?: RouteParams): Promise<NextResponse> => {
    const requestId = extractRequestId(request)
    return runWithRequestId(requestId, async () => {
      try {
        const res = await handler(request, ctx)
        return applyRequestIdHeader(res, requestId)
      } catch (e) {
        return applyRequestIdHeader(handleError(e, request), requestId)
      }
    })
  }
}

// ── Workspace access helpers ─────────────────────────────────
// Owner (grupoId undefined) always has access. Returns entity or null.

export async function checkHUAccess(huId: string, grupoId: string | undefined) {
  const hu = await prisma.historiaUsuario.findUnique({
    where: { id: huId },
    select: { grupoId: true },
  })
  if (!hu) return null
  if (grupoId && hu.grupoId !== grupoId) return null
  return hu
}

export async function checkCasoAccess(casoId: string, grupoId: string | undefined) {
  const caso = await prisma.casoPrueba.findUnique({
    where: { id: casoId },
    select: { huId: true, hu: { select: { grupoId: true } } },
  })
  if (!caso) return null
  if (grupoId && caso.hu.grupoId !== grupoId) return null
  return caso
}

export async function checkTareaAccess(tareaId: string, grupoId: string | undefined) {
  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    select: { caso: { select: { hu: { select: { grupoId: true } } } } },
  })
  if (!tarea) return null
  if (grupoId && tarea.caso?.hu?.grupoId !== grupoId) return null
  return tarea
}
