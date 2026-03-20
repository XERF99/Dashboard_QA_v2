import { crearEvento, etapaCompletada, siguienteEtapa } from "@/lib/types"
import type { CasoPrueba, EstadoAprobacion, EtapaEjecucion } from "@/lib/types"
import type { DomainCtx } from "./types"

/** Handlers de gestión de Casos de Prueba: CRUD, aprobación y ejecución. */
export function createCasoHandlers({ historias, casos, setHistorias, setCasos, setTareas, user, configEtapas, addToast, addNotificacion }: DomainCtx) {
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
      "admin", { huId, huTitulo: hu?.titulo })
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
  }
}
