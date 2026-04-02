// ── GET /api/metricas — agregaciones del dashboard QA
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { getMetricas } from "@/lib/backend/services/metricas.service"
import { getMetricasCache, setMetricasCache } from "@/lib/backend/metricas-cache"

// Caché en memoria con TTL de 60 s — evita lanzar 8 queries en cada GET.
// La función invalidateMetricasCache() es llamada por las rutas de escritura
// (historias, casos, tareas) para reflejar cambios de inmediato.

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/metricas"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const cached = getMetricasCache(payload.grupoId)
  if (cached) return NextResponse.json({ metricas: cached })

  const metricas = await getMetricas(payload.grupoId)
  setMetricasCache(metricas, payload.grupoId)
  return NextResponse.json({ metricas })
}
