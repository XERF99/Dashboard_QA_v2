// ── PATCH /api/notificaciones/marcar-todas — marcar todas como leídas
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { marcarTodasLeidas, rolToDestinatario } from "@/lib/backend/services/notificacion.service"

export async function PATCH(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const destinatario = rolToDestinatario(payload.rol)
  await marcarTodasLeidas(destinatario, payload.grupoId)
  return NextResponse.json({ success: true })
}
