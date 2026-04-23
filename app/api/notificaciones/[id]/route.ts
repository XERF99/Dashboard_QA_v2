// ── PATCH  /api/notificaciones/[id] — marcar como leída
// ── DELETE /api/notificaciones/[id] — eliminar
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { NotFoundError } from "@/lib/backend/errors"
import { marcarLeida, rolToDestinatario } from "@/lib/backend/services/notificacion.service"
import { prisma } from "@/lib/backend/prisma"

async function requireNotif(id: string, payload: { grupoId?: string; rol: string }) {
  const notif = await prisma.notificacion.findUnique({
    where: { id },
    select: { grupoId: true, destinatario: true },
  })
  const destinatario = rolToDestinatario(payload.rol)
  const grupoOk = !!notif && (!payload.grupoId || notif.grupoId === payload.grupoId)
  const destOk  = !!notif && notif.destinatario === destinatario
  if (!notif || !grupoOk || !destOk) throw new NotFoundError("Notificación")
  return notif
}

export const PATCH = withAuth(async (_request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireNotif(id, payload)
  const notificacion = await marcarLeida(id)
  return NextResponse.json({ notificacion })
})

export const DELETE = withAuth(async (_request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireNotif(id, payload)
  await prisma.notificacion.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
