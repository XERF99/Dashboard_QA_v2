"use client"

import { usePersistedState, cargarDeStorage, guardarEnStorage, STORAGE_KEYS } from "@/lib/storage"
import {
  ETAPAS_PREDETERMINADAS,
  RESULTADOS_PREDETERMINADOS,
  TIPOS_APLICACION_PREDETERMINADOS,
  AMBIENTES_PREDETERMINADOS,
  TIPOS_PRUEBA_PREDETERMINADOS,
} from "@/lib/constants/index"
import type { ConfigEtapas, TipoAplicacionDef, AmbienteDef, TipoPruebaDef, ResultadoDef, Sprint } from "@/lib/types/index"
import { APLICACIONES_PREDETERMINADAS } from "@/components/dashboard/config/aplicaciones-config"
import { useState, useEffect, useRef } from "react"
import { api } from "@/lib/services/api/client"

/**
 * Gestiona toda la configuración de la aplicación:
 * etapas, tipos de aplicación, ambientes, tipos de prueba y aplicaciones.
 *
 * Al conectar un backend, cambia las implementaciones en lib/services/
 * sin necesidad de tocar este hook ni los componentes.
 */
type ApiConfig = {
  etapas: ConfigEtapas
  resultados: ResultadoDef[]
  tiposAplicacion: TipoAplicacionDef[]
  ambientes: AmbienteDef[]
  tiposPrueba: TipoPruebaDef[]
  aplicaciones: string[]
}

export function useConfig({ isAuthenticated = false }: { isAuthenticated?: boolean } = {}) {
  const [configEtapas, setConfigEtapas] = usePersistedState<ConfigEtapas>(
    STORAGE_KEYS.configEtapas, ETAPAS_PREDETERMINADAS
  )
  const [configResultados, setConfigResultados] = usePersistedState<ResultadoDef[]>(
    STORAGE_KEYS.configResultados, RESULTADOS_PREDETERMINADOS
  )
  const [aplicaciones, setAplicaciones] = usePersistedState<string[]>(
    STORAGE_KEYS.aplicaciones, APLICACIONES_PREDETERMINADAS
  )
  const [tiposAplicacion, setTiposAplicacion] = usePersistedState<TipoAplicacionDef[]>(
    STORAGE_KEYS.tiposAplicacion, TIPOS_APLICACION_PREDETERMINADOS
  )
  const [ambientes, setAmbientes] = usePersistedState<AmbienteDef[]>(
    STORAGE_KEYS.ambientes, AMBIENTES_PREDETERMINADOS
  )
  const [tiposPrueba, setTiposPrueba] = usePersistedState<TipoPruebaDef[]>(
    STORAGE_KEYS.tiposPrueba, TIPOS_PRUEBA_PREDETERMINADOS
  )
  const [sprints, setSprints] = useState<Sprint[]>(
    () => cargarDeStorage<Sprint[]>(STORAGE_KEYS.sprints, [])
  )
  const [sprintsLoading, setSprintsLoading] = useState(true)
  const [configLoading, setConfigLoading]   = useState(true)
  const [sprintsError, setSprintsError]     = useState<string | null>(null)
  const [configError, setConfigError]       = useState<string | null>(null)

  // ── Carga inicial de sprints desde API ──────────────────
  const sprintsLoadDone = useRef(false)
  useEffect(() => {
    if (!isAuthenticated) return
    if (sprintsLoadDone.current) return
    sprintsLoadDone.current = true
    api.get<{ sprints: Sprint[] }>("/api/sprints")
      .then(r => {
        setSprints(r.sprints)
        guardarEnStorage(STORAGE_KEYS.sprints, r.sprints)
      })
      .catch((err: unknown) => {
        setSprintsError(err instanceof Error ? err.message : "Error al cargar sprints")
      })
      .finally(() => setSprintsLoading(false))
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Carga inicial de config desde API ───────────────────
  const initialLoadDone = useRef(false)
  useEffect(() => {
    if (!isAuthenticated) return
    if (initialLoadDone.current) return
    initialLoadDone.current = true
    api.get<{ config: ApiConfig }>("/api/config")
      .then(({ config: c }) => {
        if (c.etapas          && Object.keys(c.etapas).length)    setConfigEtapas(c.etapas)
        if (c.resultados      && c.resultados.length)              setConfigResultados(c.resultados as ResultadoDef[])
        if (c.tiposAplicacion && c.tiposAplicacion.length)         setTiposAplicacion(c.tiposAplicacion as TipoAplicacionDef[])
        if (c.ambientes       && c.ambientes.length)               setAmbientes(c.ambientes as AmbienteDef[])
        if (c.tiposPrueba     && c.tiposPrueba.length)             setTiposPrueba(c.tiposPrueba as TipoPruebaDef[])
        if (c.aplicaciones    && c.aplicaciones.length)            setAplicaciones(c.aplicaciones)
      })
      .catch((err: unknown) => {
        setConfigError(err instanceof Error ? err.message : "Error al cargar configuración")
      })
      .finally(() => setConfigLoading(false))
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync a API cuando cambia la config (debounced 600 ms) ──
  const configLoaded    = useRef(false)
  const configSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!configLoaded.current) { configLoaded.current = true; return }
    if (!isAuthenticated) return
    if (configSyncTimer.current) clearTimeout(configSyncTimer.current)
    configSyncTimer.current = setTimeout(() => {
      api.put("/api/config", {
        etapas: configEtapas,
        resultados: configResultados,
        tiposAplicacion: tiposAplicacion.filter(t => t.label.trim() !== ""),
        ambientes:       ambientes.filter(a => a.label.trim() !== ""),
        tiposPrueba:     tiposPrueba.filter(t => t.label.trim() !== ""),
        aplicaciones:    aplicaciones.filter(a => a.trim() !== ""),
      }).catch(err => console.warn("[Config] Error sincronizando config:", err))
    }, 600)
    return () => {
      if (configSyncTimer.current) clearTimeout(configSyncTimer.current)
    }
  }, [configEtapas, configResultados, tiposAplicacion, ambientes, tiposPrueba, aplicaciones]) // eslint-disable-line react-hooks/exhaustive-deps

  const addSprint = (data: Omit<Sprint, "id">) => {
    if (sprints.some(s => s.nombre.toLowerCase() === data.nombre.toLowerCase()))
      return { success: false, error: "Ya existe un sprint con ese nombre" }
    const tempId = `sprint-${crypto.randomUUID()}`
    const optimistic: Sprint = { id: tempId, ...data }
    setSprints(p => [...p, optimistic])
    api.post<{ sprint: Sprint }>("/api/sprints", {
      nombre: data.nombre,
      fechaInicio: data.fechaInicio,
      fechaFin: data.fechaFin,
      objetivo: data.objetivo,
    }).then(r => {
      setSprints(p => p.map(s => s.id === tempId ? r.sprint : s))
    }).catch(() => {
      console.warn("[Sprints] Error al crear sprint en API")
    })
    return { success: true }
  }
  const updateSprint = (s: Sprint) => {
    setSprints(p => p.map(x => x.id === s.id ? s : x))
    api.put(`/api/sprints/${s.id}`, {
      nombre: s.nombre,
      fechaInicio: s.fechaInicio,
      fechaFin: s.fechaFin,
      objetivo: s.objetivo,
    }).catch(() => {
      console.warn("[Sprints] Error al actualizar sprint en API")
    })
    return { success: true }
  }
  const deleteSprint = (id: string) => {
    setSprints(p => p.filter(s => s.id !== id))
    api.delete(`/api/sprints/${id}`)
      .catch(() => console.warn("[Sprints] Error al eliminar sprint en API"))
    return { success: true }
  }

  /** Actualiza tiposAplicacion y sincroniza configEtapas (añade/elimina entradas). */
  const handleTiposChange = (newTipos: TipoAplicacionDef[]) => {
    setTiposAplicacion(newTipos)
    setConfigEtapas(prev => {
      const updated = { ...prev }
      newTipos.forEach(t => { if (!(t.id in updated)) updated[t.id] = [] })
      Object.keys(updated).forEach(k => { if (!newTipos.some(t => t.id === k)) delete updated[k] })
      return updated
    })
  }

  return {
    // Async shape — isLoading refleja la carga inicial desde la API
    isLoading: sprintsLoading || configLoading,
    error: configError ?? sprintsError ?? null,
    refetch: () => { /* noop con localStorage */ },
    // Estado
    configEtapas, setConfigEtapas,
    configResultados, setConfigResultados,
    aplicaciones, setAplicaciones,
    tiposAplicacion, setTiposAplicacion, handleTiposChange,
    ambientes, setAmbientes,
    tiposPrueba, setTiposPrueba,
    sprints, addSprint, updateSprint, deleteSprint,
  }
}
