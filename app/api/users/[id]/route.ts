// ── PUT    /api/users/[id] — actualizar usuario
// ── DELETE /api/users/[id] — eliminar usuario
import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/backend/middleware/auth.middleware"
import { updateUserSchema } from "@/lib/backend/validators/auth.validator"
import { prisma } from "@/lib/backend/prisma"
import { resetPasswordService, desbloquearUsuarioService } from "@/lib/backend/services/auth.service"
import { logger } from "@/lib/backend/logger"
import { audit } from "@/lib/backend/services/audit.service"

// Roles que un admin (no owner) puede asignar
const ROLES_ADMIN_PUEDE_ASIGNAR = ["qa_lead", "qa", "viewer"]

// ── Helpers de aislamiento de workspace ──────────────────────
// Devuelve NextResponse de error si el admin no tiene permiso sobre el target.
// - Admin puede modificar usuarios en su workspace
// - Admin puede modificar usuarios sin workspace (grupoId null) → para asignarlos
// - Admin NO puede modificar usuarios de otro workspace
async function checkWorkspaceAccess(
  id: string,
  payload: { rol: string; grupoId?: string; sub: string },
  allowNullGrupo = true
): Promise<{ ok: true; target: { rol: string; grupoId: string | null } } | { ok: false; response: NextResponse }> {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { rol: true, grupoId: true },
  })
  if (!target) {
    return { ok: false, response: NextResponse.json({ error: "No encontrado" }, { status: 404 }) }
  }
  if (target.rol === "owner") {
    return { ok: false, response: NextResponse.json({ error: "No encontrado" }, { status: 404 }) }
  }
  // Si el target tiene workspace asignado, debe coincidir con el del admin
  if (target.grupoId !== null) {
    if (target.grupoId !== (payload.grupoId ?? null)) {
      return { ok: false, response: NextResponse.json({ error: "No encontrado" }, { status: 404 }) }
    }
  } else {
    // target.grupoId === null (sin workspace)
    if (!allowNullGrupo) {
      return { ok: false, response: NextResponse.json({ error: "No encontrado" }, { status: 404 }) }
    }
  }
  return { ok: true, target }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAdmin(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  if (payload.rol !== "owner") {
    const check = await checkWorkspaceAccess(id, payload, true)
    if (!check.ok) return check.response
  }

  const body = await request.json()

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "reset-password") {
    try {
      const result = await resetPasswordService(id)
      void audit({ actor: payload, action: "RESET_PASSWORD", resource: "users", resourceId: id })
      return NextResponse.json(result)
    } catch (e) {
      logger.error("PUT /api/users/:id", "Error al resetear password", e)
      return NextResponse.json({ error: "Error al resetear contraseña" }, { status: 500 })
    }
  }
  if (action === "desbloquear") {
    try {
      const result = await desbloquearUsuarioService(id)
      void audit({ actor: payload, action: "UNLOCK", resource: "users", resourceId: id })
      return NextResponse.json(result)
    } catch (e) {
      logger.error("PUT /api/users/:id", "Error al desbloquear usuario", e)
      return NextResponse.json({ error: "Error al desbloquear usuario" }, { status: 500 })
    }
  }

  const { error, value } = updateUserSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  // Admin no puede elevar un rol a admin/owner
  if (payload.rol !== "owner" && value.rol !== undefined && !ROLES_ADMIN_PUEDE_ASIGNAR.includes(value.rol)) {
    return NextResponse.json({ error: "Permisos insuficientes para asignar ese rol" }, { status: 403 })
  }

  try {
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
  } catch (e) {
    logger.error("PUT /api/users/:id", "Error al actualizar usuario", e)
    const msg = e instanceof Error ? e.message : "Error al actualizar usuario"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await requireAdmin(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params
  if (payload.sub === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
  }

  if (payload.rol !== "owner") {
    // Admin solo puede eliminar usuarios en su propio workspace (no sin-workspace)
    const check = await checkWorkspaceAccess(id, payload, false)
    if (!check.ok) return check.response
  }

  try {
    await prisma.user.delete({ where: { id } })
    void audit({ actor: payload, action: "DELETE", resource: "users", resourceId: id })
    return NextResponse.json({ success: true })
  } catch (e) {
    logger.error("DELETE /api/users/:id", "Error al eliminar usuario", e)
    const msg = e instanceof Error ? e.message : "Error al eliminar usuario"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
