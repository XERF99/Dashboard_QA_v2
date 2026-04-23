// ── GET  /api/grupos — listar todos (owner)
// ── POST /api/grupos — crear nuevo grupo (owner)
import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { ForbiddenError, ValidationError, ConflictError } from "@/lib/backend/errors"
import { getAllGrupos, createGrupo } from "@/lib/backend/services/grupo.service"

const CreateGrupoSchema = z.object({
  nombre:      z.string().min(1).max(80),
  descripcion: z.string().max(300).optional(),
})

function requireOwner(rol: string): void {
  if (rol !== "owner") throw new ForbiddenError("Solo el Owner puede gestionar grupos")
}

export const GET = withAuth(async (request, payload) => {
  requireOwner(payload.rol)

  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))

  const result = await getAllGrupos(page, limit)
  return NextResponse.json(result)
})

export const POST = withAuth(async (request, payload) => {
  requireOwner(payload.rol)

  const parsed = CreateGrupoSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    throw new ValidationError("Payload inválido", parsed.error.issues.map(i => i.message))
  }

  const result = await createGrupo(parsed.data)
  if (!result.success) throw new ConflictError(result.error)
  return NextResponse.json({ grupo: result.grupo }, { status: 201 })
})
