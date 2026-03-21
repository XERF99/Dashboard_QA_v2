"use client"

import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import {
  ETAPAS_PREDETERMINADAS,
  TIPOS_APLICACION_PREDETERMINADOS,
  AMBIENTES_PREDETERMINADOS,
  TIPOS_PRUEBA_PREDETERMINADOS,
} from "@/lib/constants/index"
import type { ConfigEtapas, TipoAplicacionDef, AmbienteDef, TipoPruebaDef, Sprint } from "@/lib/types/index"
import { APLICACIONES_PREDETERMINADAS } from "@/components/dashboard/config/aplicaciones-config"

/**
 * Gestiona toda la configuración de la aplicación:
 * etapas, tipos de aplicación, ambientes, tipos de prueba y aplicaciones.
 *
 * Al conectar un backend, cambia las implementaciones en lib/services/
 * sin necesidad de tocar este hook ni los componentes.
 */
export function useConfig() {
  const [configEtapas, setConfigEtapas] = usePersistedState<ConfigEtapas>(
    STORAGE_KEYS.configEtapas, ETAPAS_PREDETERMINADAS
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
  const [sprints, setSprints] = usePersistedState<Sprint[]>(
    STORAGE_KEYS.sprints, []
  )

  const addSprint = (data: Omit<Sprint, "id">) => {
    if (sprints.some(s => s.nombre.toLowerCase() === data.nombre.toLowerCase()))
      return { success: false, error: "Ya existe un sprint con ese nombre" }
    setSprints(p => [...p, { id: `sprint-${Date.now()}`, ...data }])
    return { success: true }
  }
  const updateSprint = (s: Sprint) => {
    setSprints(p => p.map(x => x.id === s.id ? s : x))
    return { success: true }
  }
  const deleteSprint = (id: string) => {
    setSprints(p => p.filter(s => s.id !== id))
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
    // Async shape — listos para backend (con localStorage siempre false/null)
    isLoading: false as boolean,
    error: null as string | null,
    refetch: () => { /* noop con localStorage */ },
    // Estado
    configEtapas, setConfigEtapas,
    aplicaciones, setAplicaciones,
    tiposAplicacion, setTiposAplicacion, handleTiposChange,
    ambientes, setAmbientes,
    tiposPrueba, setTiposPrueba,
    sprints, addSprint, updateSprint, deleteSprint,
  }
}
