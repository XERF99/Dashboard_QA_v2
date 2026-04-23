// ── GET    /api/tareas/[id]
// ── PUT    /api/tareas/[id]
// ── DELETE /api/tareas/[id]
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody, requireTarea } from "@/lib/backend/middleware/guards"
import { updateTareaSchema } from "@/lib/backend/validators/tarea.validator"
import { updateTarea, deleteTarea } from "@/lib/backend/services/tarea.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { NotFoundError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "GET /api/tareas/:id", 200, 60_000)

  const tarea = await prisma.tarea.findUnique({
    where: { id },
    include: { caso: { select: { hu: { select: { grupoId: true } } } } },
  })
  if (!tarea) throw new NotFoundError("Tarea")
  if (payload.grupoId && tarea.caso?.hu?.grupoId !== payload.grupoId) throw new NotFoundError("Tarea")
  return NextResponse.json({ tarea })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "PUT /api/tareas/:id", 120, 60_000)

  await requireTarea(id, payload.grupoId)
  const value = await requireBody(request, updateTareaSchema, { allowUnknown: true })

  const tarea = await updateTarea(id, value)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ tarea })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "DELETE /api/tareas/:id", 60, 60_000)

  await requireTarea(id, payload.grupoId)

  await deleteTarea(id)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ success: true })
})
