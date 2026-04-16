// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.62  Soft delete activo, logger requestId,
//  health con memoria, Cache-Control, CSV utils, validación
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import fs from "fs"
import path from "path"

// ══════════════════════════════════════════════════════════
//  1. Soft delete — services filtran deletedAt: null
// ══════════════════════════════════════════════════════════
describe("Soft delete filters", () => {
  it("historia.service — getAllHistorias incluye deletedAt: null en where", async () => {
    const src = fs.readFileSync(path.resolve("lib/backend/services/historia.service.ts"), "utf-8")
    expect(src).toContain("notDeleted")
    expect(src).toContain("deletedAt: null")
    // deleteHistoria should update, not delete
    expect(src).toMatch(/deletedAt:\s*(new Date\(\)|now)/)
    expect(src).not.toMatch(/prisma\.historiaUsuario\.delete\(/)
  })

  it("caso.service — getAllCasos y getCasosByHU filtran soft delete", async () => {
    const src = fs.readFileSync(path.resolve("lib/backend/services/caso.service.ts"), "utf-8")
    expect(src).toContain("notDeleted")
    expect(src).toContain("softDelete")
    expect(src).toContain('from "./base-crud.service"')
    expect(src).not.toMatch(/prisma\.casoPrueba\.delete\(/)
  })

  it("tarea.service — getAllTareas, getTareasByCaso, getTareasByHU filtran soft delete", async () => {
    const src = fs.readFileSync(path.resolve("lib/backend/services/tarea.service.ts"), "utf-8")
    expect(src).toContain("notDeleted")
    expect(src).toContain("softDelete")
    expect(src).toContain('from "./base-crud.service"')
    expect(src).not.toMatch(/prisma\.tarea\.delete\(/)
  })

  it("metricas.service — todas las aggregaciones filtran deletedAt", async () => {
    const src = fs.readFileSync(path.resolve("lib/backend/services/metricas.service.ts"), "utf-8")
    expect(src).toContain("notDeleted")
    // All three filter functions should include notDeleted
    const matches = src.match(/\.\.\.notDeleted/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBeGreaterThanOrEqual(3)
  })

  it("export/route.ts — filtra deletedAt: null en ambas ramas", async () => {
    const src = fs.readFileSync(path.resolve("app/api/export/route.ts"), "utf-8")
    const matches = src.match(/deletedAt: null/g)
    expect(matches).not.toBeNull()
    expect(matches!.length).toBe(2) // historias + casos
    // No more Record<string, any>
    expect(src).not.toContain("Record<string, any>")
  })
})

// ══════════════════════════════════════════════════════════
//  2. Prisma schema — composite indexes for soft delete
// ══════════════════════════════════════════════════════════
describe("Prisma schema composite indexes", () => {
  const schema = fs.readFileSync(path.resolve("prisma/schema.prisma"), "utf-8")

  it("HistoriaUsuario tiene index compuesto [grupoId, deletedAt]", () => {
    // Extract the HistoriaUsuario model block
    const model = schema.split("model HistoriaUsuario")[1]?.split("\n}")[0] ?? ""
    expect(model).toContain("@@index([grupoId, deletedAt])")
  })

  it("CasoPrueba tiene index compuesto [huId, deletedAt]", () => {
    const model = schema.split("model CasoPrueba")[1]?.split("\n}")[0] ?? ""
    expect(model).toContain("@@index([huId, deletedAt])")
  })

  it("Tarea tiene index compuesto [casoPruebaId, deletedAt]", () => {
    const model = schema.split("model Tarea")[1]?.split("\n}")[0] ?? ""
    expect(model).toContain("@@index([casoPruebaId, deletedAt])")
  })
})

// ══════════════════════════════════════════════════════════
//  3. Logger — requestId support
// ══════════════════════════════════════════════════════════
describe("Logger requestId", () => {
  beforeEach(() => { vi.restoreAllMocks() })

  it("runWithRequestId / getRequestId work (AsyncLocalStorage)", async () => {
    const { runWithRequestId, getRequestId } = await import("@/lib/backend/logger")
    expect(getRequestId()).toBeUndefined()
    let captured: string | undefined
    runWithRequestId("req-123", () => {
      captured = getRequestId()
    })
    expect(captured).toBe("req-123")
    expect(getRequestId()).toBeUndefined()
  })

  it("logger includes requestId in production JSON output", async () => {
    const origEnv = process.env.NODE_ENV
    ;(process.env as Record<string, string>).NODE_ENV = "production"
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    // Re-import to get fresh module
    vi.resetModules()
    const { logger, runWithRequestId } = await import("@/lib/backend/logger")
    runWithRequestId("req-abc", () => {
      logger.error("test", "something failed")
    })

    expect(spy).toHaveBeenCalledOnce()
    const output = spy.mock.calls[0]![0] as string
    const parsed = JSON.parse(output)
    expect(parsed.requestId).toBe("req-abc")
    expect(parsed.level).toBe("error")
    expect(parsed.context).toBe("test")

    ;(process.env as Record<string, string | undefined>).NODE_ENV = origEnv
    spy.mockRestore()
  })

  it("logger includes stack trace for Error objects", async () => {
    const origEnv = process.env.NODE_ENV
    ;(process.env as Record<string, string>).NODE_ENV = "production"
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    vi.resetModules()
    const { logger } = await import("@/lib/backend/logger")
    logger.error("test", "with stack", new Error("boom"))

    const output = spy.mock.calls[0]![0] as string
    const parsed = JSON.parse(output)
    expect(parsed.error).toBe("boom")
    expect(parsed.stack).toContain("Error: boom")

    ;(process.env as Record<string, string | undefined>).NODE_ENV = origEnv
    spy.mockRestore()
  })
})

// ══════════════════════════════════════════════════════════
//  4. Health endpoint — includes memory metrics
// ══════════════════════════════════════════════════════════
describe("Health endpoint memory metrics", () => {
  it("health route source code includes memory function and Cache-Control", () => {
    const src = fs.readFileSync(path.resolve("app/api/health/route.ts"), "utf-8")
    expect(src).toContain("memoryMB()")
    expect(src).toContain("rss_mb")
    expect(src).toContain("heapUsed_mb")
    expect(src).toContain("heapTotal_mb")
    expect(src).toContain("external_mb")
    expect(src).toContain("Cache-Control")
    expect(src).toContain("no-store")
  })

  it("health route returns memory in all response paths", () => {
    const src = fs.readFileSync(path.resolve("app/api/health/route.ts"), "utf-8")
    // Single unified response path includes memory
    const memoryMatches = src.match(/memory:\s*memoryMB\(\)/g)
    expect(memoryMatches).not.toBeNull()
    expect(memoryMatches!.length).toBeGreaterThanOrEqual(1)
  })

  it("GET /api/health includes memory even on DB failure", async () => {
    vi.resetModules()
    vi.doMock("@/lib/backend/prisma", () => ({
      prisma: { $queryRaw: vi.fn().mockRejectedValue(new Error("DB down")) },
    }))
    vi.doMock("@/lib/backend/startup-check", () => ({ assertRequiredEnv: vi.fn() }))

    const { GET } = await import("@/app/api/health/route")
    const res = await GET()
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.memory).toBeDefined()
    expect(body.memory.rss_mb).toBeGreaterThan(0)
  })
})

// ══════════════════════════════════════════════════════════
//  5. Cache-Control headers
// ══════════════════════════════════════════════════════════
describe("Cache-Control headers", () => {
  it("metricas route includes Cache-Control with private", async () => {
    const src = fs.readFileSync(path.resolve("app/api/metricas/route.ts"), "utf-8")
    expect(src).toContain("Cache-Control")
    expect(src).toContain("private")
    expect(src).toContain("stale-while-revalidate")
  })

  it("config route includes Cache-Control", async () => {
    const src = fs.readFileSync(path.resolve("app/api/config/route.ts"), "utf-8")
    expect(src).toContain("Cache-Control")
    expect(src).toContain("private, max-age=60")
  })
})

// ══════════════════════════════════════════════════════════
//  6. CSV utilities — shared parsearCSV
// ══════════════════════════════════════════════════════════
describe("CSV utilities", () => {
  it("parsearCSV parses basic CSV correctly", async () => {
    const { parsearCSV } = await import("@/lib/csv-utils")
    const result = parsearCSV("a,b,c\n1,2,3\n4,5,6")
    expect(result).toEqual([["a", "b", "c"], ["1", "2", "3"], ["4", "5", "6"]])
  })

  it("parsearCSV handles quoted fields with commas", async () => {
    const { parsearCSV } = await import("@/lib/csv-utils")
    const result = parsearCSV('"hello, world",b,c')
    expect(result[0]![0]).toBe("hello, world")
  })

  it("parsearCSV handles escaped double quotes", async () => {
    const { parsearCSV } = await import("@/lib/csv-utils")
    const result = parsearCSV('"he said ""hello""",b')
    expect(result[0]![0]).toBe('he said "hello"')
  })

  it("parsearCSV skips empty lines", async () => {
    const { parsearCSV } = await import("@/lib/csv-utils")
    const result = parsearCSV("a,b\n\n\nc,d")
    expect(result.length).toBe(2)
  })

  it("parsearFechaCSV parses valid date", async () => {
    const { parsearFechaCSV } = await import("@/lib/csv-utils")
    const date = parsearFechaCSV("15 mar 2026")
    expect(date).toBeInstanceOf(Date)
    expect(date!.getFullYear()).toBe(2026)
    expect(date!.getMonth()).toBe(2) // March = 2
    expect(date!.getDate()).toBe(15)
  })

  it("parsearFechaCSV returns undefined for invalid input", async () => {
    const { parsearFechaCSV } = await import("@/lib/csv-utils")
    expect(parsearFechaCSV("")).toBeUndefined()
    expect(parsearFechaCSV("invalid")).toBeUndefined()
    expect(parsearFechaCSV("32 xyz 2026")).toBeUndefined()
  })

  it("invertirCfg creates label→key map", async () => {
    const { invertirCfg } = await import("@/lib/csv-utils")
    const result = invertirCfg({ alta: { label: "Alta" }, media: { label: "Media" } })
    expect(result).toEqual({ alta: "alta", media: "media" })
  })
})

// ══════════════════════════════════════════════════════════
//  7. ESLint config exists
// ══════════════════════════════════════════════════════════
describe("ESLint configuration", () => {
  it("eslint.config.mjs exists", () => {
    expect(fs.existsSync(path.resolve("eslint.config.mjs"))).toBe(true)
  })

  it("eslint config ignores tests/ and node_modules/", () => {
    const src = fs.readFileSync(path.resolve("eslint.config.mjs"), "utf-8")
    expect(src).toContain("tests/")
    expect(src).toContain("node_modules/")
  })
})

// ══════════════════════════════════════════════════════════
//  8. GitHub Actions CI pipeline
// ══════════════════════════════════════════════════════════
describe("CI pipeline", () => {
  it(".github/workflows/ci.yml exists", () => {
    expect(fs.existsSync(path.resolve(".github/workflows/ci.yml"))).toBe(true)
  })

  it("CI runs lint, type check, and tests", () => {
    const src = fs.readFileSync(path.resolve(".github/workflows/ci.yml"), "utf-8")
    expect(src).toContain("pnpm lint")
    expect(src).toContain("tsc --noEmit")
    expect(src).toContain("pnpm test:run")
    expect(src).toContain("prisma generate")
  })

  it("CI triggers on push to main and dev_1", () => {
    const src = fs.readFileSync(path.resolve(".github/workflows/ci.yml"), "utf-8")
    expect(src).toContain("main")
    expect(src).toContain("dev_1")
  })
})

// ══════════════════════════════════════════════════════════
//  9. Accessibility attributes
// ══════════════════════════════════════════════════════════
describe("Accessibility", () => {
  it("confirm-delete-modal has role=alertdialog and aria-modal", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/shared/confirm-delete-modal.tsx"), "utf-8")
    expect(src).toContain('role="alertdialog"')
    expect(src).toContain("aria-modal")
    expect(src).toContain("aria-label")
  })

  it("csv-import-modal (HU) has role=dialog and aria-modal", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/historias/csv-import-modal.tsx"), "utf-8")
    expect(src).toContain('role="dialog"')
    expect(src).toContain("aria-modal")
    expect(src).toContain('aria-label="Cerrar importación"')
  })

  it("csv-import-casos-modal has role=dialog and aria-modal", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/casos/csv-import-casos-modal.tsx"), "utf-8")
    expect(src).toContain('role="dialog"')
    expect(src).toContain("aria-modal")
    expect(src).toContain('aria-label="Cerrar importación"')
  })

  it("hu-form has aria-label on form element", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/historias/hu-form.tsx"), "utf-8")
    expect(src).toContain("aria-label=")
  })

  it("user-form-modal has aria-label on form element", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/usuarios/user-form-modal.tsx"), "utf-8")
    expect(src).toContain("aria-label=")
  })
})

// ══════════════════════════════════════════════════════════
//  10. Loading states in forms
// ══════════════════════════════════════════════════════════
describe("Loading states in forms", () => {
  it("hu-form has submitting state and disabled button", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/historias/hu-form.tsx"), "utf-8")
    expect(src).toContain("submitting")
    expect(src).toContain("Guardando...")
    expect(src).toContain("disabled={submitting")
  })

  it("user-form-modal disables submit when form invalid", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/usuarios/user-form-modal.tsx"), "utf-8")
    expect(src).toContain("formValid")
    expect(src).toContain("emailValid")
    expect(src).toContain("Formato de email inválido")
  })
})

// ��═════════════════════════════════════════════════════════
//  11. CSV importers use shared utils
// ══════════════════════════════════════════════════════════
describe("CSV importers shared utils", () => {
  it("csv-utils.ts exists with shared functions", () => {
    const src = fs.readFileSync(path.resolve("lib/csv-utils.ts"), "utf-8")
    expect(src).toContain("export function parsearCSV")
    expect(src).toContain("export function invertirCfg")
    expect(src).toContain("export function parsearFechaCSV")
  })

  it("HU csv-import-modal imports from csv-utils", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/historias/csv-import-modal.tsx"), "utf-8")
    expect(src).toContain("from \"@/lib/csv-utils\"")
    // Should NOT have its own parsearCSV function
    expect(src).not.toContain("function parsearCSV")
  })

  it("Casos csv-import-modal imports from csv-utils", () => {
    const src = fs.readFileSync(path.resolve("components/dashboard/casos/csv-import-casos-modal.tsx"), "utf-8")
    expect(src).toContain("from \"@/lib/csv-utils\"")
    expect(src).not.toContain("function parsearCSV")
  })
})

// ══════════════════════════════════════════════════════════
//  12. export route — no more any casts
// ══════════════════════════════════════════════════════════
describe("Type safety in export route", () => {
  it("export/route.ts uses Record<string, unknown> not Record<string, any>", () => {
    const src = fs.readFileSync(path.resolve("app/api/export/route.ts"), "utf-8")
    expect(src).not.toContain("Record<string, any>")
    expect(src).toContain("Record<string, unknown>")
    expect(src).not.toContain("eslint-disable-next-line")
  })
})

// ══════════════════════════════════════════════════════════
//  13. next.config.mjs — CSP unsafe-eval only in dev (from v2.61)
// ══════════════════════════════════════════════════════════
describe("CSP configuration", () => {
  it("CSP unsafe-eval conditional on isDev", () => {
    const src = fs.readFileSync(path.resolve("next.config.mjs"), "utf-8")
    expect(src).toContain("const isDev")
    expect(src).toContain("isDev ? \" 'unsafe-eval'\"")
  })
})
