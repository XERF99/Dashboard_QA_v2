// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.73  Service interfaces
//
//  Verifica que los servicios de dominio exponen:
//  - Las funciones existentes (compat hacia atrás)
//  - Una interface tipada (HistoriaService, CasoService, TareaService)
//  - Un objeto default con los métodos cableados
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

describe("HistoriaService — interface", () => {
  const src = read("lib/backend/services/historia.service.ts")

  it("declara la interface HistoriaService", () => {
    expect(src).toContain("export interface HistoriaService")
    expect(src).toContain("getAll:")
    expect(src).toContain("getById:")
    expect(src).toContain("create:")
    expect(src).toContain("update:")
    expect(src).toContain("delete:")
  })

  it("exporta historiaService con shape completo", async () => {
    const mod = await import("@/lib/backend/services/historia.service")
    expect(mod.historiaService).toBeDefined()
    expect(typeof mod.historiaService.getAll).toBe("function")
    expect(typeof mod.historiaService.getById).toBe("function")
    expect(typeof mod.historiaService.create).toBe("function")
    expect(typeof mod.historiaService.update).toBe("function")
    expect(typeof mod.historiaService.delete).toBe("function")
    expect(typeof mod.historiaService.getBySprint).toBe("function")
    expect(typeof mod.historiaService.getByResponsable).toBe("function")
  })

  it("las funciones sueltas siguen exportándose (compat)", async () => {
    const mod = await import("@/lib/backend/services/historia.service")
    expect(typeof mod.createHistoria).toBe("function")
    expect(typeof mod.getAllHistorias).toBe("function")
    expect(mod.historiaService.create).toBe(mod.createHistoria)
  })
})

describe("CasoService — interface", () => {
  const src = read("lib/backend/services/caso.service.ts")

  it("declara la interface CasoService", () => {
    expect(src).toContain("export interface CasoService")
    expect(src).toContain("getByHU:")
  })

  it("exporta casoService con shape completo", async () => {
    const mod = await import("@/lib/backend/services/caso.service")
    expect(mod.casoService).toBeDefined()
    expect(typeof mod.casoService.getAll).toBe("function")
    expect(typeof mod.casoService.getByHU).toBe("function")
    expect(typeof mod.casoService.create).toBe("function")
    expect(mod.casoService.getByHU).toBe(mod.getCasosByHU)
  })
})

describe("TareaService — interface", () => {
  const src = read("lib/backend/services/tarea.service.ts")

  it("declara la interface TareaService", () => {
    expect(src).toContain("export interface TareaService")
    expect(src).toContain("getByCaso:")
    expect(src).toContain("getByHU:")
  })

  it("exporta tareaService con shape completo", async () => {
    const mod = await import("@/lib/backend/services/tarea.service")
    expect(mod.tareaService).toBeDefined()
    expect(typeof mod.tareaService.getAll).toBe("function")
    expect(typeof mod.tareaService.getByCaso).toBe("function")
    expect(typeof mod.tareaService.getByHU).toBe("function")
    expect(mod.tareaService.getByCaso).toBe(mod.getTareasByCaso)
  })
})

describe("Prisma migration v2.73 — performance indexes", () => {
  const migration = read("prisma/migrations/20260422000000_v2_73_performance_indexes/migration.sql")

  it("añade índice compuesto para AuditLog por grupoId + timestamp DESC", () => {
    expect(migration).toContain("audit_log_grupo_timestamp_idx")
    expect(migration).toContain('"grupoId", "timestamp" DESC')
  })

  it("añade índice parcial para Historia por grupoId + fechaCreacion", () => {
    expect(migration).toContain("historias_usuario_grupo_fecha_idx")
    expect(migration).toContain('WHERE "deletedAt" IS NULL')
  })

  it("añade índice parcial para Tarea por asignado + estado", () => {
    expect(migration).toContain("tareas_asignado_estado_idx")
  })

  it("todos los CREATE INDEX usan IF NOT EXISTS (idempotente)", () => {
    const creates = migration.match(/CREATE INDEX/g) ?? []
    const ifNotExists = migration.match(/CREATE INDEX IF NOT EXISTS/g) ?? []
    expect(ifNotExists.length).toBe(creates.length)
  })
})
