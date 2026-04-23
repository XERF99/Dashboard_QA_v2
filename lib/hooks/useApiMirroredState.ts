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
//  Cancela el fetch de carga inicial al desmontar con AbortController.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from "react"
import { cargarDeStorage, guardarEnStorage } from "@/lib/storage"
import { clientWarn } from "@/lib/client-logger"
import type { Dispatch, SetStateAction } from "react"

// Tiempo de espera antes de enviar el sync a la API (ms).
// Evita lanzar una petición por cada carácter al editar campos de texto.
const SYNC_DEBOUNCE_MS = 600

// Reintentos con backoff exponencial: 1s → 2s → 4s
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000]

async function syncWithRetry<T>(syncer: (data: T) => Promise<void>, data: T): Promise<void> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      await syncer(data)
      return
    } catch (err) {
      lastErr = err
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
      }
    }
  }
  throw lastErr
}

export function useApiMirroredState<T>(
  storageKey: string,
  fallback: T,
  fetcher: (signal?: AbortSignal) => Promise<T>,
  syncer:  (data: T) => Promise<void>
): [T, Dispatch<SetStateAction<T>>, boolean, string | null, string | null] {
  // Inicializar desde localStorage para render instantáneo
  const [state, setState]       = useState<T>(() => cargarDeStorage(storageKey, fallback))
  const [loaded, setLoaded]     = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const isFirstSync             = useRef(true)
  const debounceTimer           = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Paso 1: Carga inicial desde la API — cancelable al desmontar
  useEffect(() => {
    const controller = new AbortController()
    fetcher(controller.signal)
      .then(data => {
        if (controller.signal.aborted) return
        setState(data)
        guardarEnStorage(storageKey, data)
        setLoaded(true)
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        // API no disponible — usar localStorage como fallback
        setError(err instanceof Error ? err.message : "Error al cargar datos")
        setLoaded(true)
      })
    return () => controller.abort()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Paso 2: Sincronizar a localStorage + API en cada cambio (después de la carga inicial).
  // localStorage se actualiza de inmediato; el sync a la API usa debounce + 3 reintentos
  // con backoff exponencial. Si todos fallan, se expone syncError para notificar al usuario.
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
      setSyncError(null)
      syncWithRetry(syncer, state).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Error al sincronizar"
        setSyncError(msg)
        clientWarn("ApiMirror", `Sync fallido tras reintentos (${storageKey})`, err)
      })
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return [state, setState, loaded, error, syncError]
}
