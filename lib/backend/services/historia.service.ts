import { prisma } from "@/lib/backend/prisma"
import { Prisma } from "@prisma/client"
import { notDeleted, paginatedQuery, createRecord, updateRecord } from "./base-crud.service"

function grupoFilter(grupoId?: string) {
  return grupoId ? { grupoId } : {}
}

export async function getAllHistorias(
  grupoId?: string,
  page    = 1,
  limit   = 50,
  filters?: { sprint?: string; responsable?: string; q?: string; cursor?: string }
) {
  const where: Prisma.HistoriaUsuarioWhereInput = {
    ...notDeleted,
    ...grupoFilter(grupoId),
    ...(filters?.sprint      ? { sprint:      filters.sprint }      : {}),
    ...(filters?.responsable ? { responsable: filters.responsable } : {}),
  }

  if (filters?.q) {
    const terms = filters.q.split(/\s+/).filter(Boolean)
    where.AND = terms.map(term => ({
      OR: [
        { codigo:      { contains: term, mode: "insensitive" as const } },
        { titulo:      { contains: term, mode: "insensitive" as const } },
        { descripcion: { contains: term, mode: "insensitive" as const } },
        { responsable: { contains: term, mode: "insensitive" as const } },
        { aplicacion:  { contains: term, mode: "insensitive" as const } },
      ],
    }))
  }

  // Cursor-based pagination when cursor provided
  if (filters?.cursor) {
    const [historias, total] = await prisma.$transaction([
      prisma.historiaUsuario.findMany({
        where,
        orderBy: { fechaCreacion: "desc" },
        cursor: { id: filters.cursor },
        skip: 1,
        take: limit,
      }),
      prisma.historiaUsuario.count({ where }),
    ])
    return { historias, total, page, limit, pages: Math.ceil(total / limit) }
  }

  const result = await paginatedQuery(prisma.historiaUsuario, where, page, limit)
  return { historias: result.data, total: result.total, page: result.page, limit: result.limit, pages: result.pages }
}

export async function getHistoriaById(id: string) {
  return prisma.historiaUsuario.findFirst({
    where: { id, ...notDeleted },
    include: { casos: { where: { deletedAt: null } } },
  })
}

export async function createHistoria(data: Prisma.HistoriaUsuarioUncheckedCreateInput) {
  return createRecord(prisma.historiaUsuario, data)
}

export async function updateHistoria(id: string, data: Prisma.HistoriaUsuarioUncheckedUpdateInput) {
  return updateRecord(prisma.historiaUsuario, id, data)
}

export async function deleteHistoria(id: string) {
  const now = new Date()
  return prisma.$transaction(async (tx) => {
    const hu = await tx.historiaUsuario.update({ where: { id }, data: { deletedAt: now } })
    await tx.casoPrueba.updateMany({ where: { huId: id, deletedAt: null }, data: { deletedAt: now } })
    await tx.tarea.updateMany({ where: { huId: id, deletedAt: null }, data: { deletedAt: now } })
    return hu
  })
}

export async function getHistoriasBySprint(sprint: string, grupoId?: string) {
  return prisma.historiaUsuario.findMany({
    where: { ...notDeleted, sprint, ...grupoFilter(grupoId) },
    orderBy: { fechaCreacion: "desc" },
  })
}

export async function getHistoriasByResponsable(responsable: string, grupoId?: string) {
  return prisma.historiaUsuario.findMany({
    where: { ...notDeleted, responsable, ...grupoFilter(grupoId) },
    orderBy: { fechaCreacion: "desc" },
  })
}

// ── Interface (v2.73) ─────────────────────────────────────────
// Expone las funciones como un objeto con shape tipado. Habilita
// mockeo sin `vi.mock` de módulo entero y prepara el terreno para
// inyección de dependencias en handlers.
export interface HistoriaService {
  getAll:           typeof getAllHistorias
  getById:          typeof getHistoriaById
  create:           typeof createHistoria
  update:           typeof updateHistoria
  delete:           typeof deleteHistoria
  getBySprint:      typeof getHistoriasBySprint
  getByResponsable: typeof getHistoriasByResponsable
}

export const historiaService: HistoriaService = {
  getAll:           getAllHistorias,
  getById:          getHistoriaById,
  create:           createHistoria,
  update:           updateHistoria,
  delete:           deleteHistoria,
  getBySprint:      getHistoriasBySprint,
  getByResponsable: getHistoriasByResponsable,
}
