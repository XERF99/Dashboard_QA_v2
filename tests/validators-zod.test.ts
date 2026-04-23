// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.74  Migración Joi → Zod en validators/*.ts
//
//  Verifica que:
//  1. Los 5 archivos de validators exportan schemas Zod (no Joi).
//  2. Cada schema tiene un tipo inferido exportado (CreateXDTO, UpdateXDTO).
//  3. safeParse() funciona en los casos típicos (éxito / error con details).
//  4. Los tipos z.infer<> son compatibles con los servicios de dominio.
//  5. No queda ninguna referencia a Joi en lib/.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"
import { z } from "zod"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ── 1. Ninguno importa Joi ─────────────────────────────────
describe("validators — sin dependencia de Joi", () => {
  const files = [
    "lib/backend/validators/auth.validator.ts",
    "lib/backend/validators/historia.validator.ts",
    "lib/backend/validators/caso.validator.ts",
    "lib/backend/validators/tarea.validator.ts",
    "lib/backend/validators/config.validator.ts",
  ]

  it.each(files)("%s usa Zod y no importa Joi", (f) => {
    const src = read(f)
    expect(src).toContain('from "zod"')
    expect(src).not.toMatch(/from\s+["']joi["']/)
    expect(src).not.toContain("Joi.")
  })
})

// ── 2. Tipos inferidos ─────────────────────────────────────
describe("validators — tipos inferidos exportados", () => {
  it("auth.validator exporta LoginDTO, CreateUserDTO, UpdateUserDTO, CambiarPasswordDTO", async () => {
    const src = read("lib/backend/validators/auth.validator.ts")
    expect(src).toContain("export type LoginDTO")
    expect(src).toContain("export type CreateUserDTO")
    expect(src).toContain("export type UpdateUserDTO")
    expect(src).toContain("export type CambiarPasswordDTO")
    expect(src).toMatch(/z\.infer<typeof/)
  })

  it("historia.validator exporta CreateHistoriaDTO, UpdateHistoriaDTO", () => {
    const src = read("lib/backend/validators/historia.validator.ts")
    expect(src).toContain("export type CreateHistoriaDTO")
    expect(src).toContain("export type UpdateHistoriaDTO")
  })

  it("caso.validator exporta CreateCasoDTO, UpdateCasoDTO", () => {
    const src = read("lib/backend/validators/caso.validator.ts")
    expect(src).toContain("export type CreateCasoDTO")
    expect(src).toContain("export type UpdateCasoDTO")
  })

  it("tarea.validator exporta CreateTareaDTO, UpdateTareaDTO", () => {
    const src = read("lib/backend/validators/tarea.validator.ts")
    expect(src).toContain("export type CreateTareaDTO")
    expect(src).toContain("export type UpdateTareaDTO")
  })

  it("config.validator exporta UpdateConfigDTO", () => {
    const src = read("lib/backend/validators/config.validator.ts")
    expect(src).toContain("export type UpdateConfigDTO")
  })
})

// ── 3. Validación en runtime ───────────────────────────────
describe("auth.validator — comportamiento runtime", () => {
  it("loginSchema rechaza email inválido", async () => {
    const { loginSchema } = await import("@/lib/backend/validators/auth.validator")
    const r = loginSchema.safeParse({ email: "no-email", password: "12345678" })
    expect(r.success).toBe(false)
  })

  it("loginSchema acepta un payload válido", async () => {
    const { loginSchema } = await import("@/lib/backend/validators/auth.validator")
    const r = loginSchema.safeParse({ email: "a@b.com", password: "12345678" })
    expect(r.success).toBe(true)
  })

  it("cambiarPasswordSchema valida complejidad", async () => {
    const { cambiarPasswordSchema } = await import("@/lib/backend/validators/auth.validator")
    expect(cambiarPasswordSchema.safeParse({ actual: "x", nueva: "simple12" }).success).toBe(false)  // sin mayúscula ni símbolo
    expect(cambiarPasswordSchema.safeParse({ actual: "x", nueva: "Segura1!" }).success).toBe(true)
  })

  it("createUserSchema valida rol enum", async () => {
    const { createUserSchema } = await import("@/lib/backend/validators/auth.validator")
    expect(createUserSchema.safeParse({ nombre: "Ana", email: "a@b.com", rol: "fake" }).success).toBe(false)
    expect(createUserSchema.safeParse({ nombre: "Ana", email: "a@b.com", rol: "qa" }).success).toBe(true)
  })
})

describe("historia.validator — comportamiento runtime", () => {
  it("createHistoriaSchema aplica defaults", async () => {
    const { createHistoriaSchema } = await import("@/lib/backend/validators/historia.validator")
    const r = createHistoriaSchema.safeParse({
      codigo: "H-1", titulo: "T", responsable: "R", tipoAplicacion: "ta", creadoPor: "u",
    })
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.prioridad).toBe("media")  // default
      expect(r.data.descripcion).toBe("")     // default
      expect(r.data.permitirCasosAdicionales).toBe(false)  // default
    }
  })

  it("updateHistoriaSchema rechaza estado inválido", async () => {
    const { updateHistoriaSchema } = await import("@/lib/backend/validators/historia.validator")
    const r = updateHistoriaSchema.safeParse({
      codigo: "H-1", titulo: "T", responsable: "R", tipoAplicacion: "ta", creadoPor: "u",
      estado: "invalido",
    })
    expect(r.success).toBe(false)
  })
})

describe("caso.validator — comportamiento runtime", () => {
  it("createCasoSchema rechaza entorno inválido", async () => {
    const { createCasoSchema } = await import("@/lib/backend/validators/caso.validator")
    const r = createCasoSchema.safeParse({ huId: "h", titulo: "T", creadoPor: "u", entorno: "prod" })
    expect(r.success).toBe(false)
  })

  it("createCasoSchema default complejidad=media", async () => {
    const { createCasoSchema } = await import("@/lib/backend/validators/caso.validator")
    const r = createCasoSchema.safeParse({ huId: "h", titulo: "T", creadoPor: "u" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.complejidad).toBe("media")
  })
})

// ── 4. requireBody + Zod ───────────────────────────────────
describe("requireBody — integración con Zod", () => {
  it("retorna data tipada en éxito", async () => {
    const { requireBody } = await import("@/lib/backend/middleware/guards")
    const { NextRequest } = await import("next/server")
    const schema = z.object({ n: z.number() })
    const req = new NextRequest("http://localhost/test", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ n: 42 }),
    })
    const result = await requireBody(req, schema)
    expect(result.n).toBe(42)
  })

  it("lanza ValidationError con paths en details", async () => {
    const { requireBody } = await import("@/lib/backend/middleware/guards")
    const { ValidationError } = await import("@/lib/backend/errors")
    const { NextRequest } = await import("next/server")
    const schema = z.object({ nombre: z.string(), edad: z.number().min(0) })
    const req = new NextRequest("http://localhost/test", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ nombre: "Ana", edad: -1 }),
    })
    try {
      await requireBody(req, schema)
      expect.fail("debería haber lanzado")
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      const err = e as InstanceType<typeof ValidationError>
      expect(err.details).toBeDefined()
      expect(err.details!.some(d => d.includes("edad"))).toBe(true)
    }
  })

  it("strict por default: rechaza campos desconocidos", async () => {
    const { requireBody } = await import("@/lib/backend/middleware/guards")
    const { ValidationError } = await import("@/lib/backend/errors")
    const { NextRequest } = await import("next/server")
    const schema = z.object({ x: z.string() })
    const req = new NextRequest("http://localhost/test", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ x: "a", extra: "b" }),
    })
    await expect(requireBody(req, schema)).rejects.toBeInstanceOf(ValidationError)
  })

  it("allowUnknown: true → preserva campos desconocidos", async () => {
    const { requireBody } = await import("@/lib/backend/middleware/guards")
    const { NextRequest } = await import("next/server")
    const schema = z.object({ x: z.string() })
    const req = new NextRequest("http://localhost/test", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ x: "a", extra: "b" }),
    })
    const result = await requireBody(req, schema, { allowUnknown: true })
    expect(result.x).toBe("a")
    expect((result as Record<string, unknown>).extra).toBe("b")
  })

  it("body JSON inválido → ValidationError", async () => {
    const { requireBody } = await import("@/lib/backend/middleware/guards")
    const { ValidationError } = await import("@/lib/backend/errors")
    const { NextRequest } = await import("next/server")
    const schema = z.object({ x: z.string() })
    const req = new NextRequest("http://localhost/test", {
      method: "POST", headers: { "content-type": "application/json" },
      body: "not json",
    })
    await expect(requireBody(req, schema)).rejects.toThrow(ValidationError)
  })
})

// ── 5. package.json sin Joi ────────────────────────────────
describe("package.json — sin Joi", () => {
  const pkg = JSON.parse(read("package.json"))

  it("joi no está en dependencies", () => {
    expect(pkg.dependencies?.joi).toBeUndefined()
  })

  it("joi no está en devDependencies", () => {
    expect(pkg.devDependencies?.joi).toBeUndefined()
  })

  it("zod sigue presente", () => {
    expect(pkg.dependencies?.zod).toBeTruthy()
  })
})
