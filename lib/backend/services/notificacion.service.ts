// ═══════════════════════════════════════════════════════════
//  NOTIFICACION SERVICE — lógica de negocio para Notificaciones
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

/** Mapea el rol JWT al destinatario de notificaciones. */
export function rolToDestinatario(rol: string): "admin" | "qa" {
  return ["owner", "admin"].includes(rol) ? "admin" : "qa"
}

export async function getNotificacionesByDestinatario(
  destinatario: string,
  grupoId?: string,
  page = 1,
  limit = 50
) {
  const skip  = (page - 1) * limit
  const where = {
    destinatario,
    ...(grupoId ? { grupoId } : {}),
  }
  const [notificaciones, total] = await prisma.$transaction([
    prisma.notificacion.findMany({
      where,
      orderBy: { fecha: "desc" },
      skip,
      take: limit,
    }),
    prisma.notificacion.count({ where }),
  ])
  return { notificaciones, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function createNotificacion(data: {
  tipo:        string
  titulo:      string
  descripcion: string
  destinatario: string
  grupoId:     string
  casoId?:     string
  huId?:       string
  huTitulo?:   string
  casoTitulo?: string
}) {
  return prisma.notificacion.create({ data })
}

export async function marcarLeida(id: string) {
  return prisma.notificacion.update({ where: { id }, data: { leida: true } })
}

export async function marcarTodasLeidas(destinatario: string, grupoId?: string) {
  return prisma.notificacion.updateMany({
    where: { destinatario, leida: false, ...(grupoId ? { grupoId } : {}) },
    data:  { leida: true },
  })
}
