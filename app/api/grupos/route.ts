// ── GET  /api/grupos — listar todos (owner)
// ── POST /api/grupos — crear nuevo grupo (owner)
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { getAllGrupos, createGrupo } from "@/lib/backend/services/grupo.service"

const CreateGrupoSchema = z.object({
  nombre:      z.string().min(1).max(80),
  descripcion: z.string().max(300).optional(),
})

function requireOwner(rol: string) {
  return rol !== "owner"
    ? NextResponse.json({ error: "Solo el Owner puede gestionar grupos" }, { status: 403 })
    : null
}

export const GET = withAuth(async (request, payload) => {
  const deny = requireOwner(payload.rol)
  if (deny) return deny

  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))

  const result = await getAllGrupos(page, limit)
  return NextResponse.json(result)
})

export const POST = withAuth(async (request, payload) => {
  const deny = requireOwner(payload.rol)
  if (deny) return deny

  const parsed = CreateGrupoSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }

  const result = await createGrupo(parsed.data)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 })
  return NextResponse.json({ grupo: result.grupo }, { status: 201 })
})
