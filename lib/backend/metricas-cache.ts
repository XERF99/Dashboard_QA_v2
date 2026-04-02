// ── Caché en memoria para /api/metricas ─────────────────────
// Módulo compartido para que las rutas de escritura puedan
// invalidar el caché sin importar la ruta de métricas directamente.
//
// El caché está particionado por grupoId para evitar que usuarios
// de distintos workspaces compartan datos de métricas.
// La clave "__owner__" se usa para el Owner (grupoId undefined).

import type { getMetricas } from "@/lib/backend/services/metricas.service"

export type MetricasData = Awaited<ReturnType<typeof getMetricas>>

const CACHE_TTL_MS = 300_000  // 5 minutos — las métricas no cambian en segundos

const cache = new Map<string, { data: MetricasData; expireAt: number }>()

function cacheKey(grupoId?: string): string {
  return grupoId ?? "__owner__"
}

export function getMetricasCache(grupoId?: string): MetricasData | null {
  const entry = cache.get(cacheKey(grupoId))
  if (entry && Date.now() < entry.expireAt) return entry.data
  return null
}

export function setMetricasCache(data: MetricasData, grupoId?: string): void {
  cache.set(cacheKey(grupoId), { data, expireAt: Date.now() + CACHE_TTL_MS })
}

export function invalidateMetricasCache(grupoId?: string): void {
  if (grupoId !== undefined) {
    cache.delete(cacheKey(grupoId))
  } else {
    cache.clear()
  }
}
