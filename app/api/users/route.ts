// ── GET /api/users  — listar usuarios
// ── POST /api/users — crear usuario
import { NextRequest, NextResponse } from "next/server"
import { withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { createUserSchema } from "@/lib/backend/validators/auth.validator"
import { createUserService } from "@/lib/backend/services/auth.service"
import { prisma } from "@/lib/backend/prisma"
import { audit } from "@/lib/backend/services/audit.service"

// Roles que un admin (no owner) puede asignar
const ROLES_ADMIN_PUEDE_CREAR = ["qa_lead", "qa", "viewer"]

export const GET = withAuthAdmin(async (request, payload) => {
  // Owner: ve todos los usuarios excepto a sí mismo (ya está logueado, no necesita verse en la lista)
  // Admin: ve usuarios de su workspace + usuarios sin workspace (grupoId null).
  //   Incluir grupoId:null es INTENCIONAL: permite que el admin incorpore usuarios
  //   sin asignar a su workspace. Si payload.grupoId fuera null (no debería ocurrir
  //   para admins por el check SIN_WORKSPACE), el OR solo incluiría grupoId:null.
  const where = payload.rol !== "owner"
    ? {
        NOT: { rol: "owner" },
        OR: [
          ...(payload.grupoId ? [{ grupoId: payload.grupoId }] : []),
          { grupoId: null },
        ],
      }
    : { NOT: { id: payload.sub } }

  const { searchParams } = new URL(request.url)
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))
  const skip  = (page - 1) * limit

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      select: {
        id: true, nombre: true, email: true, rol: true,
        grupoId: true, activo: true, debeCambiarPassword: true,
        bloqueado: true, fechaCreacion: true, historialConexiones: true,
      },
      where,
      orderBy: { fechaCreacion: "asc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ])
  return NextResponse.json({ users, total, page, limit, pages: Math.ceil(total / limit) })
})

export const POST = withAuthAdmin(async (request, payload) => {
  // Rate limiting: 30 usuarios por admin por minuto
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, `POST /api/users:${payload.sub}`), 30, 60_000)
  if (!rl.allowed) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Demasiadas solicitudes de creación de usuario. Intenta en un momento." },
      {
        status: 429,
        headers: {
          "Retry-After":           String(retryAfterSecs),
          "X-RateLimit-Limit":     "30",
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const body = await request.json()
  const { error, value } = createUserSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  // Solo owner puede crear usuarios con rol admin u owner
  if (payload.rol !== "owner" && !ROLES_ADMIN_PUEDE_CREAR.includes(value.rol)) {
    return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
  }

  // Owner crea con rol owner: solo si no existe ninguno aún (validar en service)
  if (value.rol === "owner" && payload.rol !== "owner") {
    return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 })
  }

  // Admin hereda su propio grupoId; owner puede proveer uno en el body
  const grupoId = payload.rol !== "owner"
    ? (payload.grupoId ?? null)
    : (value.grupoId ?? null)

  try {
    const result = await createUserService({ ...value, grupoId })
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 409 })
    void audit({ actor: payload, action: "CREATE", resource: "users", resourceId: result.user?.id, meta: { email: value.email, rol: value.rol } })
    return NextResponse.json({ user: result.user }, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error interno al crear usuario"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
})
