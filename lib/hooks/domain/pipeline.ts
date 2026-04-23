"use client"

// ═══════════════════════════════════════════════════════════════
//  Command pipeline — patrón Command + dispatcher
//
//  Cada acción de dominio se expresa como un *CommandResult* declarativo:
//    - mutate       → diffs a aplicar al estado (historias / casos / tareas)
//    - events       → eventos a añadir al historial de HUs
//    - toast        → notificación local al usuario
//    - notify       → notificación persistida por rol
//    - api          → side-effect fire-and-forget (con clientWarn on error)
//
//  `runCommand` centraliza:
//    - la combinación de mutaciones + eventos en un único setHistorias
//    - el orden de los efectos colaterales (state → toast → notify → api)
//    - el logging estructurado de errores de API
//
//  Esto elimina la duplicación del patrón
//    `setHistorias(prev => prev.map(h => h.id === huId
//      ? { ...h, historial: [...h.historial, crearEvento(...)] } : h))`
//  que aparecía ~20 veces entre los handlers de dominio.
// ═══════════════════════════════════════════════════════════════

import { crearEvento } from "@/lib/types"
import type {
  HistoriaUsuario,
  CasoPrueba,
  Tarea,
  TipoEvento,
  TipoNotificacion,
  RolDestinatario,
  Notificacion,
} from "@/lib/types"
import type { DomainCtx, ToastPayload } from "./types"
import { clientWarn } from "@/lib/client-logger"

type Updater<T> = (prev: T) => T

export interface EventSpec {
  huId: string
  tipo: TipoEvento
  texto: string
}

export interface NotifySpec {
  tipo: TipoNotificacion
  titulo: string
  descripcion: string
  destinatario: RolDestinatario
  extra?: Pick<Notificacion, "casoId" | "huId" | "huTitulo" | "casoTitulo" | "grupoId">
}

export interface ApiSpec {
  call: () => Promise<unknown>
  context: string
  message: string
}

export interface CommandResult {
  historias?: Updater<HistoriaUsuario[]>
  casos?:     Updater<CasoPrueba[]>
  tareas?:    Updater<Tarea[]>
  events?:    EventSpec[]
  toast?:     ToastPayload
  notify?:    NotifySpec
  api?:       ApiSpec
}

export function runCommand(ctx: DomainCtx, result: CommandResult | null | undefined): void {
  if (!result) return
  const autor = ctx.user?.nombre || "Sistema"

  if (result.casos)  ctx.setCasos(result.casos)
  if (result.tareas) ctx.setTareas(result.tareas)

  const hasEvents = !!(result.events && result.events.length > 0)
  if (result.historias || hasEvents) {
    ctx.setHistorias(prev => {
      const afterMutate = result.historias ? result.historias(prev) : prev
      if (!hasEvents) return afterMutate
      return result.events!.reduce((acc, spec) => {
        const evento = crearEvento(spec.tipo, spec.texto, autor)
        return acc.map(h => h.id === spec.huId ? { ...h, historial: [...h.historial, evento] } : h)
      }, afterMutate)
    })
  }

  if (result.toast)  ctx.addToast(result.toast)
  if (result.notify) ctx.addNotificacion(result.notify.tipo, result.notify.titulo, result.notify.descripcion, result.notify.destinatario, result.notify.extra)
  if (result.api) {
    const { call, context, message } = result.api
    call().catch(err => clientWarn(context, message, err))
  }
}

export function defineCommand<Args extends unknown[]>(
  ctx: DomainCtx,
  build: (...args: Args) => CommandResult | null,
): (...args: Args) => void {
  return (...args: Args) => runCommand(ctx, build(...args))
}
