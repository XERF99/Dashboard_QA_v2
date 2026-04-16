// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.60  Observabilidad y resiliencia
//
//  Cubre:
//  1. GET /api/health → 200 cuando DB ok
//  2. GET /api/health → 503 cuando DB falla
//  3. GET /api/grupos/:id  → 500 cuando DB falla
//  4. PUT /api/grupos/:id  → 500 cuando DB falla
//  5. DELETE /api/grupos/:id → 500 cuando DB falla
//  6. GET /api/auth/me     → 500 cuando DB falla
//  7. POST /api/auth/logout → 500 cuando service falla
//  8. GET /api/sprints     → 500 cuando DB falla
//  9. GET /api/notificaciones → 500 cuando service falla
//  10. POST /api/notificaciones → 500 cuando service falla
//  11. logger.error registra con contexto estructurado
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"
import { logger } from "@/lib/backend/logger"

// ── Token helpers ─────────────────────────────────────────
async function makeRequest(method: string, path: string, body?: unknown, grupoId?: string) {
  const token = await signToken({ sub: "user-1", email: "user@test.com", nombre: "User", rol: "admin", grupoId: grupoId ?? "grupo-1" })
  const url    = `http://localhost${path}`
  const init = {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }
  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1])
}

async function makeOwnerRequest(method: string, path: string, body?: unknown) {
  const token = await signToken({ sub: "owner-1", email: "owner@test.com", nombre: "Owner", rol: "owner", grupoId: undefined })
  const url    = `http://localhost${path}`
  const init = {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }
  return new NextRequest(url, init as ConstructorParameters<typeof NextRequest>[1])
}

// ── Mocks ────────────────────────────────────────────────

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:            { findUnique: vi.fn(), count: vi.fn().mockResolvedValue(1) },
    historiaUsuario: { findUnique: vi.fn() },
    $queryRaw:       vi.fn(),
  },
}))

vi.mock("@/lib/backend/services/auth.service", () => ({
  logoutService: vi.fn(),
}))

vi.mock("@/lib/backend/services/sprint.service", () => ({
  getAllSprints:    vi.fn(),
  getSprintActivo: vi.fn(),
  createSprint:    vi.fn(),
}))

vi.mock("@/lib/backend/services/notificacion.service", () => ({
  getNotificacionesByDestinatario: vi.fn(),
  createNotificacion:              vi.fn(),
  rolToDestinatario:               vi.fn().mockReturnValue("admin"),
}))

vi.mock("@/lib/backend/services/grupo.service", () => ({
  getGrupoById: vi.fn(),
  updateGrupo:  vi.fn(),
  deleteGrupo:  vi.fn(),
}))

// ── Helper: mock auth to pass ─────────────────────────────
async function mockAuthOk() {
  const { prisma } = await import("@/lib/backend/prisma")
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
    activo: true, grupo: { activo: true },
  } as never)
}

// ── 1. GET /api/health ───────────────────────────────────
describe("GET /api/health", () => {
  it("returns 200 with status=ok when DB responds", async () => {
    // Ensure env checks pass
    process.env.JWT_SECRET = "test-secret"
    process.env.DATABASE_URL = "postgresql://test"

    const { prisma } = await import("@/lib/backend/prisma")
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ "?column?": 1 }])

    const { GET } = await import("@/app/api/health/route")
    const res  = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe("ok")
    expect(body.checks.db).toBe("ok")
    expect(typeof body.uptime).toBe("number")
    expect(typeof body.latency_ms).toBe("number")
  })

  it("returns 503 with status=degraded when DB throws", async () => {
    const { prisma } = await import("@/lib/backend/prisma")
    vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error("connection refused"))
    vi.mocked(prisma.user.count).mockRejectedValueOnce(new Error("connection refused"))

    const { GET } = await import("@/app/api/health/route")
    const res  = await GET()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.status).toBe("degraded")
    expect(body.checks.db).toBe("error")
  })
})

// ── 2. GET /api/grupos/:id ───────────────────────────────
describe("GET /api/grupos/:id → 500 when DB fails", () => {
  it("returns 500 on service error", async () => {
    await mockAuthOk()

    const { getGrupoById } = await import("@/lib/backend/services/grupo.service")
    vi.mocked(getGrupoById).mockRejectedValueOnce(new Error("DB timeout"))

    const { GET } = await import("@/app/api/grupos/[id]/route")
    const req = await makeOwnerRequest("GET", "/api/grupos/grupo-1")
    const res = await GET(req, { params: Promise.resolve({ id: "grupo-1" }) })

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ── 3. PUT /api/grupos/:id ───────────────────────────────
describe("PUT /api/grupos/:id → 500 when DB fails", () => {
  it("returns 500 on service error", async () => {
    await mockAuthOk()

    const { updateGrupo } = await import("@/lib/backend/services/grupo.service")
    vi.mocked(updateGrupo).mockRejectedValueOnce(new Error("DB timeout"))

    const { PUT } = await import("@/app/api/grupos/[id]/route")
    const req = await makeOwnerRequest("PUT", "/api/grupos/grupo-1", { nombre: "nuevo nombre" })
    const res = await PUT(req, { params: Promise.resolve({ id: "grupo-1" }) })

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ── 4. DELETE /api/grupos/:id ────────────────────────────
describe("DELETE /api/grupos/:id → 500 when DB fails", () => {
  it("returns 500 on service error", async () => {
    await mockAuthOk()

    const { deleteGrupo } = await import("@/lib/backend/services/grupo.service")
    vi.mocked(deleteGrupo).mockRejectedValueOnce(new Error("DB timeout"))

    const { DELETE } = await import("@/app/api/grupos/[id]/route")
    const req = await makeOwnerRequest("DELETE", "/api/grupos/grupo-1")
    const res = await DELETE(req, { params: Promise.resolve({ id: "grupo-1" }) })

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ── 5. GET /api/auth/me ──────────────────────────────────
describe("GET /api/auth/me → 500 when DB fails", () => {
  it("returns 500 on DB error", async () => {
    const { prisma } = await import("@/lib/backend/prisma")
    // Call 1: requireAuth → passes
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never)
      // Call 2: actual handler findUnique → fails
      .mockRejectedValueOnce(new Error("DB timeout"))

    const { GET } = await import("@/app/api/auth/me/route")
    const req = await makeRequest("GET", "/api/auth/me")
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ── 6. POST /api/auth/logout ─────────────────────────────
describe("POST /api/auth/logout → 500 when service fails", () => {
  it("returns 500 on logoutService error", async () => {
    await mockAuthOk()

    const { logoutService } = await import("@/lib/backend/services/auth.service")
    vi.mocked(logoutService).mockRejectedValueOnce(new Error("service failure"))

    const { POST } = await import("@/app/api/auth/logout/route")
    const req = await makeRequest("POST", "/api/auth/logout")
    const res = await POST(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ── 7. GET /api/sprints ──────────────────────────────────
describe("GET /api/sprints → 500 when DB fails", () => {
  it("returns 500 on getAllSprints error", async () => {
    await mockAuthOk()

    const { getAllSprints } = await import("@/lib/backend/services/sprint.service")
    vi.mocked(getAllSprints).mockRejectedValueOnce(new Error("DB timeout"))

    const { GET } = await import("@/app/api/sprints/route")
    const req = await makeRequest("GET", "/api/sprints")
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ── 8. GET /api/notificaciones ───────────────────────────
describe("GET /api/notificaciones → 500 when service fails", () => {
  it("returns 500 on service error", async () => {
    await mockAuthOk()

    const { getNotificacionesByDestinatario } = await import("@/lib/backend/services/notificacion.service")
    vi.mocked(getNotificacionesByDestinatario).mockRejectedValueOnce(new Error("service failure"))

    const { GET } = await import("@/app/api/notificaciones/route")
    const req = await makeRequest("GET", "/api/notificaciones")
    const res = await GET(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ── 9. POST /api/notificaciones ──────────────────────────
describe("POST /api/notificaciones → 500 when service fails", () => {
  it("returns 500 on createNotificacion error", async () => {
    await mockAuthOk()

    const { createNotificacion } = await import("@/lib/backend/services/notificacion.service")
    vi.mocked(createNotificacion).mockRejectedValueOnce(new Error("service failure"))

    const { POST } = await import("@/app/api/notificaciones/route")
    const req = await makeRequest("POST", "/api/notificaciones", {
      tipo:         "aprobacion_enviada",
      titulo:       "Test",
      descripcion:  "desc",
      destinatario: "admin",
    })
    const res = await POST(req)

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })
})

// ── 10. logger.error structured output ───────────────────
describe("logger.error", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("calls console.error with context and message", () => {
    logger.error("test-context", "something broke")
    expect(console.error).toHaveBeenCalledTimes(1)
    const arg = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string
    expect(arg).toContain("test-context")
    expect(arg).toContain("something broke")
  })

  it("includes error message when err is an Error instance", () => {
    logger.error("test-context", "db failed", new Error("connection timeout"))
    const arg = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string
    expect(arg).toContain("connection timeout")
  })

  it("produces JSON string in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    logger.error("prod-ctx", "prod error", new Error("oops"))
    const arg = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string
    const parsed = JSON.parse(arg)
    expect(parsed.level).toBe("error")
    expect(parsed.context).toBe("prod-ctx")
    expect(parsed.message).toBe("prod error")
    expect(parsed.error).toBe("oops")
    vi.unstubAllEnvs()
  })
})
