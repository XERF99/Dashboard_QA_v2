// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/users  (CRUD + reset-password + desbloquear)
//  Solo admins/owners pueden acceder.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user: {
      findMany:  vi.fn(),
      findUnique: vi.fn(),
      update:    vi.fn(),
      delete:    vi.fn(),
    },
  },
}))

vi.mock("@/lib/backend/services/auth.service", () => ({
  createUserService:        vi.fn(),
  resetPasswordService:     vi.fn(),
  desbloquearUsuarioService: vi.fn(),
}))

import { prisma } from "@/lib/backend/prisma"
import { createUserService, resetPasswordService, desbloquearUsuarioService } from "@/lib/backend/services/auth.service"
import { GET, POST }         from "@/app/api/users/route"
import { PUT, DELETE }       from "@/app/api/users/[id]/route"

// ── Helper ───────────────────────────────────────────────
function makeReq(method: string, path: string, body?: unknown, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const userBase = {
  id: "usr-099", nombre: "Nuevo QA", email: "nuevo@empresa.com",
  rol: "qa", activo: true, debeCambiarPassword: true,
  bloqueado: false, fechaCreacion: new Date().toISOString(),
}

let adminToken: string
let ownerToken: string
let qaToken:    string

beforeAll(async () => {
  adminToken = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin" })
  ownerToken = await signToken({ sub: "usr-000", email: "owner@empresa.com", nombre: "Owner", rol: "owner" })
  qaToken    = await signToken({ sub: "usr-006", email: "maria@empresa.com", nombre: "Maria", rol: "qa" })
})

// ── GET /api/users ───────────────────────────────────────

describe("GET /api/users", () => {
  it("usuario sin rol admin → 403", async () => {
    const res = await GET(makeReq("GET", "/api/users", undefined, qaToken))
    expect(res.status).toBe(403)
  })

  it("admin lista usuarios → 200", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([userBase] as never)

    const res  = await GET(makeReq("GET", "/api/users", undefined, adminToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.users).toHaveLength(1)
  })
})

// ── POST /api/users ──────────────────────────────────────

describe("POST /api/users", () => {
  it("body inválido (sin email) → 400", async () => {
    const res = await POST(makeReq("POST", "/api/users", { nombre: "Sin email", rol: "qa" }, adminToken))
    expect(res.status).toBe(400)
  })

  it("email duplicado → 409", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: false, error: "Email ya registrado" })

    const res  = await POST(
      makeReq("POST", "/api/users", { nombre: "Otro QA", email: "admin@empresa.com", rol: "qa" }, adminToken)
    )
    const data = await res.json()

    expect(res.status).toBe(409)
    expect(data.error).toMatch(/ya registrado/i)
  })

  it("crea usuario correctamente → 201", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: true, user: userBase as never })

    const res  = await POST(
      makeReq("POST", "/api/users", { nombre: "Nuevo QA", email: "nuevo@empresa.com", rol: "qa" }, adminToken)
    )
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.user.email).toBe("nuevo@empresa.com")
  })
})

// ── PUT /api/users/[id] ──────────────────────────────────

describe("PUT /api/users/[id]", () => {
  it("actualiza datos del usuario → 200", async () => {
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ ...userBase, nombre: "QA Actualizado" } as never)

    const res  = await PUT(
      makeReq("PUT", "/api/users/usr-099", {
        id: "usr-099", nombre: "QA Actualizado", email: "nuevo@empresa.com",
        rol: "qa", activo: true, debeCambiarPassword: false,
      }, adminToken),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.user.nombre).toBe("QA Actualizado")
  })

  it("reset-password → 200 con contraseña genérica", async () => {
    vi.mocked(resetPasswordService).mockResolvedValueOnce({ success: true })

    const res  = await PUT(
      makeReq("PUT", "/api/users/usr-099?action=reset-password", {}, adminToken),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it("desbloquear usuario → 200", async () => {
    vi.mocked(desbloquearUsuarioService).mockResolvedValueOnce({ success: true })

    const res  = await PUT(
      makeReq("PUT", "/api/users/usr-099?action=desbloquear", {}, adminToken),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ── DELETE /api/users/[id] ───────────────────────────────

describe("DELETE /api/users/[id]", () => {
  it("admin intenta eliminar su propia cuenta → 400", async () => {
    const res  = await DELETE(
      makeReq("DELETE", "/api/users/usr-001", undefined, adminToken),
      { params: Promise.resolve({ id: "usr-001" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toMatch(/propia cuenta/i)
  })

  it("admin elimina otro usuario → 200", async () => {
    vi.mocked(prisma.user.delete).mockResolvedValueOnce(userBase as never)

    const res  = await DELETE(
      makeReq("DELETE", "/api/users/usr-099", undefined, adminToken),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ── Visibilidad de usuarios Owner ─────────────────────────

describe("Owner invisibility — GET /api/users", () => {
  it("admin token → findMany called con where NOT rol owner", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([userBase] as never)

    await GET(makeReq("GET", "/api/users", undefined, adminToken))

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { NOT: { rol: "owner" } } })
    )
  })

  it("owner token → findMany called con where vacío", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([userBase] as never)

    await GET(makeReq("GET", "/api/users", undefined, ownerToken))

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })
})

describe("Owner invisibility — POST /api/users", () => {
  it("admin intenta crear usuario con rol owner → 403", async () => {
    const res  = await POST(
      makeReq("POST", "/api/users", { nombre: "Fake Owner", email: "fake@empresa.com", rol: "owner" }, adminToken)
    )
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toMatch(/permisos insuficientes/i)
  })
})

describe("Owner invisibility — PUT /api/users/[id]", () => {
  it("admin intenta editar usuario owner → 404", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ rol: "owner" } as never)

    const res = await PUT(
      makeReq("PUT", "/api/users/usr-000", {
        nombre: "X", email: "owner@empresa.com", rol: "owner", activo: true, debeCambiarPassword: false,
      }, adminToken),
      { params: Promise.resolve({ id: "usr-000" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toMatch(/no encontrado/i)
  })
})

describe("Owner invisibility — DELETE /api/users/[id]", () => {
  it("admin intenta eliminar usuario owner → 404", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ rol: "owner" } as never)

    const res  = await DELETE(
      makeReq("DELETE", "/api/users/usr-000", undefined, adminToken),
      { params: Promise.resolve({ id: "usr-000" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toMatch(/no encontrado/i)
  })
})
