import { crearEvento, etapasParaTipo } from "@/lib/types"
import type { HistoriaUsuario, EstadoHU } from "@/lib/types"
import type { DomainCtx } from "./types"

/** Handlers de CRUD y ciclo de vida de Historias de Usuario. */
export function createHUHandlers({ historias, setHistorias, setCasos, setTareas, user, configEtapas, addToast }: DomainCtx) {
  const handleSubmitHU = (hu: HistoriaUsuario, isEdit: boolean) => {
    setHistorias(prev => prev.find(h => h.id === hu.id) ? prev.map(h => h.id === hu.id ? hu : h) : [...prev, hu])
    addToast({ type: "success", title: hu.titulo, desc: isEdit ? "Historia actualizada" : "Historia creada" })
  }

  const handleEliminarHUConfirmado = (hu: HistoriaUsuario) => {
    setHistorias(p => p.filter(h => h.id !== hu.id))
    setCasos(p => p.filter(c => c.huId !== hu.id))
    setTareas(p => p.filter(t => t.huId !== hu.id))
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
    handlePermitirCasosAdicionales,
  }
}
