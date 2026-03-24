// ── GET  /api/notificaciones — listar las del usuario autenticado
// ── POST /api/notificaciones — crear nueva
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import {
  getNotificacionesByDestinatario,
  createNotificacion,
  rolToDestinatario,
} from "@/lib/backend/services/notificacion.service"

const CreateNotificacionSchema = z.object({
  tipo:        z.enum(["aprobacion_enviada", "modificacion_solicitada", "caso_aprobado", "caso_rechazado", "modificacion_habilitada", "cuenta_bloqueada"]),
  titulo:      z.string().min(1),
  descripcion: z.string().min(1),
  destinatario: z.enum(["admin", "qa"]),
  casoId:      z.string().optional(),
  huId:        z.string().optional(),
  huTitulo:    z.string().optional(),
  casoTitulo:  z.string().optional(),
})

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const destinatario = rolToDestinatario(payload.rol)
  const notificaciones = await getNotificacionesByDestinatario(destinatario, payload.grupoId)
  return NextResponse.json({ notificaciones })
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const parsed = CreateNotificacionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const { tipo, titulo, descripcion, destinatario, casoId, huId, huTitulo, casoTitulo } = parsed.data

  // grupoId requerido para aislar notificaciones por grupo
  const grupoId = payload.grupoId ?? "grupo-default"
  const notificacion = await createNotificacion({
    tipo, titulo, descripcion, destinatario, grupoId, casoId, huId, huTitulo, casoTitulo,
  })
  return NextResponse.json({ notificacion }, { status: 201 })
}
