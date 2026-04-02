// ── GET    /api/grupos/[id] — obtener grupo
// ── PUT    /api/grupos/[id] — actualizar grupo (owner)
// ── DELETE /api/grupos/[id] — eliminar grupo (owner)
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { getGrupoById, updateGrupo, deleteGrupo } from "@/lib/backend/services/grupo.service"

const UpdateGrupoSchema = z.object({
  nombre:      z.string().min(1).max(80).optional(),
  descripcion: z.string().max(300).optional(),
  activo:      z.boolean().optional(),
})

function requireOwner(rol: string) {
  return rol !== "owner"
    ? NextResponse.json({ error: "Solo el Owner puede gestionar grupos" }, { status: 403 })
    : null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  // El owner puede ver cualquier grupo; cualquier usuario autenticado puede ver su propio grupo
  if (payload.rol !== "owner" && payload.grupoId !== id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const grupo = await getGrupoById(id)
    if (!grupo) return NextResponse.json({ error: "Grupo no encontrado" }, { status: 404 })
    return NextResponse.json({ grupo })
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener el grupo" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const deny = requireOwner(payload.rol)
  if (deny) return deny

  const { id } = await params
  const parsed = UpdateGrupoSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await updateGrupo(id, parsed.data)
    return NextResponse.json({ grupo: result.grupo })
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar el grupo" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const deny = requireOwner(payload.rol)
  if (deny) return deny

  const { id } = await params
  try {
    const result = await deleteGrupo(id)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar el grupo" }, { status: 500 })
  }
}
