import { crearEvento, etapasParaTipo, etapaCompletada, siguienteEtapa } from "@/lib/types"
import type { HistoriaUsuario, EstadoHU, EtapaEjecucion } from "@/lib/types"
import type { DomainCtx } from "./types"
import { defineCommand, type CommandResult } from "./pipeline"
import { api } from "@/lib/services/api/client"
import { API } from "@/lib/constants/api-routes"

/** Handlers de CRUD y ciclo de vida de Historias de Usuario. */
export function createHUHandlers(ctx: DomainCtx) {
  const { historias, casos, setHistorias, user, configEtapas, configResultados, addToast } = ctx
  const autor = user?.nombre || "Sistema"

  const handleSubmitHU = defineCommand(ctx, (hu: HistoriaUsuario, isEdit: boolean): CommandResult => ({
    historias: prev => prev.find(h => h.id === hu.id) ? prev.map(h => h.id === hu.id ? hu : h) : [...prev, hu],
    toast:     { type: "success", title: hu.titulo, desc: isEdit ? "Historia actualizada" : "Historia creada" },
  }))

  const handleEliminarHUConfirmado = defineCommand(ctx, (hu: HistoriaUsuario): CommandResult => ({
    historias: p => p.filter(h => h.id !== hu.id),
    casos:     p => p.filter(c => c.huId !== hu.id),
    tareas:    p => p.filter(t => t.huId !== hu.id),
    api:       { call: () => api.delete(API.historia(hu.id)), context: "HU", message: "Error al eliminar historia en API" },
    toast:     { type: "error", title: "Historia eliminada", desc: hu.titulo },
  }))

  const handleBulkCambiarEstado = defineCommand(ctx, (ids: string[], estado: EstadoHU): CommandResult => ({
    historias: prev => prev.map(h => ids.includes(h.id) ? { ...h, estado } : h),
    toast:     { type: "success", title: "Estado actualizado", desc: `${ids.length} HU${ids.length !== 1 ? "s" : ""} actualizadas` },
  }))

  const handleBulkCambiarResponsable = defineCommand(ctx, (ids: string[], responsable: string): CommandResult => ({
    historias: prev => prev.map(h => ids.includes(h.id) ? { ...h, responsable } : h),
    toast:     { type: "success", title: "Responsable actualizado", desc: `${ids.length} HU${ids.length !== 1 ? "s" : ""} asignadas a ${responsable}` },
  }))

  const handleBulkEliminarConfirmado = defineCommand(ctx, (ids: string[]): CommandResult => ({
    historias: p => p.filter(h => !ids.includes(h.id)),
    casos:     p => p.filter(c => !ids.includes(c.huId)),
    tareas:    p => p.filter(t => !ids.includes(t.huId)),
    api: {
      call: () => Promise.all(ids.map(id => api.delete(API.historia(id)))),
      context: "HU",
      message: "Error al eliminar historias en bloque en API",
    },
    toast: { type: "error", title: `${ids.length} historia${ids.length !== 1 ? "s" : ""} eliminada${ids.length !== 1 ? "s" : ""}` },
  }))

  const handleImportarHUs = defineCommand(ctx, (nuevasHUs: HistoriaUsuario[]): CommandResult => {
    const codigosExistentes = new Set(historias.map(h => h.codigo))
    const sinDuplicados = nuevasHUs.filter(h => !codigosExistentes.has(h.codigo))
    return {
      historias: prev => [...prev, ...sinDuplicados],
      toast:     { type: "success", title: `${sinDuplicados.length} HU${sinDuplicados.length !== 1 ? "s" : ""} importadas`, desc: "Desde archivo CSV" },
    }
  })

  // ── Ciclo de vida con transiciones que dependen del estado previo ──
  // Estos handlers usan `setHistorias` directo porque la mutación depende
  // de campos calculados dentro del map (evita un setHistorias doble).

  const handleIniciarHU = (huId: string) => {
    setHistorias(prev => prev.map(h => {
      if (h.id !== huId || h.estado !== "sin_iniciar") return h
      const primeraEtapa = etapasParaTipo(h.tipoAplicacion, configEtapas)[0] ?? "sin_iniciar"
      return {
        ...h, estado: "en_progreso", etapa: primeraEtapa,
        historial: [...h.historial, crearEvento("hu_iniciada",
          `QA inició la historia — etapa: ${primeraEtapa.charAt(0).toUpperCase() + primeraEtapa.slice(1)}`,
          autor
        )],
      }
    }))
    addToast({ type: "info", title: "HU iniciada", desc: "Etapa de despliegue activa" })
  }

  const handleCancelarHU = defineCommand(ctx, (huId: string, motivo: string): CommandResult => ({
    historias: prev => prev.map(h => h.id !== huId ? h : {
      ...h, estado: "cancelada", etapa: "cambio_cancelado",
      motivoCancelacion: motivo, fechaCierre: new Date(),
    }),
    events: [{ huId, tipo: "hu_cancelada", texto: `HU cancelada: ${motivo}` }],
    toast:  { type: "error", title: "HU cancelada", desc: motivo.slice(0, 60) },
  }))

  const handleAvanzarEtapa = (huId: string) => {
    const hu = historias.find(h => h.id === huId)
    if (!hu || hu.etapa === "completada" || hu.etapa === "cambio_cancelado" || hu.etapa === "sin_iniciar") return

    const casosConBloqueo = casos.filter(c => c.huId === huId && c.bloqueos.some(b => !b.resuelto))
    if (casosConBloqueo.length > 0) {
      addToast({ type: "error", title: "HU bloqueada", desc: `Hay ${casosConBloqueo.length} caso${casosConBloqueo.length !== 1 ? "s" : ""} de prueba con bloqueos activos. Resuélvelos antes de avanzar.` })
      return
    }

    const casosAprobados = casos.filter(c => c.huId === huId && c.estadoAprobacion === "aprobado")
    const check = etapaCompletada(casosAprobados, hu.etapa as EtapaEjecucion, configResultados)
    if (!check.completa || !check.exitosa) return

    const next = siguienteEtapa(hu.etapa as EtapaEjecucion, hu.tipoAplicacion, configEtapas)
    if (next) {
      ctx.setCasos(prev => prev.map(c => {
        if (c.huId !== huId || c.estadoAprobacion !== "aprobado") return c
        const yaExiste = c.resultadosPorEtapa.some(r => r.etapa === next)
        return yaExiste ? c : { ...c, resultadosPorEtapa: [...c.resultadosPorEtapa, { etapa: next, estado: "pendiente" as const, resultado: "pendiente" as const, intentos: [] }] }
      }))
      const etapaLabel = next.charAt(0).toUpperCase() + next.slice(1)
      setHistorias(prev => prev.map(h => h.id === huId
        ? { ...h, etapa: next, historial: [...h.historial, crearEvento("hu_etapa_avanzada", `Etapa avanzó a ${etapaLabel}`, autor)] }
        : h
      ))
      addToast({ type: "success", title: "Etapa completada", desc: `Avanzando a ${etapaLabel}` })
    } else {
      setHistorias(prev => prev.map(h => h.id === huId
        ? { ...h, estado: "exitosa", etapa: "completada", fechaCierre: new Date(), historial: [...h.historial, crearEvento("hu_completada", "Todas las etapas completadas exitosamente", autor)] }
        : h
      ))
      addToast({ type: "success", title: "HU completada", desc: "Todas las etapas exitosas" })
    }
  }

  const handleFallarHU = defineCommand(ctx, (huId: string, motivo: string): CommandResult => ({
    historias: prev => prev.map(h => h.id !== huId ? h : {
      ...h, estado: "fallida", etapa: "cambio_cancelado", motivoCancelacion: motivo, fechaCierre: new Date(),
    }),
    events: [{ huId, tipo: "hu_fallida", texto: `HU fallida: ${motivo}` }],
    toast:  { type: "error", title: "HU fallida", desc: motivo.slice(0, 60) },
  }))

  const handlePermitirCasosAdicionales = defineCommand(ctx, (huId: string, motivo: string): CommandResult => ({
    historias: prev => prev.map(h => h.id !== huId ? h : {
      ...h, permitirCasosAdicionales: true, motivoCasosAdicionales: motivo,
    }),
    events: [{ huId, tipo: "casos_adicionales_habilitados", texto: `Admin habilitó agregar casos: ${motivo}` }],
    toast:  { type: "info", title: "Modificación habilitada", desc: "QA puede agregar más casos" },
  }))

  return {
    handleSubmitHU,
    handleEliminarHUConfirmado,
    handleBulkCambiarEstado,
    handleBulkCambiarResponsable,
    handleBulkEliminarConfirmado,
    handleImportarHUs,
    handleIniciarHU,
    handleCancelarHU,
    handleAvanzarEtapa,
    handleFallarHU,
    handlePermitirCasosAdicionales,
  }
}
