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
  tipo:        z.enum(["aprobacion_enviada", "modificacion_solicitada", "caso_aprobado", "caso_rechazado", "modificacion_habilitada", "cuenta_bloqueada", "bloqueo_reportado", "bloqueo_resuelto"]),
  titulo:      z.string().min(1),
  descripcion: z.string().min(1),
  destinatario: z.enum(["admin", "qa"]),
  grupoId:     z.string().optional(),   // requerido cuando el caller es owner
  casoId:      z.string().optional(),
  huId:        z.string().optional(),
  huTitulo:    z.string().optional(),
  casoTitulo:  z.string().optional(),
})

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))

  try {
    const destinatario = rolToDestinatario(payload.rol)
    const result = await getNotificacionesByDestinatario(destinatario, payload.grupoId, page, limit)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const parsed = CreateNotificacionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const { tipo, titulo, descripcion, destinatario, grupoId: bodyGrupoId, casoId, huId, huTitulo, casoTitulo } = parsed.data

  // grupoId: non-owner uses their JWT grupoId; owner must supply it in the body
  const grupoId = payload.grupoId ?? bodyGrupoId
  if (!grupoId) {
    return NextResponse.json({ error: "grupoId es requerido" }, { status: 400 })
  }

  try {
    const notificacion = await createNotificacion({
      tipo, titulo, descripcion, destinatario, grupoId, casoId, huId, huTitulo, casoTitulo,
    })
    return NextResponse.json({ notificacion }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Error al crear la notificación" }, { status: 500 })
  }
}
