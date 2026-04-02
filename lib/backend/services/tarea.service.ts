// ═══════════════════════════════════════════════════════════
//  TAREA SERVICE — lógica de negocio para Tareas
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"
import { Prisma } from "@prisma/client"

export async function getAllTareas(grupoId?: string, asignado?: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit
  const where: Prisma.TareaWhereInput = grupoId ? { caso: { hu: { grupoId } } } : {}
  if (asignado) where.asignado = asignado
  const [tareas, total] = await prisma.$transaction([
    prisma.tarea.findMany({ where, orderBy: { fechaCreacion: "desc" }, skip, take: limit }),
    prisma.tarea.count({ where }),
  ])
  return { tareas, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function getTareaById(id: string) {
  return prisma.tarea.findUnique({ where: { id } })
}

export async function getTareasByCaso(casoPruebaId: string, page = 1, limit = 200) {
  const skip = (page - 1) * limit
  const where = { casoPruebaId }
  const [tareas, total] = await prisma.$transaction([
    prisma.tarea.findMany({ where, orderBy: { fechaCreacion: "asc" }, skip, take: limit }),
    prisma.tarea.count({ where }),
  ])
  return { tareas, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function getTareasByHU(huId: string, page = 1, limit = 200) {
  const skip = (page - 1) * limit
  const where = { huId }
  const [tareas, total] = await prisma.$transaction([
    prisma.tarea.findMany({ where, orderBy: { fechaCreacion: "asc" }, skip, take: limit }),
    prisma.tarea.count({ where }),
  ])
  return { tareas, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function createTarea(data: Prisma.TareaUncheckedCreateInput) {
  return prisma.tarea.create({ data })
}

export async function updateTarea(id: string, data: Prisma.TareaUncheckedUpdateInput) {
  return prisma.tarea.update({ where: { id }, data })
}

export async function deleteTarea(id: string) {
  return prisma.tarea.delete({ where: { id } })
}
