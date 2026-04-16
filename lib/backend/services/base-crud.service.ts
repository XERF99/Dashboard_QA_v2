import { prisma } from "@/lib/backend/prisma"

export const notDeleted = { deletedAt: null }

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export async function paginatedQuery<T>(
  model: { findMany: (args: object) => Promise<T[]>; count: (args: object) => Promise<number> },
  where: object,
  page: number,
  limit: number,
  orderBy: object = { fechaCreacion: "desc" },
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit
  const [data, total] = await prisma.$transaction([
    model.findMany({ where, orderBy, skip, take: limit }) as never,
    model.count({ where }) as never,
  ]) as [T[], number]
  return { data, total, page, limit, pages: Math.ceil(total / limit) }
}

export function softDelete<T>(
  model: { update: (args: { where: { id: string }; data: { deletedAt: Date } }) => Promise<T> },
  id: string,
): Promise<T> {
  return model.update({ where: { id }, data: { deletedAt: new Date() } })
}

export function createRecord<T, D>(
  model: { create: (args: { data: D }) => Promise<T> },
  data: D,
): Promise<T> {
  return model.create({ data })
}

export function updateRecord<T, D>(
  model: { update: (args: { where: { id: string }; data: D }) => Promise<T> },
  id: string,
  data: D,
): Promise<T> {
  return model.update({ where: { id }, data })
}
