// ── GET    /api/tareas/[id]
// ── PUT    /api/tareas/[id]
// ── DELETE /api/tareas/[id]
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { updateTareaSchema } from "@/lib/backend/validators/tarea.validator"
import { updateTarea, deleteTarea } from "@/lib/backend/services/tarea.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"

// Fetches the full tarea and checks workspace access in a single query.
// Owner (grupoId undefined) always has access. Returns null if not found or denied.
async function getTareaIfAllowed(id: string, grupoId: string | undefined) {
  const tarea = await prisma.tarea.findUnique({
    where: { id },
    include: { caso: { select: { hu: { select: { grupoId: true } } } } },
  })
  if (!tarea) return null
  if (grupoId && tarea.caso?.hu?.grupoId !== grupoId) return null
  return tarea
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/tareas/:id"), 200, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const { id } = await params

  try {
    const tarea = await getTareaIfAllowed(id, payload.grupoId)
    if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
    return NextResponse.json({ tarea })
  } catch (e) {
    logger.error("GET /api/tareas/:id", "Error al obtener tarea", e)
    const msg = e instanceof Error ? e.message : "Error al obtener tarea"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  // Inline access check — only need grupoId path
  const existing = await prisma.tarea.findUnique({
    where: { id },
    select: { caso: { select: { hu: { select: { grupoId: true } } } } },
  })
  if (!existing || (payload.grupoId && existing.caso?.hu?.grupoId !== payload.grupoId)) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  const body = await request.json()
  const { error, value } = updateTareaSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  try {
    const tarea = await updateTarea(id, value)
    invalidateMetricasCache(payload.grupoId)
    return NextResponse.json({ tarea })
  } catch (e) {
    logger.error("PUT /api/tareas/:id", "Error al actualizar tarea", e)
    const msg = e instanceof Error ? e.message : "Error al actualizar tarea"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  const existing = await prisma.tarea.findUnique({
    where: { id },
    select: { caso: { select: { hu: { select: { grupoId: true } } } } },
  })
  if (!existing || (payload.grupoId && existing.caso?.hu?.grupoId !== payload.grupoId)) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  }

  try {
    await deleteTarea(id)
    invalidateMetricasCache(payload.grupoId)
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error("DELETE /api/tareas/:id", "Error al eliminar tarea", e)
    const msg = e instanceof Error ? e.message : "Error al eliminar tarea"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
