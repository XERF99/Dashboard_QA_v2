// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.57 nuevas funcionalidades
//  · Retry-After + X-RateLimit-* headers en todas las respuestas 429
//  · Rate limit en PUT /api/auth/password (clave por usuario)
//  · Corrección bug fechas parciales en PUT /api/sprints/[id]
//  · Límites .max() en validadores de auth (email, password, nombre)
//  · try/catch 500 en GET/PUT /api/config
//  · Fusión double-query en GET/DELETE /api/historias/[id]
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Shared prisma mock ────────────────────────────────────
const { mockPrisma } = vi.hoisted(() => {
  const historiaUsuario = {
    findUnique: vi.fn(),
    findMany:   vi.fn().mockResolvedValue([]),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update:     vi.fn().mockResolvedValue({}),
  }
  const casoPrueba = {
    findMany:   vi.fn().mockResolvedValue([]),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update:     vi.fn().mockResolvedValue({}),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
  }
  const tarea = {
    findMany:   vi.fn().mockResolvedValue([]),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update:     vi.fn().mockResolvedValue({}),
  }
  const notificacion = {
    findUnique: vi.fn(),
    delete:     vi.fn().mockResolvedValue({}),
  }
  const sprint = {
    findUnique: vi.fn().mockResolvedValue({ grupoId: "g-1" }),
  }
  const user = { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) }
  const grupo = { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) }
  const mockPrisma = {
    historiaUsuario,
    casoPrueba,
    tarea,
    notificacion,
    sprint,
    user,
    grupo,
    $transaction: vi.fn((fn: unknown) => {
      if (typeof fn === "function") return fn({ historiaUsuario, casoPrueba, tarea })
      return Promise.all(fn as Promise<unknown>[])
    }),
  }
  return { mockPrisma }
})

vi.mock("@/lib/backend/prisma", () => ({ prisma: mockPrisma }))
vi.mock("@/lib/backend/metricas-cache", () => ({ invalidateMetricasCache: vi.fn() }))

// Rate-limit mock: real rlKey + getClientIp, controllable checkRateLimit
vi.mock("@/lib/backend/middleware/rate-limit", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/backend/middleware/rate-limit")>()
  return {
    ...real,
    checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 29, resetAt: Date.now() + 60_000 })),
    getClientIp:    vi.fn(() => "10.0.0.1"),
  }
})

// Service mocks
vi.mock("@/lib/backend/services/config.service", () => ({
  getConfig:    vi.fn().mockResolvedValue({}),
  updateConfig: vi.fn().mockResolvedValue({}),
}))
vi.mock("@/lib/backend/validators/config.validator", () => ({
  updateConfigSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
}))
vi.mock("@/lib/backend/services/auth.service", () => ({
  loginService:          vi.fn(),
  cambiarPasswordService: vi.fn(),
}))
vi.mock("@/lib/backend/services/sprint.service", () => ({
  getAllSprints:    vi.fn(),
  getSprintActivo: vi.fn(),
  getSprintById:   vi.fn(),
  createSprint:    vi.fn(),
  updateSprint:    vi.fn().mockResolvedValue({}),
  deleteSprint:    vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/backend/services/notificacion.service", () => ({
  getNotificacionesByDestinatario: vi.fn().mockResolvedValue({ notificaciones: [], total: 0, page: 1, limit: 50, pages: 0 }),
  crearNotificacion:               vi.fn(),
  marcarLeida:                     vi.fn().mockResolvedValue({}),
  rolToDestinatario:               vi.fn((rol: string) => rol),
}))
vi.mock("@/lib/backend/services/historia.service", () => ({
  getAllHistorias:  vi.fn(),
  getHistoriaById: vi.fn(),
  createHistoria:  vi.fn(),
  updateHistoria:  vi.fn().mockResolvedValue({}),
  deleteHistoria:  vi.fn().mockResolvedValue({}),
}))
vi.mock("@/lib/backend/validators/historia.validator", () => ({
  createHistoriaSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
  updateHistoriaSchema: { safeParse: vi.fn().mockReturnValue({ success: true, data: {} }) },
}))

import { checkRateLimit as mockRL } from "@/lib/backend/middleware/rate-limit"
import { cambiarPasswordService }   from "@/lib/backend/services/auth.service"
import { getConfig, updateConfig }  from "@/lib/backend/services/config.service"
import { getSprintById, updateSprint, deleteSprint } from "@/lib/backend/services/sprint.service"
import { marcarLeida, rolToDestinatario } from "@/lib/backend/services/notificacion.service"

import { PUT as putPassword }                        from "@/app/api/auth/password/route"
import { GET as getConfig_, PUT as putConfig_ }      from "@/app/api/config/route"
import { PATCH as patchNotif, DELETE as deleteNotif } from "@/app/api/notificaciones/[id]/route"
import { PUT as putSprint, DELETE as deleteSprint_ }  from "@/app/api/sprints/[id]/route"
import { GET as getHistoria, DELETE as deleteHistoria_ } from "@/app/api/historias/[id]/route"
import { POST as syncCasos }   from "@/app/api/casos/sync/route"
import { POST as syncHistorias } from "@/app/api/historias/sync/route"
import { POST as syncTareas }   from "@/app/api/tareas/sync/route"
import { PATCH as batchCasos }  from "@/app/api/casos/batch/route"
import { GET as exportData }    from "@/app/api/export/route"

// ── Helpers ───────────────────────────────────────────────
function makeReq(method: string, path: string, body?: unknown, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
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
  adminToken = await signToken({ sub: "u-1", email: "admin@t.com", nombre: "Admin", rol: "admin",  grupoId: "g-1" })
  ownerToken = await signToken({ sub: "u-0", email: "owner@t.com", nombre: "Owner", rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mockRL).mockReturnValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60_000 })
  mockPrisma.user.findUnique.mockResolvedValue({ activo: true, grupo: { activo: true } })
  mockPrisma.grupo.findUnique.mockResolvedValue({ activo: true, grupo: { activo: true } })
  mockPrisma.sprint.findUnique.mockResolvedValue({ grupoId: "g-1" })
  mockPrisma.notificacion.findUnique.mockResolvedValue(null)
  mockPrisma.historiaUsuario.findUnique.mockResolvedValue(null)
  vi.mocked(getConfig).mockResolvedValue({} as never)
  vi.mocked(updateConfig).mockResolvedValue({} as never)
  vi.mocked(cambiarPasswordService).mockResolvedValue({ success: true } as never)
  vi.mocked(updateSprint).mockResolvedValue({} as never)
  vi.mocked(deleteSprint).mockResolvedValue(undefined as never)
  vi.mocked(marcarLeida).mockResolvedValue({} as never)
  vi.mocked(rolToDestinatario).mockImplementation(((rol: string) => rol) as typeof rolToDestinatario)
  // Reset $transaction
  mockPrisma.$transaction.mockImplementation((fn: unknown) => {
    if (typeof fn === "function") {
      return fn({
        historiaUsuario: mockPrisma.historiaUsuario,
        casoPrueba:      mockPrisma.casoPrueba,
        tarea:           mockPrisma.tarea,
      })
    }
    return Promise.all(fn as Promise<unknown>[])
  })
  mockPrisma.casoPrueba.findMany.mockResolvedValue([{ id: "c-1" }])
  mockPrisma.casoPrueba.createMany.mockResolvedValue({ count: 0 })
  mockPrisma.tarea.findMany.mockResolvedValue([])
  mockPrisma.tarea.createMany.mockResolvedValue({ count: 0 })
  mockPrisma.historiaUsuario.findMany.mockResolvedValue([])
  mockPrisma.historiaUsuario.createMany.mockResolvedValue({ count: 0 })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 1 — Retry-After headers en todas las respuestas 429
// ═══════════════════════════════════════════════════════════

const BLOCKED_RL = { allowed: false, remaining: 0, resetAt: Date.now() + 45_000 }

describe("Retry-After headers en respuestas 429", () => {
  it("POST /api/historias/sync — 429 incluye Retry-After y X-RateLimit-*", async () => {
    vi.mocked(mockRL).mockReturnValueOnce(BLOCKED_RL)
    const res = await syncHistorias(makeReq("POST", "/api/historias/sync", { historias: [] }, adminToken))
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("POST /api/casos/sync — 429 incluye Retry-After y X-RateLimit-*", async () => {
    vi.mocked(mockRL).mockReturnValueOnce(BLOCKED_RL)
    const res = await syncCasos(makeReq("POST", "/api/casos/sync", { casos: [] }, adminToken))
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("POST /api/tareas/sync — 429 incluye Retry-After y X-RateLimit-*", async () => {
    vi.mocked(mockRL).mockReturnValueOnce(BLOCKED_RL)
    const res = await syncTareas(makeReq("POST", "/api/tareas/sync", { tareas: [] }, adminToken))
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("GET /api/export — 429 incluye Retry-After y X-RateLimit-*", async () => {
    vi.mocked(mockRL).mockReturnValueOnce(BLOCKED_RL)
    const res = await exportData(makeReq("GET", "/api/export?tipo=historias", undefined, adminToken))
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("20")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("PATCH /api/casos/batch — 429 incluye Retry-After y X-RateLimit-*", async () => {
    vi.mocked(mockRL).mockReturnValueOnce(BLOCKED_RL)
    const res = await batchCasos(makeReq("PATCH", "/api/casos/batch", { ids: ["c-1"], accion: "aprobar" }, adminToken))
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("20")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("Retry-After refleja el tiempo real hasta el reset", async () => {
    const resetAt = Date.now() + 37_000  // 37 segundos
    vi.mocked(mockRL).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt })
    const res = await syncHistorias(makeReq("POST", "/api/historias/sync", { historias: [] }, adminToken))
    expect(res.status).toBe(429)
    const retryAfter = Number(res.headers.get("Retry-After"))
    // Should be between 36 and 38 (ceil of ~37s)
    expect(retryAfter).toBeGreaterThanOrEqual(36)
    expect(retryAfter).toBeLessThanOrEqual(38)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 2 — Rate limit en PUT /api/auth/password
// ═══════════════════════════════════════════════════════════

describe("PUT /api/auth/password — rate limit", () => {
  it("sin token → 401", async () => {
    const res = await putPassword(makeReq("PUT", "/api/auth/password", { actual: "old1234!", nueva: "new1234!" }))
    expect(res.status).toBe(401)
  })

  it("body inválido (nueva < 8 chars) → 400", async () => {
    const res = await putPassword(makeReq("PUT", "/api/auth/password", { actual: "old1234!", nueva: "short" }, adminToken))
    expect(res.status).toBe(400)
  })

  it("rate limit excedido → 429 con Retry-After y X-RateLimit-*", async () => {
    vi.mocked(mockRL).mockReturnValueOnce(BLOCKED_RL)
    const res = await putPassword(makeReq("PUT", "/api/auth/password", { actual: "old1234!", nueva: "newPass123!" }, adminToken))
    expect(res.status).toBe(429)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("cambio exitoso → 200", async () => {
    vi.mocked(cambiarPasswordService).mockResolvedValueOnce({ success: true })
    const res = await putPassword(makeReq("PUT", "/api/auth/password", { actual: "old1234!", nueva: "newPass123!" }, adminToken))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it("servicio rechaza (password incorrecta) → 400", async () => {
    vi.mocked(cambiarPasswordService).mockResolvedValueOnce({ success: false, error: "Contraseña incorrecta" })
    const res = await putPassword(makeReq("PUT", "/api/auth/password", { actual: "wrong!", nueva: "newPass123!" }, adminToken))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 3 — Corrección bug fechas parciales en PUT /api/sprints/[id]
// ═══════════════════════════════════════════════════════════

const sprintExistente = {
  id:          "sp-1",
  nombre:      "Sprint 3",
  grupoId:     "g-1",
  fechaInicio: new Date("2026-03-01"),
  fechaFin:    new Date("2026-03-14"),
  objetivo:    "Objetivo original",
}

describe("PUT /api/sprints/[id] — validación de fechas parciales (bug fix)", () => {
  it("solo fechaInicio válida (< fechaFin existente) → 200", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(sprintExistente as never)
    vi.mocked(updateSprint).mockResolvedValueOnce({ ...sprintExistente, fechaInicio: new Date("2026-02-28") } as never)

    const res = await putSprint(
      makeReq("PUT", "/api/sprints/sp-1", { fechaInicio: "2026-02-28" }, adminToken),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    expect(res.status).toBe(200)
  })

  it("solo fechaInicio inválida (>= fechaFin existente) → 400", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(sprintExistente as never)

    const res = await putSprint(
      makeReq("PUT", "/api/sprints/sp-1", { fechaInicio: "2026-03-20" }, adminToken),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/fechaInicio/i)
  })

  it("solo fechaFin válida (> fechaInicio existente) → 200", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(sprintExistente as never)
    vi.mocked(updateSprint).mockResolvedValueOnce({ ...sprintExistente, fechaFin: new Date("2026-03-21") } as never)

    const res = await putSprint(
      makeReq("PUT", "/api/sprints/sp-1", { fechaFin: "2026-03-21" }, adminToken),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    expect(res.status).toBe(200)
  })

  it("solo fechaFin inválida (<= fechaInicio existente) → 400", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(sprintExistente as never)

    const res = await putSprint(
      makeReq("PUT", "/api/sprints/sp-1", { fechaFin: "2026-02-28" }, adminToken),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/fechaInicio/i)
  })

  it("sprint no encontrado → 404", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(null)

    const res = await putSprint(
      makeReq("PUT", "/api/sprints/sp-x", { nombre: "Nuevo nombre" }, adminToken),
      { params: Promise.resolve({ id: "sp-x" }) }
    )
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 4 — Límites .max() en validadores de auth
// ═══════════════════════════════════════════════════════════

import { loginSchema, cambiarPasswordSchema, createUserSchema, updateUserSchema } from "@/lib/backend/validators/auth.validator"

describe("Auth validators — límites .max()", () => {
  it("loginSchema: email > 254 chars → error", () => {
    // local(4) + @(1) + domain(247) + .com(4) = 256 — valid format but over .max(254)
    const email = "user@" + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(55) + ".com"
    expect(email.length).toBe(256)
    const { error } = loginSchema.safeParse({ email, password: "pass1234" })
    expect(error).toBeDefined()
  })

  it("loginSchema: password > 128 chars → error", () => {
    const { error } = loginSchema.safeParse({ email: "a@t.com", password: "x".repeat(129) })
    expect(error).toBeDefined()
    expect(error!.message).toMatch(/128/)
  })

  it("loginSchema: email OK (254) + password OK (128) → válido", () => {
    // local(4) + @(1) + domain(245) + .com(4) = 254 — exactly at limit
    const email = "user@" + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(53) + ".com"
    expect(email.length).toBe(254)
    const { error } = loginSchema.safeParse({ email, password: "x".repeat(128) })
    expect(error).toBeUndefined()
  })

  it("cambiarPasswordSchema: actual > 128 → error", () => {
    const { error } = cambiarPasswordSchema.safeParse({ actual: "x".repeat(129), nueva: "newPass1!" })
    expect(error).toBeDefined()
  })

  it("cambiarPasswordSchema: nueva > 128 → error", () => {
    const { error } = cambiarPasswordSchema.safeParse({ actual: "old1!", nueva: "x".repeat(129) })
    expect(error).toBeDefined()
  })

  it("createUserSchema: nombre > 200 chars → error", () => {
    const { error } = createUserSchema.safeParse({
      nombre: "A".repeat(201), email: "a@t.com", rol: "qa",
    })
    expect(error).toBeDefined()
  })

  it("createUserSchema: email > 254 chars → error", () => {
    const email = "user@" + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(55) + ".com"
    const { error } = createUserSchema.safeParse({ nombre: "Ana", email, rol: "qa" })
    expect(error).toBeDefined()
  })

  it("updateUserSchema: nombre > 200 chars → error", () => {
    const { error } = updateUserSchema.safeParse({
      id: "u-1", nombre: "A".repeat(201),
    })
    expect(error).toBeDefined()
  })

  it("updateUserSchema: email > 254 chars → error", () => {
    const email = "user@" + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(55) + ".com"
    const { error } = updateUserSchema.safeParse({ id: "u-1", email })
    expect(error).toBeDefined()
  })

  it("updateUserSchema: valores válidos exactos en límite → sin error", () => {
    const email = "user@" + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(63) + "." + "a".repeat(53) + ".com"
    expect(email.length).toBe(254)
    const { error } = updateUserSchema.safeParse({ id: "u-1", nombre: "A".repeat(200), email })
    expect(error).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 5 — try/catch 500 en GET/PUT /api/config
// ═══════════════════════════════════════════════════════════

describe("GET /api/config — try/catch 500", () => {
  it("sin token → 401", async () => {
    const res = await getConfig_(makeReq("GET", "/api/config"))
    expect(res.status).toBe(401)
  })

  it("servicio lanza error → 500", async () => {
    vi.mocked(getConfig).mockRejectedValueOnce(new Error("DB failure"))
    const res = await getConfig_(makeReq("GET", "/api/config", undefined, adminToken))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeTruthy()
  })

  it("servicio OK → 200 con config", async () => {
    vi.mocked(getConfig).mockResolvedValueOnce({ claveCualquiera: "valor" } as never)
    const res  = await getConfig_(makeReq("GET", "/api/config", undefined, adminToken))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.config).toBeDefined()
  })
})

describe("PUT /api/config — try/catch 500", () => {
  it("servicio lanza error → 500", async () => {
    vi.mocked(updateConfig).mockRejectedValueOnce(new Error("DB failure"))
    // Need owner/admin role for requireAdmin → use ownerToken
    const res = await putConfig_(makeReq("PUT", "/api/config", { someKey: "val" }, ownerToken))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeTruthy()
  })

  it("servicio OK → 200 con config actualizada", async () => {
    vi.mocked(updateConfig).mockResolvedValueOnce({ someKey: "val" } as never)
    const res  = await putConfig_(makeReq("PUT", "/api/config", { someKey: "val" }, ownerToken))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.config).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 6 — Fusión double-query en GET/DELETE /api/historias/[id]
// ═══════════════════════════════════════════════════════════

const historiaBase = {
  id:      "hu-1",
  grupoId: "g-1",
  titulo:  "Login feature",
  casos:   [],
}

describe("GET /api/historias/[id] — single-query fusion", () => {
  it("historia no encontrada → 404", async () => {
    mockPrisma.historiaUsuario.findUnique.mockResolvedValueOnce(null)

    const res = await getHistoria(
      makeReq("GET", "/api/historias/hu-x", undefined, adminToken),
      { params: Promise.resolve({ id: "hu-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("historia de otro grupo → 404 (workspace isolation)", async () => {
    mockPrisma.historiaUsuario.findUnique.mockResolvedValueOnce({
      ...historiaBase, grupoId: "g-otro",
    })

    const res = await getHistoria(
      makeReq("GET", "/api/historias/hu-1", undefined, adminToken),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    expect(res.status).toBe(404)
  })

  it("owner ve historias de cualquier grupo → 200", async () => {
    mockPrisma.historiaUsuario.findUnique.mockResolvedValueOnce({
      ...historiaBase, grupoId: "g-otro",
    })

    const res  = await getHistoria(
      makeReq("GET", "/api/historias/hu-1", undefined, ownerToken),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.historia.id).toBe("hu-1")
  })

  it("historia del mismo grupo → 200", async () => {
    mockPrisma.historiaUsuario.findUnique.mockResolvedValueOnce(historiaBase)

    const res  = await getHistoria(
      makeReq("GET", "/api/historias/hu-1", undefined, adminToken),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.historia.id).toBe("hu-1")
  })

  it("prisma falla → 500", async () => {
    mockPrisma.historiaUsuario.findUnique.mockRejectedValueOnce(new Error("DB error"))

    const res = await getHistoria(
      makeReq("GET", "/api/historias/hu-1", undefined, adminToken),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    expect(res.status).toBe(500)
  })

  it("findUnique se llama exactamente UNA vez (single query)", async () => {
    mockPrisma.historiaUsuario.findUnique.mockResolvedValueOnce(historiaBase)

    await getHistoria(
      makeReq("GET", "/api/historias/hu-1", undefined, adminToken),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    expect(mockPrisma.historiaUsuario.findUnique).toHaveBeenCalledTimes(1)
  })
})

describe("DELETE /api/historias/[id] — workspace isolation", () => {
  it("historia no encontrada → 404", async () => {
    mockPrisma.historiaUsuario.findUnique.mockResolvedValueOnce(null)

    const res = await deleteHistoria_(
      makeReq("DELETE", "/api/historias/hu-x", undefined, adminToken),
      { params: Promise.resolve({ id: "hu-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("historia de otro grupo → 404", async () => {
    mockPrisma.historiaUsuario.findUnique.mockResolvedValueOnce({ grupoId: "g-otro" })

    const res = await deleteHistoria_(
      makeReq("DELETE", "/api/historias/hu-1", undefined, adminToken),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    expect(res.status).toBe(404)
  })

  it("historia del mismo grupo → 200", async () => {
    mockPrisma.historiaUsuario.findUnique.mockResolvedValueOnce({ grupoId: "g-1" })

    const res  = await deleteHistoria_(
      makeReq("DELETE", "/api/historias/hu-1", undefined, adminToken),
      { params: Promise.resolve({ id: "hu-1" }) }
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 7 — resolveNotif helper en /api/notificaciones/[id]
// ═══════════════════════════════════════════════════════════

describe("PATCH /api/notificaciones/[id] — resolveNotif + try/catch", () => {
  it("notificación no encontrada → 404", async () => {
    mockPrisma.notificacion.findUnique.mockResolvedValueOnce(null)

    const res = await patchNotif(
      makeReq("PATCH", "/api/notificaciones/n-x", undefined, adminToken),
      { params: Promise.resolve({ id: "n-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("notificación de otro destinatario → 404", async () => {
    vi.mocked(rolToDestinatario).mockReturnValueOnce("qa")
    mockPrisma.notificacion.findUnique.mockResolvedValueOnce({
      grupoId: "g-1", destinatario: "owner",
    })

    const res = await patchNotif(
      makeReq("PATCH", "/api/notificaciones/n-1", undefined, adminToken),
      { params: Promise.resolve({ id: "n-1" }) }
    )
    expect(res.status).toBe(404)
  })

  it("marcar como leída OK → 200", async () => {
    vi.mocked(rolToDestinatario).mockReturnValueOnce("admin")
    mockPrisma.notificacion.findUnique.mockResolvedValueOnce({
      grupoId: "g-1", destinatario: "admin",
    })
    vi.mocked(marcarLeida).mockResolvedValueOnce({ id: "n-1" } as never)

    const res  = await patchNotif(
      makeReq("PATCH", "/api/notificaciones/n-1", undefined, adminToken),
      { params: Promise.resolve({ id: "n-1" }) }
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.notificacion).toBeDefined()
  })
})

describe("DELETE /api/notificaciones/[id] — resolveNotif + try/catch", () => {
  it("notificación no encontrada → 404", async () => {
    mockPrisma.notificacion.findUnique.mockResolvedValueOnce(null)

    const res = await deleteNotif(
      makeReq("DELETE", "/api/notificaciones/n-x", undefined, adminToken),
      { params: Promise.resolve({ id: "n-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("eliminar notificación propia → 200", async () => {
    vi.mocked(rolToDestinatario).mockReturnValueOnce("admin")
    mockPrisma.notificacion.findUnique.mockResolvedValueOnce({
      grupoId: "g-1", destinatario: "admin",
    })
    mockPrisma.notificacion.delete.mockResolvedValueOnce({} as never)

    const res  = await deleteNotif(
      makeReq("DELETE", "/api/notificaciones/n-1", undefined, adminToken),
      { params: Promise.resolve({ id: "n-1" }) }
    )
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
