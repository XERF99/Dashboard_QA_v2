import { crearEvento, etapasParaTipo, etapaCompletada, siguienteEtapa } from "@/lib/types"
import type { HistoriaUsuario, EstadoHU, EtapaEjecucion } from "@/lib/types"
import type { DomainCtx } from "./types"
import { api } from "@/lib/services/api/client"

/** Handlers de CRUD y ciclo de vida de Historias de Usuario. */
export function createHUHandlers({ historias, casos, setHistorias, setCasos, setTareas, user, configEtapas, configResultados, addToast }: DomainCtx) {
  const handleSubmitHU = (hu: HistoriaUsuario, isEdit: boolean) => {
    setHistorias(prev => prev.find(h => h.id === hu.id) ? prev.map(h => h.id === hu.id ? hu : h) : [...prev, hu])
    addToast({ type: "success", title: hu.titulo, desc: isEdit ? "Historia actualizada" : "Historia creada" })
  }

  const handleEliminarHUConfirmado = (hu: HistoriaUsuario) => {
    setHistorias(p => p.filter(h => h.id !== hu.id))
    setCasos(p => p.filter(c => c.huId !== hu.id))
    setTareas(p => p.filter(t => t.huId !== hu.id))
    api.delete(`/api/historias/${hu.id}`).catch(() => console.warn("[HU] Error al eliminar historia en API"))
    addToast({ type: "error", title: "Historia eliminada", desc: hu.titulo })
  }

  const handleBulkCambiarEstado = (ids: string[], estado: EstadoHU) => {
    setHistorias(prev => prev.map(h => ids.includes(h.id) ? { ...h, estado } : h))
    addToast({ type: "success", title: "Estado actualizado", desc: `${ids.length} HU${ids.length !== 1 ? "s" : ""} actualizadas` })
  }

  const handleBulkCambiarResponsable = (ids: string[], responsable: string) => {
    setHistorias(prev => prev.map(h => ids.includes(h.id) ? { ...h, responsable } : h))
    addToast({ type: "success", title: "Responsable actualizado", desc: `${ids.length} HU${ids.length !== 1 ? "s" : ""} asignadas a ${responsable}` })
  }

  const handleBulkEliminarConfirmado = (ids: string[]) => {
    setHistorias(p => p.filter(h => !ids.includes(h.id)))
    setCasos(p => p.filter(c => !ids.includes(c.huId)))
    setTareas(p => p.filter(t => !ids.includes(t.huId)))
    Promise.all(ids.map(id => api.delete(`/api/historias/${id}`))).catch(() => console.warn("[HU] Error al eliminar historias en bloque en API"))
    addToast({ type: "error", title: `${ids.length} historia${ids.length !== 1 ? "s" : ""} eliminada${ids.length !== 1 ? "s" : ""}` })
  }

  const handleImportarHUs = (nuevasHUs: HistoriaUsuario[]) => {
    const codigosExistentes = new Set(historias.map(h => h.codigo))
    const sinDuplicados = nuevasHUs.filter(h => !codigosExistentes.has(h.codigo))
    setHistorias(prev => [...prev, ...sinDuplicados])
    addToast({ type: "success", title: `${sinDuplicados.length} HU${sinDuplicados.length !== 1 ? "s" : ""} importadas`, desc: "Desde archivo CSV" })
  }

  const handleIniciarHU = (huId: string) => {
    setHistorias(prev => prev.map(h => {
      if (h.id !== huId || h.estado !== "sin_iniciar") return h
      const primeraEtapa = etapasParaTipo(h.tipoAplicacion, configEtapas)[0]
      return {
        ...h, estado: "en_progreso", etapa: primeraEtapa,
        historial: [...h.historial, crearEvento("hu_iniciada",
          `QA inició la historia — etapa: ${primeraEtapa.charAt(0).toUpperCase() + primeraEtapa.slice(1)}`,
          user?.nombre || "Sistema"
        )],
      }
    }))
    addToast({ type: "info", title: "HU iniciada", desc: "Etapa de despliegue activa" })
  }

  const handleCancelarHU = (huId: string, motivo: string) => {
    setHistorias(prev => prev.map(h => {
      if (h.id !== huId) return h
      return {
        ...h, estado: "cancelada", etapa: "cambio_cancelado",
        motivoCancelacion: motivo, fechaCierre: new Date(),
        historial: [...h.historial, crearEvento("hu_cancelada", `HU cancelada: ${motivo}`, user?.nombre || "Sistema")],
      }
    }))
    addToast({ type: "error", title: "HU cancelada", desc: motivo.slice(0, 60) })
  }

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
      setCasos(prev => prev.map(c => {
        if (c.huId !== huId || c.estadoAprobacion !== "aprobado") return c
        const yaExiste = c.resultadosPorEtapa.some(r => r.etapa === next)
        return yaExiste ? c : { ...c, resultadosPorEtapa: [...c.resultadosPorEtapa, { etapa: next, estado: "pendiente" as const, resultado: "pendiente" as const, intentos: [] }] }
      }))
      const etapaLabel = next.charAt(0).toUpperCase() + next.slice(1)
      const ev = crearEvento("hu_etapa_avanzada", `Etapa avanzó a ${etapaLabel}`, user?.nombre || "Sistema")
      setHistorias(prev => prev.map(h => h.id === huId ? { ...h, etapa: next, historial: [...h.historial, ev] } : h))
      addToast({ type: "success", title: "Etapa completada", desc: `Avanzando a ${etapaLabel}` })
    } else {
      const ev = crearEvento("hu_completada", "Todas las etapas completadas exitosamente", user?.nombre || "Sistema")
      setHistorias(prev => prev.map(h => h.id === huId ? { ...h, estado: "exitosa", etapa: "completada", fechaCierre: new Date(), historial: [...h.historial, ev] } : h))
      addToast({ type: "success", title: "HU completada", desc: "Todas las etapas exitosas" })
    }
  }

  const handleFallarHU = (huId: string, motivo: string) => {
    const ev = crearEvento("hu_fallida", `HU fallida: ${motivo}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id !== huId ? h : {
      ...h, estado: "fallida", etapa: "cambio_cancelado", motivoCancelacion: motivo, fechaCierre: new Date(),
      historial: [...h.historial, ev],
    }))
    addToast({ type: "error", title: "HU fallida", desc: motivo.slice(0, 60) })
  }

  const handlePermitirCasosAdicionales = (huId: string, motivo: string) => {
    const ev = crearEvento("casos_adicionales_habilitados", `Admin habilitó agregar casos: ${motivo}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id !== huId ? h : {
      ...h, permitirCasosAdicionales: true, motivoCasosAdicionales: motivo, historial: [...h.historial, ev],
    }))
    addToast({ type: "info", title: "Modificación habilitada", desc: "QA puede agregar más casos" })
  }

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
