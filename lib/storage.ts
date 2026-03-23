import { useState, useEffect } from "react"

// ── Revive ISO date strings → Date objects ────────────────
export function revivirFechas(_key: string, value: unknown): unknown {
  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  ) {
    return new Date(value)
  }
  return value
}

export function cargarDeStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw, revivirFechas) as T
  } catch {
    return fallback
  }
}

export function guardarEnStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded */ }
}

export function usePersistedState<T>(
  key: string,
  fallback: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => cargarDeStorage(key, fallback))

  useEffect(() => {
    guardarEnStorage(key, state)
  }, [key, state])

  return [state, setState]
}

export const STORAGE_KEYS = {
  historias:        "tcs_historias",
  casos:            "tcs_casos",
  tareas:           "tcs_tareas",
  configEtapas:     "tcs_config_etapas",
  configResultados: "tcs_config_resultados",
  aplicaciones:     "tcs_aplicaciones",
  tiposAplicacion:  "tcs_tipos_aplicacion",
  ambientes:        "tcs_ambientes",
  tiposPrueba:      "tcs_tipos_prueba",
  notificaciones:   "tcs_notificaciones",
  sprints:          "tcs_sprints",
  users:            "tcs_users",
  roles:            "tcs_roles",
} as const
