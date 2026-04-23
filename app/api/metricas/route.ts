// ── GET /api/metricas — agregaciones del dashboard QA
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { getMetricas } from "@/lib/backend/services/metricas.service"
import { getMetricasCache, setMetricasCache } from "@/lib/backend/metricas-cache"

// Caché en memoria con TTL de 60 s — evita lanzar 8 queries en cada GET.
// La función invalidateMetricasCache() es llamada por las rutas de escritura
// (historias, casos, tareas) para reflejar cambios de inmediato.

export const GET = withAuth(async (request, payload) => {
  await requireRateLimit(request, "GET /api/metricas", 60, 60_000)

  const headers = { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" }

  const cached = getMetricasCache(payload.grupoId)
  if (cached) return NextResponse.json({ metricas: cached }, { headers })

  const metricas = await getMetricas(payload.grupoId)
  setMetricasCache(metricas, payload.grupoId)
  return NextResponse.json({ metricas }, { headers })
})
