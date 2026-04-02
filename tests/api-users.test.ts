// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/users  (CRUD + workspace isolation)
//  Solo admins/owners pueden acceder.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
      count:      vi.fn().mockResolvedValue(0),
    },
    grupo: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
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
  rol: "qa", grupoId: "grupo-abc", activo: true, debeCambiarPassword: true,
  bloqueado: false, fechaCreacion: new Date().toISOString(),
}

let adminToken:         string   // admin sin grupoId
let adminTokenConGrupo: string   // admin con grupoId = "grupo-abc"
let adminOtroGrupo:     string   // admin con grupoId = "grupo-xyz" (otro workspace)
let ownerToken:         string
let qaToken:            string

beforeAll(async () => {
  adminToken         = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-abc" })
  adminTokenConGrupo = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-abc" })
  adminOtroGrupo     = await signToken({ sub: "usr-002", email: "admin2@empresa.com", nombre: "Admin2", rol: "admin", grupoId: "grupo-xyz" })
  ownerToken         = await signToken({ sub: "usr-000", email: "owner@empresa.com", nombre: "Owner", rol: "owner" })
  qaToken            = await signToken({ sub: "usr-006", email: "maria@empresa.com", nombre: "Maria", rol: "qa" })
})

beforeEach(() => {
  vi.clearAllMocks()
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
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

// ── GET /api/users — filtrado por workspace ───────────────

describe("GET /api/users — workspace filter", () => {
  it("admin con grupoId → query filtra por grupoId propio + null", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([userBase] as never)

    await GET(makeReq("GET", "/api/users", undefined, adminTokenConGrupo))

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { rol: "owner" },
          OR: expect.arrayContaining([
            { grupoId: "grupo-abc" },
            { grupoId: null },
          ]),
        }),
      })
    )
  })

  it("admin con grupoId → query filtra por su propio grupoId", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([userBase] as never)

    await GET(makeReq("GET", "/api/users", undefined, adminToken))

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { rol: "owner" },
          OR: expect.arrayContaining([{ grupoId: "grupo-abc" }, { grupoId: null }]),
        }),
      })
    )
  })

  it("owner token → query excluye al propio owner (ve todos los demás)", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValueOnce([userBase] as never)

    await GET(makeReq("GET", "/api/users", undefined, ownerToken))

    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { NOT: { id: expect.any(String) } } })
    )
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

// ── POST — restricción de roles para admin ────────────────

describe("POST /api/users — role restriction", () => {
  it("admin intenta crear usuario con rol owner → 403", async () => {
    const res  = await POST(
      makeReq("POST", "/api/users", { nombre: "Fake Owner", email: "fake@empresa.com", rol: "owner" }, adminToken)
    )
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toMatch(/permisos insuficientes/i)
  })

  it("admin intenta crear usuario con rol admin → 403", async () => {
    const res  = await POST(
      makeReq("POST", "/api/users", { nombre: "Fake Admin", email: "fakeadmin@empresa.com", rol: "admin" }, adminToken)
    )
    const data = await res.json()

    expect(res.status).toBe(403)
    expect(data.error).toMatch(/permisos insuficientes/i)
  })

  it("admin puede crear qa_lead → pasa la validación de rol", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: true, user: { ...userBase, rol: "qa_lead" } as never })

    const res = await POST(
      makeReq("POST", "/api/users", { nombre: "Lead QA", email: "lead@empresa.com", rol: "qa_lead" }, adminToken)
    )
    expect(res.status).toBe(201)
  })

  it("owner puede crear usuario con rol admin → 201", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: true, user: { ...userBase, rol: "admin" } as never })

    const res = await POST(
      makeReq("POST", "/api/users", { nombre: "New Admin", email: "newadmin@empresa.com", rol: "admin" }, ownerToken)
    )
    expect(res.status).toBe(201)
  })
})

// ── PUT /api/users/[id] ──────────────────────────────────

describe("PUT /api/users/[id]", () => {
  it("actualiza datos del usuario → 200", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "qa", grupoId: "grupo-abc" } as never) // checkWorkspaceAccess
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ ...userBase, nombre: "QA Actualizado" } as never)

    const res  = await PUT(
      makeReq("PUT", "/api/users/usr-099", {
        id: "usr-099", nombre: "QA Actualizado", email: "nuevo@empresa.com",
        rol: "qa", activo: true, debeCambiarPassword: false,
      }, adminTokenConGrupo),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.user.nombre).toBe("QA Actualizado")
  })

  it("reset-password → 200 con contraseña genérica", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "qa", grupoId: "grupo-abc" } as never) // checkWorkspaceAccess
    vi.mocked(resetPasswordService).mockResolvedValueOnce({ success: true })

    const res  = await PUT(
      makeReq("PUT", "/api/users/usr-099?action=reset-password", {}, adminTokenConGrupo),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it("desbloquear usuario → 200", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "qa", grupoId: "grupo-abc" } as never) // checkWorkspaceAccess
    vi.mocked(desbloquearUsuarioService).mockResolvedValueOnce({ success: true })

    const res  = await PUT(
      makeReq("PUT", "/api/users/usr-099?action=desbloquear", {}, adminTokenConGrupo),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ── PUT — workspace isolation ─────────────────────────────

describe("PUT /api/users/[id] — workspace isolation", () => {
  it("admin intenta editar usuario de OTRO workspace → 404", async () => {
    // target está en "grupo-abc", pero admin tiene "grupo-xyz"
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "qa", grupoId: "grupo-abc" } as never) // checkWorkspaceAccess

    const res = await PUT(
      makeReq("PUT", "/api/users/usr-099", { id: "usr-099", nombre: "Hack" }, adminOtroGrupo),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    expect(res.status).toBe(404)
  })

  it("admin puede editar usuario sin workspace (para asignarlo)", async () => {
    // target grupoId = null → admin puede asignarle su workspace
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "qa", grupoId: null } as never)  // checkWorkspaceAccess
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ ...userBase, grupoId: "grupo-abc" } as never)

    const res = await PUT(
      makeReq("PUT", "/api/users/usr-099", { id: "usr-099", grupoId: "grupo-abc" }, adminTokenConGrupo),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    expect(res.status).toBe(200)
  })

  it("admin intenta editar usuario owner → 404", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "owner", grupoId: null } as never) // checkWorkspaceAccess

    const res = await PUT(
      makeReq("PUT", "/api/users/usr-000", { id: "usr-000", nombre: "X" }, adminTokenConGrupo),
      { params: Promise.resolve({ id: "usr-000" }) }
    )
    expect(res.status).toBe(404)
  })

  it("owner puede editar cualquier usuario → 200", async () => {
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ ...userBase, nombre: "Editado" } as never)

    const res = await PUT(
      makeReq("PUT", "/api/users/usr-099", { id: "usr-099", nombre: "Editado" }, ownerToken),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    expect(res.status).toBe(200)
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

  it("admin elimina usuario de su workspace → 200", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "qa", grupoId: "grupo-abc" } as never) // checkWorkspaceAccess
    vi.mocked(prisma.user.delete).mockResolvedValueOnce(userBase as never)

    const res  = await DELETE(
      makeReq("DELETE", "/api/users/usr-099", undefined, adminTokenConGrupo),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ── DELETE — workspace isolation ─────────────────────────

describe("DELETE /api/users/[id] — workspace isolation", () => {
  it("admin intenta eliminar usuario de OTRO workspace → 404", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "qa", grupoId: "grupo-abc" } as never) // checkWorkspaceAccess

    const res = await DELETE(
      makeReq("DELETE", "/api/users/usr-099", undefined, adminOtroGrupo),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    expect(res.status).toBe(404)
  })

  it("admin intenta eliminar usuario sin workspace → 404", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "qa", grupoId: null } as never)  // checkWorkspaceAccess

    const res = await DELETE(
      makeReq("DELETE", "/api/users/usr-099", undefined, adminTokenConGrupo),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    expect(res.status).toBe(404)
  })

  it("owner puede eliminar cualquier usuario → 200", async () => {
    vi.mocked(prisma.user.delete).mockResolvedValueOnce(userBase as never)

    const res = await DELETE(
      makeReq("DELETE", "/api/users/usr-099", undefined, ownerToken),
      { params: Promise.resolve({ id: "usr-099" }) }
    )
    expect(res.status).toBe(200)
  })

  it("admin intenta eliminar usuario owner → 404", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never) // requireAuth
      .mockResolvedValueOnce({ rol: "owner", grupoId: null } as never) // checkWorkspaceAccess

    const res = await DELETE(
      makeReq("DELETE", "/api/users/usr-000", undefined, adminTokenConGrupo),
      { params: Promise.resolve({ id: "usr-000" }) }
    )
    expect(res.status).toBe(404)
  })
})

// ── Herencia de grupoId ───────────────────────────────────

describe("grupoId — herencia automática al crear usuario", () => {
  it("admin con grupoId en token → createUserService recibe ese grupoId", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: true, user: userBase as never })

    await POST(
      makeReq("POST", "/api/users", { nombre: "Nuevo QA", email: "nuevo2@empresa.com", rol: "qa" }, adminTokenConGrupo)
    )

    expect(createUserService).toHaveBeenCalledWith(
      expect.objectContaining({ grupoId: "grupo-abc" })
    )
  })

  it("admin con grupoId → createUserService recibe grupoId del admin", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: true, user: userBase as never })

    await POST(
      makeReq("POST", "/api/users", { nombre: "Nuevo QA", email: "nuevo3@empresa.com", rol: "qa" }, adminToken)
    )

    expect(createUserService).toHaveBeenCalledWith(
      expect.objectContaining({ grupoId: "grupo-abc" })
    )
  })

  it("owner puede especificar grupoId en el body", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: true, user: userBase as never })

    await POST(
      makeReq("POST", "/api/users", { nombre: "QA del Grupo", email: "qa@g.com", rol: "qa", grupoId: "grupo-xyz" }, ownerToken)
    )

    expect(createUserService).toHaveBeenCalledWith(
      expect.objectContaining({ grupoId: "grupo-xyz" })
    )
  })

  it("owner sin grupoId en body → grupoId null", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: true, user: userBase as never })

    await POST(
      makeReq("POST", "/api/users", { nombre: "Sin Grupo", email: "singrupo@g.com", rol: "qa" }, ownerToken)
    )

    expect(createUserService).toHaveBeenCalledWith(
      expect.objectContaining({ grupoId: null })
    )
  })
})

// ── Actualización parcial (grupoId) ──────────────────────

describe("PUT /api/users/[id] — actualización grupoId", () => {
  it("PUT con grupoId null desasigna al usuario del grupo", async () => {
    // ownerToken: requireAuth calls user.findUnique; owner skips checkWorkspaceAccess (no 2nd call)
    vi.mocked(prisma.user.update).mockResolvedValueOnce({ ...userBase, grupoId: null } as never)

    const res = await PUT(
      makeReq("PUT", "/api/users/usr-099", { id: "usr-099", grupoId: null }, ownerToken),
      { params: Promise.resolve({ id: "usr-099" }) }
    )

    expect(res.status).toBe(200)
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ grupoId: null }),
      })
    )
  })
})
