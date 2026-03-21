"use client"

import { useState } from "react"
import { STORAGE_KEYS } from "@/lib/storage"
import { historiasEjemplo, casosPruebaEjemplo, tareasEjemplo } from "@/lib/types"
import { useApiMirroredState } from "@/lib/hooks/useApiMirroredState"
import { api } from "@/lib/services/api/client"
import type { HistoriaUsuario, CasoPrueba, Tarea, ConfigEtapas, ResultadoDef, TipoNotificacion, RolDestinatario, Notificacion } from "@/lib/types"
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
  configResultados: ResultadoDef[]
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
export function useDomainData({ user, configEtapas, configResultados, addToast, addNotificacion }: DomainDataOptions) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [historias, setHistorias] = useApiMirroredState<HistoriaUsuario[]>(
    STORAGE_KEYS.historias, historiasEjemplo,
    () => api.get<{ historias: HistoriaUsuario[] }>("/api/historias").then(r => r.historias),
    (data) => api.post("/api/historias/sync", { historias: data }).then(() => void 0),
  )

  const [casos, setCasos] = useApiMirroredState<CasoPrueba[]>(
    STORAGE_KEYS.casos, casosPruebaEjemplo,
    () => api.get<{ casos: CasoPrueba[] }>("/api/casos").then(r => r.casos),
    (data) => api.post("/api/casos/sync", { casos: data }).then(() => void 0),
  )

  const [tareas, setTareas] = useApiMirroredState<Tarea[]>(
    STORAGE_KEYS.tareas, tareasEjemplo,
    () => api.get<{ tareas: Tarea[] }>("/api/tareas").then(r => r.tareas),
    (data) => api.post("/api/tareas/sync", { tareas: data }).then(() => void 0),
  )

  const refetch = () => { setIsLoading(false) }

  const ctx: DomainCtx = {
    historias, casos,
    setHistorias: setHistorias as DomainCtx["setHistorias"],
    setCasos:     setCasos     as DomainCtx["setCasos"],
    setTareas:    setTareas    as DomainCtx["setTareas"],
    user, configEtapas, configResultados, addToast, addNotificacion,
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
