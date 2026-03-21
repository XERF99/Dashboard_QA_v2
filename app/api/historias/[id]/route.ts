// ── GET    /api/historias/[id]
// ── PUT    /api/historias/[id]
// ── DELETE /api/historias/[id]
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { updateHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { getHistoriaById, updateHistoria, deleteHistoria } from "@/lib/backend/services/historia.service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const historia = await getHistoriaById(id)
  if (!historia) return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 })
  return NextResponse.json({ historia })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const body = await request.json()
  const { error, value } = updateHistoriaSchema.validate(body, { abortEarly: false, allowUnknown: true })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const historia = await updateHistoria(id, value)
  return NextResponse.json({ historia })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  await deleteHistoria(id)
  return NextResponse.json({ success: true })
}
