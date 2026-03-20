"use client"

import { useState } from "react"
import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import { historiasEjemplo, casosPruebaEjemplo, tareasEjemplo } from "@/lib/types"
import type { HistoriaUsuario, CasoPrueba, Tarea, ConfigEtapas, TipoNotificacion, RolDestinatario, Notificacion } from "@/lib/types"
import type { UserSafe } from "@/lib/auth-context"
import { createHUHandlers }          from "./domain/huHandlers"
import { createCasoHandlers }        from "./domain/casoHandlers"
import { createTareaHandlers }       from "./domain/tareaHandlers"
import { createBloqueoHandlers }     from "./domain/bloqueoHandlers"
import { createComentarioHandlers }  from "./domain/comentarioHandlers"
import type { DomainCtx } from "./domain/types"

interface DomainDataOptions {
  user: UserSafe | null
  configEtapas: ConfigEtapas
  addToast: (t: { type: "success" | "warning" | "error" | "info"; title: string; desc?: string }) => void
  addNotificacion: (
    tipo: TipoNotificacion,
    titulo: string,
    descripcion: string,
    destinatario: RolDestinatario,
    extra?: Pick<Notificacion, "casoId" | "huId" | "huTitulo" | "casoTitulo">
  ) => void
}

/**
 * Facade: inicializa el estado de dominio y delega cada grupo de handlers
 * a su módulo especializado en domain/*.
 *
 * API pública sin cambios — ningún componente necesita actualizarse.
 * Al conectar un backend: reemplazar usePersistedState por llamadas a API
 * dentro de los módulos domain/*.
 */
export function useDomainData({ user, configEtapas, addToast, addNotificacion }: DomainDataOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const refetch = () => { /* noop — implementar fetch al conectar backend */ }

  const [historias, setHistorias] = usePersistedState<HistoriaUsuario[]>(STORAGE_KEYS.historias, historiasEjemplo)
  const [casos, setCasos]         = usePersistedState<CasoPrueba[]>(STORAGE_KEYS.casos, casosPruebaEjemplo)
  const [tareas, setTareas]       = usePersistedState<Tarea[]>(STORAGE_KEYS.tareas, tareasEjemplo)

  const ctx: DomainCtx = {
    historias, casos,
    setHistorias: setHistorias as DomainCtx["setHistorias"],
    setCasos:     setCasos     as DomainCtx["setCasos"],
    setTareas:    setTareas    as DomainCtx["setTareas"],
    user, configEtapas, addToast, addNotificacion,
  }

  return {
    // Async shape — listos para backend
    isLoading, setIsLoading, error, setError, refetch,
    // Estado
    historias, setHistorias,
    casos,     setCasos,
    tareas,    setTareas,
    // Handlers por dominio
    ...createHUHandlers(ctx),
    ...createCasoHandlers(ctx),
    ...createTareaHandlers(ctx),
    ...createBloqueoHandlers(ctx),
    ...createComentarioHandlers(ctx),
  }
}
