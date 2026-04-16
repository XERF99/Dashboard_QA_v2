import { prisma } from "@/lib/backend/prisma"
import { Prisma } from "@prisma/client"
import { notDeleted, paginatedQuery, softDelete, createRecord, updateRecord } from "./base-crud.service"

export async function getAllTareas(grupoId?: string, asignado?: string, page = 1, limit = 50) {
  const where: Prisma.TareaWhereInput = { ...notDeleted, ...(grupoId ? { caso: { hu: { grupoId } } } : {}) }
  if (asignado) where.asignado = asignado
  const result = await paginatedQuery(prisma.tarea, where, page, limit)
  return { tareas: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages }
}

export async function getTareaById(id: string) {
  return prisma.tarea.findUnique({ where: { id } })
}

export async function getTareasByCaso(casoPruebaId: string, page = 1, limit = 200) {
  const where = { ...notDeleted, casoPruebaId }
  const result = await paginatedQuery(prisma.tarea, where, page, limit, { fechaCreacion: "asc" })
  return { tareas: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages }
}

export async function getTareasByHU(huId: string, page = 1, limit = 200) {
  const where = { ...notDeleted, huId }
  const result = await paginatedQuery(prisma.tarea, where, page, limit, { fechaCreacion: "asc" })
  return { tareas: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages }
}

export async function createTarea(data: Prisma.TareaUncheckedCreateInput) {
  return createRecord(prisma.tarea, data)
}

export async function updateTarea(id: string, data: Prisma.TareaUncheckedUpdateInput) {
  return updateRecord(prisma.tarea, id, data)
}

export async function deleteTarea(id: string) {
  return softDelete(prisma.tarea, id)
}
