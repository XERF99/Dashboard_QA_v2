"use client"

import { useCallback, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { cargarDeStorage, guardarEnStorage } from "@/lib/storage"
import type { Dispatch, SetStateAction } from "react"

const SYNC_DEBOUNCE_MS = 600

export function useApiQuery<T>(
  queryKey: string,
  storageKey: string,
  fallback: T,
  fetcher: (signal?: AbortSignal) => Promise<T>,
  syncer: (data: T) => Promise<void>
): [T, Dispatch<SetStateAction<T>>, boolean, string | null, string | null] {
  const queryClient = useQueryClient()
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const skipNextSync = useRef(true)

  const { data, isFetched, error: queryError } = useQuery<T>({
    queryKey: [queryKey],
    queryFn: ({ signal }) => fetcher(signal),
    initialData: () => cargarDeStorage<T>(storageKey, fallback),
    staleTime: 2 * 60 * 1000,
  })

  const syncMutation = useMutation({
    mutationFn: syncer,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
  })

  const currentData = data ?? fallback

  useEffect(() => {
    if (isFetched) {
      guardarEnStorage(storageKey, currentData)
    }
  }, [currentData, isFetched, storageKey])

  const setState: Dispatch<SetStateAction<T>> = useCallback((action) => {
    queryClient.setQueryData<T>([queryKey], (prev) => {
      const prevVal = prev ?? fallback
      const next = typeof action === "function"
        ? (action as (prev: T) => T)(prevVal)
        : action
      return next
    })
  }, [queryClient, queryKey, fallback])

  useEffect(() => {
    if (!isFetched) return
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }

    guardarEnStorage(storageKey, currentData)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      syncMutation.mutate(currentData)
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [currentData]) // eslint-disable-line react-hooks/exhaustive-deps

  const loaded = isFetched
  const error = queryError ? (queryError instanceof Error ? queryError.message : "Error al cargar datos") : null
  const syncError = syncMutation.isError
    ? (syncMutation.error instanceof Error ? syncMutation.error.message : "Error al sincronizar")
    : null

  return [currentData, setState, loaded, error, syncError]
}
