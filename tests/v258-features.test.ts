// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.58 nuevas funcionalidades
//  · Fusión double-query en GET /api/casos/[id] y /api/tareas/[id]
//  · requireAuth: 1 sola query (include grupo) en lugar de 2
//  · try/catch en GET/PUT/DELETE /api/users y GET /api/export
//  · Rate limiting en POST /api/users y POST /api/historias
//  · Índice compuesto Sprint(grupoId, fechaInicio, fechaFin) documentado
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Shared prisma mock ────────────────────────────────────
const { mockPrisma } = vi.hoisted(() => {
  const historiaUsuario = {
    findUnique:  vi.fn(),
    findMany:    vi.fn().mockResolvedValue([]),
    count:       vi.fn().mockResolvedValue(0),
    create:      vi.fn(),
    update:      vi.fn(),
    delete:      vi.fn(),
  }
  const casoPrueba = {
    findUnique:  vi.fn(),
    findMany:    vi.fn().mockResolvedValue([]),
    count:       vi.fn().mockResolvedValue(0),
    update:      vi.fn().mockResolvedValue({}),
    delete:      vi.fn().mockResolvedValue({}),
    updateMany:  vi.fn().mockResolvedValue({ count: 0 }),
  }
  const tarea = {
    findUnique:  vi.fn(),
    findMany:    vi.fn().mockResolvedValue([]),
    count:       vi.fn().mockResolvedValue(0),
    update:      vi.fn().mockResolvedValue({}),
    delete:      vi.fn().mockResolvedValue({}),
  }
  const user = {
    findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }),
    findMany:   vi.fn().mockResolvedValue([]),
    count:      vi.fn().mockResolvedValue(0),
    update:     vi.fn().mockResolvedValue({}),
    delete:     vi.fn().mockResolvedValue({}),
    create:     vi.fn().mockResolvedValue({ id: "u-new" }),
  }
  const grupo = { findUnique: vi.fn().mockResolvedValue({ activo: true }) }
  const mockPrisma = {
    historiaUsuario, casoPrueba, tarea, user, grupo,
    $transaction: vi.fn((ops: unknown) => {
      if (typeof ops === "function") return ops({ historiaUsuario, casoPrueba, tarea })
      return Promise.all(ops as Promise<unknown>[])
    }),
  }
  return { mockPrisma }
})

vi.mock("@/lib/backend/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/backend/metricas-cache", () => ({ invalidateMetricasCache: vi.fn() }))

// Rate-limit: real rlKey, controllable checkRateLimit
vi.mock("@/lib/backend/middleware/rate-limit", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/backend/middleware/rate-limit")>()
  return {
    ...real,
    checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 19, resetAt: Date.now() + 3_600_000 })),
    getClientIp:    vi.fn(() => "10.0.0.1"),
  }
})

vi.mock("@/lib/backend/services/caso.service", () => ({
  getAllCasos:   vi.fn().mockResolvedValue({ casos: [], total: 0, page: 1, limit: 50, pages: 0 }),
  getCasoById:  vi.fn(),
  updateCaso:   vi.fn().mockResolvedValue({}),
  deleteCaso:   vi.fn().mockResolvedValue({}),
  createCaso:   vi.fn(),
  getCasosByHU: vi.fn(),
}))
vi.mock("@/lib/backend/services/tarea.service", () => ({
  getAllTareas:     vi.fn().mockResolvedValue({ tareas: [], total: 0, page: 1, limit: 50, pages: 0 }),
  getTareaById:    vi.fn(),
  updateTarea:     vi.fn().mockResolvedValue({}),
  deleteTarea:     vi.fn().mockResolvedValue({}),
  createTarea:     vi.fn(),
  getTareasByCaso: vi.fn(),
  getTareasByHU:   vi.fn(),
}))
vi.mock("@/lib/backend/services/auth.service", () => ({
  loginService:           vi.fn(),
  createUserService:      vi.fn().mockResolvedValue({ success: true, user: { id: "u-new" } }),
  resetPasswordService:   vi.fn().mockResolvedValue({ success: true }),
  desbloquearUsuarioService: vi.fn().mockResolvedValue({ success: true }),
  cambiarPasswordService: vi.fn(),
}))
vi.mock("@/lib/backend/validators/caso.validator", () => ({
  createCasoSchema: { validate: vi.fn().mockReturnValue({ error: null, value: {} }) },
  updateCasoSchema: { validate: vi.fn().mockReturnValue({ error: null, value: {} }) },
}))
vi.mock("@/lib/backend/validators/tarea.validator", () => ({
  createTareaSchema: { validate: vi.fn().mockReturnValue({ error: null, value: {} }) },
  updateTareaSchema: { validate: vi.fn().mockReturnValue({ error: null, value: {} }) },
}))
vi.mock("@/lib/backend/validators/historia.validator", () => ({
  createHistoriaSchema: { validate: vi.fn().mockReturnValue({ error: null, value: { titulo: "T" } }) },
  updateHistoriaSchema: { validate: vi.fn().mockReturnValue({ error: null, value: {} }) },
}))
vi.mock("@/lib/backend/services/historia.service", () => ({
  getAllHistorias:  vi.fn().mockResolvedValue({ historias: [], total: 0, page: 1, limit: 50, pages: 0 }),
  createHistoria:  vi.fn().mockResolvedValue({ id: "hu-new" }),
  getHistoriaById: vi.fn(),
  updateHistoria:  vi.fn(),
  deleteHistoria:  vi.fn(),
}))

import { checkRateLimit as mockRL } from "@/lib/backend/middleware/rate-limit"
import { createUserService }        from "@/lib/backend/services/auth.service"

import { GET as getCaso, PUT as putCaso, DELETE as deleteCaso_ } from "@/app/api/casos/[id]/route"
import { GET as getTarea, PUT as putTarea, DELETE as deleteTarea_ } from "@/app/api/tareas/[id]/route"
import { GET as getUsers, POST as postUser } from "@/app/api/users/route"
import { PUT as putUser, DELETE as deleteUser } from "@/app/api/users/[id]/route"
import { GET as exportData } from "@/app/api/export/route"
import { POST as postHistoria } from "@/app/api/historias/route"

// ── Helpers ───────────────────────────────────────────────
function makeReq(method: string, path: string, body?: unknown, token?: string, search?: string) {
  const url = `http://localhost${path}${search ? `?${search}` : ""}`
  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

let adminToken: string
let ownerToken: string

beforeAll(async () => {
  adminToken = await signToken({ sub: "u-1", email: "admin@t.com", nombre: "Admin", rol: "admin", grupoId: "g-1" })
  ownerToken = await signToken({ sub: "u-0", email: "owner@t.com", nombre: "Owner", rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mockRL).mockReturnValue({ allowed: true, remaining: 19, resetAt: Date.now() + 3_600_000 })
  mockPrisma.user.findUnique.mockResolvedValue({ activo: true, grupo: { activo: true } })
  mockPrisma.user.findMany.mockResolvedValue([])
  mockPrisma.user.count.mockResolvedValue(0)
  mockPrisma.casoPrueba.findUnique.mockResolvedValue(null)
  mockPrisma.tarea.findUnique.mockResolvedValue(null)
  mockPrisma.historiaUsuario.findMany.mockResolvedValue([])
  mockPrisma.historiaUsuario.count.mockResolvedValue(0)
  mockPrisma.casoPrueba.findMany.mockResolvedValue([])
  mockPrisma.casoPrueba.count.mockResolvedValue(0)
  vi.mocked(createUserService).mockResolvedValue({ success: true, user: { id: "u-new" } } as never)
  mockPrisma.$transaction.mockImplementation((ops: unknown) => {
    if (typeof ops === "function") return ops({ historiaUsuario: mockPrisma.historiaUsuario, casoPrueba: mockPrisma.casoPrueba, tarea: mockPrisma.tarea })
    return Promise.all(ops as Promise<unknown>[])
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 1 — GET /api/casos/[id]: single-query fusion
// ═══════════════════════════════════════════════════════════

const casoBase = {
  id: "c-1", huId: "hu-1", titulo: "Login test",
  hu: { grupoId: "g-1" },
  tareas: [],
}

describe("GET /api/casos/[id] — single-query fusion", () => {
  it("sin token → 401", async () => {
    const res = await getCaso(makeReq("GET", "/api/casos/c-1"), { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(401)
  })

  it("caso no encontrado → 404", async () => {
    mockPrisma.casoPrueba.findUnique.mockResolvedValueOnce(null)
    const res = await getCaso(makeReq("GET", "/api/casos/c-x", undefined, adminToken), { params: Promise.resolve({ id: "c-x" }) })
    expect(res.status).toBe(404)
  })

  it("caso de otro grupo → 404", async () => {
    mockPrisma.casoPrueba.findUnique.mockResolvedValueOnce({ ...casoBase, hu: { grupoId: "g-otro" } })
    const res = await getCaso(makeReq("GET", "/api/casos/c-1", undefined, adminToken), { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(404)
  })

  it("owner ve casos de cualquier grupo → 200", async () => {
    mockPrisma.casoPrueba.findUnique.mockResolvedValueOnce({ ...casoBase, hu: { grupoId: "g-otro" } })
    const res = await getCaso(makeReq("GET", "/api/casos/c-1", undefined, ownerToken), { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(200)
  })

  it("caso del mismo grupo → 200", async () => {
    mockPrisma.casoPrueba.findUnique.mockResolvedValueOnce(casoBase)
    const res  = await getCaso(makeReq("GET", "/api/casos/c-1", undefined, adminToken), { params: Promise.resolve({ id: "c-1" }) })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.caso.id).toBe("c-1")
  })

  it("findUnique se llama exactamente UNA vez (single query)", async () => {
    mockPrisma.casoPrueba.findUnique.mockResolvedValueOnce(casoBase)
    await getCaso(makeReq("GET", "/api/casos/c-1", undefined, adminToken), { params: Promise.resolve({ id: "c-1" }) })
    expect(mockPrisma.casoPrueba.findUnique).toHaveBeenCalledTimes(1)
  })

  it("DB falla → 500", async () => {
    mockPrisma.casoPrueba.findUnique.mockRejectedValueOnce(new Error("DB error"))
    const res = await getCaso(makeReq("GET", "/api/casos/c-1", undefined, adminToken), { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(500)
  })
})

describe("DELETE /api/casos/[id] — workspace isolation", () => {
  it("caso de otro grupo → 404", async () => {
    mockPrisma.casoPrueba.findUnique.mockResolvedValueOnce({ hu: { grupoId: "g-otro" } })
    const res = await deleteCaso_(makeReq("DELETE", "/api/casos/c-1", undefined, adminToken), { params: Promise.resolve({ id: "c-1" }) })
    expect(res.status).toBe(404)
  })

  it("caso propio → 200", async () => {
    mockPrisma.casoPrueba.findUnique.mockResolvedValueOnce({ hu: { grupoId: "g-1" } })
    const res  = await deleteCaso_(makeReq("DELETE", "/api/casos/c-1", undefined, adminToken), { params: Promise.resolve({ id: "c-1" }) })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 2 — GET /api/tareas/[id]: single-query fusion
// ═══════════════════════════════════════════════════════════

const tareaBase = {
  id: "t-1", casoPruebaId: "c-1", titulo: "Ejecutar test",
  caso: { hu: { grupoId: "g-1" } },
}

describe("GET /api/tareas/[id] — single-query fusion", () => {
  it("sin token → 401", async () => {
    const res = await getTarea(makeReq("GET", "/api/tareas/t-1"), { params: Promise.resolve({ id: "t-1" }) })
    expect(res.status).toBe(401)
  })

  it("tarea no encontrada → 404", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValueOnce(null)
    const res = await getTarea(makeReq("GET", "/api/tareas/t-x", undefined, adminToken), { params: Promise.resolve({ id: "t-x" }) })
    expect(res.status).toBe(404)
  })

  it("tarea de otro grupo → 404", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValueOnce({ ...tareaBase, caso: { hu: { grupoId: "g-otro" } } })
    const res = await getTarea(makeReq("GET", "/api/tareas/t-1", undefined, adminToken), { params: Promise.resolve({ id: "t-1" }) })
    expect(res.status).toBe(404)
  })

  it("tarea del mismo grupo → 200", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValueOnce(tareaBase)
    const res  = await getTarea(makeReq("GET", "/api/tareas/t-1", undefined, adminToken), { params: Promise.resolve({ id: "t-1" }) })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.tarea.id).toBe("t-1")
  })

  it("owner ve tareas de cualquier grupo → 200", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValueOnce({ ...tareaBase, caso: { hu: { grupoId: "g-otro" } } })
    const res = await getTarea(makeReq("GET", "/api/tareas/t-1", undefined, ownerToken), { params: Promise.resolve({ id: "t-1" }) })
    expect(res.status).toBe(200)
  })

  it("findUnique se llama exactamente UNA vez (single query)", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValueOnce(tareaBase)
    await getTarea(makeReq("GET", "/api/tareas/t-1", undefined, adminToken), { params: Promise.resolve({ id: "t-1" }) })
    expect(mockPrisma.tarea.findUnique).toHaveBeenCalledTimes(1)
  })

  it("DB falla → 500", async () => {
    mockPrisma.tarea.findUnique.mockRejectedValueOnce(new Error("DB error"))
    const res = await getTarea(makeReq("GET", "/api/tareas/t-1", undefined, adminToken), { params: Promise.resolve({ id: "t-1" }) })
    expect(res.status).toBe(500)
  })
})

describe("DELETE /api/tareas/[id] — workspace isolation", () => {
  it("tarea de otro grupo → 404", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValueOnce({ caso: { hu: { grupoId: "g-otro" } } })
    const res = await deleteTarea_(makeReq("DELETE", "/api/tareas/t-1", undefined, adminToken), { params: Promise.resolve({ id: "t-1" }) })
    expect(res.status).toBe(404)
  })

  it("tarea propia → 200", async () => {
    mockPrisma.tarea.findUnique.mockResolvedValueOnce({ caso: { hu: { grupoId: "g-1" } } })
    const res  = await deleteTarea_(makeReq("DELETE", "/api/tareas/t-1", undefined, adminToken), { params: Promise.resolve({ id: "t-1" }) })
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 3 — requireAuth: 1 query (user + grupo include)
// ═══════════════════════════════════════════════════════════

describe("requireAuth — single DB query (user include grupo)", () => {
  it("cuenta inactiva → 403", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: false, grupo: null })
    const res = await getUsers(makeReq("GET", "/api/users", undefined, adminToken))
    expect(res.status).toBe(403)
  })

  it("grupo inactivo → 403", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: { activo: false } })
    const res = await getUsers(makeReq("GET", "/api/users", undefined, adminToken))
    expect(res.status).toBe(403)
    const data = await res.json()
    expect(data.code).toBe("GRUPO_INACTIVO")
  })

  it("cuenta activa + grupo activo → 200", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: { activo: true } })
    const res = await getUsers(makeReq("GET", "/api/users", undefined, adminToken))
    expect(res.status).toBe(200)
  })

  it("findUnique se llama exactamente UNA vez por request (no 2 queries)", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: { activo: true } })
    await getUsers(makeReq("GET", "/api/users", undefined, adminToken))
    // requireAuth hace 1 query; requireAdmin llama a requireAuth → 1 query total
    expect(mockPrisma.user.findUnique).toHaveBeenCalledTimes(1)
  })

  it("owner sin grupoId → grupo: null → pasa sin error", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: null })
    const res = await getUsers(makeReq("GET", "/api/users", undefined, ownerToken))
    // owner sin grupoId no verifica grupo — espera status 200
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 4 — try/catch en GET /api/users
// ═══════════════════════════════════════════════════════════

describe("GET /api/users — try/catch 500", () => {
  it("sin token → 401", async () => {
    const res = await getUsers(makeReq("GET", "/api/users"))
    expect(res.status).toBe(401)
  })

  it("DB falla → 500", async () => {
    mockPrisma.$transaction.mockRejectedValueOnce(new Error("DB failure"))
    const res  = await getUsers(makeReq("GET", "/api/users", undefined, adminToken))
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBeTruthy()
  })

  it("DB OK → 200 con paginación", async () => {
    mockPrisma.$transaction.mockResolvedValueOnce([[{ id: "u-1" }], 1])
    const res  = await getUsers(makeReq("GET", "/api/users", undefined, adminToken))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.users).toHaveLength(1)
    expect(data.total).toBe(1)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 5 — try/catch en PUT/DELETE /api/users/[id]
// ═══════════════════════════════════════════════════════════

describe("PUT /api/users/[id] — try/catch 500", () => {
  it("DB falla en update → 500", async () => {
    // workspace check passes (owner)
    mockPrisma.user.update.mockRejectedValueOnce(new Error("constraint violation"))
    const res = await putUser(
      makeReq("PUT", "/api/users/u-2", { id: "u-2", nombre: "New Name" }, ownerToken),
      { params: Promise.resolve({ id: "u-2" }) }
    )
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeTruthy()
  })

  it("update exitoso → 200", async () => {
    mockPrisma.user.update.mockResolvedValueOnce({ id: "u-2", nombre: "New Name", email: "a@b.com", rol: "qa", grupoId: "g-1", activo: true })
    const res  = await putUser(
      makeReq("PUT", "/api/users/u-2", { id: "u-2", nombre: "New Name" }, ownerToken),
      { params: Promise.resolve({ id: "u-2" }) }
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.user.nombre).toBe("New Name")
  })
})

describe("DELETE /api/users/[id] — try/catch 500", () => {
  it("eliminar propia cuenta → 400", async () => {
    const res = await deleteUser(
      makeReq("DELETE", "/api/users/u-1", undefined, adminToken),
      { params: Promise.resolve({ id: "u-1" }) }
    )
    expect(res.status).toBe(400)
  })

  it("DB falla en delete → 500 (owner)", async () => {
    mockPrisma.user.delete.mockRejectedValueOnce(new Error("FK constraint"))
    const res = await deleteUser(
      makeReq("DELETE", "/api/users/u-9", undefined, ownerToken),
      { params: Promise.resolve({ id: "u-9" }) }
    )
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeTruthy()
  })

  it("delete exitoso → 200", async () => {
    mockPrisma.user.delete.mockResolvedValueOnce({})
    const res  = await deleteUser(
      makeReq("DELETE", "/api/users/u-9", undefined, ownerToken),
      { params: Promise.resolve({ id: "u-9" }) }
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 6 — Rate limiting POST /api/users
// ═══════════════════════════════════════════════════════════

const BLOCKED_RL = { allowed: false, remaining: 0, resetAt: Date.now() + 3_600_000 }

describe("POST /api/users — rate limiting", () => {
  it("sin token → 401", async () => {
    const res = await postUser(makeReq("POST", "/api/users", { nombre: "A", email: "a@t.com", rol: "qa" }))
    expect(res.status).toBe(401)
  })

  it("rate limit excedido → 429 con Retry-After y X-RateLimit-*", async () => {
    vi.mocked(mockRL).mockReturnValueOnce(BLOCKED_RL)
    const res = await postUser(makeReq("POST", "/api/users", { nombre: "A", email: "a@t.com", rol: "qa" }, adminToken))
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("20")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("payload válido + rate limit OK → 201", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: true, user: { id: "u-new" } } as never)
    const res  = await postUser(makeReq("POST", "/api/users", { nombre: "Ana", email: "ana@t.com", rol: "qa" }, adminToken))
    expect(res.status).toBe(201)
  })

  it("email duplicado → 409", async () => {
    vi.mocked(createUserService).mockResolvedValueOnce({ success: false, error: "Ya existe un usuario con este email" } as never)
    const res  = await postUser(makeReq("POST", "/api/users", { nombre: "Ana", email: "ana@t.com", rol: "qa" }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(409)
    expect(data.error).toMatch(/email/i)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 7 — Rate limiting POST /api/historias
// ═══════════════════════════════════════════════════════════

describe("POST /api/historias — rate limiting", () => {
  it("sin token → 401", async () => {
    const res = await postHistoria(makeReq("POST", "/api/historias", { titulo: "T" }))
    expect(res.status).toBe(401)
  })

  it("rate limit excedido → 429 con Retry-After y X-RateLimit-*", async () => {
    vi.mocked(mockRL).mockReturnValueOnce(BLOCKED_RL)
    const res = await postHistoria(makeReq("POST", "/api/historias", { titulo: "T" }, adminToken))
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("60")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("payload válido + rate limit OK → 201", async () => {
    const res = await postHistoria(makeReq("POST", "/api/historias", { titulo: "T" }, adminToken))
    expect(res.status).toBe(201)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 8 — try/catch en GET /api/export
// ═══════════════════════════════════════════════════════════

describe("GET /api/export — try/catch 500", () => {
  it("sin token → 401", async () => {
    const res = await exportData(makeReq("GET", "/api/export?tipo=historias"))
    expect(res.status).toBe(401)
  })

  it("tipo inválido → 400", async () => {
    const res = await exportData(makeReq("GET", "/api/export?tipo=invalido", undefined, adminToken))
    expect(res.status).toBe(400)
  })

  it("DB falla en findMany → 500", async () => {
    mockPrisma.historiaUsuario.findMany.mockRejectedValueOnce(new Error("DB error"))
    const res  = await exportData(makeReq("GET", "/api/export?tipo=historias", undefined, adminToken))
    const data = await res.json()
    expect(res.status).toBe(500)
    expect(data.error).toBeTruthy()
  })

  it("export historias OK → 200 con CSV", async () => {
    mockPrisma.historiaUsuario.findMany.mockResolvedValueOnce([
      { id: "hu-1", codigo: "HU-001", titulo: "Login", estado: "en_progreso", prioridad: "alta",
        sprint: "Sprint 1", responsable: "Ana", puntos: 3, etapa: "desarrollo", ambiente: "qa",
        tipoPrueba: "funcional", aplicacion: "web", requiriente: "Luis", areaSolicitante: "TI",
        fechaCreacion: new Date("2026-01-01"), fechaFinEstimada: null, fechaCierre: null },
    ])
    const res = await exportData(makeReq("GET", "/api/export?tipo=historias", undefined, adminToken))
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("text/csv")
  })

  it("export casos OK → 200 con CSV", async () => {
    mockPrisma.casoPrueba.findMany.mockResolvedValueOnce([
      { id: "c-1", huId: "hu-1", titulo: "TC-001", estadoAprobacion: "aprobado", tipoPrueba: "funcional",
        entorno: "qa", complejidad: "media", horasEstimadas: 2, aprobadoPor: "Ana",
        fechaAprobacion: null, creadoPor: "Luis", fechaCreacion: new Date("2026-01-01") },
    ])
    const res = await exportData(makeReq("GET", "/api/export?tipo=casos", undefined, adminToken))
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("text/csv")
  })
})
