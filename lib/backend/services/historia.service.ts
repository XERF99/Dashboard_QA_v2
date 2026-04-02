// ═══════════════════════════════════════════════════════════
//  HISTORIA SERVICE — lógica de negocio para HUs
//  grupoId: undefined = owner (ve todo), string = filtra al grupo
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"
import { Prisma } from "@prisma/client"

function grupoFilter(grupoId?: string) {
  return grupoId ? { grupoId } : {}
}

export async function getAllHistorias(
  grupoId?: string,
  page    = 1,
  limit   = 50,
  filters?: { sprint?: string; responsable?: string }
) {
  const skip  = (page - 1) * limit
  const where = {
    ...grupoFilter(grupoId),
    ...(filters?.sprint      ? { sprint:      filters.sprint }      : {}),
    ...(filters?.responsable ? { responsable: filters.responsable } : {}),
  }
  const [historias, total] = await prisma.$transaction([
    prisma.historiaUsuario.findMany({
      where,
      orderBy: { fechaCreacion: "desc" },
      skip,
      take: limit,
    }),
    prisma.historiaUsuario.count({ where }),
  ])
  return { historias, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function getHistoriaById(id: string) {
  return prisma.historiaUsuario.findUnique({ where: { id }, include: { casos: true } })
}

export async function createHistoria(data: Prisma.HistoriaUsuarioUncheckedCreateInput) {
  return prisma.historiaUsuario.create({ data })
}

export async function updateHistoria(id: string, data: Prisma.HistoriaUsuarioUncheckedUpdateInput) {
  return prisma.historiaUsuario.update({ where: { id }, data })
}

export async function deleteHistoria(id: string) {
  // onDelete: Cascade en CasoPrueba elimina casos y tareas en cascada
  return prisma.historiaUsuario.delete({ where: { id } })
}

export async function getHistoriasBySprint(sprint: string, grupoId?: string) {
  return prisma.historiaUsuario.findMany({
    where: { sprint, ...grupoFilter(grupoId) },
    orderBy: { fechaCreacion: "desc" },
  })
}

export async function getHistoriasByResponsable(responsable: string, grupoId?: string) {
  return prisma.historiaUsuario.findMany({
    where: { responsable, ...grupoFilter(grupoId) },
    orderBy: { fechaCreacion: "desc" },
  })
}
