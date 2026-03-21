// ── PUT    /api/users/[id] — actualizar usuario
// ── DELETE /api/users/[id] — eliminar usuario
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/backend/middleware/auth.middleware"
import { updateUserSchema } from "@/lib/backend/validators/auth.validator"
import { prisma } from "@/lib/backend/prisma"
import { resetPasswordService, desbloquearUsuarioService } from "@/lib/backend/services/auth.service"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAdmin(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  const body = await request.json()

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "reset-password") {
    const result = await resetPasswordService(id)
    return NextResponse.json(result)
  }
  if (action === "desbloquear") {
    const result = await desbloquearUsuarioService(id)
    return NextResponse.json(result)
  }

  const { error, value } = updateUserSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      nombre:              value.nombre,
      email:               value.email.toLowerCase(),
      rol:                 value.rol,
      activo:              value.activo,
      debeCambiarPassword: value.debeCambiarPassword,
    },
    select: { id: true, nombre: true, email: true, rol: true, activo: true },
  })
  return NextResponse.json({ user })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAdmin(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  if (payload.sub === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
