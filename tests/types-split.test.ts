// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.72  lib/types split por dominio
//
//  Verifica que:
//  1. El barrel file (lib/types/index.ts) re-exporta todo.
//  2. Importar desde el submódulo específico funciona igual.
//  3. API_ROUTES mantiene su shape y valores.
//  4. Tipos branded siguen tipados.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

describe("lib/types — split por dominio", () => {
  it("index.ts sólo re-exporta (sin definir tipos en línea)", () => {
    const src = read("lib/types/index.ts")
    expect(src).toContain('export * from "./brand"')
    expect(src).toContain('export * from "./common"')
    expect(src).toContain('export * from "./config"')
    expect(src).toContain('export * from "./historia"')
    expect(src).toContain('export * from "./caso"')
    expect(src).toContain('export * from "./tarea"')
    expect(src).toContain('export * from "./sprint"')
    expect(src).toContain('export * from "./user"')
    expect(src).toContain('export * from "./notificacion"')
    expect(src).toContain('export * from "./api"')
    // No debe contener definiciones directas de interfaces
    expect(src).not.toContain("export interface HistoriaUsuario")
    expect(src).not.toContain("export interface CasoPrueba")
    expect(src).not.toContain("export interface Tarea")
  })

  it("cada submódulo existe", () => {
    const files = [
      "lib/types/brand.ts",
      "lib/types/common.ts",
      "lib/types/config.ts",
      "lib/types/historia.ts",
      "lib/types/caso.ts",
      "lib/types/tarea.ts",
      "lib/types/sprint.ts",
      "lib/types/user.ts",
      "lib/types/notificacion.ts",
      "lib/types/api.ts",
    ]
    for (const f of files) {
      expect(fs.existsSync(path.resolve(f))).toBe(true)
    }
  })

  it("submódulos tienen <= 120 líneas cada uno", () => {
    const files = [
      "lib/types/brand.ts",
      "lib/types/common.ts",
      "lib/types/config.ts",
      "lib/types/historia.ts",
      "lib/types/caso.ts",
      "lib/types/tarea.ts",
      "lib/types/sprint.ts",
      "lib/types/user.ts",
      "lib/types/notificacion.ts",
      "lib/types/api.ts",
    ]
    for (const f of files) {
      const lines = read(f).split("\n").length
      expect(lines).toBeLessThanOrEqual(120)
    }
  })
})

describe("API_ROUTES — re-export funcional", () => {
  it("expone todas las rutas desde el barrel", async () => {
    const { API_ROUTES } = await import("@/lib/types")
    expect(API_ROUTES.HISTORIAS).toBe("/api/historias")
    expect(API_ROUTES.CASOS).toBe("/api/casos")
    expect(API_ROUTES.AUTH_LOGIN).toBe("/api/auth/login")
  })

  it("expone las rutas desde el submódulo directo", async () => {
    const api = await import("@/lib/types/api")
    expect(api.API_ROUTES.HISTORIAS).toBe("/api/historias")
  })
})

describe("types submódulos — imports directos", () => {
  it("historia.ts exporta HistoriaUsuario y tipos asociados", async () => {
    const src = read("lib/types/historia.ts")
    expect(src).toContain("export interface HistoriaUsuario")
    expect(src).toContain("export type EstadoHU")
    expect(src).toContain("export type PrioridadHU")
    expect(src).toContain("export interface EventoHistorial")
  })

  it("caso.ts exporta CasoPrueba y ejecución por etapa", async () => {
    const src = read("lib/types/caso.ts")
    expect(src).toContain("export interface CasoPrueba")
    expect(src).toContain("export interface ResultadoEtapa")
    expect(src).toContain("export type EstadoAprobacion")
  })

  it("common.ts contiene Bloqueo discriminated union", async () => {
    const src = read("lib/types/common.ts")
    expect(src).toContain("export interface BloqueoActivo")
    expect(src).toContain("export interface BloqueoResuelto")
    expect(src).toContain("export type Bloqueo")
    expect(src).toContain("resuelto: false")
    expect(src).toContain("resuelto: true")
  })
})
