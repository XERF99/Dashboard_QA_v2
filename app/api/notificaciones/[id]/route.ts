// ── PATCH /api/notificaciones/[id] — marcar como leída
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { marcarLeida } from "@/lib/backend/services/notificacion.service"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const notificacion = await marcarLeida(id)
  return NextResponse.json({ notificacion })
}
