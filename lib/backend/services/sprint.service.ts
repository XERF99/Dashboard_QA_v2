// ═══════════════════════════════════════════════════════════
//  SPRINT SERVICE — lógica de negocio para Sprints
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

export async function getAllSprints() {
  return prisma.sprint.findMany({ orderBy: { fechaInicio: "desc" } })
}

export async function getSprintById(id: string) {
  return prisma.sprint.findUnique({ where: { id } })
}

/** Devuelve el sprint cuyo rango [fechaInicio, fechaFin] incluye la fecha actual. */
export async function getSprintActivo() {
  const now = new Date()
  return prisma.sprint.findFirst({
    where: { fechaInicio: { lte: now }, fechaFin: { gte: now } },
    orderBy: { fechaInicio: "desc" },
  })
}

export async function createSprint(data: {
  nombre: string
  fechaInicio: Date | string
  fechaFin: Date | string
  objetivo?: string
}) {
  return prisma.sprint.create({
    data: {
      nombre:      data.nombre,
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
