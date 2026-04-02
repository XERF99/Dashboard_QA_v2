// ═══════════════════════════════════════════════════════════
//  CASO SERVICE — lógica de negocio para Casos de Prueba
//  grupoId: undefined = owner (ve todo), string = filtra al grupo
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"
import { Prisma } from "@prisma/client"

function grupoHUFilter(grupoId?: string) {
  return grupoId ? { hu: { grupoId } } : {}
}

export async function getAllCasos(grupoId?: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit
  const where = grupoHUFilter(grupoId)
  const [casos, total] = await prisma.$transaction([
    prisma.casoPrueba.findMany({ where, orderBy: { fechaCreacion: "desc" }, skip, take: limit }),
    prisma.casoPrueba.count({ where }),
  ])
  return { casos, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function getCasoById(id: string) {
  return prisma.casoPrueba.findUnique({ where: { id }, include: { tareas: true } })
}

export async function getCasosByHU(huId: string, page = 1, limit = 100) {
  const skip = (page - 1) * limit
  const where = { huId }
  const [casos, total] = await prisma.$transaction([
    prisma.casoPrueba.findMany({ where, orderBy: { fechaCreacion: "asc" }, skip, take: limit }),
    prisma.casoPrueba.count({ where }),
  ])
  return { casos, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function createCaso(data: Prisma.CasoPruebaUncheckedCreateInput) {
  return prisma.casoPrueba.create({ data })
}

export async function updateCaso(id: string, data: Prisma.CasoPruebaUncheckedUpdateInput) {
  return prisma.casoPrueba.update({ where: { id }, data })
}

export async function deleteCaso(id: string) {
  return prisma.casoPrueba.delete({ where: { id } })
}
