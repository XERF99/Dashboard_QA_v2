// ── GET    /api/tareas/[id]
// ── PUT    /api/tareas/[id]
// ── DELETE /api/tareas/[id]
import { NextRequest, NextResponse } from "next/server"
import { withAuth, checkTareaAccess } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { updateTareaSchema } from "@/lib/backend/validators/tarea.validator"
import { updateTarea, deleteTarea } from "@/lib/backend/services/tarea.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { prisma } from "@/lib/backend/prisma"

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/tareas/:id"), 200, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  // Full fetch with caso relation for GET
  const tarea = await prisma.tarea.findUnique({
    where: { id },
    include: { caso: { select: { hu: { select: { grupoId: true } } } } },
  })
  if (!tarea) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
  if (payload.grupoId && tarea.caso?.hu?.grupoId !== payload.grupoId) {
    return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 })
  }
  return NextResponse.json({ tarea })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "PUT /api/tareas/:id"), 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const existing = await checkTareaAccess(id, payload.grupoId)
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const body = await request.json()
  const { error, value } = updateTareaSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const tarea = await updateTarea(id, value)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ tarea })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "DELETE /api/tareas/:id"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const existing = await checkTareaAccess(id, payload.grupoId)
  if (!existing) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  await deleteTarea(id)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ success: true })
})
