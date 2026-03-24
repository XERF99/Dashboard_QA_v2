// ═══════════════════════════════════════════════════════════
//  CASO SERVICE — lógica de negocio para Casos de Prueba
//  grupoId: undefined = owner (ve todo), string = filtra al grupo
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

function grupoHUFilter(grupoId?: string) {
  return grupoId ? { hu: { grupoId } } : {}
}

export async function getAllCasos(grupoId?: string) {
  return prisma.casoPrueba.findMany({
    where: grupoHUFilter(grupoId),
    orderBy: { fechaCreacion: "desc" },
  })
}

export async function getCasoById(id: string) {
  return prisma.casoPrueba.findUnique({ where: { id }, include: { tareas: true } })
}

export async function getCasosByHU(huId: string) {
  return prisma.casoPrueba.findMany({ where: { huId }, orderBy: { fechaCreacion: "asc" } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createCaso(data: Record<string, unknown>) {
  return prisma.casoPrueba.create({ data: data as any })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateCaso(id: string, data: Record<string, unknown>) {
  return prisma.casoPrueba.update({ where: { id }, data: data as any })
}

export async function deleteCaso(id: string) {
  return prisma.casoPrueba.delete({ where: { id } })
}
