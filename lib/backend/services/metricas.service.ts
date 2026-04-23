// ═══════════════════════════════════════════════════════════
//  METRICAS SERVICE — agregaciones para el dashboard QA
//  grupoId: undefined = owner (ve todo), string = filtra al grupo
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

const notDeleted = { deletedAt: null }

function grupoFilter(grupoId?: string) {
  return { ...notDeleted, ...(grupoId ? { grupoId } : {}) }
}

function grupoHUFilter(grupoId?: string) {
  return { ...notDeleted, ...(grupoId ? { hu: { grupoId } } : {}) }
}

function grupoHUCasoFilter(grupoId?: string) {
  return { ...notDeleted, ...(grupoId ? { caso: { hu: { grupoId } } } : {}) }
}

export async function getMetricas(grupoId?: string) {
  // Use allSettled for error isolation — one failing aggregation won't break the rest
  const results = await Promise.allSettled([
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

  // Extract values with empty-array fallback for failed queries
  const val = <T,>(r: PromiseSettledResult<T>): T | [] =>
    r.status === "fulfilled" ? r.value : []
  const historiasPorEstado          = val(results[0]!) as { estado: string; _count: { _all: number } }[]
  const historiasPorSprint          = val(results[1]!) as { sprint: string | null; _count: { _all: number } }[]
  const casosPorEstado              = val(results[2]!) as { estadoAprobacion: string; _count: { _all: number } }[]
  const tareasPorEstado             = val(results[3]!) as { estado: string; _count: { _all: number } }[]
  const tareasPendientesPorAsignado = val(results[4]!) as { asignado: string; estado: string; _count: { _all: number } }[]
  const velocidadPorSprint          = val(results[5]!) as { sprint: string | null; _sum: { puntos: number | null }; _count: { _all: number } }[]
  const tareasCountPorResultado     = val(results[6]!) as { resultado: string; _count: { _all: number } }[]

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

// ── Interface (v2.78) ─────────────────────────────────────────
export interface MetricasService {
  get: typeof getMetricas
}

export const metricasService: MetricasService = {
  get: getMetricas,
}
