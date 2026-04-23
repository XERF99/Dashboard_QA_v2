import { prisma } from "@/lib/backend/prisma"
import { Prisma } from "@prisma/client"
import { notDeleted, paginatedQuery, softDelete, createRecord, updateRecord } from "./base-crud.service"

function grupoHUFilter(grupoId?: string) {
  return grupoId ? { hu: { grupoId } } : {}
}

export async function getAllCasos(grupoId?: string, page = 1, limit = 50) {
  const where = { ...notDeleted, ...grupoHUFilter(grupoId) }
  const result = await paginatedQuery(prisma.casoPrueba, where, page, limit)
  return { casos: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages }
}

export async function getCasoById(id: string) {
  return prisma.casoPrueba.findUnique({ where: { id }, include: { tareas: true } })
}

export async function getCasosByHU(huId: string, page = 1, limit = 100) {
  const where = { ...notDeleted, huId }
  const result = await paginatedQuery(prisma.casoPrueba, where, page, limit, { fechaCreacion: "asc" })
  return { casos: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages }
}

export async function createCaso(data: Prisma.CasoPruebaUncheckedCreateInput) {
  return createRecord(prisma.casoPrueba, data)
}

export async function updateCaso(id: string, data: Prisma.CasoPruebaUncheckedUpdateInput) {
  return updateRecord(prisma.casoPrueba, id, data)
}

export async function deleteCaso(id: string) {
  return softDelete(prisma.casoPrueba, id)
}

// ── Interface (v2.73) ─────────────────────────────────────────
export interface CasoService {
  getAll:   typeof getAllCasos
  getById:  typeof getCasoById
  getByHU:  typeof getCasosByHU
  create:   typeof createCaso
  update:   typeof updateCaso
  delete:   typeof deleteCaso
}

export const casoService: CasoService = {
  getAll:   getAllCasos,
  getById:  getCasoById,
  getByHU:  getCasosByHU,
  create:   createCaso,
  update:   updateCaso,
  delete:   deleteCaso,
}
