// ── Caché en memoria para /api/metricas ─────────────────────
// Módulo compartido para que las rutas de escritura puedan
// invalidar el caché sin importar la ruta de métricas directamente.

import type { getMetricas } from "@/lib/backend/services/metricas.service"

export type MetricasData = Awaited<ReturnType<typeof getMetricas>>

const CACHE_TTL_MS = 60_000

let cache: { data: MetricasData; expireAt: number } | null = null

export function getMetricasCache(): MetricasData | null {
  if (cache && Date.now() < cache.expireAt) return cache.data
  return null
}

export function setMetricasCache(data: MetricasData): void {
  cache = { data, expireAt: Date.now() + CACHE_TTL_MS }
}

export function invalidateMetricasCache(): void {
  cache = null
}
