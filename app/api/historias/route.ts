// ── GET  /api/historias — listar todas
// ── POST /api/historias — crear nueva
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { createHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { getAllHistorias, createHistoria } from "@/lib/backend/services/historia.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const historias = await getAllHistorias(payload.grupoId)
  return NextResponse.json({ historias })
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { error, value } = createHistoriaSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  // Añadir grupoId del usuario autenticado si no viene en el body
  const historiaData = { ...value, grupoId: value.grupoId ?? payload.grupoId }
  const historia = await createHistoria(historiaData)
  invalidateMetricasCache()
  return NextResponse.json({ historia }, { status: 201 })
}
