// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.56 nuevas funcionalidades
//  · rlKey: claves compuestas ip:ruta (independencia por endpoint)
//  · maybeCleanup: solo limpia al superar el umbral
//  · POST /api/historias/sync — límite 500, 403 sin grupoId, 429, 200
//  · POST /api/casos/sync    — límite 1000, 429, 200, workspace isolation
//  · POST /api/tareas/sync   — límite 2000, 429, 200, workspace isolation
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, rlKey } from "@/lib/backend/middleware/rate-limit"

// ═══════════════════════════════════════════════════════════
//  BLOQUE 1 — rlKey: claves compuestas ip:ruta
// ═══════════════════════════════════════════════════════════

describe("rlKey — clave compuesta ip:ruta", () => {
  it("concatena IP y ruta con ':'", () => {
    expect(rlKey("1.2.3.4", "/api/export")).toBe("1.2.3.4:/api/export")
  })

  it("misma IP, rutas distintas → claves distintas", () => {
    expect(rlKey("1.2.3.4", "/api/export")).not.toBe(rlKey("1.2.3.4", "/api/casos/sync"))
  })

  it("misma ruta, IPs distintas → claves distintas", () => {
    expect(rlKey("1.1.1.1", "/api/export")).not.toBe(rlKey("2.2.2.2", "/api/export"))
  })

  it("misma IP + ruta diferente producen claves distintas (contadores independientes)", () => {
    const ip = "99.99.99.1"
    expect(rlKey(ip, "/api/export")).not.toBe(rlKey(ip, "/api/historias/sync"))
    expect(rlKey(ip, "/api/casos/sync")).not.toBe(rlKey(ip, "/api/tareas/sync"))
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 2 — POST /api/historias/sync
// ═══════════════════════════════════════════════════════════

const { mockPrismaSync } = vi.hoisted(() => {
  // tx === mockPrismaSync model objects — same references so beforeEach mocks affect tx too
  const historiaUsuario = {
    findMany:   vi.fn().mockResolvedValue([]),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update:     vi.fn().mockResolvedValue({}),
  }
  const casoPrueba = {
    findMany:   vi.fn().mockResolvedValue([]),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update:     vi.fn().mockResolvedValue({}),
  }
  const tarea = {
    findMany:   vi.fn().mockResolvedValue([]),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
    update:     vi.fn().mockResolvedValue({}),
  }
  const mockPrismaSync = {
    historiaUsuario,
    casoPrueba,
    tarea,
    user:  { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo: { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    $transaction: vi.fn((fn: unknown) => {
      // interactive transaction: pass the same object so mocks are shared
      if (typeof fn === "function") return fn({ historiaUsuario, casoPrueba, tarea })
      return Promise.all(fn as Promise<unknown>[])
    }),
  }
  return { mockPrismaSync }
})

vi.mock("@/lib/backend/prisma", () => ({ prisma: mockPrismaSync }))
vi.mock("@/lib/backend/metricas-cache", () => ({ invalidateMetricasCache: vi.fn() }))

vi.mock("@/lib/backend/middleware/rate-limit", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/backend/middleware/rate-limit")>()
  return {
    ...real,
    checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 29, resetAt: Date.now() + 60_000 })),
    getClientIp:    vi.fn(() => "127.0.0.1"),
  }
})

import { POST as syncHistorias } from "@/app/api/historias/sync/route"
import { POST as syncCasos }     from "@/app/api/casos/sync/route"
import { POST as syncTareas }    from "@/app/api/tareas/sync/route"
import { checkRateLimit as mockRL } from "@/lib/backend/middleware/rate-limit"

function makeReq(body: unknown, token?: string) {
  return new NextRequest("http://localhost/api/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

let adminToken: string
let noGrupoToken: string

beforeAll(async () => {
  adminToken   = await signToken({ sub: "u-1", email: "a@t.com", nombre: "Admin", rol: "admin",  grupoId: "g-1" })
  noGrupoToken = await signToken({ sub: "u-2", email: "o@t.com", nombre: "Owner", rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(mockRL).mockReturnValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60_000 })
  mockPrismaSync.user.findUnique.mockResolvedValue({ activo: true, grupo: { activo: true } })
  mockPrismaSync.grupo.findUnique.mockResolvedValue({ activo: true, grupo: { activo: true } })
  mockPrismaSync.historiaUsuario.findMany.mockResolvedValue([])
  mockPrismaSync.historiaUsuario.createMany.mockResolvedValue({ count: 0 })
  // Return valid case so tareas workspace check passes in happy-path tests
  mockPrismaSync.casoPrueba.findMany.mockResolvedValue([{ id: "c-1" }])
  mockPrismaSync.casoPrueba.createMany.mockResolvedValue({ count: 0 })
  mockPrismaSync.tarea.findMany.mockResolvedValue([])
  mockPrismaSync.tarea.createMany.mockResolvedValue({ count: 0 })
  // Restore $transaction default (interactive)
  mockPrismaSync.$transaction.mockImplementation((fn: unknown) => {
    if (typeof fn === "function") {
      return fn({
        historiaUsuario: mockPrismaSync.historiaUsuario,
        casoPrueba:      mockPrismaSync.casoPrueba,
        tarea:           mockPrismaSync.tarea,
      })
    }
    return Promise.all(fn as Promise<unknown>[])
  })
})

// ── /api/historias/sync ──────────────────────────────────────

describe("POST /api/historias/sync", () => {
  it("sin token → 401", async () => {
    const res = await syncHistorias(makeReq({ historias: [] }))
    expect(res.status).toBe(401)
  })

  it("owner sin grupoId → 403", async () => {
    const res = await syncHistorias(makeReq({ historias: [] }, noGrupoToken))
    expect(res.status).toBe(403)
  })

  it("429 cuando rate limit excedido", async () => {
    vi.mocked(mockRL).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })
    const res = await syncHistorias(makeReq({ historias: [] }, adminToken))
    expect(res.status).toBe(429)
  })

  it("501 historias → 400 (supera límite de 500)", async () => {
    const historias = Array.from({ length: 501 }, (_, i) => ({ id: `h-${i}`, titulo: "T" }))
    const res  = await syncHistorias(makeReq({ historias }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe("Payload inválido")
  })

  it("500 historias exactas → pasan la validación (no 400)", async () => {
    const historias = Array.from({ length: 500 }, (_, i) => ({ id: `h-${i}`, titulo: "T" }))
    const res = await syncHistorias(makeReq({ historias }, adminToken))
    expect(res.status).not.toBe(400)
  })

  it("payload vacío → 200 con count 0", async () => {
    const res  = await syncHistorias(makeReq({ historias: [] }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.count).toBe(0)
  })

  it("payload válido → 200 con count correcto", async () => {
    const historias = [{ id: "hu-1", titulo: "Login" }, { id: "hu-2", titulo: "Logout" }]
    const res  = await syncHistorias(makeReq({ historias }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.count).toBe(2)
  })
})

// ── /api/casos/sync ──────────────────────────────────────────

describe("POST /api/casos/sync", () => {
  it("sin token → 401", async () => {
    const res = await syncCasos(makeReq({ casos: [] }))
    expect(res.status).toBe(401)
  })

  it("429 cuando rate limit excedido", async () => {
    vi.mocked(mockRL).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })
    const res = await syncCasos(makeReq({ casos: [] }, adminToken))
    expect(res.status).toBe(429)
  })

  it("1001 casos → 400 (supera límite de 1000)", async () => {
    const casos = Array.from({ length: 1001 }, (_, i) => ({ id: `c-${i}`, titulo: "T", huId: "hu-1" }))
    const res  = await syncCasos(makeReq({ casos }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe("Payload inválido")
  })

  it("1000 casos exactos → pasan la validación (no 400)", async () => {
    const casos = Array.from({ length: 1000 }, (_, i) => ({ id: `c-${i}`, titulo: "T", huId: "hu-1" }))
    const res = await syncCasos(makeReq({ casos }, adminToken))
    expect(res.status).not.toBe(400)
  })

  it("payload vacío → 200 con count 0", async () => {
    const res  = await syncCasos(makeReq({ casos: [] }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.count).toBe(0)
  })

  it("workspace isolation: HU de otro grupo → 403 (ForbiddenError)", async () => {
    // No hay HUs válidas para el grupoId del usuario
    mockPrismaSync.casoPrueba.findMany.mockResolvedValue([])
    mockPrismaSync.historiaUsuario.findMany.mockResolvedValue([])
    const casos = [{ id: "c-x", titulo: "Hack", huId: "hu-otro-grupo" }]
    const res = await syncCasos(makeReq({ casos }, adminToken))
    expect(res.status).toBe(403)
  })
})

// ── /api/tareas/sync ──────────────────────────────────────────

describe("POST /api/tareas/sync", () => {
  it("sin token → 401", async () => {
    const res = await syncTareas(makeReq({ tareas: [] }))
    expect(res.status).toBe(401)
  })

  it("429 cuando rate limit excedido", async () => {
    vi.mocked(mockRL).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })
    const res = await syncTareas(makeReq({ tareas: [] }, adminToken))
    expect(res.status).toBe(429)
  })

  it("2001 tareas → 400 (supera límite de 2000)", async () => {
    const tareas = Array.from({ length: 2001 }, (_, i) => ({ id: `t-${i}`, titulo: "T", casoPruebaId: "c-1" }))
    const res  = await syncTareas(makeReq({ tareas }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toBe("Payload inválido")
  })

  it("2000 tareas exactas → pasan la validación (no 400)", async () => {
    const tareas = Array.from({ length: 2000 }, (_, i) => ({ id: `t-${i}`, titulo: "T", casoPruebaId: "c-1" }))
    const res = await syncTareas(makeReq({ tareas }, adminToken))
    expect(res.status).not.toBe(400)
  })

  it("payload vacío → 200 con count 0", async () => {
    const res  = await syncTareas(makeReq({ tareas: [] }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.count).toBe(0)
  })

  it("payload válido → 200 con count correcto", async () => {
    const tareas = [{ id: "t-1", titulo: "Revisar login", casoPruebaId: "c-1" }]
    const res  = await syncTareas(makeReq({ tareas }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.count).toBe(1)
  })

  it("workspace isolation: caso de otro grupo → 403 (ForbiddenError)", async () => {
    // No hay casos válidos para el grupoId del usuario
    mockPrismaSync.tarea.findMany.mockResolvedValue([])
    mockPrismaSync.casoPrueba.findMany.mockResolvedValue([])
    const tareas = [{ id: "t-x", titulo: "Hack", casoPruebaId: "c-otro" }]
    const res = await syncTareas(makeReq({ tareas }, adminToken))
    expect(res.status).toBe(403)
  })
})
