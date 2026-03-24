// ── GET /api/grupos/[id]/metricas — métricas de un grupo (owner)
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { getMetricasGrupo } from "@/lib/backend/services/grupo.service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  if (payload.rol !== "owner") {
    return NextResponse.json({ error: "Solo el Owner puede consultar métricas de grupos" }, { status: 403 })
  }

  const { id } = await params
  const metricas = await getMetricasGrupo(id)
  return NextResponse.json({ metricas })
}
