"use client"

import { useMemo } from "react"
import { STORAGE_KEYS } from "@/lib/storage"
import { historiasEjemplo, casosPruebaEjemplo, tareasEjemplo } from "@/lib/types"
import { useApiMirroredState } from "@/lib/hooks/useApiMirroredState"
import { api } from "@/lib/services/api/client"
import type { HistoriaUsuario, CasoPrueba, Tarea, ConfigEtapas, ResultadoDef, TipoNotificacion, RolDestinatario, Notificacion } from "@/lib/types"
import type { UserSafe } from "@/lib/contexts/auth-context"
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
  const error: string | null = null

  const [historias, setHistorias, historiasLoaded] = useApiMirroredState<HistoriaUsuario[]>(
    STORAGE_KEYS.historias, historiasEjemplo,
    () => api.get<{ historias: HistoriaUsuario[] }>("/api/historias").then(r => r.historias),
    (data) => api.post("/api/historias/sync", { historias: data }).then(() => void 0),
  )

  const [casos, setCasos, casosLoaded] = useApiMirroredState<CasoPrueba[]>(
    STORAGE_KEYS.casos, casosPruebaEjemplo,
    () => api.get<{ casos: CasoPrueba[] }>("/api/casos").then(r => r.casos),
    (data) => api.post("/api/casos/sync", { casos: data }).then(() => void 0),
  )

  const [tareas, setTareas, tareasLoaded] = useApiMirroredState<Tarea[]>(
    STORAGE_KEYS.tareas, tareasEjemplo,
    () => api.get<{ tareas: Tarea[] }>("/api/tareas").then(r => r.tareas),
    (data) => api.post("/api/tareas/sync", { tareas: data }).then(() => void 0),
  )

  // true mientras alguno de los tres recursos no haya completado su carga inicial desde la API
  const isLoading = useMemo(
    () => !historiasLoaded || !casosLoaded || !tareasLoaded,
    [historiasLoaded, casosLoaded, tareasLoaded]
  )

  const refetch = () => { /* no-op: la recarga la gestiona useApiMirroredState */ }

  const ctx: DomainCtx = {
    historias, casos,
    setHistorias: setHistorias as DomainCtx["setHistorias"],
    setCasos:     setCasos     as DomainCtx["setCasos"],
    setTareas:    setTareas    as DomainCtx["setTareas"],
    user, configEtapas, configResultados, addToast, addNotificacion,
  }

  return {
    // Async shape — listos para backend
    isLoading, error, refetch,
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
