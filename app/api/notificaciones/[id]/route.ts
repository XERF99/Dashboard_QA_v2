// ── PATCH  /api/notificaciones/[id] — marcar como leída
// ── DELETE /api/notificaciones/[id] — eliminar
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { marcarLeida, rolToDestinatario } from "@/lib/backend/services/notificacion.service"
import { prisma } from "@/lib/backend/prisma"

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

export const PATCH = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const notif = await resolveNotif(id, payload)
  if (!notif) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  const notificacion = await marcarLeida(id)
  return NextResponse.json({ notificacion })
})

export const DELETE = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const notif = await resolveNotif(id, payload)
  if (!notif) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

  await prisma.notificacion.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
