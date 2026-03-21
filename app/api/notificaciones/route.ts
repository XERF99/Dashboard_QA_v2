// ── GET  /api/notificaciones — listar las del usuario autenticado
// ── POST /api/notificaciones — crear nueva
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import {
  getNotificacionesByDestinatario,
  createNotificacion,
  rolToDestinatario,
} from "@/lib/backend/services/notificacion.service"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const destinatario = rolToDestinatario(payload.rol)
  const notificaciones = await getNotificacionesByDestinatario(destinatario)
  return NextResponse.json({ notificaciones })
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { tipo, titulo, descripcion, destinatario, casoId, huId, huTitulo, casoTitulo } = body

  if (!tipo || !titulo || !descripcion || !destinatario) {
    return NextResponse.json(
      { error: "tipo, titulo, descripcion y destinatario son requeridos" },
      { status: 400 }
    )
  }

  const notificacion = await createNotificacion({
    tipo, titulo, descripcion, destinatario, casoId, huId, huTitulo, casoTitulo,
  })
  return NextResponse.json({ notificacion }, { status: 201 })
}
