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

  // Paso 2: Sincronizar a localStorage + API en cada cambio (después de la carga inicial)
  useEffect(() => {
    if (!loaded) return
    if (isFirstSync.current) {
      isFirstSync.current = false
      return
    }
    guardarEnStorage(storageKey, state)
    syncer(state).catch(err => {
      console.warn(`[ApiMirror] Error sincronizando ${storageKey}:`, err)
    })
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setState, loaded]
}
