import type { Bloqueo, BloqueoResuelto } from "@/lib/types"
import type { DomainCtx } from "./types"
import { defineCommand, type CommandResult } from "./pipeline"

function resolveBloqueo(b: Bloqueo, bId: string, nota: string, userName: string): Bloqueo {
  if (b.id !== bId) return b
  return { ...b, resuelto: true as const, fechaResolucion: new Date(), resueltoPor: userName, notaResolucion: nota } satisfies BloqueoResuelto
}

/** Handlers de gestión de Bloqueos: HU, casos y tareas. */
export function createBloqueoHandlers(ctx: DomainCtx) {
  const { tareas, user } = ctx
  const grupoId  = user?.grupoId ?? undefined
  const userName = user?.nombre  ?? "Sistema"

  const handleAddBloqueo = defineCommand(ctx, (huId: string, b: Bloqueo): CommandResult => ({
    historias: p => p.map(h => h.id !== huId ? h : { ...h, bloqueos: [...h.bloqueos, b] }),
    events:    [{ huId, tipo: "bloqueo_reportado", texto: `Bloqueo: ${b.descripcion.slice(0, 80)}` }],
    toast:     { type: "warning", title: "Bloqueo registrado", desc: b.descripcion.slice(0, 60) },
    notify:    {
      tipo: "bloqueo_reportado",
      titulo: "Bloqueo reportado en HU",
      descripcion: `${userName} reportó un bloqueo: ${b.descripcion.slice(0, 80)}`,
      destinatario: "admin",
      extra: { huId, grupoId },
    },
  }))

  const handleResolverBloqueo = defineCommand(ctx, (huId: string, bId: string, nota: string): CommandResult => ({
    historias: p => p.map(h => h.id !== huId ? h : {
      ...h, bloqueos: h.bloqueos.map(b => resolveBloqueo(b, bId, nota, userName)),
    }),
    events: [{ huId, tipo: "bloqueo_resuelto", texto: `Bloqueo resuelto: ${nota.slice(0, 80)}` }],
    toast:  { type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) },
    notify: {
      tipo: "bloqueo_resuelto",
      titulo: "Bloqueo de HU resuelto",
      descripcion: `${userName} resolvió un bloqueo: ${nota.slice(0, 80)}`,
      destinatario: "qa",
      extra: { huId, grupoId },
    },
  }))

  const handleResolverBloqueoCaso = defineCommand(ctx, (casoId: string, huId: string, bId: string, nota: string): CommandResult => ({
    casos: prev => prev.map(c =>
      c.id !== casoId ? c : { ...c, bloqueos: c.bloqueos.map(b => resolveBloqueo(b, bId, nota, userName)) }
    ),
    events: [{ huId, tipo: "bloqueo_resuelto", texto: `Bloqueo de caso resuelto: ${nota.slice(0, 80)}` }],
    toast:  { type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) },
    notify: {
      tipo: "bloqueo_resuelto",
      titulo: "Bloqueo de caso resuelto",
      descripcion: `${userName} resolvió un bloqueo en caso de prueba: ${nota.slice(0, 80)}`,
      destinatario: "qa",
      extra: { casoId, huId, grupoId },
    },
  }))

  const handleResolverBloqueoTarea = defineCommand(ctx, (tareaId: string, bId: string, nota: string): CommandResult | null => {
    const tarea = tareas.find(t => t.id === tareaId)
    if (!tarea) return null
    const { huId } = tarea
    return {
      tareas: prev => prev.map(t => {
        if (t.id !== tareaId) return t
        const bloqueos = t.bloqueos.map(b => resolveBloqueo(b, bId, nota, userName))
        return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" as const : "en_progreso" as const }
      }),
      events: [{ huId, tipo: "bloqueo_resuelto", texto: `Bloqueo de tarea resuelto: ${nota.slice(0, 80)}` }],
      toast:  { type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) },
      notify: {
        tipo: "bloqueo_resuelto",
        titulo: "Bloqueo de tarea resuelto",
        descripcion: `${userName} resolvió un bloqueo de tarea: ${nota.slice(0, 80)}`,
        destinatario: "qa",
        extra: { huId, grupoId },
      },
    }
  })

  return {
    handleAddBloqueo,
    handleResolverBloqueo,
    handleResolverBloqueoCaso,
    handleResolverBloqueoTarea,
  }
}
