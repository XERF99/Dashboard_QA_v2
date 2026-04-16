import { crearEvento } from "@/lib/types"
import type { CasoPrueba, EstadoAprobacion, EtapaEjecucion } from "@/lib/types"
import type { DomainCtx } from "./types"
import { api } from "@/lib/services/api/client"
import { API } from "@/lib/constants/api-routes"

/** Handlers de gestión de Casos de Prueba: CRUD, aprobación y ejecución. */
export function createCasoHandlers({ historias, casos, tareas, setHistorias, setCasos, setTareas, user, addToast, addNotificacion }: DomainCtx) {
  const handleAddCaso = (caso: CasoPrueba) => {
    setCasos(prev => [...prev, caso])
    setHistorias(p => p.map(h => h.id !== caso.huId ? h : {
      ...h, casosIds: [...h.casosIds, caso.id],
      historial: [...h.historial, crearEvento("caso_creado", `Caso creado: ${caso.titulo}`, user?.nombre || "Sistema")],
    }))
    addToast({ type: "success", title: "Caso de prueba creado", desc: caso.titulo })
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
    api.delete(API.caso(casoId)).catch(() => console.warn("[Casos] Error al eliminar caso en API"))
    addToast({ type: "warning", title: "Caso eliminado" })
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
      "admin", { huId, huTitulo: hu?.titulo, grupoId: user?.grupoId ?? undefined })
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
      "admin", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo, grupoId: user?.grupoId ?? undefined })
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
      "qa", { huId, huTitulo: hu?.titulo, grupoId: user?.grupoId ?? undefined })
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
      "qa", { huId, huTitulo: hu?.titulo, grupoId: user?.grupoId ?? undefined })
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
      "admin", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo, grupoId: user?.grupoId ?? undefined })
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
      "qa", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo, grupoId: user?.grupoId ?? undefined })
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

  const handleCompletarCasoEtapa = (casoId: string, etapa: EtapaEjecucion, resultado: string, comentarioFallo?: string) => {
    const tareasConBloqueo = tareas.filter(t => t.casoPruebaId === casoId && t.bloqueos.some(b => !b.resuelto))
    if (tareasConBloqueo.length > 0) {
      addToast({ type: "error", title: "Caso bloqueado", desc: `Hay ${tareasConBloqueo.length} tarea${tareasConBloqueo.length !== 1 ? "s" : ""} con bloqueos activos. Resuélvelos antes de completar el caso.` })
      return
    }

    const casoAfectado = casos.find(c => c.id === casoId)
    if (!casoAfectado) return
    const huIdAfectada = casoAfectado.huId
    const tituloAfectado = casoAfectado.titulo

    setCasos(prev => prev.map(c => {
      if (c.id !== casoId) return c
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

    const ev = crearEvento("caso_completado", `Caso "${tituloAfectado}" completado: ${resultado} — etapa ${etapa}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huIdAfectada ? { ...h, historial: [...h.historial, ev] } : h))

    addToast({ type: resultado === "exitoso" ? "success" : resultado === "fallido" ? "error" : "info", title: `Caso: ${resultado}`, desc: `Etapa ${etapa}` })
  }

  const handleImportarCasos = (nuevosCasos: CasoPrueba[]) => {
    setCasos(prev => [...prev, ...nuevosCasos])
    // Agregar cada caso al casosIds de su HU
    setHistorias(prev => prev.map(h => {
      const suyos = nuevosCasos.filter(c => c.huId === h.id)
      if (suyos.length === 0) return h
      const ev = crearEvento("caso_creado", `${suyos.length} caso${suyos.length !== 1 ? "s" : ""} importado${suyos.length !== 1 ? "s" : ""} desde CSV`, user?.nombre || "Sistema")
      return {
        ...h,
        casosIds: [...h.casosIds, ...suyos.map(c => c.id)],
        historial: [...h.historial, ev],
      }
    }))
    addToast({ type: "success", title: `${nuevosCasos.length} caso${nuevosCasos.length !== 1 ? "s" : ""} importado${nuevosCasos.length !== 1 ? "s" : ""}`, desc: "Desde archivo CSV" })
  }

  const handleRetestearCaso = (casoId: string, etapa: EtapaEjecucion, comentarioCorreccion: string) => {
    const casoAfectado = casos.find(c => c.id === casoId)
    if (!casoAfectado) return
    const huIdAfectada = casoAfectado.huId

    setCasos(prev => prev.map(c => {
      if (c.id !== casoId) return c
      return {
        ...c, resultadosPorEtapa: c.resultadosPorEtapa.map(r => {
          if (r.etapa !== etapa || r.resultado === "pendiente") return r
          const intentosUpd = [...(r.intentos || [])]
          if (intentosUpd.length > 0) {
            intentosUpd[intentosUpd.length - 1] = { ...intentosUpd[intentosUpd.length - 1]!, comentarioCorreccion }
          }
          return { ...r, estado: "en_ejecucion" as const, resultado: "pendiente" as const, fechaFin: undefined, intentos: intentosUpd }
        }),
      }
    }))
    const ev = crearEvento("caso_retesteo_solicitado", `Retesteo solicitado — ${comentarioCorreccion.slice(0, 80)}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huIdAfectada ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "info", title: "Retesteo solicitado", desc: "Caso listo para re-ejecutar" })
  }

  return {
    handleAddCaso,
    handleEditarCaso,
    handleEliminarCaso,
    handleEnviarAprobacion,
    handleEnviarCasoAprobacion,
    handleAprobarCasos,
    handleRechazarCasos,
    handleSolicitarModificacionCaso,
    handleHabilitarModificacionCaso,
    handleIniciarEjecucion,
    handleCompletarCasoEtapa,
    handleRetestearCaso,
    handleImportarCasos,
  }
}
