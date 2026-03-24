// ═══════════════════════════════════════════════════════════
//  GRUPO SERVICE — lógica de negocio para Grupos (workspaces)
//  Solo el Owner puede crear/editar/eliminar grupos.
//  Las métricas por grupo son útiles para el panel del Owner.
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

// ── CRUD ──────────────────────────────────────────────────

export async function getAllGrupos() {
  return prisma.grupo.findMany({ orderBy: { createdAt: "asc" } })
}

export async function getGrupoById(id: string) {
  return prisma.grupo.findUnique({ where: { id } })
}

export async function createGrupo(data: { nombre: string; descripcion?: string }) {
  const existe = await prisma.grupo.findUnique({ where: { nombre: data.nombre } })
  if (existe) return { success: false as const, error: "Ya existe un grupo con ese nombre" }

  const grupo = await prisma.grupo.create({
    data: { nombre: data.nombre, descripcion: data.descripcion ?? "" },
  })
  // Crear config vacía para el nuevo grupo
  await prisma.config.create({ data: { grupoId: grupo.id } })
  return { success: true as const, grupo }
}

export async function updateGrupo(id: string, data: { nombre?: string; descripcion?: string; activo?: boolean }) {
  const grupo = await prisma.grupo.update({ where: { id }, data })
  return { success: true as const, grupo }
}

export async function deleteGrupo(id: string) {
  // Verifica que no tenga usuarios activos
  const usuarios = await prisma.user.count({ where: { grupoId: id } })
  if (usuarios > 0) {
    return { success: false as const, error: `No se puede eliminar: el grupo tiene ${usuarios} usuario${usuarios !== 1 ? "s" : ""} asignado${usuarios !== 1 ? "s" : ""}` }
  }

  const historias = await prisma.historiaUsuario.count({ where: { grupoId: id } })
  if (historias > 0) {
    return { success: false as const, error: `No se puede eliminar: el grupo tiene ${historias} historia${historias !== 1 ? "s" : ""} de usuario` }
  }

  await prisma.grupo.delete({ where: { id } })
  return { success: true as const }
}

// ── Métricas por grupo (para el panel del Owner) ──────────

export async function getMetricasGrupo(grupoId: string) {
  const [
    totalHUs,
    totalCasos,
    totalTareas,
    totalUsuarios,
    husPorEstado,
    casosPorEstado,
    tareasPorEstado,
  ] = await Promise.all([
    prisma.historiaUsuario.count({ where: { grupoId } }),

    prisma.casoPrueba.count({
      where: { hu: { grupoId } },
    }),

    prisma.tarea.count({
      where: { caso: { hu: { grupoId } } },
    }),

    prisma.user.count({ where: { grupoId } }),

    prisma.historiaUsuario.groupBy({
      by: ["estado"],
      where: { grupoId },
      _count: { _all: true },
    }),

    prisma.casoPrueba.groupBy({
      by: ["estadoAprobacion"],
      where: { hu: { grupoId } },
      _count: { _all: true },
    }),

    prisma.tarea.groupBy({
      by: ["estado"],
      where: { caso: { hu: { grupoId } } },
      _count: { _all: true },
    }),
  ])

  return {
    totalHUs,
    totalCasos,
    totalTareas,
    totalUsuarios,
    husPorEstado: husPorEstado.map(h => ({ estado: h.estado, total: h._count._all })),
    casosPorEstado: casosPorEstado.map(c => ({ estado: c.estadoAprobacion, total: c._count._all })),
    tareasPorEstado: tareasPorEstado.map(t => ({ estado: t.estado, total: t._count._all })),
  }
}

// ── Métricas de TODOS los grupos (panel global del Owner) ──

export async function getMetricasGlobales() {
  const grupos = await prisma.grupo.findMany({ orderBy: { createdAt: "asc" } })

  const resumen = await Promise.all(
    grupos.map(async (g) => {
      const metricas = await getMetricasGrupo(g.id)
      return { grupo: g, metricas }
    })
  )

  return resumen
}
