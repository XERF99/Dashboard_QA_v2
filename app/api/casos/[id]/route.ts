// ── GET    /api/casos/[id]
// ── PUT    /api/casos/[id]
// ── DELETE /api/casos/[id]
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody, requireCaso } from "@/lib/backend/middleware/guards"
import { updateCasoSchema } from "@/lib/backend/validators/caso.validator"
import { updateCaso, deleteCaso } from "@/lib/backend/services/caso.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { NotFoundError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "GET /api/casos/:id", 200, 60_000)

  // Full fetch con tareas (más datos de los que ofrece requireCaso)
  const caso = await prisma.casoPrueba.findUnique({
    where: { id },
    include: { tareas: true, hu: { select: { grupoId: true } } },
  })
  if (!caso) throw new NotFoundError("Caso")
  if (payload.grupoId && caso.hu.grupoId !== payload.grupoId) throw new NotFoundError("Caso")
  return NextResponse.json({ caso })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "PUT /api/casos/:id", 120, 60_000)

  await requireCaso(id, payload.grupoId)
  const value = await requireBody(request, updateCasoSchema, { allowUnknown: true })

  const caso = await updateCaso(id, value)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ caso })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "DELETE /api/casos/:id", 60, 60_000)

  await requireCaso(id, payload.grupoId)

  await deleteCaso(id)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ success: true })
})
