// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — GET /api/users/:id/asignaciones
//  Verifica conteo de HUs y tareas asignadas a un usuario
//  antes de quitarle el workspace.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    grupo: {
      findUnique: vi.fn(),
    },
    historiaUsuario: {
      count:    vi.fn(),
      findMany: vi.fn(),
    },
    tarea: {
      count: vi.fn(),
    },
  },
}))

import { prisma } from "@/lib/backend/prisma"
import { GET } from "@/app/api/users/[id]/asignaciones/route"

// ── Helper ───────────────────────────────────────────────
function makeReq(userId: string, token?: string) {
  return new NextRequest(`http://localhost/api/users/${userId}/asignaciones`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

let ownerToken: string
let adminToken: string
let qaToken:    string

beforeAll(async () => {
  ownerToken = await signToken({ sub: "usr-000", email: "owner@empresa.com", nombre: "Owner", rol: "owner" })
  adminToken = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-abc" })
  qaToken    = await signToken({ sub: "usr-006", email: "qa@empresa.com",    nombre: "QA",    rol: "qa",    grupoId: "grupo-abc" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
})

// ── Tests ─────────────────────────────────────────────────

describe("GET /api/users/:id/asignaciones — autenticación", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("usr-099"), makeParams("usr-099"))
    expect(res.status).toBe(401)
  })

  it("usuario QA (no admin) → 403", async () => {
    const res = await GET(makeReq("usr-099", qaToken), makeParams("usr-099"))
    expect(res.status).toBe(403)
  })
})

describe("GET /api/users/:id/asignaciones — usuario sin workspace", () => {
  it("devuelve 0/0 si el usuario no tiene grupoId", async () => {
    // requireAuth consume la primera llamada (activo check),
    // la segunda es la búsqueda del usuario objetivo
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true } as never)       // requireAuth
      .mockResolvedValueOnce({ nombre: "María", grupoId: null } as never) // handler

    const res  = await GET(makeReq("usr-099", ownerToken), makeParams("usr-099"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ historias: 0, tareas: 0 })
    expect(vi.mocked(prisma.historiaUsuario.count)).not.toHaveBeenCalled()
  })

  it("devuelve 0/0 si el usuario no existe en DB", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true } as never)
      .mockResolvedValueOnce(null as never)

    const res  = await GET(makeReq("usr-xxx", ownerToken), makeParams("usr-xxx"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ historias: 0, tareas: 0 })
  })
})

describe("GET /api/users/:id/asignaciones — conteos correctos", () => {
  it("devuelve conteo de HUs y tareas asignadas al usuario", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true } as never)
      .mockResolvedValueOnce({ nombre: "Laura Méndez", grupoId: "grupo-abc" } as never)

    vi.mocked(prisma.historiaUsuario.count).mockResolvedValue(3 as never)
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValue([
      { id: "hu-1" }, { id: "hu-2" }, { id: "hu-3" },
    ] as never)
    vi.mocked(prisma.tarea.count).mockResolvedValue(7 as never)

    const res  = await GET(makeReq("usr-002", ownerToken), makeParams("usr-002"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toEqual({ historias: 3, tareas: 7 })
  })

  it("filtra HUs por responsable y grupoId del usuario", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true } as never)
      .mockResolvedValueOnce({ nombre: "Laura Méndez", grupoId: "grupo-abc" } as never)

    vi.mocked(prisma.historiaUsuario.count).mockResolvedValue(2 as never)
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValue([{ id: "hu-1" }, { id: "hu-2" }] as never)
    vi.mocked(prisma.tarea.count).mockResolvedValue(0 as never)

    await GET(makeReq("usr-002", ownerToken), makeParams("usr-002"))

    expect(vi.mocked(prisma.historiaUsuario.count)).toHaveBeenCalledWith({
      where: { responsable: "Laura Méndez", grupoId: "grupo-abc" },
    })
  })

  it("filtra tareas por asignado y huIds del workspace", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true } as never)
      .mockResolvedValueOnce({ nombre: "Laura Méndez", grupoId: "grupo-abc" } as never)

    vi.mocked(prisma.historiaUsuario.count).mockResolvedValue(1 as never)
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValue([{ id: "hu-42" }] as never)
    vi.mocked(prisma.tarea.count).mockResolvedValue(4 as never)

    await GET(makeReq("usr-002", ownerToken), makeParams("usr-002"))

    expect(vi.mocked(prisma.tarea.count)).toHaveBeenCalledWith({
      where: { asignado: "Laura Méndez", huId: { in: ["hu-42"] } },
    })
  })

  it("admin con grupoId propio también puede consultar → 200", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never)
      .mockResolvedValueOnce({ nombre: "Carlos", grupoId: "grupo-abc" } as never)

    vi.mocked(prisma.historiaUsuario.count).mockResolvedValue(0 as never)
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValue([] as never)
    vi.mocked(prisma.tarea.count).mockResolvedValue(0 as never)

    const res = await GET(makeReq("usr-003", adminToken), makeParams("usr-003"))
    expect(res.status).toBe(200)
  })
})
