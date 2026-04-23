// ── GET /api/users  — listar usuarios
// ── POST /api/users — crear usuario
import { NextResponse } from "next/server"
import { withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody } from "@/lib/backend/middleware/guards"
import { createUserSchema } from "@/lib/backend/validators/auth.validator"
import { createUserService } from "@/lib/backend/services/auth.service"
import { ForbiddenError, ConflictError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"
import { audit } from "@/lib/backend/services/audit.service"

const ROLES_ADMIN_PUEDE_CREAR = ["qa_lead", "qa", "viewer"]

export const GET = withAuthAdmin(async (request, payload) => {
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
  await requireRateLimit(request, "POST /api/users", 30, 60_000, payload.sub)

  const value = await requireBody(request, createUserSchema)

  if (payload.rol !== "owner" && !ROLES_ADMIN_PUEDE_CREAR.includes(value.rol)) {
    throw new ForbiddenError("Permisos insuficientes")
  }
  if (value.rol === "owner" && payload.rol !== "owner") {
    throw new ForbiddenError("Permisos insuficientes")
  }

  const grupoId = payload.rol !== "owner"
    ? (payload.grupoId ?? null)
    : (value.grupoId ?? null)

  const result = await createUserService({ ...value, grupoId })
  if (!result.success) throw new ConflictError(result.error ?? "No se pudo crear el usuario")
  void audit({ actor: payload, action: "CREATE", resource: "users", resourceId: result.user?.id, meta: { email: value.email, rol: value.rol } })
  return NextResponse.json({ user: result.user }, { status: 201 })
})
