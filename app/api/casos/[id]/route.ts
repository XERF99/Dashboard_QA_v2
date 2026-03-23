// ── GET    /api/casos/[id]
// ── PUT    /api/casos/[id]
// ── DELETE /api/casos/[id]
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { updateCasoSchema } from "@/lib/backend/validators/caso.validator"
import { getCasoById, updateCaso, deleteCaso } from "@/lib/backend/services/caso.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const caso = await getCasoById(id)
  if (!caso) return NextResponse.json({ error: "Caso no encontrado" }, { status: 404 })
  return NextResponse.json({ caso })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const body = await request.json()
  const { error, value } = updateCasoSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const caso = await updateCaso(id, value)
  invalidateMetricasCache()
  return NextResponse.json({ caso })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  await deleteCaso(id)
  invalidateMetricasCache()
  return NextResponse.json({ success: true })
}
