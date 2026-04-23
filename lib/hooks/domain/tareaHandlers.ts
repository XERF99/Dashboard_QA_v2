import type { Tarea, Bloqueo, BloqueoResuelto } from "@/lib/types"
import type { DomainCtx } from "./types"
import { defineCommand, type CommandResult } from "./pipeline"
import { api } from "@/lib/services/api/client"
import { API } from "@/lib/constants/api-routes"

/** Handlers de gestión de Tareas: CRUD, completar y bloqueos. */
export function createTareaHandlers(ctx: DomainCtx) {
  const { tareas, user } = ctx

  const handleAddTarea = defineCommand(ctx, (tarea: Tarea): CommandResult => ({
    tareas: prev => [...prev, tarea],
    casos:  prev => prev.map(c => c.id === tarea.casoPruebaId ? { ...c, tareasIds: [...c.tareasIds, tarea.id] } : c),
    toast:  { type: "success", title: "Tarea creada", desc: tarea.titulo },
  }))

  const handleEditarTarea = defineCommand(ctx, (tarea: Tarea): CommandResult => ({
    tareas: prev => prev.map(t => t.id === tarea.id ? tarea : t),
    toast:  { type: "success", title: "Tarea actualizada", desc: tarea.titulo },
  }))

  const handleEliminarTarea = defineCommand(ctx, (tareaId: string, casoId: string): CommandResult => ({
    tareas: prev => prev.filter(t => t.id !== tareaId),
    casos:  prev => prev.map(c => c.id === casoId ? { ...c, tareasIds: c.tareasIds.filter(id => id !== tareaId) } : c),
    api:    { call: () => api.delete(API.tarea(tareaId)), context: "Tareas", message: "Error al eliminar tarea en API" },
    toast:  { type: "warning", title: "Tarea eliminada" },
  }))

  const handleCompletarTarea = defineCommand(ctx, (tareaId: string, resultado: "exitoso" | "fallido"): CommandResult => ({
    tareas: prev => prev.map(t => t.id === tareaId ? { ...t, estado: "completada", resultado, fechaFin: new Date() } : t),
    toast:  { type: resultado === "exitoso" ? "success" : "error", title: `Tarea ${resultado}` },
  }))

  const handleBloquearTarea = defineCommand(ctx, (tareaId: string, bloqueo: Bloqueo): CommandResult | null => {
    const tarea = tareas.find(t => t.id === tareaId)
    if (!tarea) return null
    const { huId } = tarea
    return {
      tareas: prev => prev.map(t => t.id !== tareaId ? t : { ...t, estado: "bloqueada", bloqueos: [...t.bloqueos, bloqueo] }),
      events: [{ huId, tipo: "tarea_bloqueada", texto: `Tarea bloqueada: ${bloqueo.descripcion.slice(0, 80)}` }],
      toast:  { type: "warning", title: "Tarea bloqueada", desc: bloqueo.descripcion.slice(0, 60) },
    }
  })

  const handleDesbloquearTarea = defineCommand(ctx, (tareaId: string, bloqueoId: string): CommandResult | null => {
    const tarea = tareas.find(t => t.id === tareaId)
    if (!tarea) return null
    const { huId } = tarea
    const userName = user?.nombre ?? "Sistema"
    return {
      tareas: prev => prev.map(t => {
        if (t.id !== tareaId) return t
        const bloqueos = t.bloqueos.map(b => b.id === bloqueoId
          ? { ...b, resuelto: true as const, fechaResolucion: new Date(), resueltoPor: userName } satisfies BloqueoResuelto
          : b
        )
        return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" as const : "en_progreso" as const }
      }),
      events: [{ huId, tipo: "tarea_desbloqueada", texto: "Bloqueo de tarea resuelto" }],
      toast:  { type: "success", title: "Bloqueo resuelto" },
    }
  })

  return {
    handleAddTarea,
    handleEditarTarea,
    handleEliminarTarea,
    handleCompletarTarea,
    handleBloquearTarea,
    handleDesbloquearTarea,
  }
}
