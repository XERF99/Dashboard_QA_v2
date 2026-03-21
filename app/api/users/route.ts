// ── GET /api/users  — listar usuarios (admin)
// ── POST /api/users — crear usuario (admin)
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/backend/middleware/auth.middleware"
import { createUserSchema } from "@/lib/backend/validators/auth.validator"
import { createUserService } from "@/lib/backend/services/auth.service"
import { prisma } from "@/lib/backend/prisma"

export async function GET(request: NextRequest) {
  const payload = await requireAdmin(request)
  if (payload instanceof NextResponse) return payload

  const users = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, rol: true, activo: true, debeCambiarPassword: true, bloqueado: true, fechaCreacion: true },
    orderBy: { fechaCreacion: "asc" },
  })
  return NextResponse.json({ users })
}

export async function POST(request: NextRequest) {
  const payload = await requireAdmin(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { error, value } = createUserSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const result = await createUserService(value)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 })
  return NextResponse.json({ user: result.user }, { status: 201 })
}
