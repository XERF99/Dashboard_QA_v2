// ═══════════════════════════════════════════════════════════
//  HISTORIA SERVICE — lógica de negocio para HUs
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

export async function getAllHistorias() {
  return prisma.historiaUsuario.findMany({ orderBy: { fechaCreacion: "desc" } })
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

export async function getHistoriasBySprint(sprint: string) {
  return prisma.historiaUsuario.findMany({ where: { sprint }, orderBy: { fechaCreacion: "desc" } })
}

export async function getHistoriasByResponsable(responsable: string) {
  return prisma.historiaUsuario.findMany({ where: { responsable }, orderBy: { fechaCreacion: "desc" } })
}
