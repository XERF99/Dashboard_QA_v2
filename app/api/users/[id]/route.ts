// ── PUT    /api/users/[id] — actualizar usuario
// ── DELETE /api/users/[id] — eliminar usuario
import { NextResponse } from "next/server"
import { withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody } from "@/lib/backend/middleware/guards"
import { updateUserSchema } from "@/lib/backend/validators/auth.validator"
import { prisma } from "@/lib/backend/prisma"
import { resetPasswordService, desbloquearUsuarioService } from "@/lib/backend/services/auth.service"
import { audit } from "@/lib/backend/services/audit.service"
import { NotFoundError, ForbiddenError, ValidationError } from "@/lib/backend/errors"

const ROLES_ADMIN_PUEDE_ASIGNAR = ["qa_lead", "qa", "viewer"]

async function requireWorkspaceAccess(
  id: string,
  payload: { rol: string; grupoId?: string; sub: string },
  allowNullGrupo = true
): Promise<{ rol: string; grupoId: string | null }> {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { rol: true, grupoId: true },
  })
  if (!target) throw new NotFoundError("Usuario")
  if (target.rol === "owner") throw new NotFoundError("Usuario")
  if (target.grupoId !== null) {
    if (target.grupoId !== (payload.grupoId ?? null)) throw new NotFoundError("Usuario")
  } else if (!allowNullGrupo) {
    throw new NotFoundError("Usuario")
  }
  return target
}

export const PUT = withAuthAdmin(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "PUT /api/users/:id", 60, 60_000)

  if (payload.rol !== "owner") {
    await requireWorkspaceAccess(id, payload, true)
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "reset-password") {
    const result = await resetPasswordService(id)
    void audit({ actor: payload, action: "RESET_PASSWORD", resource: "users", resourceId: id })
    return NextResponse.json(result)
  }
  if (action === "desbloquear") {
    const result = await desbloquearUsuarioService(id)
    void audit({ actor: payload, action: "UNLOCK", resource: "users", resourceId: id })
    return NextResponse.json(result)
  }

  const value = await requireBody(request, updateUserSchema)

  if (payload.rol !== "owner" && value.rol !== undefined && !ROLES_ADMIN_PUEDE_ASIGNAR.includes(value.rol)) {
    throw new ForbiddenError("Permisos insuficientes para asignar ese rol")
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(value.nombre              !== undefined && { nombre:              value.nombre }),
      ...(value.email               !== undefined && { email:               value.email.toLowerCase() }),
      ...(value.rol                 !== undefined && { rol:                 value.rol }),
      ...(value.activo              !== undefined && { activo:              value.activo }),
      ...(value.debeCambiarPassword !== undefined && { debeCambiarPassword: value.debeCambiarPassword }),
      ...(value.grupoId             !== undefined && { grupoId:             value.grupoId || null }),
    },
    select: { id: true, nombre: true, email: true, rol: true, grupoId: true, activo: true },
  })
  void audit({ actor: payload, action: "UPDATE", resource: "users", resourceId: id, meta: { changes: Object.keys(value) } })
  return NextResponse.json({ user })
})

export const DELETE = withAuthAdmin(async (request, payload, ctx) => {
  const { id } = await ctx!.params
  await requireRateLimit(request, "DELETE /api/users/:id", 30, 60_000)

  if (payload.sub === id) throw new ValidationError("No puedes eliminar tu propia cuenta")

  if (payload.rol !== "owner") {
    await requireWorkspaceAccess(id, payload, false)
  }

  await prisma.user.delete({ where: { id } })
  void audit({ actor: payload, action: "DELETE", resource: "users", resourceId: id })
  return NextResponse.json({ success: true })
})
