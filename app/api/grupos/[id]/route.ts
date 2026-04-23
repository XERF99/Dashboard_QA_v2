// ── GET    /api/grupos/[id] — obtener grupo
// ── PUT    /api/grupos/[id] — actualizar grupo (owner)
// ── DELETE /api/grupos/[id] — eliminar grupo (owner)
import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { ForbiddenError, NotFoundError, ValidationError, ConflictError } from "@/lib/backend/errors"
import { getGrupoById, updateGrupo, deleteGrupo } from "@/lib/backend/services/grupo.service"

const UpdateGrupoSchema = z.object({
  nombre:      z.string().min(1).max(80).optional(),
  descripcion: z.string().max(300).optional(),
  activo:      z.boolean().optional(),
})

function requireOwner(rol: string): void {
  if (rol !== "owner") throw new ForbiddenError("Solo el Owner puede gestionar grupos")
}

export const GET = withAuth(async (_request, payload, ctx) => {
  const { id } = await ctx!.params

  if (payload.rol !== "owner" && payload.grupoId !== id) {
    throw new ForbiddenError("No autorizado")
  }

  const grupo = await getGrupoById(id)
  if (!grupo) throw new NotFoundError("Grupo")
  return NextResponse.json({ grupo })
})

export const PUT = withAuth(async (request, payload, ctx) => {
  requireOwner(payload.rol)

  const { id } = await ctx!.params
  const parsed = UpdateGrupoSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    throw new ValidationError("Payload inválido", parsed.error.issues.map(i => i.message))
  }

  const result = await updateGrupo(id, parsed.data)
  return NextResponse.json({ grupo: result.grupo })
})

export const DELETE = withAuth(async (_request, payload, ctx) => {
  requireOwner(payload.rol)

  const { id } = await ctx!.params
  const result = await deleteGrupo(id)
  if (!result.success) throw new ConflictError(result.error)
  return NextResponse.json({ success: true })
})
