"use client"

import { useState } from "react"
import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import {
  historiasEjemplo, casosPruebaEjemplo, tareasEjemplo,
  crearEvento, etapasParaTipo, siguienteEtapa, etapaCompletada,
} from "@/lib/types"
import type {
  HistoriaUsuario, CasoPrueba, Tarea, Bloqueo,
  EtapaEjecucion, EstadoHU, EstadoAprobacion, Comentario,
  ConfigEtapas, TipoNotificacion, RolDestinatario, Notificacion,
} from "@/lib/types"
import type { UserSafe } from "@/lib/auth-context"

// ── Tipo interno para addToast ────────────────────────────
type ToastPayload = { type: "success" | "warning" | "error" | "info"; title: string; desc?: string }

interface DomainDataOptions {
  user: UserSafe | null
  configEtapas: ConfigEtapas
  addToast: (t: ToastPayload) => void
  addNotificacion: (
    tipo: TipoNotificacion,
    titulo: string,
    descripcion: string,
    destinatario: RolDestinatario,
    extra?: Pick<Notificacion, "casoId" | "huId" | "huTitulo" | "casoTitulo">
  ) => void
}

/**
 * Gestiona todo el estado de dominio: historias, casos y tareas.
 * Centraliza los handlers de mutación para que page.tsx sea solo orquestación de UI.
 *
 * Al conectar un backend, este hook es el único punto que necesita cambios.
 */
export function useDomainData({ user, configEtapas, addToast, addNotificacion }: DomainDataOptions) {
  // ── Async shape ────────────────────────────────────────────
  // Con localStorage siempre arranca en false/null.
  // Al conectar un backend: setIsLoading(true) antes del fetch,
  // setError(msg) si falla, refetch() vuelve a llamar a la API.
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const refetch = () => {
    // noop con localStorage — al conectar un backend implementar aquí la llamada.
    // Ejemplo:
    //   setIsLoading(true)
    //   Promise.all([fetchHistorias(), fetchCasos(), fetchTareas()])
    //     .then(([h, c, t]) => { setHistorias(h); setCasos(c); setTareas(t) })
    //     .catch(e => setError(e.message))
    //     .finally(() => setIsLoading(false))
  }

  const [historias, setHistorias] = usePersistedState<HistoriaUsuario[]>(STORAGE_KEYS.historias, historiasEjemplo)
  const [casos, setCasos]         = usePersistedState<CasoPrueba[]>(STORAGE_KEYS.casos, casosPruebaEjemplo)
  const [tareas, setTareas]       = usePersistedState<Tarea[]>(STORAGE_KEYS.tareas, tareasEjemplo)

  // ── CRUD HU ───────────────────────────────────────────────
  /**
   * Crea o actualiza una HU.
   * @param isEdit true si es edición, false si es creación nueva.
   */
  const handleSubmitHU = (hu: HistoriaUsuario, isEdit: boolean) => {
    setHistorias(prev => prev.find(h => h.id === hu.id) ? prev.map(h => h.id === hu.id ? hu : h) : [...prev, hu])
    addToast({ type: "success", title: hu.titulo, desc: isEdit ? "Historia actualizada" : "Historia creada" })
  }

  /**
   * Ejecuta la eliminación confirmada de una HU y sus casos/tareas asociados.
   * page.tsx controla el modal de confirmación antes de llamar a esta función.
   */
  const handleEliminarHUConfirmado = (hu: HistoriaUsuario) => {
    setHistorias(p => p.filter(h => h.id !== hu.id))
    setCasos(p => p.filter(c => c.huId !== hu.id))
    setTareas(p => p.filter(t => t.huId !== hu.id))
    addToast({ type: "error", title: "Historia eliminada", desc: hu.titulo })
  }

  // ── Acciones masivas ──────────────────────────────────────
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

  // ── Importar CSV ──────────────────────────────────────────
  const handleImportarHUs = (nuevasHUs: HistoriaUsuario[]) => {
    const codigosExistentes = new Set(historias.map(h => h.codigo))
    const sinDuplicados = nuevasHUs.filter(h => !codigosExistentes.has(h.codigo))
    setHistorias(prev => [...prev, ...sinDuplicados])
    addToast({ type: "success", title: `${sinDuplicados.length} HU${sinDuplicados.length !== 1 ? "s" : ""} importadas`, desc: "Desde archivo CSV" })
  }

  // ── QA inicia HU ──────────────────────────────────────────
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

  // ── Admin cancela HU ──────────────────────────────────────
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

  // ── Casos de prueba ───────────────────────────────────────
  const handleAddCaso = (caso: CasoPrueba) => {
    setCasos(prev => [...prev, caso])
    setHistorias(p => p.map(h => h.id !== caso.huId ? h : {
      ...h, casosIds: [...h.casosIds, caso.id],
      historial: [...h.historial, crearEvento("caso_creado", `Caso creado: ${caso.titulo}`, user?.nombre || "Sistema")],
    }))
    addToast({ type: "success", title: "Caso de prueba creado", desc: caso.titulo })
  }

  const handleEnviarAprobacion = (huId: string) => {
    setCasos(prev => prev.map(c =>
      c.huId === huId && (c.estadoAprobacion === "borrador" || c.estadoAprobacion === "rechazado")
        ? { ...c, estadoAprobacion: "pendiente_aprobacion" as EstadoAprobacion } : c
    ))
    const ev = crearEvento("caso_enviado_aprobacion", "Casos enviados para aprobación", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "info", title: "Casos enviados", desc: "Pendientes de aprobación" })
    const hu = historias.find(h => h.id === huId)
    addNotificacion("aprobacion_enviada", "Casos enviados a aprobación",
      `${user?.nombre || "QA"} envió todos los casos de la HU "${hu?.titulo || huId}" para aprobación`,
      "admin", { huId, huTitulo: hu?.titulo })
  }

  const handleAprobarCasos = (huId: string) => {
    setCasos(prev => prev.map(c =>
      c.huId === huId && c.estadoAprobacion === "pendiente_aprobacion"
        ? { ...c, estadoAprobacion: "aprobado" as EstadoAprobacion, aprobadoPor: user?.nombre, fechaAprobacion: new Date() } : c
    ))
    const ev = crearEvento("caso_aprobado", `Casos aprobados por ${user?.nombre}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "success", title: "Casos aprobados" })
    const hu = historias.find(h => h.id === huId)
    addNotificacion("caso_aprobado", "Casos aprobados",
      `Admin aprobó todos los casos de la HU "${hu?.titulo || huId}"`,
      "qa", { huId, huTitulo: hu?.titulo })
  }

  const handleRechazarCasos = (huId: string, motivo: string) => {
    setCasos(prev => prev.map(c =>
      c.huId === huId && c.estadoAprobacion === "pendiente_aprobacion"
        ? { ...c, estadoAprobacion: "rechazado" as EstadoAprobacion, motivoRechazo: motivo } : c
    ))
    const ev = crearEvento("caso_rechazado", `Casos rechazados: ${motivo}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "warning", title: "Casos rechazados", desc: motivo.slice(0, 60) })
    const hu = historias.find(h => h.id === huId)
    addNotificacion("caso_rechazado", "Casos rechazados",
      `Admin rechazó los casos de la HU "${hu?.titulo || huId}": ${motivo.slice(0, 80)}`,
      "qa", { huId, huTitulo: hu?.titulo })
  }

  const handleCompletarCasoEtapa = (casoId: string, etapa: EtapaEjecucion, resultado: "exitoso" | "fallido", comentarioFallo?: string) => {
    let huIdAfectada = ""
    setCasos(prev => prev.map(c => {
      if (c.id !== casoId) return c
      huIdAfectada = c.huId
      return {
        ...c, resultadosPorEtapa: c.resultadosPorEtapa.map(r => {
          if (r.etapa !== etapa) return r
          const intento = {
            numero: (r.intentos?.length || 0) + 1,
            resultado,
            comentarioFallo: resultado === "fallido" ? comentarioFallo : undefined,
            fecha: new Date(),
            ejecutadoPor: user?.nombre || "Sistema",
          }
          return { ...r, estado: "completado" as const, resultado, fechaFin: new Date(), intentos: [...(r.intentos || []), intento] }
        }),
      }
    }))

    setTimeout(() => {
      if (!huIdAfectada) return
      const hu = historias.find(h => h.id === huIdAfectada)
      if (!hu || hu.etapa === "completada" || hu.etapa === "cambio_cancelado" || hu.etapa === "sin_iniciar") return

      const casosHU = casos.filter(c => c.huId === huIdAfectada).map(c =>
        c.id === casoId
          ? { ...c, resultadosPorEtapa: c.resultadosPorEtapa.map(r => r.etapa === etapa ? { ...r, estado: "completado" as const, resultado, fechaFin: new Date(), intentos: r.intentos || [] } : r) }
          : c
      )
      const check = etapaCompletada(casosHU, hu.etapa as EtapaEjecucion)
      if (!check.completa) return

      if (check.exitosa) {
        const next = siguienteEtapa(hu.etapa as EtapaEjecucion, hu.tipoAplicacion, configEtapas)
        if (next) {
          setCasos(prevC => prevC.map(c => {
            if (c.huId !== huIdAfectada) return c
            const yaExiste = c.resultadosPorEtapa.some(r => r.etapa === next)
            return yaExiste ? c : { ...c, resultadosPorEtapa: [...c.resultadosPorEtapa, { etapa: next, estado: "pendiente" as const, resultado: "pendiente" as const, intentos: [] }] }
          }))
          const ev = crearEvento("hu_etapa_avanzada", `Etapa avanzó a ${next.charAt(0).toUpperCase() + next.slice(1)}`, "Sistema")
          setHistorias(prev => prev.map(h => h.id === huIdAfectada ? { ...h, etapa: next, historial: [...h.historial, ev] } : h))
          addToast({ type: "success", title: "Etapa completada", desc: `Avanzando a ${next}` })
        } else {
          const ev = crearEvento("hu_completada", "Todas las etapas completadas exitosamente", "Sistema")
          setHistorias(prev => prev.map(h => h.id === huIdAfectada ? { ...h, estado: "exitosa", etapa: "completada", fechaCierre: new Date(), historial: [...h.historial, ev] } : h))
          addToast({ type: "success", title: "HU completada", desc: "Todas las etapas exitosas" })
        }
      }
    }, 100)

    addToast({ type: resultado === "exitoso" ? "success" : "error", title: `Caso ${resultado}`, desc: `Etapa ${etapa}` })
  }

  const handleRetestearCaso = (casoId: string, etapa: EtapaEjecucion, comentarioCorreccion: string) => {
    let huIdAfectada = ""
    setCasos(prev => prev.map(c => {
      if (c.id !== casoId) return c
      huIdAfectada = c.huId
      return {
        ...c, resultadosPorEtapa: c.resultadosPorEtapa.map(r => {
          if (r.etapa !== etapa || r.resultado !== "fallido") return r
          const intentosUpd = [...(r.intentos || [])]
          if (intentosUpd.length > 0) {
            intentosUpd[intentosUpd.length - 1] = { ...intentosUpd[intentosUpd.length - 1], comentarioCorreccion }
          }
          return { ...r, estado: "en_ejecucion" as const, resultado: "pendiente" as const, fechaFin: undefined, intentos: intentosUpd }
        }),
      }
    }))
    const ev = crearEvento("caso_retesteo_solicitado", `Retesteo solicitado — ${comentarioCorreccion.slice(0, 80)}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huIdAfectada ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "info", title: "Retesteo solicitado", desc: "Caso listo para re-ejecutar" })
  }

  const handleIniciarEjecucion = (huId: string, etapa: EtapaEjecucion) => {
    setCasos(prev => prev.map(c => {
      if (c.huId !== huId || c.estadoAprobacion !== "aprobado") return c
      const yaExiste = c.resultadosPorEtapa.some(r => r.etapa === etapa)
      return {
        ...c, resultadosPorEtapa: yaExiste
          ? c.resultadosPorEtapa.map(r => r.etapa === etapa && r.estado === "pendiente" ? { ...r, estado: "en_ejecucion" as const, fechaInicio: new Date() } : r)
          : [...c.resultadosPorEtapa, { etapa, estado: "en_ejecucion" as const, resultado: "pendiente" as const, fechaInicio: new Date(), intentos: [] }],
      }
    }))
    const ev = crearEvento("caso_ejecucion_iniciada", `Ejecución iniciada — etapa ${etapa}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "info", title: "Ejecución iniciada", desc: `Etapa: ${etapa}` })
  }

  const handleEditarCaso = (caso: CasoPrueba) => {
    setCasos(prev => prev.map(c => c.id === caso.id ? caso : c))
    const ev = crearEvento("caso_editado", `Caso editado: ${caso.titulo}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === caso.huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "success", title: "Caso actualizado", desc: caso.titulo })
  }

  const handleEliminarCaso = (casoId: string, huId: string) => {
    setCasos(prev => prev.filter(c => c.id !== casoId))
    setTareas(prev => prev.filter(t => t.casoPruebaId !== casoId))
    const ev = crearEvento("caso_eliminado", "Caso de prueba eliminado", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id !== huId ? h : {
      ...h, casosIds: h.casosIds.filter(id => id !== casoId), historial: [...h.historial, ev],
    }))
    addToast({ type: "warning", title: "Caso eliminado" })
  }

  const handleEnviarCasoAprobacion = (casoId: string, huId: string) => {
    const caso = casos.find(c => c.id === casoId)
    const hu = historias.find(h => h.id === huId)
    setCasos(prev => prev.map(c =>
      c.id === casoId && (c.estadoAprobacion === "borrador" || c.estadoAprobacion === "rechazado")
        ? { ...c, estadoAprobacion: "pendiente_aprobacion" as EstadoAprobacion } : c
    ))
    const ev = crearEvento("caso_enviado_aprobacion", "Caso enviado para aprobación", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "info", title: "Caso enviado", desc: "Pendiente de aprobación" })
    addNotificacion("aprobacion_enviada", "Caso enviado a aprobación",
      `${user?.nombre || "QA"} envió el caso "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}" para aprobación`,
      "admin", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo })
  }

  const handleSolicitarModificacionCaso = (casoId: string, huId: string) => {
    const caso = casos.find(c => c.id === casoId)
    const hu = historias.find(h => h.id === huId)
    setCasos(prev => prev.map(c => c.id === casoId ? { ...c, modificacionSolicitada: true } : c))
    const ev = crearEvento("caso_modificacion_solicitada", "QA solicitó modificación de caso aprobado", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "info", title: "Modificación solicitada", desc: "El admin puede habilitar el cambio" })
    addNotificacion("modificacion_solicitada", "Solicitud de modificación",
      `${user?.nombre || "QA"} solicita modificar el caso aprobado "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}"`,
      "admin", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo })
  }

  const handleHabilitarModificacionCaso = (casoId: string, huId: string) => {
    const caso = casos.find(c => c.id === casoId)
    const hu = historias.find(h => h.id === huId)
    setCasos(prev => prev.map(c =>
      c.id === casoId ? { ...c, modificacionHabilitada: true, modificacionSolicitada: false, estadoAprobacion: "borrador" as EstadoAprobacion } : c
    ))
    const ev = crearEvento("caso_modificacion_habilitada", "Admin habilitó modificación de caso", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "success", title: "Modificación habilitada", desc: "QA puede editar el caso" })
    addNotificacion("modificacion_habilitada", "Modificación habilitada",
      `Admin habilitó la modificación del caso "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}"`,
      "qa", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo })
  }

  // ── Tareas ─────────────────────────────────────────────────
  const handleAddTarea = (tarea: Tarea) => {
    setTareas(prev => [...prev, tarea])
    setCasos(prev => prev.map(c => c.id === tarea.casoPruebaId ? { ...c, tareasIds: [...c.tareasIds, tarea.id] } : c))
    addToast({ type: "success", title: "Tarea creada", desc: tarea.titulo })
  }

  const handleEditarTarea = (tarea: Tarea) => {
    setTareas(prev => prev.map(t => t.id === tarea.id ? tarea : t))
    addToast({ type: "success", title: "Tarea actualizada", desc: tarea.titulo })
  }

  const handleEliminarTarea = (tareaId: string, casoId: string) => {
    setTareas(prev => prev.filter(t => t.id !== tareaId))
    setCasos(prev => prev.map(c => c.id === casoId ? { ...c, tareasIds: c.tareasIds.filter(id => id !== tareaId) } : c))
    addToast({ type: "warning", title: "Tarea eliminada" })
  }

  const handleCompletarTarea = (tareaId: string, resultado: "exitoso" | "fallido") => {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: "completada", resultado, fechaFin: new Date() } : t))
    addToast({ type: resultado === "exitoso" ? "success" : "error", title: `Tarea ${resultado}` })
  }

  const handleBloquearTarea = (tareaId: string, bloqueo: Bloqueo) => {
    let huId = ""
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      huId = t.huId
      return { ...t, estado: "bloqueada", bloqueos: [...t.bloqueos, bloqueo] }
    }))
    setTimeout(() => {
      if (!huId) return
      const ev = crearEvento("tarea_bloqueada", `Tarea bloqueada: ${bloqueo.descripcion.slice(0, 80)}`, user?.nombre || "Sistema")
      setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    }, 50)
    addToast({ type: "warning", title: "Tarea bloqueada", desc: bloqueo.descripcion.slice(0, 60) })
  }

  const handleDesbloquearTarea = (tareaId: string, bloqueoId: string) => {
    let huId = ""
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      huId = t.huId
      const bloqueos = t.bloqueos.map(b => b.id === bloqueoId
        ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre }
        : b
      )
      return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" : "en_progreso" }
    }))
    setTimeout(() => {
      if (!huId) return
      const ev = crearEvento("tarea_desbloqueada", "Bloqueo de tarea resuelto", user?.nombre || "Sistema")
      setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    }, 50)
    addToast({ type: "success", title: "Bloqueo resuelto" })
  }

  // ── Bloqueos HU ───────────────────────────────────────────
  const handleAddBloqueo = (huId: string, b: Bloqueo) => {
    setHistorias(p => p.map(h => h.id !== huId ? h : {
      ...h, bloqueos: [...h.bloqueos, b],
      historial: [...h.historial, crearEvento("bloqueo_reportado", `Bloqueo: ${b.descripcion.slice(0, 80)}`, user?.nombre || "Sistema")],
    }))
    addToast({ type: "warning", title: "Bloqueo registrado", desc: b.descripcion.slice(0, 60) })
  }

  const handleResolverBloqueo = (huId: string, bId: string, nota: string) => {
    setHistorias(p => p.map(h => h.id !== huId ? h : {
      ...h, bloqueos: h.bloqueos.map(b => b.id === bId
        ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre, notaResolucion: nota }
        : b
      ),
      historial: [...h.historial, crearEvento("bloqueo_resuelto", `Bloqueo resuelto: ${nota.slice(0, 80)}`, user?.nombre || "Sistema")],
    }))
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
  }

  const handleResolverBloqueoCaso = (casoId: string, huId: string, bId: string, nota: string) => {
    setCasos(prev => prev.map(c =>
      c.id !== casoId ? c : {
        ...c, bloqueos: c.bloqueos.map(b => b.id === bId
          ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre, notaResolucion: nota }
          : b
        ),
      }
    ))
    const ev = crearEvento("bloqueo_resuelto", `Bloqueo de caso resuelto: ${nota.slice(0, 80)}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
  }

  const handleResolverBloqueoTarea = (tareaId: string, bId: string, nota: string) => {
    let huId = ""
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      huId = t.huId
      const bloqueos = t.bloqueos.map(b => b.id === bId
        ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre, notaResolucion: nota }
        : b
      )
      return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" as const : "en_progreso" as const }
    }))
    setTimeout(() => {
      if (!huId) return
      const ev = crearEvento("bloqueo_resuelto", `Bloqueo de tarea resuelto: ${nota.slice(0, 80)}`, user?.nombre || "Sistema")
      setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    }, 50)
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
  }

  // ── Comentarios ───────────────────────────────────────────
  const handleAddComentarioHU = (huId: string, texto: string) => {
    const c: Comentario = { id: `com-${Date.now()}`, texto, autor: user?.nombre || "Sistema", fecha: new Date() }
    setHistorias(p => p.map(h => h.id !== huId ? h : { ...h, comentarios: [...h.comentarios, c] }))
  }

  const handleAddComentarioCaso = (casoId: string, texto: string) => {
    const c: Comentario = { id: `com-${Date.now()}`, texto, autor: user?.nombre || "Sistema", fecha: new Date() }
    setCasos(p => p.map(caso => caso.id !== casoId ? caso : { ...caso, comentarios: [...caso.comentarios, c] }))
  }

  const handlePermitirCasosAdicionales = (huId: string, motivo: string) => {
    const ev = crearEvento("casos_adicionales_habilitados", `Admin habilitó agregar casos: ${motivo}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id !== huId ? h : {
      ...h, permitirCasosAdicionales: true, motivoCasosAdicionales: motivo, historial: [...h.historial, ev],
    }))
    addToast({ type: "info", title: "Modificación habilitada", desc: "QA puede agregar más casos" })
  }

  return {
    // Async shape — listos para backend (con localStorage siempre false/null)
    isLoading, setIsLoading,
    error, setError,
    refetch,
    // Estado
    historias, setHistorias,
    casos, setCasos,
    tareas, setTareas,
    // Handlers HU
    handleSubmitHU,
    handleEliminarHUConfirmado,
    handleBulkCambiarEstado,
    handleBulkCambiarResponsable,
    handleBulkEliminarConfirmado,
    handleImportarHUs,
    handleIniciarHU,
    handleCancelarHU,
    // Handlers casos
    handleAddCaso,
    handleEnviarAprobacion,
    handleAprobarCasos,
    handleRechazarCasos,
    handleCompletarCasoEtapa,
    handleRetestearCaso,
    handleIniciarEjecucion,
    handleEditarCaso,
    handleEliminarCaso,
    handleEnviarCasoAprobacion,
    handleSolicitarModificacionCaso,
    handleHabilitarModificacionCaso,
    handlePermitirCasosAdicionales,
    // Handlers tareas
    handleAddTarea,
    handleEditarTarea,
    handleEliminarTarea,
    handleCompletarTarea,
    handleBloquearTarea,
    handleDesbloquearTarea,
    // Handlers bloqueos
    handleAddBloqueo,
    handleResolverBloqueo,
    handleResolverBloqueoCaso,
    handleResolverBloqueoTarea,
    // Handlers comentarios
    handleAddComentarioHU,
    handleAddComentarioCaso,
  }
}
