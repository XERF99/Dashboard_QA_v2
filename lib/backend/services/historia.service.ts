// ═══════════════════════════════════════════════════════════
//  HISTORIA SERVICE — lógica de negocio para HUs
//  grupoId: undefined = owner (ve todo), string = filtra al grupo
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

function grupoFilter(grupoId?: string) {
  return grupoId ? { grupoId } : {}
}

export async function getAllHistorias(grupoId?: string) {
  return prisma.historiaUsuario.findMany({
    where: grupoFilter(grupoId),
    orderBy: { fechaCreacion: "desc" },
  })
}

export async function getHistoriaById(id: string) {
  return prisma.historiaUsuario.findUnique({ where: { id }, include: { casos: true } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createHistoria(data: Record<string, unknown>) {
  return prisma.historiaUsuario.create({ data: data as any })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateHistoria(id: string, data: Record<string, unknown>) {
  return prisma.historiaUsuario.update({ where: { id }, data: data as any })
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
