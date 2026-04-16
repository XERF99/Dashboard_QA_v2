// ── PUT    /api/users/[id] — actualizar usuario
// ── DELETE /api/users/[id] — eliminar usuario
import { NextRequest, NextResponse } from "next/server"
import { withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { updateUserSchema } from "@/lib/backend/validators/auth.validator"
import { prisma } from "@/lib/backend/prisma"
import { resetPasswordService, desbloquearUsuarioService } from "@/lib/backend/services/auth.service"
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

export const PUT = withAuthAdmin(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "PUT /api/users/:id"), 60, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  if (payload.rol !== "owner") {
    const check = await checkWorkspaceAccess(id, payload, true)
    if (!check.ok) return check.response
  }

  const body = await request.json()

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

  const { error, value } = updateUserSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  // Admin no puede elevar un rol a admin/owner
  if (payload.rol !== "owner" && value.rol !== undefined && !ROLES_ADMIN_PUEDE_ASIGNAR.includes(value.rol)) {
    return NextResponse.json({ error: "Permisos insuficientes para asignar ese rol" }, { status: 403 })
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

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "DELETE /api/users/:id"), 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  if (payload.sub === id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 })
  }

  if (payload.rol !== "owner") {
    // Admin solo puede eliminar usuarios en su propio workspace (no sin-workspace)
    const check = await checkWorkspaceAccess(id, payload, false)
    if (!check.ok) return check.response
  }

  await prisma.user.delete({ where: { id } })
  void audit({ actor: payload, action: "DELETE", resource: "users", resourceId: id })
  return NextResponse.json({ success: true })
})
