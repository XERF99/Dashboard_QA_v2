// ── GET    /api/sprints/[id] — obtener sprint por id
// ── PUT    /api/sprints/[id] — actualizar sprint
// ── DELETE /api/sprints/[id] — eliminar sprint
import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { NotFoundError, ValidationError } from "@/lib/backend/errors"
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

async function getSprintIfAllowed(id: string, grupoId: string | undefined) {
  const sprint = await getSprintById(id)
  if (!sprint) return null
  if (grupoId && sprint.grupoId !== grupoId) return null
  return sprint
}

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const sprint = await getSprintIfAllowed(id, payload.grupoId)
  if (!sprint) throw new NotFoundError("Sprint")
  return NextResponse.json({ sprint })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "PUT /api/sprints/:id", 60, 60_000)

  const existing = await getSprintIfAllowed(id, payload.grupoId)
  if (!existing) throw new NotFoundError("Sprint")

  const parsed = UpdateSprintSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    throw new ValidationError("Payload inválido", parsed.error.issues.map(i => i.message))
  }
  const { nombre, fechaInicio, fechaFin, objetivo } = parsed.data

  const inicio = new Date(fechaInicio ?? existing.fechaInicio)
  const fin    = new Date(fechaFin    ?? existing.fechaFin)
  if (inicio >= fin) {
    throw new ValidationError("fechaInicio debe ser anterior a fechaFin")
  }

  const sprint = await updateSprint(id, { nombre, fechaInicio, fechaFin, objetivo })
  return NextResponse.json({ sprint })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "DELETE /api/sprints/:id", 60, 60_000)

  const sprint = await prisma.sprint.findUnique({ where: { id }, select: { grupoId: true } })
  if (!sprint || (payload.grupoId && sprint.grupoId !== payload.grupoId)) {
    throw new NotFoundError("Sprint")
  }
  await deleteSprint(id)
  return NextResponse.json({ success: true })
})
