// ═══════════════════════════════════════════════════════════
//  METRICAS SERVICE — agregaciones para el dashboard QA
//  grupoId: undefined = owner (ve todo), string = filtra al grupo
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

function grupoFilter(grupoId?: string) {
  return grupoId ? { grupoId } : {}
}

function grupoHUFilter(grupoId?: string) {
  return grupoId ? { hu: { grupoId } } : {}
}

function grupoHUCasoFilter(grupoId?: string) {
  return grupoId ? { caso: { hu: { grupoId } } } : {}
}

export async function getMetricas(grupoId?: string) {
  const [
    historiasPorEstado,
    historiasPorSprint,
    casosPorEstado,
    tareasPorEstado,
    tareasPendientesPorAsignado,
    velocidadPorSprint,
    tareasCountPorResultado,
  ] = await Promise.all([
    // Historias agrupadas por estado
    prisma.historiaUsuario.groupBy({
      by: ["estado"],
      where: grupoFilter(grupoId),
      _count: { _all: true },
    }),

    // Historias agrupadas por sprint (excluye nulos)
    prisma.historiaUsuario.groupBy({
      by: ["sprint"],
      where: { sprint: { not: null }, ...grupoFilter(grupoId) },
      _count: { _all: true },
    }),

    // Casos agrupados por estadoAprobacion
    prisma.casoPrueba.groupBy({
      by: ["estadoAprobacion"],
      where: grupoHUFilter(grupoId),
      _count: { _all: true },
    }),

    // Tareas agrupadas por estado
    prisma.tarea.groupBy({
      by: ["estado"],
      where: grupoHUCasoFilter(grupoId),
      _count: { _all: true },
    }),

    // Tareas pendientes/bloqueadas por asignado
    prisma.tarea.groupBy({
      by: ["asignado", "estado"],
      where: { estado: { in: ["pendiente", "bloqueada"] }, ...grupoHUCasoFilter(grupoId) },
      _count: { _all: true },
    }),

    // Velocidad por sprint: suma de puntos de historias "exitosas"
    prisma.historiaUsuario.groupBy({
      by: ["sprint"],
      where: { estado: "exitosa", sprint: { not: null }, ...grupoFilter(grupoId) },
      _sum: { puntos: true },
      _count: { _all: true },
    }),

    // Distribución por resultado
    prisma.tarea.groupBy({
      by: ["resultado"],
      where: grupoHUCasoFilter(grupoId),
      _count: { _all: true },
    }),
  ])

  const totalTareas              = tareasCountPorResultado.reduce((s, r) => s + r._count._all, 0)
  const tareasConResultadoFallido = tareasCountPorResultado.find(r => r.resultado === "fallido")?._count._all ?? 0
  const tasaDefectos = totalTareas > 0
    ? Math.round((tareasConResultadoFallido / totalTareas) * 100 * 10) / 10
    : 0

  return {
    historiasPorEstado: historiasPorEstado.map(h => ({
      estado: h.estado,
      total: h._count._all,
    })),
    historiasPorSprint: historiasPorSprint.map(h => ({
      sprint: h.sprint,
      total: h._count._all,
    })),
    casosPorEstado: casosPorEstado.map(c => ({
      estado: c.estadoAprobacion,
      total: c._count._all,
    })),
    tareasPorEstado: tareasPorEstado.map(t => ({
      estado: t.estado,
      total: t._count._all,
    })),
    tareasPendientesPorAsignado: tareasPendientesPorAsignado.map(t => ({
      asignado: t.asignado,
      estado: t.estado,
      total: t._count._all,
    })),
    velocidadPorSprint: velocidadPorSprint.map(v => ({
      sprint: v.sprint,
      puntosCompletados: v._sum.puntos ?? 0,
      historias: v._count._all,
    })),
    tasaDefectos: {
      total: totalTareas,
      fallidos: tareasConResultadoFallido,
      porcentaje: tasaDefectos,
    },
  }
}
