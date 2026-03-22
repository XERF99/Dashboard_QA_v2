// ── GET /api/metricas — agregaciones del dashboard QA
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { getMetricas } from "@/lib/backend/services/metricas.service"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const metricas = await getMetricas()
  return NextResponse.json({ metricas })
}
