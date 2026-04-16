// ── PATCH /api/notificaciones/marcar-todas — marcar todas como leídas
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { marcarTodasLeidas, rolToDestinatario } from "@/lib/backend/services/notificacion.service"

export const PATCH = withAuth(async (request, payload) => {
  const destinatario = rolToDestinatario(payload.rol)
  await marcarTodasLeidas(destinatario, payload.grupoId)
  return NextResponse.json({ success: true })
})
