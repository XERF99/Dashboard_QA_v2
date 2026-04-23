// ── GET  /api/notificaciones — listar las del usuario autenticado
// ── POST /api/notificaciones — crear nueva
import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { ValidationError } from "@/lib/backend/errors"
import {
  getNotificacionesByDestinatario,
  createNotificacion,
  rolToDestinatario,
} from "@/lib/backend/services/notificacion.service"

const CreateNotificacionSchema = z.object({
  tipo:        z.enum(["aprobacion_enviada", "modificacion_solicitada", "caso_aprobado", "caso_rechazado", "modificacion_habilitada", "cuenta_bloqueada", "bloqueo_reportado", "bloqueo_resuelto"]),
  titulo:      z.string().min(1),
  descripcion: z.string().min(1),
  destinatario: z.enum(["admin", "qa"]),
  grupoId:     z.string().optional(),
  casoId:      z.string().optional(),
  huId:        z.string().optional(),
  huTitulo:    z.string().optional(),
  casoTitulo:  z.string().optional(),
})

export const GET = withAuth(async (request, payload) => {
  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))

  const destinatario = rolToDestinatario(payload.rol)
  const result = await getNotificacionesByDestinatario(destinatario, payload.grupoId, page, limit)
  return NextResponse.json(result)
})

export const POST = withAuth(async (request, payload) => {
  const parsed = CreateNotificacionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    throw new ValidationError("Payload inválido", parsed.error.issues.map(i => i.message))
  }
  const { tipo, titulo, descripcion, destinatario, grupoId: bodyGrupoId, casoId, huId, huTitulo, casoTitulo } = parsed.data

  const grupoId = payload.grupoId ?? bodyGrupoId
  if (!grupoId) throw new ValidationError("grupoId es requerido")

  const notificacion = await createNotificacion({
    tipo, titulo, descripcion, destinatario, grupoId, casoId, huId, huTitulo, casoTitulo,
  })
  return NextResponse.json({ notificacion }, { status: 201 })
})
