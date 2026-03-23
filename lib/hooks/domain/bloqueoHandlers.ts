import { crearEvento } from "@/lib/types"
import type { Bloqueo } from "@/lib/types"
import type { DomainCtx } from "./types"

/** Handlers de gestión de Bloqueos: HU, casos y tareas. */
export function createBloqueoHandlers({ tareas, setHistorias, setCasos, setTareas, user, addToast }: DomainCtx) {
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
    const tarea = tareas.find(t => t.id === tareaId)
    if (!tarea) return
    const huId = tarea.huId
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      const bloqueos = t.bloqueos.map(b => b.id === bId
        ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre, notaResolucion: nota }
        : b
      )
      return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" as const : "en_progreso" as const }
    }))
    const ev = crearEvento("bloqueo_resuelto", `Bloqueo de tarea resuelto: ${nota.slice(0, 80)}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
  }

  return {
    handleAddBloqueo,
    handleResolverBloqueo,
    handleResolverBloqueoCaso,
    handleResolverBloqueoTarea,
  }
}
