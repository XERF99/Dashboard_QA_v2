"use client"

import { useMemo, useEffect } from "react"
import { useHistoriasData }       from "./useHistoriasData"
import { useCasosData }           from "./useCasosData"
import { useTareasData }          from "./useTareasData"
import { createHUHandlers }       from "./domain/huHandlers"
import { createCasoHandlers }     from "./domain/casoHandlers"
import { createTareaHandlers }    from "./domain/tareaHandlers"
import { createBloqueoHandlers }  from "./domain/bloqueoHandlers"
import { createComentarioHandlers } from "./domain/comentarioHandlers"
import type { DomainCtx } from "./domain/types"
import type { ConfigEtapas, ResultadoDef, TipoNotificacion, RolDestinatario, Notificacion } from "@/lib/types"
import type { UserSafe } from "@/lib/contexts/auth-context"

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
    extra?: Pick<Notificacion, "casoId" | "huId" | "huTitulo" | "casoTitulo" | "grupoId">
  ) => void
}

export function useDomainData({ user, configEtapas, configResultados, addToast, addNotificacion }: DomainDataOptions) {
  const [historias, setHistorias, historiasLoaded, historiasError, historiasSyncError] = useHistoriasData()
  const [casos,     setCasos,     casosLoaded,     casosError,     casosSyncError]     = useCasosData()
  const [tareas,    setTareas,    tareasLoaded,    tareasError,    tareasSyncError]     = useTareasData()

  const error = historiasError ?? casosError ?? tareasError ?? null

  useEffect(() => {
    const syncErr = historiasSyncError ?? casosSyncError ?? tareasSyncError
    if (syncErr) {
      addToast({ type: "error", title: "Error al guardar", desc: "Los cambios no pudieron sincronizarse con el servidor. Comprueba tu conexión." })
    }
  }, [historiasSyncError, casosSyncError, tareasSyncError]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLoading = useMemo(
    () => !historiasLoaded || !casosLoaded || !tareasLoaded,
    [historiasLoaded, casosLoaded, tareasLoaded]
  )

  const refetch = () => { /* no-op: la recarga la gestiona useApiMirroredState */ }

  const ctx: DomainCtx = {
    historias, casos, tareas,
    setHistorias: setHistorias as DomainCtx["setHistorias"],
    setCasos:     setCasos     as DomainCtx["setCasos"],
    setTareas:    setTareas    as DomainCtx["setTareas"],
    user, configEtapas, configResultados, addToast, addNotificacion,
  }

  return {
    isLoading, error, refetch,
    historias, setHistorias,
    casos,     setCasos,
    tareas,    setTareas,
    ...createHUHandlers(ctx),
    ...createCasoHandlers(ctx),
    ...createTareaHandlers(ctx),
    ...createBloqueoHandlers(ctx),
    ...createComentarioHandlers(ctx),
  }
}
