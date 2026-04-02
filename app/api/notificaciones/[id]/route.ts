// ── PATCH  /api/notificaciones/[id] — marcar como leída
// ── DELETE /api/notificaciones/[id] — eliminar
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { marcarLeida, rolToDestinatario } from "@/lib/backend/services/notificacion.service"
import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"

type Ctx = { params: Promise<{ id: string }> }

async function resolveNotif(id: string, payload: { grupoId?: string; rol: string }) {
  const notif = await prisma.notificacion.findUnique({
    where: { id },
    select: { grupoId: true, destinatario: true },
  })
  if (!notif) return null
  const destinatario = rolToDestinatario(payload.rol)
  const grupoOk = !payload.grupoId || notif.grupoId === payload.grupoId
  const destOk  = notif.destinatario === destinatario
  return grupoOk && destOk ? notif : null
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  try {
    const notif = await resolveNotif(id, payload)
    if (!notif) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const notificacion = await marcarLeida(id)
    return NextResponse.json({ notificacion })
  } catch (e) {
    logger.error("PATCH /api/notificaciones/:id", "Error al marcar notificación", e)
    return NextResponse.json({ error: "Error al marcar notificación" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: Ctx) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  try {
    const notif = await resolveNotif(id, payload)
    if (!notif) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    await prisma.notificacion.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error("DELETE /api/notificaciones/:id", "Error al eliminar notificación", e)
    return NextResponse.json({ error: "Error al eliminar notificación" }, { status: 500 })
  }
}
