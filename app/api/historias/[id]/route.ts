// ── GET    /api/historias/[id]
// ── PUT    /api/historias/[id]
// ── DELETE /api/historias/[id]
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody, requireHU } from "@/lib/backend/middleware/guards"
import { updateHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { updateHistoria, deleteHistoria } from "@/lib/backend/services/historia.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { NotFoundError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"
import { audit } from "@/lib/backend/services/audit.service"

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "GET /api/historias/:id", 200, 60_000)

  const historia = await prisma.historiaUsuario.findUnique({ where: { id }, include: { casos: true } })
  if (!historia) throw new NotFoundError("Historia")
  if (payload.grupoId && historia.grupoId !== payload.grupoId) throw new NotFoundError("Historia")
  return NextResponse.json({ historia })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "PUT /api/historias/:id", 120, 60_000)

  await requireHU(id, payload.grupoId)
  const value = await requireBody(request, updateHistoriaSchema, { allowUnknown: true })

  const historia = await updateHistoria(id, value)
  invalidateMetricasCache(payload.grupoId)
  void audit({ actor: payload, action: "UPDATE", resource: "historias", resourceId: id })
  return NextResponse.json({ historia })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "DELETE /api/historias/:id", 60, 60_000)

  await requireHU(id, payload.grupoId)

  await deleteHistoria(id)
  invalidateMetricasCache(payload.grupoId)
  void audit({ actor: payload, action: "DELETE", resource: "historias", resourceId: id })
  return NextResponse.json({ success: true })
})
