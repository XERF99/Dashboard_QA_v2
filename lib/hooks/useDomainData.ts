"use client"

import { useMemo, useEffect } from "react"
import { STORAGE_KEYS } from "@/lib/storage"
import { historiasEjemplo, casosPruebaEjemplo, tareasEjemplo } from "@/lib/types"
import { useApiMirroredState } from "@/lib/hooks/useApiMirroredState"
import { api } from "@/lib/services/api/client"
import type { HistoriaUsuario, CasoPrueba, Tarea, Bloqueo, ConfigEtapas, ResultadoDef, TipoNotificacion, RolDestinatario, Notificacion } from "@/lib/types"
import type { UserSafe } from "@/lib/contexts/auth-context"
import { createHUHandlers }          from "./domain/huHandlers"
import { createCasoHandlers }        from "./domain/casoHandlers"
import { createTareaHandlers }       from "./domain/tareaHandlers"
import { createBloqueoHandlers }     from "./domain/bloqueoHandlers"
import { createComentarioHandlers }  from "./domain/comentarioHandlers"
import type { DomainCtx } from "./domain/types"

// ── Date normalization ────────────────────────────────────────────────────────
// JSON serialization converts Date → ISO string. These parsers restore proper
// Date objects at the API boundary so every consumer gets real Date instances.

function d(v: unknown): Date { return v instanceof Date ? v : new Date(v as string) }
function dOpt(v: unknown): Date | undefined { return v == null ? undefined : d(v) }

function parseBloqueo(b: Bloqueo): Bloqueo {
  return { ...b, fecha: d(b.fecha), fechaResolucion: dOpt(b.fechaResolucion) }
}

function parseHistorias(raw: HistoriaUsuario[]): HistoriaUsuario[] {
  return raw.map(h => ({
    ...h,
    fechaCreacion:    d(h.fechaCreacion),
    fechaFinEstimada: dOpt(h.fechaFinEstimada),
    fechaCierre:      dOpt(h.fechaCierre),
    bloqueos:  h.bloqueos.map(parseBloqueo),
    historial: h.historial.map(e => ({ ...e, fecha: d(e.fecha) })),
  }))
}

function parseCasos(raw: CasoPrueba[]): CasoPrueba[] {
  return raw.map(c => ({
    ...c,
    fechaCreacion:   d(c.fechaCreacion),
    fechaAprobacion: dOpt(c.fechaAprobacion),
    bloqueos:    c.bloqueos.map(parseBloqueo),
    comentarios: c.comentarios.map(cm => ({ ...cm, fecha: d(cm.fecha) })),
    resultadosPorEtapa: c.resultadosPorEtapa.map(r => ({
      ...r,
      fechaInicio: dOpt(r.fechaInicio),
      fechaFin:    dOpt(r.fechaFin),
    })),
  }))
}

function parseTareas(raw: Tarea[]): Tarea[] {
  return raw.map(t => ({
    ...t,
    fechaCreacion: d(t.fechaCreacion),
    fechaInicio:   dOpt(t.fechaInicio),
    fechaFin:      dOpt(t.fechaFin),
    bloqueos: t.bloqueos.map(parseBloqueo),
  }))
}

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

/**
 * Facade: inicializa el estado de dominio y delega cada grupo de handlers
 * a su módulo especializado en domain/*.
 *
 * API pública sin cambios — ningún componente necesita actualizarse.
 * Al conectar un backend: reemplazar usePersistedState por llamadas a API
 * dentro de los módulos domain/*.
 */
export function useDomainData({ user, configEtapas, configResultados, addToast, addNotificacion }: DomainDataOptions) {
  const [historias, setHistorias, historiasLoaded, historiasError, historiasSyncError] = useApiMirroredState<HistoriaUsuario[]>(
    STORAGE_KEYS.historias, historiasEjemplo,
    (_signal) => api.get<{ historias: HistoriaUsuario[] }>("/api/historias").then(r => parseHistorias(r.historias)),
    (data) => api.post("/api/historias/sync", { historias: data }).then(() => void 0),
  )

  const [casos, setCasos, casosLoaded, casosError, casosSyncError] = useApiMirroredState<CasoPrueba[]>(
    STORAGE_KEYS.casos, casosPruebaEjemplo,
    (_signal) => api.get<{ casos: CasoPrueba[] }>("/api/casos").then(r => parseCasos(r.casos)),
    (data) => api.post("/api/casos/sync", { casos: data }).then(() => void 0),
  )

  const [tareas, setTareas, tareasLoaded, tareasError, tareasSyncError] = useApiMirroredState<Tarea[]>(
    STORAGE_KEYS.tareas, tareasEjemplo,
    (_signal) => api.get<{ tareas: Tarea[] }>("/api/tareas").then(r => parseTareas(r.tareas)),
    (data) => api.post("/api/tareas/sync", { tareas: data }).then(() => void 0),
  )

  const error = historiasError ?? casosError ?? tareasError ?? null

  // Toast cuando el sync falla tras todos los reintentos
  useEffect(() => {
    const syncErr = historiasSyncError ?? casosSyncError ?? tareasSyncError
    if (syncErr) {
      addToast({ type: "error", title: "Error al guardar", desc: "Los cambios no pudieron sincronizarse con el servidor. Comprueba tu conexión." })
    }
  }, [historiasSyncError, casosSyncError, tareasSyncError]) // eslint-disable-line react-hooks/exhaustive-deps

  // true mientras alguno de los tres recursos no haya completado su carga inicial desde la API
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
