// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.65  Refactoring: withAuth middleware helper,
//  workspace access helpers, type system improvements
//  (branded types, API_ROUTES, Bloqueo discriminated union),
//  rate limiting consistency
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ══════════════════════════════════════════════════════════
//  1. Rate limiting
// ══════════════════════════════════════════════════════════
import { checkRateLimit, rlKey } from "@/lib/backend/middleware/rate-limit"

describe("Rate limiting", () => {
  it("allows requests under the limit", () => {
    const key = rlKey("test-ip", "test-route-" + Math.random())
    const result = checkRateLimit(key, 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("blocks requests over the limit", () => {
    const key = rlKey("test-ip", "test-route-" + Math.random())
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 60_000)
    }
    const result = checkRateLimit(key, 5, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("resets after window expires", async () => {
    const key = rlKey("test-ip", "test-route-" + Math.random())
    // Fill up the limit with a short window
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, 5, 50)
    }
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 60))
    const result = checkRateLimit(key, 5, 50)
    expect(result.allowed).toBe(true)
  })

  it("isolates different keys", () => {
    const key1 = rlKey("ip1", "route-" + Math.random())
    const key2 = rlKey("ip2", "route-" + Math.random())
    // Exhaust key1
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key1, 5, 60_000)
    }
    // key2 should still be allowed
    const result = checkRateLimit(key2, 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("returns correct remaining count on successive calls", () => {
    const key = rlKey("test-ip", "remaining-" + Math.random())
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 5, 60_000)
      expect(result.remaining).toBe(4 - i)
      expect(result.allowed).toBe(true)
    }
    // 6th call should be blocked
    const blocked = checkRateLimit(key, 5, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it("rlKey combines ip and route", () => {
    expect(rlKey("127.0.0.1", "/api/historias")).toBe("127.0.0.1:/api/historias")
    expect(rlKey("10.0.0.1", "/api/export")).toBe("10.0.0.1:/api/export")
  })
})

// ══════════════════════════════════════════════════════════
//  2. API_ROUTES constants
// ══════════════════════════════════════════════════════════
import { API_ROUTES } from "@/lib/types/index"

describe("API_ROUTES constants", () => {
  it("has all expected routes", () => {
    expect(API_ROUTES.HISTORIAS).toBe("/api/historias")
    expect(API_ROUTES.CASOS).toBe("/api/casos")
    expect(API_ROUTES.TAREAS).toBe("/api/tareas")
    expect(API_ROUTES.CONFIG).toBe("/api/config")
    expect(API_ROUTES.METRICAS).toBe("/api/metricas")
    expect(API_ROUTES.HEALTH).toBe("/api/health")
    expect(API_ROUTES.EXPORT).toBe("/api/export")
    expect(API_ROUTES.EXPORT_PDF).toBe("/api/export/pdf")
    expect(API_ROUTES.AUTH_LOGIN).toBe("/api/auth/login")
    expect(API_ROUTES.AUTH_LOGOUT).toBe("/api/auth/logout")
    expect(API_ROUTES.AUTH_ME).toBe("/api/auth/me")
    expect(API_ROUTES.AUTH_PASSWORD).toBe("/api/auth/password")
    expect(API_ROUTES.USERS).toBe("/api/users")
    expect(API_ROUTES.GRUPOS).toBe("/api/grupos")
    expect(API_ROUTES.SPRINTS).toBe("/api/sprints")
    expect(API_ROUTES.NOTIFICACIONES).toBe("/api/notificaciones")
    expect(API_ROUTES.AUDIT).toBe("/api/audit")
  })

  it("routes are readonly and complete", () => {
    expect(typeof API_ROUTES).toBe("object")
    expect(Object.keys(API_ROUTES).length).toBe(17)
  })

  it("all route values start with /api/", () => {
    for (const [, value] of Object.entries(API_ROUTES)) {
      expect(value).toMatch(/^\/api\//)
    }
  })
})

// ══════════════════════════════════════════════════════════
//  3. Bloqueo discriminated union
// ══════════════════════════════════════════════════════════
import type { Bloqueo, BloqueoActivo, BloqueoResuelto } from "@/lib/types/index"

describe("Bloqueo discriminated union", () => {
  it("BloqueoActivo has resuelto: false", () => {
    const bloqueo: BloqueoActivo = {
      id: "b1",
      descripcion: "test",
      reportadoPor: "user1",
      fecha: new Date(),
      resuelto: false,
    }
    expect(bloqueo.resuelto).toBe(false)
    expect(bloqueo.descripcion).toBe("test")
  })

  it("BloqueoResuelto has resuelto: true with required fields", () => {
    const bloqueo: BloqueoResuelto = {
      id: "b2",
      descripcion: "test",
      reportadoPor: "user1",
      fecha: new Date(),
      resuelto: true,
      fechaResolucion: new Date(),
      resueltoPor: "admin",
      notaResolucion: "Fixed",
    }
    expect(bloqueo.resuelto).toBe(true)
    expect(bloqueo.fechaResolucion).toBeDefined()
    expect(bloqueo.resueltoPor).toBe("admin")
    expect(bloqueo.notaResolucion).toBe("Fixed")
  })

  it("BloqueoResuelto allows optional notaResolucion", () => {
    const bloqueo: BloqueoResuelto = {
      id: "b3",
      descripcion: "issue",
      reportadoPor: "user2",
      fecha: new Date(),
      resuelto: true,
      fechaResolucion: new Date(),
      resueltoPor: "admin",
    }
    expect(bloqueo.resuelto).toBe(true)
    expect(bloqueo.notaResolucion).toBeUndefined()
  })

  it("discriminated union narrows correctly", () => {
    const bloqueo: Bloqueo = {
      id: "b4",
      descripcion: "test",
      reportadoPor: "user1",
      fecha: new Date(),
      resuelto: true,
      fechaResolucion: new Date(),
      resueltoPor: "admin",
    }

    if (bloqueo.resuelto) {
      // TypeScript narrows to BloqueoResuelto
      expect(bloqueo.fechaResolucion).toBeDefined()
      expect(bloqueo.resueltoPor).toBeDefined()
    }

    const activo: Bloqueo = {
      id: "b5",
      descripcion: "still open",
      reportadoPor: "user1",
      fecha: new Date(),
      resuelto: false,
    }

    if (!activo.resuelto) {
      // TypeScript narrows to BloqueoActivo
      expect(activo.id).toBe("b5")
      expect((activo as any).fechaResolucion).toBeUndefined()
    }
  })
})

// ══════════════════════════════════════════════════════════
//  4. Branded types
// ══════════════════════════════════════════════════════════
import type { HUId, CasoId, TareaId, EntityId } from "@/lib/types/index"

describe("Branded types", () => {
  it("branded types are string-compatible at runtime", () => {
    const huId = "hu-123" as HUId
    const casoId = "caso-456" as CasoId
    const tareaId = "tarea-789" as TareaId

    // At runtime, branded types are just strings
    expect(typeof huId).toBe("string")
    expect(typeof casoId).toBe("string")
    expect(typeof tareaId).toBe("string")
    expect(huId).toBe("hu-123")
    expect(casoId).toBe("caso-456")
    expect(tareaId).toBe("tarea-789")
  })

  it("branded types can be used in string operations", () => {
    const huId = "hu-abc-123" as HUId
    expect(huId.startsWith("hu-")).toBe(true)
    expect(huId.length).toBe(10)
    expect(`ID: ${huId}`).toBe("ID: hu-abc-123")
  })

  it("EntityId generic accepts custom brands", () => {
    const customId = "custom-1" as EntityId<"Custom">
    expect(typeof customId).toBe("string")
    expect(customId).toBe("custom-1")
  })
})

// ══════════════════════════════════════════════════════════
//  5. withAuth middleware — source structure
// ══════════════════════════════════════════════════════════
describe("withAuth middleware structure", () => {
  const src = read("lib/backend/middleware/with-auth.ts")

  it("exports withAuth and withAuthAdmin functions", () => {
    expect(src).toContain("export function withAuth(")
    expect(src).toContain("export function withAuthAdmin(")
  })

  it("withAuth calls requireAuth and checks instanceof NextResponse", () => {
    expect(src).toContain("requireAuth(request)")
    expect(src).toContain("payload instanceof NextResponse")
  })

  it("withAuthAdmin calls requireAdmin", () => {
    expect(src).toContain("requireAdmin(request)")
  })

  it("wraps handler errors in try/catch returning 500", () => {
    expect(src).toContain("catch (e)")
    expect(src).toContain("status: 500")
    expect(src).toContain("Unhandled error")
  })

  it("logs unhandled errors via logger.error", () => {
    expect(src).toContain("logger.error(request.nextUrl.pathname")
  })

  it("returns error message from caught Error instances", () => {
    expect(src).toContain('e instanceof Error ? e.message : "Error interno"')
  })
})

// ══════════════════════════════════════════════════════════
//  6. Workspace access helpers — source structure
// ══════════════════════════════════════════════════════════
describe("Workspace access helpers structure", () => {
  const src = read("lib/backend/middleware/with-auth.ts")

  it("exports checkHUAccess", () => {
    expect(src).toContain("export async function checkHUAccess(")
  })

  it("exports checkCasoAccess", () => {
    expect(src).toContain("export async function checkCasoAccess(")
  })

  it("exports checkTareaAccess", () => {
    expect(src).toContain("export async function checkTareaAccess(")
  })

  it("checkHUAccess queries historiaUsuario and checks grupoId", () => {
    expect(src).toContain("prisma.historiaUsuario.findUnique")
    // Returns null when entity not found
    expect(src).toContain("if (!hu) return null")
    // Returns null when grupoId doesn't match
    expect(src).toContain("hu.grupoId !== grupoId")
  })

  it("checkCasoAccess queries casoPrueba with hu relation", () => {
    expect(src).toContain("prisma.casoPrueba.findUnique")
    expect(src).toContain("if (!caso) return null")
    expect(src).toContain("caso.hu.grupoId !== grupoId")
  })

  it("checkTareaAccess queries tarea with nested caso.hu relation", () => {
    expect(src).toContain("prisma.tarea.findUnique")
    expect(src).toContain("if (!tarea) return null")
    expect(src).toContain("tarea.caso?.hu?.grupoId !== grupoId")
  })

  it("owner (undefined grupoId) always has access", () => {
    // When grupoId is undefined, the condition `grupoId && ...` is falsy
    // so the check is skipped and access is granted
    expect(src).toContain("grupoId && hu.grupoId !== grupoId")
    expect(src).toContain("grupoId && caso.hu.grupoId !== grupoId")
    expect(src).toContain("grupoId && tarea.caso?.hu?.grupoId !== grupoId")
  })

  it("access helpers accept grupoId as string | undefined", () => {
    expect(src).toContain("grupoId: string | undefined")
  })
})

// ══════════════════════════════════════════════════════════
//  7. withAuth middleware — mocked behavior
// ══════════════════════════════════════════════════════════

// Mock Next.js server modules for behavior tests
vi.mock("next/server", () => {
  class MockNextResponse {
    body: any
    status: number
    constructor(body: any, init?: { status?: number }) {
      this.body = body
      this.status = init?.status ?? 200
    }
    static json(data: any, init?: { status?: number }) {
      return new MockNextResponse(data, init)
    }
  }
  class MockNextRequest {
    nextUrl: { pathname: string }
    constructor(url: string) {
      this.nextUrl = { pathname: url }
    }
  }
  return {
    NextResponse: MockNextResponse,
    NextRequest: MockNextRequest,
  }
})

vi.mock("@/lib/backend/middleware/auth.middleware", () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    historiaUsuario: { findUnique: vi.fn() },
    casoPrueba: { findUnique: vi.fn() },
    tarea: { findUnique: vi.fn() },
  },
}))

vi.mock("@/lib/backend/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}))

describe("withAuth middleware behavior (mocked)", () => {
  let withAuth: typeof import("@/lib/backend/middleware/with-auth").withAuth
  let withAuthAdmin: typeof import("@/lib/backend/middleware/with-auth").withAuthAdmin
  let requireAuth: any
  let requireAdmin: any
  let NextResponse: any
  let NextRequest: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import("@/lib/backend/middleware/with-auth")
    withAuth = mod.withAuth
    withAuthAdmin = mod.withAuthAdmin
    const authMod = await import("@/lib/backend/middleware/auth.middleware")
    requireAuth = authMod.requireAuth
    requireAdmin = authMod.requireAdmin
    const nextServer = await import("next/server")
    NextResponse = nextServer.NextResponse
    NextRequest = nextServer.NextRequest
  })

  it("withAuth returns 401 when requireAuth returns NextResponse", async () => {
    const unauthorizedResponse = NextResponse.json({ error: "No autorizado" }, { status: 401 })
    requireAuth.mockResolvedValue(unauthorizedResponse)

    const handler = vi.fn()
    const wrapped = withAuth(handler)
    const request = new NextRequest("/api/test")

    const result = await wrapped(request as any)
    expect(result).toBe(unauthorizedResponse)
    expect(handler).not.toHaveBeenCalled()
  })

  it("withAuth calls handler with payload when auth succeeds", async () => {
    const payload = { sub: "user-1", role: "user", grupoId: "g1" }
    requireAuth.mockResolvedValue(payload)

    const handlerResponse = NextResponse.json({ ok: true })
    const handler = vi.fn().mockResolvedValue(handlerResponse)
    const wrapped = withAuth(handler)
    const request = new NextRequest("/api/test")

    const result = await wrapped(request as any)
    expect(result).toBe(handlerResponse)
    expect(handler).toHaveBeenCalledWith(request, payload, undefined)
  })

  it("withAuth catches unhandled errors and returns 500", async () => {
    const payload = { sub: "user-1", role: "user" }
    requireAuth.mockResolvedValue(payload)

    const handler = vi.fn().mockRejectedValue(new Error("Something broke"))
    const wrapped = withAuth(handler)
    const request = new NextRequest("/api/test")

    const result = await wrapped(request as any)
    expect(result.body).toEqual({ error: "Something broke" })
    expect(result.status).toBe(500)
  })

  it("withAuth returns generic message for non-Error throws", async () => {
    const payload = { sub: "user-1", role: "user" }
    requireAuth.mockResolvedValue(payload)

    const handler = vi.fn().mockRejectedValue("string error")
    const wrapped = withAuth(handler)
    const request = new NextRequest("/api/test")

    const result = await wrapped(request as any)
    expect(result.body).toEqual({ error: "Error interno" })
    expect(result.status).toBe(500)
  })

  it("withAuthAdmin returns 403 when requireAdmin returns NextResponse", async () => {
    const forbiddenResponse = NextResponse.json({ error: "Forbidden" }, { status: 403 })
    requireAdmin.mockResolvedValue(forbiddenResponse)

    const handler = vi.fn()
    const wrapped = withAuthAdmin(handler)
    const request = new NextRequest("/api/admin/test")

    const result = await wrapped(request as any)
    expect(result).toBe(forbiddenResponse)
    expect(handler).not.toHaveBeenCalled()
  })

  it("withAuthAdmin calls handler when admin auth succeeds", async () => {
    const payload = { sub: "admin-1", role: "owner" }
    requireAdmin.mockResolvedValue(payload)

    const handlerResponse = NextResponse.json({ users: [] })
    const handler = vi.fn().mockResolvedValue(handlerResponse)
    const wrapped = withAuthAdmin(handler)
    const request = new NextRequest("/api/admin/test")

    const result = await wrapped(request as any)
    expect(result).toBe(handlerResponse)
    expect(handler).toHaveBeenCalledWith(request, payload, undefined)
  })
})

// ══════════════════════════════════════════════════════════
//  8. Workspace access helpers — mocked behavior
// ══════════════════════════════════════════════════════════
describe("Workspace access helpers behavior (mocked)", () => {
  let checkHUAccess: typeof import("@/lib/backend/middleware/with-auth").checkHUAccess
  let checkCasoAccess: typeof import("@/lib/backend/middleware/with-auth").checkCasoAccess
  let checkTareaAccess: typeof import("@/lib/backend/middleware/with-auth").checkTareaAccess
  let prisma: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import("@/lib/backend/middleware/with-auth")
    checkHUAccess = mod.checkHUAccess
    checkCasoAccess = mod.checkCasoAccess
    checkTareaAccess = mod.checkTareaAccess
    const prismaMod = await import("@/lib/backend/prisma")
    prisma = prismaMod.prisma
  })

  // ── checkHUAccess ──────────────────────────────────────
  it("checkHUAccess returns entity when grupoId matches", async () => {
    const hu = { grupoId: "g1" }
    prisma.historiaUsuario.findUnique.mockResolvedValue(hu)

    const result = await checkHUAccess("hu-1", "g1")
    expect(result).toEqual(hu)
  })

  it("checkHUAccess returns null when grupoId doesn't match", async () => {
    prisma.historiaUsuario.findUnique.mockResolvedValue({ grupoId: "g1" })

    const result = await checkHUAccess("hu-1", "g2")
    expect(result).toBeNull()
  })

  it("checkHUAccess returns entity when grupoId is undefined (owner)", async () => {
    const hu = { grupoId: "g1" }
    prisma.historiaUsuario.findUnique.mockResolvedValue(hu)

    const result = await checkHUAccess("hu-1", undefined)
    expect(result).toEqual(hu)
  })

  it("checkHUAccess returns null when entity doesn't exist", async () => {
    prisma.historiaUsuario.findUnique.mockResolvedValue(null)

    const result = await checkHUAccess("hu-nonexistent", "g1")
    expect(result).toBeNull()
  })

  // ── checkCasoAccess ────────────────────────────────────
  it("checkCasoAccess returns entity when grupoId matches", async () => {
    const caso = { hu: { grupoId: "g1" } }
    prisma.casoPrueba.findUnique.mockResolvedValue(caso)

    const result = await checkCasoAccess("caso-1", "g1")
    expect(result).toEqual(caso)
  })

  it("checkCasoAccess returns null when grupoId doesn't match", async () => {
    prisma.casoPrueba.findUnique.mockResolvedValue({ hu: { grupoId: "g1" } })

    const result = await checkCasoAccess("caso-1", "g2")
    expect(result).toBeNull()
  })

  it("checkCasoAccess returns entity when grupoId is undefined (owner)", async () => {
    const caso = { hu: { grupoId: "g1" } }
    prisma.casoPrueba.findUnique.mockResolvedValue(caso)

    const result = await checkCasoAccess("caso-1", undefined)
    expect(result).toEqual(caso)
  })

  it("checkCasoAccess returns null when entity doesn't exist", async () => {
    prisma.casoPrueba.findUnique.mockResolvedValue(null)

    const result = await checkCasoAccess("caso-nonexistent", "g1")
    expect(result).toBeNull()
  })

  // ── checkTareaAccess ───────────────────────────────────
  it("checkTareaAccess returns entity when grupoId matches", async () => {
    const tarea = { caso: { hu: { grupoId: "g1" } } }
    prisma.tarea.findUnique.mockResolvedValue(tarea)

    const result = await checkTareaAccess("tarea-1", "g1")
    expect(result).toEqual(tarea)
  })

  it("checkTareaAccess returns null when grupoId doesn't match", async () => {
    prisma.tarea.findUnique.mockResolvedValue({ caso: { hu: { grupoId: "g1" } } })

    const result = await checkTareaAccess("tarea-1", "g2")
    expect(result).toBeNull()
  })

  it("checkTareaAccess returns entity when grupoId is undefined (owner)", async () => {
    const tarea = { caso: { hu: { grupoId: "g1" } } }
    prisma.tarea.findUnique.mockResolvedValue(tarea)

    const result = await checkTareaAccess("tarea-1", undefined)
    expect(result).toEqual(tarea)
  })

  it("checkTareaAccess returns null when entity doesn't exist", async () => {
    prisma.tarea.findUnique.mockResolvedValue(null)

    const result = await checkTareaAccess("tarea-nonexistent", "g1")
    expect(result).toBeNull()
  })
})
