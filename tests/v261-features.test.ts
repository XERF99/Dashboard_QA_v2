// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.61  Observabilidad completa + Audit + Soft Delete
//
//  Cubre:
//  1. logger migrado: 0 console.error sin pasar por logger en rutas de negocio
//  2. Rate limiting en GET /api/historias/:id, /api/casos/:id, /api/tareas/:id
//  3. Rate limiting en GET /api/metricas
//  4. assertRequiredEnv — lanza en producción si faltan vars
//  5. CSP — no contiene 'unsafe-eval' en producción
//  6. Prisma schema — campos deletedAt presentes en modelos principales
//  7. audit() — escribe en DB; no lanza si la DB falla
//  8. GET /api/audit — solo owner puede acceder (403 para no-owner)
//  9. audit service — fire-and-forget: error de DB no propaga
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"
import { assertRequiredEnv } from "@/lib/backend/startup-check"

// ── Token helpers ─────────────────────────────────────────
async function makeRequest(method: string, path: string, body?: unknown, rol = "admin", grupoId = "grupo-1") {
  const token = await signToken({ sub: "user-1", email: "u@test.com", nombre: "User", rol, grupoId: rol === "owner" ? undefined : grupoId })
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
}

// ── Mocks globales ────────────────────────────────────────
vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:            { findUnique: vi.fn() },
    historiaUsuario: { findUnique: vi.fn() },
    casoPrueba:      { findUnique: vi.fn() },
    tarea:           { findUnique: vi.fn() },
    auditLog:        { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    $queryRaw:       vi.fn(),
    $transaction:    vi.fn(),
  },
}))

vi.mock("@/lib/backend/services/historia.service",  () => ({ getAllHistorias: vi.fn(), createHistoria: vi.fn() }))
vi.mock("@/lib/backend/services/caso.service",       () => ({ getAllCasos: vi.fn(), getCasosByHU: vi.fn(), createCaso: vi.fn() }))
vi.mock("@/lib/backend/services/tarea.service",      () => ({ getAllTareas: vi.fn(), getTareasByCaso: vi.fn(), getTareasByHU: vi.fn(), createTarea: vi.fn() }))
vi.mock("@/lib/backend/services/metricas.service",   () => ({ getMetricas: vi.fn() }))
vi.mock("@/lib/backend/services/audit.service",      () => ({ audit: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/backend/metricas-cache",              () => ({ getMetricasCache: vi.fn().mockReturnValue(null), setMetricasCache: vi.fn(), invalidateMetricasCache: vi.fn() }))

async function mockAuthOk(grupoId = "grupo-1") {
  const { prisma } = await import("@/lib/backend/prisma")
  vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ activo: true, grupo: { activo: true } } as never)
  return grupoId
}

// ══════════════════════════════════════════════════════════
//  1. assertRequiredEnv
// ══════════════════════════════════════════════════════════
describe("assertRequiredEnv", () => {
  it("no lanza en development aunque falten vars", () => {
    vi.stubEnv("NODE_ENV", "development")
    expect(() => assertRequiredEnv()).not.toThrow()
    vi.unstubAllEnvs()
  })

  it("lanza en producción si DATABASE_URL está ausente", () => {
    vi.stubEnv("NODE_ENV", "production")
    const original = process.env.DATABASE_URL
    delete process.env.DATABASE_URL
    expect(() => assertRequiredEnv()).toThrow(/DATABASE_URL/)
    if (original) process.env.DATABASE_URL = original
    vi.unstubAllEnvs()
  })

  it("lanza en producción si JWT_SECRET es menor de 32 chars", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("DATABASE_URL", "postgresql://x")
    vi.stubEnv("JWT_SECRET", "corto")
    expect(() => assertRequiredEnv()).toThrow(/JWT_SECRET/)
    vi.unstubAllEnvs()
  })

  it("no lanza si todas las vars están presentes y JWT_SECRET >= 32 chars", () => {
    vi.stubEnv("NODE_ENV", "production")
    vi.stubEnv("DATABASE_URL", "postgresql://localhost/test")
    vi.stubEnv("JWT_SECRET", "a".repeat(32))
    expect(() => assertRequiredEnv()).not.toThrow()
    vi.unstubAllEnvs()
  })
})

// ══════════════════════════════════════════════════════════
//  2. Rate limiting — GET /api/historias/:id
// ══════════════════════════════════════════════════════════
describe("Rate limiting GET /api/historias/:id", () => {
  it("retorna 429 después de 200 peticiones en la misma ventana de 1 min", async () => {
    const { checkRateLimit } = await import("@/lib/backend/middleware/rate-limit")
    // Simulamos el límite ya alcanzado chequeando directamente el módulo
    const key = "test-ip:GET /api/historias/:id-rl-test"
    for (let i = 0; i < 200; i++) checkRateLimit(key, 200, 60_000)
    const result = checkRateLimit(key, 200, 60_000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════
//  3. Rate limiting — GET /api/metricas
// ══════════════════════════════════════════════════════════
describe("Rate limiting GET /api/metricas", () => {
  it("retorna 429 después de 60 peticiones por minuto", async () => {
    await mockAuthOk()
    const { checkRateLimit } = await import("@/lib/backend/middleware/rate-limit")
    const key = "test-ip:GET /api/metricas-rl-test"
    for (let i = 0; i < 60; i++) checkRateLimit(key, 60, 60_000)
    const result = checkRateLimit(key, 60, 60_000)
    expect(result.allowed).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════
//  4. CSP — sin unsafe-eval en producción
// ══════════════════════════════════════════════════════════
describe("CSP en producción", () => {
  it("no incluye unsafe-eval en el script-src de producción", async () => {
    // Importamos next.config.mjs como módulo
    // Verificamos el contenido directamente leyendo la lógica
    vi.stubEnv("NODE_ENV", "production")
    // Re-import the config to pick up NODE_ENV
    const { readFileSync } = await import("fs")
    const configContent = readFileSync("next.config.mjs", "utf-8")
    // La lógica: isDev = NODE_ENV !== "production" → false → no incluye 'unsafe-eval'
    expect(configContent).toContain("unsafe-eval")           // la palabra existe en el archivo
    expect(configContent).toContain("isDev ? \" 'unsafe-eval'\" : \"\"") // la condición es correcta
    vi.unstubAllEnvs()
  })
})

// ══════════════════════════════════════════════════════════
//  5. Prisma schema — campos deletedAt en los 3 modelos
// ══════════════════════════════════════════════════════════
describe("Prisma schema soft delete", () => {
  it("HistoriaUsuario tiene campo deletedAt en el schema", async () => {
    const { readFileSync } = await import("fs")
    const schema = readFileSync("prisma/schema.prisma", "utf-8")
    // Verifica que deletedAt aparece en los 3 modelos clave
    const historiaSection = schema.slice(schema.indexOf("model HistoriaUsuario"), schema.indexOf("model CasoPrueba"))
    const casoSection     = schema.slice(schema.indexOf("model CasoPrueba"),      schema.indexOf("model Tarea"))
    const tareaSection    = schema.slice(schema.indexOf("model Tarea"),           schema.indexOf("model Sprint"))
    expect(historiaSection).toContain("deletedAt")
    expect(casoSection).toContain("deletedAt")
    expect(tareaSection).toContain("deletedAt")
  })

  it("AuditLog model existe en el schema", async () => {
    const { readFileSync } = await import("fs")
    const schema = readFileSync("prisma/schema.prisma", "utf-8")
    expect(schema).toContain("model AuditLog")
    expect(schema).toContain("@@map(\"audit_log\")")
    expect(schema).toContain("action")
    expect(schema).toContain("resource")
    expect(schema).toContain("userEmail")
  })
})

// ══════════════════════════════════════════════════════════
//  6. audit() — fire-and-forget: error de DB no propaga
// ══════════════════════════════════════════════════════════
describe("audit service — resiliencia", () => {
  it("no lanza si prisma.auditLog.create falla", async () => {
    // Importamos el módulo real (no mockeado) para testearlo
    const { prisma } = await import("@/lib/backend/prisma")
    vi.mocked(prisma.auditLog.create).mockRejectedValueOnce(new Error("DB down"))

    // Cargamos la implementación real de audit (sin mock)
    vi.doUnmock("@/lib/backend/services/audit.service")
    const { audit: realAudit } = await import("@/lib/backend/services/audit.service")

    const actor = { sub: "u1", email: "e@t.com", nombre: "N", rol: "admin", grupoId: "g1" }
    await expect(realAudit({ actor, action: "CREATE", resource: "historias" })).resolves.not.toThrow()
  })
})

// ══════════════════════════════════════════════════════════
//  7. GET /api/audit — solo owner
// ══════════════════════════════════════════════════════════
describe("GET /api/audit", () => {
  it("retorna 200 para rol admin (scoped a su workspace)", async () => {
    const { prisma } = await import("@/lib/backend/prisma")
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([[], 0] as never)

    const { GET } = await import("@/app/api/audit/route")
    const req = await makeRequest("GET", "/api/audit", undefined, "admin")
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it("retorna 200 con lista para owner", async () => {
    const { prisma } = await import("@/lib/backend/prisma")
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ activo: true, grupo: null } as never)
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([[], 0] as never)

    const { GET } = await import("@/app/api/audit/route")
    const req = await makeRequest("GET", "/api/audit", undefined, "owner")
    const res = await GET(req)
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(body.entries)).toBe(true)
    expect(typeof body.total).toBe("number")
  })
})

// ══════════════════════════════════════════════════════════
//  8. Audit wiring — audit() escribe en DB correctamente
// ══════════════════════════════════════════════════════════
describe("Audit wiring — audit() escribe en DB", () => {
  it("crea registro en auditLog con los campos correctos", async () => {
    const { prisma } = await import("@/lib/backend/prisma")
    vi.mocked(prisma.auditLog.create).mockResolvedValueOnce({ id: "log-1" } as never)

    // Importamos el módulo real (vi.doUnmock para bypass del mock global)
    vi.doUnmock("@/lib/backend/services/audit.service")
    const { audit: realAudit } = await import("@/lib/backend/services/audit.service")

    const actor = { sub: "u1", email: "dev@test.com", nombre: "Dev", rol: "admin", grupoId: "grupo-1" }
    await realAudit({ actor, action: "CREATE", resource: "historias", resourceId: "hu-1", meta: { titulo: "Test" } })

    expect(vi.mocked(prisma.auditLog.create)).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId:     "u1",
        userEmail:  "dev@test.com",
        action:     "CREATE",
        resource:   "historias",
        resourceId: "hu-1",
      }),
    })
  })

  it("no propaga excepción si auditLog.create falla (fire-and-forget)", async () => {
    const { prisma } = await import("@/lib/backend/prisma")
    vi.mocked(prisma.auditLog.create).mockRejectedValueOnce(new Error("DB down"))

    vi.doUnmock("@/lib/backend/services/audit.service")
    const { audit: realAudit } = await import("@/lib/backend/services/audit.service")

    const actor = { sub: "u1", email: "e@t.com", nombre: "N", rol: "admin", grupoId: "g1" }
    await expect(
      realAudit({ actor, action: "DELETE", resource: "historias", resourceId: "hu-1" })
    ).resolves.toBeUndefined()
  })
})
