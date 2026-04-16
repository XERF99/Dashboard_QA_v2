import { crearEvento } from "@/lib/types"
import type { Bloqueo, BloqueoResuelto } from "@/lib/types"
import type { DomainCtx } from "./types"

function resolveBloqueo(b: Bloqueo, bId: string, nota: string, userName: string): Bloqueo {
  if (b.id !== bId) return b
  return { ...b, resuelto: true as const, fechaResolucion: new Date(), resueltoPor: userName, notaResolucion: nota } satisfies BloqueoResuelto
}

/** Handlers de gestión de Bloqueos: HU, casos y tareas. */
export function createBloqueoHandlers({ tareas, setHistorias, setCasos, setTareas, user, addToast, addNotificacion }: DomainCtx) {
  const grupoId = user?.grupoId ?? undefined

  const handleAddBloqueo = (huId: string, b: Bloqueo) => {
    setHistorias(p => p.map(h => h.id !== huId ? h : {
      ...h, bloqueos: [...h.bloqueos, b],
      historial: [...h.historial, crearEvento("bloqueo_reportado", `Bloqueo: ${b.descripcion.slice(0, 80)}`, user?.nombre || "Sistema")],
    }))
    addToast({ type: "warning", title: "Bloqueo registrado", desc: b.descripcion.slice(0, 60) })
    addNotificacion("bloqueo_reportado", "Bloqueo reportado en HU",
      `${user?.nombre || "Sistema"} reportó un bloqueo: ${b.descripcion.slice(0, 80)}`,
      "admin", { huId, grupoId })
  }

  const handleResolverBloqueo = (huId: string, bId: string, nota: string) => {
    const userName = user?.nombre ?? "Sistema"
    setHistorias(p => p.map(h => h.id !== huId ? h : {
      ...h, bloqueos: h.bloqueos.map(b => resolveBloqueo(b, bId, nota, userName)),
      historial: [...h.historial, crearEvento("bloqueo_resuelto", `Bloqueo resuelto: ${nota.slice(0, 80)}`, userName)],
    }))
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
    addNotificacion("bloqueo_resuelto", "Bloqueo de HU resuelto",
      `${user?.nombre || "Sistema"} resolvió un bloqueo: ${nota.slice(0, 80)}`,
      "qa", { huId, grupoId })
  }

  const handleResolverBloqueoCaso = (casoId: string, huId: string, bId: string, nota: string) => {
    const userName = user?.nombre ?? "Sistema"
    setCasos(prev => prev.map(c =>
      c.id !== casoId ? c : {
        ...c, bloqueos: c.bloqueos.map(b => resolveBloqueo(b, bId, nota, userName)),
      }
    ))
    const ev = crearEvento("bloqueo_resuelto", `Bloqueo de caso resuelto: ${nota.slice(0, 80)}`, userName)
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
    addNotificacion("bloqueo_resuelto", "Bloqueo de caso resuelto",
      `${user?.nombre || "Sistema"} resolvió un bloqueo en caso de prueba: ${nota.slice(0, 80)}`,
      "qa", { casoId, huId, grupoId })
  }

  const handleResolverBloqueoTarea = (tareaId: string, bId: string, nota: string) => {
    const tarea = tareas.find(t => t.id === tareaId)
    if (!tarea) return
    const huId = tarea.huId
    const userName = user?.nombre ?? "Sistema"
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      const bloqueos = t.bloqueos.map(b => resolveBloqueo(b, bId, nota, userName))
      return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" as const : "en_progreso" as const }
    }))
    const ev = crearEvento("bloqueo_resuelto", `Bloqueo de tarea resuelto: ${nota.slice(0, 80)}`, userName)
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
    addNotificacion("bloqueo_resuelto", "Bloqueo de tarea resuelto",
      `${user?.nombre || "Sistema"} resolvió un bloqueo de tarea: ${nota.slice(0, 80)}`,
      "qa", { huId, grupoId })
  }

  return {
    handleAddBloqueo,
    handleResolverBloqueo,
    handleResolverBloqueoCaso,
    handleResolverBloqueoTarea,
  }
}
