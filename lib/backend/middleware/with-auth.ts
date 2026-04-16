import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin, type JWTPayload } from "./auth.middleware"
import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteParams = { params: Promise<any> }

type AuthHandler = (
  request: NextRequest,
  payload: JWTPayload,
  ctx?: RouteParams
) => Promise<NextResponse>

/**
 * Wraps an API route handler with authentication.
 * Eliminates the repetitive `requireAuth` + `instanceof NextResponse` pattern.
 */
export function withAuth(handler: AuthHandler) {
  return async (request: NextRequest, ctx?: RouteParams): Promise<NextResponse> => {
    const payload = await requireAuth(request)
    if (payload instanceof NextResponse) return payload
    try {
      return await handler(request, payload, ctx)
    } catch (e) {
      logger.error(request.nextUrl.pathname, "Unhandled error", e)
      const msg = e instanceof Error ? e.message : "Error interno"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }
}

/**
 * Wraps an API route handler with admin authentication.
 */
export function withAuthAdmin(handler: AuthHandler) {
  return async (request: NextRequest, ctx?: RouteParams): Promise<NextResponse> => {
    const payload = await requireAdmin(request)
    if (payload instanceof NextResponse) return payload
    try {
      return await handler(request, payload, ctx)
    } catch (e) {
      logger.error(request.nextUrl.pathname, "Unhandled error", e)
      const msg = e instanceof Error ? e.message : "Error interno"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
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
