// ═══════════════════════════════════════════════════════════
//  SPRINT SERVICE — lógica de negocio para Sprints
//  grupoId: undefined = owner (ve todo), string = filtra al grupo
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

function grupoFilter(grupoId?: string) {
  return grupoId ? { grupoId } : {}
}

export async function getAllSprints(grupoId?: string, page = 1, limit = 50) {
  const skip  = (page - 1) * limit
  const where = grupoFilter(grupoId)
  const [sprints, total] = await prisma.$transaction([
    prisma.sprint.findMany({
      where,
      orderBy: { fechaInicio: "desc" },
      skip,
      take: limit,
    }),
    prisma.sprint.count({ where }),
  ])
  return { sprints, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function getSprintById(id: string) {
  return prisma.sprint.findUnique({ where: { id } })
}

/** Devuelve el sprint cuyo rango [fechaInicio, fechaFin] incluye la fecha actual. */
export async function getSprintActivo(grupoId?: string) {
  const now = new Date()
  return prisma.sprint.findFirst({
    where: { fechaInicio: { lte: now }, fechaFin: { gte: now }, ...grupoFilter(grupoId) },
    orderBy: { fechaInicio: "desc" },
  })
}

export async function createSprint(data: {
  nombre: string
  grupoId: string
  fechaInicio: Date | string
  fechaFin: Date | string
  objetivo?: string
}) {
  return prisma.sprint.create({
    data: {
      nombre:      data.nombre,
      grupoId:     data.grupoId,
      fechaInicio: new Date(data.fechaInicio),
      fechaFin:    new Date(data.fechaFin),
      objetivo:    data.objetivo,
    },
  })
}

export async function updateSprint(
  id: string,
  data: Partial<{ nombre: string; fechaInicio: Date | string; fechaFin: Date | string; objetivo: string }>
) {
  return prisma.sprint.update({
    where: { id },
    data: {
      ...(data.nombre      !== undefined && { nombre:      data.nombre }),
      ...(data.fechaInicio !== undefined && { fechaInicio: new Date(data.fechaInicio) }),
      ...(data.fechaFin    !== undefined && { fechaFin:    new Date(data.fechaFin) }),
      ...(data.objetivo    !== undefined && { objetivo:    data.objetivo }),
    },
  })
}

export async function deleteSprint(id: string) {
  return prisma.sprint.delete({ where: { id } })
}
