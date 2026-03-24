// ── GET /api/metricas — agregaciones del dashboard QA
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { getMetricas } from "@/lib/backend/services/metricas.service"
import { getMetricasCache, setMetricasCache } from "@/lib/backend/metricas-cache"

// Caché en memoria con TTL de 60 s — evita lanzar 8 queries en cada GET.
// La función invalidateMetricasCache() es llamada por las rutas de escritura
// (historias, casos, tareas) para reflejar cambios de inmediato.

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const cached = getMetricasCache()
  if (cached) return NextResponse.json({ metricas: cached })

  const metricas = await getMetricas(payload.grupoId)
  setMetricasCache(metricas)
  return NextResponse.json({ metricas })
}
