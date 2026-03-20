import { crearEvento } from "@/lib/types"
import type { Tarea, Bloqueo } from "@/lib/types"
import type { DomainCtx } from "./types"

/** Handlers de gestión de Tareas: CRUD, completar y bloqueos. */
export function createTareaHandlers({ setHistorias, setCasos, setTareas, user, addToast }: DomainCtx) {
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

  return {
    handleAddTarea,
    handleEditarTarea,
    handleEliminarTarea,
    handleCompletarTarea,
    handleBloquearTarea,
    handleDesbloquearTarea,
  }
}
