"use client"

// ═══════════════════════════════════════════════════════════
//  useApiMirroredState
//  Hook que mantiene estado local sincronizado con la API.
//
//  Comportamiento:
//  1. Inicializa desde localStorage (UI instantánea, sin flash)
//  2. En mount: carga desde la API y reemplaza estado local
//  3. En cada cambio posterior: sincroniza a localStorage Y a la API
//
//  Si la API no está disponible, funciona solo con localStorage.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import { cargarDeStorage, guardarEnStorage } from "@/lib/storage"

// Tiempo de espera antes de enviar el sync a la API (ms).
// Evita lanzar una petición por cada carácter al editar campos de texto.
const SYNC_DEBOUNCE_MS = 600

export function useApiMirroredState<T>(
  storageKey: string,
  fallback: T,
  fetcher: () => Promise<T>,
  syncer:  (data: T) => Promise<void>
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  // Inicializar desde localStorage para render instantáneo
  const [state, setState]   = useState<T>(() => cargarDeStorage(storageKey, fallback))
  const [loaded, setLoaded] = useState(false)
  const isFirstSync         = useRef(true)
  const debounceTimer       = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Paso 1: Carga inicial desde la API
  useEffect(() => {
    fetcher()
      .then(data => {
        setState(data)
        guardarEnStorage(storageKey, data)
        setLoaded(true)
      })
      .catch(() => {
        // API no disponible — usar localStorage como fallback silencioso
        setLoaded(true)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Paso 2: Sincronizar a localStorage + API en cada cambio (después de la carga inicial).
  // localStorage se actualiza de inmediato; el sync a la API usa debounce para evitar
  // disparar un POST por cada carácter al editar texto.
  useEffect(() => {
    if (!loaded) return
    if (isFirstSync.current) {
      isFirstSync.current = false
      return
    }

    // Persistir en localStorage sin esperar
    guardarEnStorage(storageKey, state)

    // Cancelar el timer anterior y arrancar uno nuevo
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      syncer(state).catch(err => {
        console.warn(`[ApiMirror] Error sincronizando ${storageKey}:`, err)
      })
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setState, loaded]
}
