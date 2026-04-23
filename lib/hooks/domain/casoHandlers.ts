import type { CasoPrueba, EstadoAprobacion, EtapaEjecucion } from "@/lib/types"
import type { DomainCtx } from "./types"
import { defineCommand, type CommandResult } from "./pipeline"
import { api } from "@/lib/services/api/client"
import { API } from "@/lib/constants/api-routes"

/** Handlers de gestión de Casos de Prueba: CRUD, aprobación y ejecución. */
export function createCasoHandlers(ctx: DomainCtx) {
  const { historias, casos, tareas, user } = ctx
  const grupoId = user?.grupoId ?? undefined
  const autor   = user?.nombre  ?? "QA"

  const handleAddCaso = defineCommand(ctx, (caso: CasoPrueba): CommandResult => ({
    casos:     prev => [...prev, caso],
    historias: prev => prev.map(h => h.id !== caso.huId ? h : { ...h, casosIds: [...h.casosIds, caso.id] }),
    events:    [{ huId: caso.huId, tipo: "caso_creado", texto: `Caso creado: ${caso.titulo}` }],
    toast:     { type: "success", title: "Caso de prueba creado", desc: caso.titulo },
  }))

  const handleEditarCaso = defineCommand(ctx, (caso: CasoPrueba): CommandResult => ({
    casos:  prev => prev.map(c => c.id === caso.id ? caso : c),
    events: [{ huId: caso.huId, tipo: "caso_editado", texto: `Caso editado: ${caso.titulo}` }],
    toast:  { type: "success", title: "Caso actualizado", desc: caso.titulo },
  }))

  const handleEliminarCaso = defineCommand(ctx, (casoId: string, huId: string): CommandResult => ({
    casos:     prev => prev.filter(c => c.id !== casoId),
    tareas:    prev => prev.filter(t => t.casoPruebaId !== casoId),
    historias: prev => prev.map(h => h.id !== huId ? h : { ...h, casosIds: h.casosIds.filter(id => id !== casoId) }),
    events:    [{ huId, tipo: "caso_eliminado", texto: "Caso de prueba eliminado" }],
    toast:     { type: "warning", title: "Caso eliminado" },
    api:       { call: () => api.delete(API.caso(casoId)), context: "Casos", message: "Error al eliminar caso en API" },
  }))

  const handleEnviarAprobacion = defineCommand(ctx, (huId: string): CommandResult => {
    const hu = historias.find(h => h.id === huId)
    return {
      casos: prev => prev.map(c =>
        c.huId === huId && (c.estadoAprobacion === "borrador" || c.estadoAprobacion === "rechazado")
          ? { ...c, estadoAprobacion: "pendiente_aprobacion" as EstadoAprobacion } : c
      ),
      events: [{ huId, tipo: "caso_enviado_aprobacion", texto: "Casos enviados para aprobación" }],
      toast:  { type: "info", title: "Casos enviados", desc: "Pendientes de aprobación" },
      notify: {
        tipo: "aprobacion_enviada",
        titulo: "Casos enviados a aprobación",
        descripcion: `${autor} envió todos los casos de la HU "${hu?.titulo || huId}" para aprobación`,
        destinatario: "admin",
        extra: { huId, huTitulo: hu?.titulo, grupoId },
      },
    }
  })

  const handleEnviarCasoAprobacion = defineCommand(ctx, (casoId: string, huId: string): CommandResult => {
    const caso = casos.find(c => c.id === casoId)
    const hu   = historias.find(h => h.id === huId)
    return {
      casos: prev => prev.map(c =>
        c.id === casoId && (c.estadoAprobacion === "borrador" || c.estadoAprobacion === "rechazado")
          ? { ...c, estadoAprobacion: "pendiente_aprobacion" as EstadoAprobacion } : c
      ),
      events: [{ huId, tipo: "caso_enviado_aprobacion", texto: "Caso enviado para aprobación" }],
      toast:  { type: "info", title: "Caso enviado", desc: "Pendiente de aprobación" },
      notify: {
        tipo: "aprobacion_enviada",
        titulo: "Caso enviado a aprobación",
        descripcion: `${autor} envió el caso "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}" para aprobación`,
        destinatario: "admin",
        extra: { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo, grupoId },
      },
    }
  })

  const handleAprobarCasos = defineCommand(ctx, (huId: string): CommandResult => {
    const hu = historias.find(h => h.id === huId)
    return {
      casos: prev => prev.map(c =>
        c.huId === huId && c.estadoAprobacion === "pendiente_aprobacion"
          ? { ...c, estadoAprobacion: "aprobado" as EstadoAprobacion, aprobadoPor: user?.nombre, fechaAprobacion: new Date() } : c
      ),
      events: [{ huId, tipo: "caso_aprobado", texto: `Casos aprobados por ${user?.nombre}` }],
      toast:  { type: "success", title: "Casos aprobados" },
      notify: {
        tipo: "caso_aprobado",
        titulo: "Casos aprobados",
        descripcion: `Admin aprobó todos los casos de la HU "${hu?.titulo || huId}"`,
        destinatario: "qa",
        extra: { huId, huTitulo: hu?.titulo, grupoId },
      },
    }
  })

  const handleRechazarCasos = defineCommand(ctx, (huId: string, motivo: string): CommandResult => {
    const hu = historias.find(h => h.id === huId)
    return {
      casos: prev => prev.map(c =>
        c.huId === huId && c.estadoAprobacion === "pendiente_aprobacion"
          ? { ...c, estadoAprobacion: "rechazado" as EstadoAprobacion, motivoRechazo: motivo } : c
      ),
      events: [{ huId, tipo: "caso_rechazado", texto: `Casos rechazados: ${motivo}` }],
      toast:  { type: "warning", title: "Casos rechazados", desc: motivo.slice(0, 60) },
      notify: {
        tipo: "caso_rechazado",
        titulo: "Casos rechazados",
        descripcion: `Admin rechazó los casos de la HU "${hu?.titulo || huId}": ${motivo.slice(0, 80)}`,
        destinatario: "qa",
        extra: { huId, huTitulo: hu?.titulo, grupoId },
      },
    }
  })

  const handleSolicitarModificacionCaso = defineCommand(ctx, (casoId: string, huId: string): CommandResult => {
    const caso = casos.find(c => c.id === casoId)
    const hu   = historias.find(h => h.id === huId)
    return {
      casos:  prev => prev.map(c => c.id === casoId ? { ...c, modificacionSolicitada: true } : c),
      events: [{ huId, tipo: "caso_modificacion_solicitada", texto: "QA solicitó modificación de caso aprobado" }],
      toast:  { type: "info", title: "Modificación solicitada", desc: "El admin puede habilitar el cambio" },
      notify: {
        tipo: "modificacion_solicitada",
        titulo: "Solicitud de modificación",
        descripcion: `${autor} solicita modificar el caso aprobado "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}"`,
        destinatario: "admin",
        extra: { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo, grupoId },
      },
    }
  })

  const handleHabilitarModificacionCaso = defineCommand(ctx, (casoId: string, huId: string): CommandResult => {
    const caso = casos.find(c => c.id === casoId)
    const hu   = historias.find(h => h.id === huId)
    return {
      casos: prev => prev.map(c =>
        c.id === casoId
          ? { ...c, modificacionHabilitada: true, modificacionSolicitada: false, estadoAprobacion: "borrador" as EstadoAprobacion }
          : c
      ),
      events: [{ huId, tipo: "caso_modificacion_habilitada", texto: "Admin habilitó modificación de caso" }],
      toast:  { type: "success", title: "Modificación habilitada", desc: "QA puede editar el caso" },
      notify: {
        tipo: "modificacion_habilitada",
        titulo: "Modificación habilitada",
        descripcion: `Admin habilitó la modificación del caso "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}"`,
        destinatario: "qa",
        extra: { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo, grupoId },
      },
    }
  })

  const handleIniciarEjecucion = defineCommand(ctx, (huId: string, etapa: EtapaEjecucion): CommandResult => ({
    casos: prev => prev.map(c => {
      if (c.huId !== huId || c.estadoAprobacion !== "aprobado") return c
      const yaExiste = c.resultadosPorEtapa.some(r => r.etapa === etapa)
      return {
        ...c, resultadosPorEtapa: yaExiste
          ? c.resultadosPorEtapa.map(r => r.etapa === etapa && r.estado === "pendiente" ? { ...r, estado: "en_ejecucion" as const, fechaInicio: new Date() } : r)
          : [...c.resultadosPorEtapa, { etapa, estado: "en_ejecucion" as const, resultado: "pendiente" as const, fechaInicio: new Date(), intentos: [] }],
      }
    }),
    events: [{ huId, tipo: "caso_ejecucion_iniciada", texto: `Ejecución iniciada — etapa ${etapa}` }],
    toast:  { type: "info", title: "Ejecución iniciada", desc: `Etapa: ${etapa}` },
  }))

  const handleCompletarCasoEtapa = defineCommand(ctx, (casoId: string, etapa: EtapaEjecucion, resultado: string, comentarioFallo?: string): CommandResult | null => {
    const tareasConBloqueo = tareas.filter(t => t.casoPruebaId === casoId && t.bloqueos.some(b => !b.resuelto))
    if (tareasConBloqueo.length > 0) {
      return {
        toast: {
          type: "error",
          title: "Caso bloqueado",
          desc: `Hay ${tareasConBloqueo.length} tarea${tareasConBloqueo.length !== 1 ? "s" : ""} con bloqueos activos. Resuélvelos antes de completar el caso.`,
        },
      }
    }

    const casoAfectado = casos.find(c => c.id === casoId)
    if (!casoAfectado) return null

    const { huId, titulo } = casoAfectado

    return {
      casos: prev => prev.map(c => {
        if (c.id !== casoId) return c
        return {
          ...c, resultadosPorEtapa: c.resultadosPorEtapa.map(r => {
            if (r.etapa !== etapa) return r
            const intento = {
              numero: (r.intentos?.length || 0) + 1,
              resultado,
              comentarioFallo: resultado === "fallido" ? comentarioFallo : undefined,
              fecha: new Date(),
              ejecutadoPor: autor,
            }
            return { ...r, estado: "completado" as const, resultado, fechaFin: new Date(), intentos: [...(r.intentos || []), intento] }
          }),
        }
      }),
      events: [{ huId, tipo: "caso_completado", texto: `Caso "${titulo}" completado: ${resultado} — etapa ${etapa}` }],
      toast:  {
        type: resultado === "exitoso" ? "success" : resultado === "fallido" ? "error" : "info",
        title: `Caso: ${resultado}`,
        desc: `Etapa ${etapa}`,
      },
    }
  })

  const handleImportarCasos = defineCommand(ctx, (nuevosCasos: CasoPrueba[]): CommandResult => {
    const events = historias
      .map(h => {
        const suyos = nuevosCasos.filter(c => c.huId === h.id)
        if (suyos.length === 0) return null
        return {
          huId: h.id,
          tipo: "caso_creado" as const,
          texto: `${suyos.length} caso${suyos.length !== 1 ? "s" : ""} importado${suyos.length !== 1 ? "s" : ""} desde CSV`,
        }
      })
      .filter((e): e is { huId: string; tipo: "caso_creado"; texto: string } => e !== null)

    return {
      casos: prev => [...prev, ...nuevosCasos],
      historias: prev => prev.map(h => {
        const suyos = nuevosCasos.filter(c => c.huId === h.id)
        if (suyos.length === 0) return h
        return { ...h, casosIds: [...h.casosIds, ...suyos.map(c => c.id)] }
      }),
      events,
      toast: {
        type: "success",
        title: `${nuevosCasos.length} caso${nuevosCasos.length !== 1 ? "s" : ""} importado${nuevosCasos.length !== 1 ? "s" : ""}`,
        desc: "Desde archivo CSV",
      },
    }
  })

  const handleRetestearCaso = defineCommand(ctx, (casoId: string, etapa: EtapaEjecucion, comentarioCorreccion: string): CommandResult | null => {
    const casoAfectado = casos.find(c => c.id === casoId)
    if (!casoAfectado) return null
    const { huId } = casoAfectado

    return {
      casos: prev => prev.map(c => {
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
      }),
      events: [{ huId, tipo: "caso_retesteo_solicitado", texto: `Retesteo solicitado — ${comentarioCorreccion.slice(0, 80)}` }],
      toast:  { type: "info", title: "Retesteo solicitado", desc: "Caso listo para re-ejecutar" },
    }
  })

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
