// ── GET    /api/sprints/[id] — obtener sprint por id
// ── PUT    /api/sprints/[id] — actualizar sprint
// ── DELETE /api/sprints/[id] — eliminar sprint
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import {
  getSprintById,
  updateSprint,
  deleteSprint,
} from "@/lib/backend/services/sprint.service"
import { prisma } from "@/lib/backend/prisma"

const UpdateSprintSchema = z.object({
  nombre:      z.string().min(1).optional(),
  fechaInicio: z.string().optional(),
  fechaFin:    z.string().optional(),
  objetivo:    z.string().optional(),
})

// Verifica que el sprint pertenezca al workspace del llamante.
// Owner (grupoId undefined) siempre tiene acceso.
// Devuelve el sprint completo para evitar una segunda query en PUT.
async function getSprintIfAllowed(id: string, grupoId: string | undefined) {
  const sprint = await getSprintById(id)
  if (!sprint) return null
  if (grupoId && sprint.grupoId !== grupoId) return null
  return sprint
}

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const sprint = await getSprintIfAllowed(id, payload.grupoId)
  if (!sprint) return NextResponse.json({ error: "Sprint no encontrado" }, { status: 404 })
  return NextResponse.json({ sprint })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "PUT /api/sprints/:id"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  // Fetch sprint once — used for access check AND current fechas
  const existing = await getSprintIfAllowed(id, payload.grupoId)
  if (!existing) return NextResponse.json({ error: "Sprint no encontrado" }, { status: 404 })

  const parsed = UpdateSprintSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const { nombre, fechaInicio, fechaFin, objetivo } = parsed.data

  // Use incoming value OR current value so a single-field update is validated correctly
  const inicio = new Date(fechaInicio ?? existing.fechaInicio)
  const fin    = new Date(fechaFin    ?? existing.fechaFin)
  if (inicio >= fin) {
    return NextResponse.json(
      { error: "fechaInicio debe ser anterior a fechaFin" },
      { status: 400 }
    )
  }

  const sprint = await updateSprint(id, { nombre, fechaInicio, fechaFin, objetivo })
  return NextResponse.json({ sprint })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "DELETE /api/sprints/:id"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  // Inline access check without extra query when access is ok
  const sprint = await prisma.sprint.findUnique({ where: { id }, select: { grupoId: true } })
  if (!sprint || (payload.grupoId && sprint.grupoId !== payload.grupoId)) {
    return NextResponse.json({ error: "Sprint no encontrado" }, { status: 404 })
  }
  await deleteSprint(id)
  return NextResponse.json({ success: true })
})
