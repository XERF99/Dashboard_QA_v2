// ═══════════════════════════════════════════════════════════
//  TAREA SERVICE — lógica de negocio para Tareas
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

export async function getAllTareas() {
  return prisma.tarea.findMany({ orderBy: { fechaCreacion: "desc" } })
}

export async function getTareaById(id: string) {
  return prisma.tarea.findUnique({ where: { id } })
}

export async function getTareasByCaso(casoPruebaId: string) {
  return prisma.tarea.findMany({ where: { casoPruebaId }, orderBy: { fechaCreacion: "asc" } })
}

export async function getTareasByHU(huId: string) {
  return prisma.tarea.findMany({ where: { huId }, orderBy: { fechaCreacion: "asc" } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createTarea(data: Record<string, unknown>) {
  return prisma.tarea.create({ data: data as any })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateTarea(id: string, data: Record<string, unknown>) {
  return prisma.tarea.update({ where: { id }, data: data as any })
}

export async function deleteTarea(id: string) {
  return prisma.tarea.delete({ where: { id } })
}
