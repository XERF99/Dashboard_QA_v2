// ── GET    /api/casos/[id]
// ── PUT    /api/casos/[id]
// ── DELETE /api/casos/[id]
import { NextRequest, NextResponse } from "next/server"
import { withAuth, checkCasoAccess } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { updateCasoSchema } from "@/lib/backend/validators/caso.validator"
import { updateCaso, deleteCaso } from "@/lib/backend/services/caso.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { prisma } from "@/lib/backend/prisma"

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/casos/:id"), 200, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  // Full fetch with tareas for GET (need more data than checkCasoAccess provides)
  const caso = await prisma.casoPrueba.findUnique({
    where: { id },
    include: { tareas: true, hu: { select: { grupoId: true } } },
  })
  if (!caso) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
  if (payload.grupoId && caso.hu.grupoId !== payload.grupoId) {
    return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
  }
  return NextResponse.json({ caso })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "PUT /api/casos/:id"), 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const existing = await checkCasoAccess(id, payload.grupoId)
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const body = await request.json()
  const { error, value } = updateCasoSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const caso = await updateCaso(id, value)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ caso })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "DELETE /api/casos/:id"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const existing = await checkCasoAccess(id, payload.grupoId)
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  await deleteCaso(id)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ success: true })
})
