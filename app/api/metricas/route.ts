// ── GET /api/metricas — agregaciones del dashboard QA
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { getMetricas } from "@/lib/backend/services/metricas.service"
import { getMetricasCache, setMetricasCache } from "@/lib/backend/metricas-cache"

// Caché en memoria con TTL de 60 s — evita lanzar 8 queries en cada GET.
// La función invalidateMetricasCache() es llamada por las rutas de escritura
// (historias, casos, tareas) para reflejar cambios de inmediato.

export const GET = withAuth(async (request, payload) => {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/metricas"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const headers = { "Cache-Control": "private, max-age=300, stale-while-revalidate=60" }

  const cached = getMetricasCache(payload.grupoId)
  if (cached) return NextResponse.json({ metricas: cached }, { headers })

  const metricas = await getMetricas(payload.grupoId)
  setMetricasCache(metricas, payload.grupoId)
  return NextResponse.json({ metricas }, { headers })
})
