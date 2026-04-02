// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/historias  (CRUD + sync)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/services/historia.service", () => ({
  getAllHistorias:  vi.fn(),
  createHistoria:  vi.fn(),
  getHistoriaById: vi.fn(),
  updateHistoria:  vi.fn(),
  deleteHistoria:  vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:            { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    historiaUsuario: {
      findUnique:  vi.fn(),
      deleteMany:  vi.fn(),
      findMany:    vi.fn(),
      createMany:  vi.fn(),
      update:      vi.fn(),
    },
    grupo: {
      findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        historiaUsuario: {
          deleteMany:  vi.fn(),
          findMany:    vi.fn().mockResolvedValue([]),
          createMany:  vi.fn(),
          update:      vi.fn(),
        },
      })
    ),
  },
}))

import {
  getAllHistorias, createHistoria,
  updateHistoria, deleteHistoria,
} from "@/lib/backend/services/historia.service"
import { prisma } from "@/lib/backend/prisma"
import { GET, POST }         from "@/app/api/historias/route"
import { GET as getById, PUT, DELETE } from "@/app/api/historias/[id]/route"
import { POST as syncPOST }  from "@/app/api/historias/sync/route"

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

// Campos que devuelve la DB (para mocks de respuesta)
const huBase = {
  id: "hu-1", codigo: "HU-001", titulo: "Historia test",
  descripcion: "", estado: "sin_iniciar", prioridad: "media",
  responsable: "usr-001", tipoAplicacion: "web", creadoPor: "usr-001",
  fechaCreacion: new Date().toISOString(), bloqueos: [], historial: [],
}

// Campos válidos para crear (sin campos desconocidos por Joi)
const huCreateBody = {
  codigo: "HU-001", titulo: "Historia test",
  descripcion: "", responsable: "usr-001",
  tipoAplicacion: "web", creadoPor: "usr-001",
}

let token:      string
let syncToken:  string
let ownerToken: string

beforeAll(async () => {
  token      = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  syncToken  = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  ownerToken = await signToken({ sub: "usr-000", email: "owner@empresa.com",  nombre: "Owner", rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
  vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue({ grupoId: "grupo-test" } as never)
})

// ── GET /api/historias ───────────────────────────────────

describe("GET /api/historias", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("GET", "/api/historias"))
    expect(res.status).toBe(401)
  })

  it("lista todas las historias → 200", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(
      { historias: [huBase], total: 1, page: 1, limit: 50, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/historias", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.historias).toHaveLength(1)
    expect(data.historias[0].codigo).toBe("HU-001")
  })
})

// ── POST /api/historias ──────────────────────────────────

describe("POST /api/historias", () => {
  it("body inválido (sin título) → 400", async () => {
    const res = await POST(makeReq("POST", "/api/historias", { descripcion: "sin título" }, token))
    expect(res.status).toBe(400)
  })

  it("crea historia correctamente → 201", async () => {
    vi.mocked(createHistoria).mockResolvedValueOnce(huBase as never)

    const res  = await POST(makeReq("POST", "/api/historias", huCreateBody, token))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.historia.id).toBe("hu-1")
  })
})

// ── GET /api/historias/[id] ──────────────────────────────

describe("GET /api/historias/[id]", () => {
  it("historia no encontrada → 404", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce(null)

    const res = await getById(
      makeReq("GET", "/api/historias/hu-x", undefined, token),
      { params: Promise.resolve({ id: "hu-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("historia encontrada → 200", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce({ ...huBase, grupoId: "grupo-test", casos: [] } as never)

    const res  = await getById(
      makeReq("GET", "/api/historias/hu-1", undefined, token),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.historia.id).toBe("hu-1")
  })
})

// ── PUT /api/historias/[id] ──────────────────────────────

describe("PUT /api/historias/[id]", () => {
  it("actualiza historia → 200", async () => {
    vi.mocked(updateHistoria).mockResolvedValueOnce({ ...huBase, titulo: "Actualizada" } as never)

    const res  = await PUT(
      makeReq("PUT", "/api/historias/hu-1", { ...huCreateBody, titulo: "Actualizada" }, token),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.historia.titulo).toBe("Actualizada")
  })
})

// ── DELETE /api/historias/[id] ───────────────────────────

describe("DELETE /api/historias/[id]", () => {
  it("elimina historia → 200", async () => {
    vi.mocked(deleteHistoria).mockResolvedValueOnce(undefined as never)

    const res  = await DELETE(
      makeReq("DELETE", "/api/historias/hu-1", undefined, token),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ── POST /api/historias/sync ─────────────────────────────

describe("POST /api/historias/sync", () => {
  it("sin token → 401", async () => {
    const res = await syncPOST(makeReq("POST", "/api/historias/sync", { historias: [] }))
    expect(res.status).toBe(401)
  })

  it("sincroniza array completo → 200 con count", async () => {
    const res  = await syncPOST(
      makeReq("POST", "/api/historias/sync", { historias: [huBase, { ...huBase, id: "hu-2", codigo: "HU-002" }] }, syncToken)
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.count).toBe(2)
  })
})
