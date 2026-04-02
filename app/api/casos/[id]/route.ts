// ── GET    /api/casos/[id]
// ── PUT    /api/casos/[id]
// ── DELETE /api/casos/[id]
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { updateCasoSchema } from "@/lib/backend/validators/caso.validator"
import { updateCaso, deleteCaso } from "@/lib/backend/services/caso.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"

// Fetches the full caso (with tareas) and checks workspace access in a single query.
// Owner (grupoId undefined) always has access. Returns null if not found or denied.
async function getCasoIfAllowed(id: string, grupoId: string | undefined) {
  const caso = await prisma.casoPrueba.findUnique({
    where: { id },
    include: { tareas: true, hu: { select: { grupoId: true } } },
  })
  if (!caso) return null
  if (grupoId && caso.hu.grupoId !== grupoId) return null
  return caso
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/casos/:id"), 200, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const { id } = await params

  try {
    const caso = await getCasoIfAllowed(id, payload.grupoId)
    if (!caso) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
    return NextResponse.json({ caso })
  } catch (e) {
    logger.error("GET /api/casos/:id", "Error al obtener caso", e)
    const msg = e instanceof Error ? e.message : "Error al obtener caso"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  // Inline access check — only need grupoId path, no full include
  const existing = await prisma.casoPrueba.findUnique({
    where: { id },
    select: { hu: { select: { grupoId: true } } },
  })
  if (!existing || (payload.grupoId && existing.hu.grupoId !== payload.grupoId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const body = await request.json()
  const { error, value } = updateCasoSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  try {
    const caso = await updateCaso(id, value)
    invalidateMetricasCache(payload.grupoId)
    return NextResponse.json({ caso })
  } catch (e) {
    logger.error("PUT /api/casos/:id", "Error al actualizar caso", e)
    const msg = e instanceof Error ? e.message : "Error al actualizar caso"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  const existing = await prisma.casoPrueba.findUnique({
    where: { id },
    select: { hu: { select: { grupoId: true } } },
  })
  if (!existing || (payload.grupoId && existing.hu.grupoId !== payload.grupoId)) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  try {
    await deleteCaso(id)
    invalidateMetricasCache(payload.grupoId)
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error("DELETE /api/casos/:id", "Error al eliminar caso", e)
    const msg = e instanceof Error ? e.message : "Error al eliminar caso"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
