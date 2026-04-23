// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.72  Middleware request-id propagation
//
//  Verifica que proxy.ts genera/propaga x-request-id.
//  Los tests son de grep sobre el fuente porque el middleware
//  Edge no es trivialmente ejecutable en entorno Node (depende
//  de Web APIs específicas de Next).
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

describe("proxy.ts — request id", () => {
  const src = read("proxy.ts")

  it("define ensureRequestId que genera UUID si no viene", () => {
    expect(src).toContain("function ensureRequestId")
    expect(src).toContain("crypto.randomUUID()")
  })

  it("respeta el header x-request-id entrante si es válido", () => {
    expect(src).toMatch(/REQUEST_ID_HEADER\s*=\s*"x-request-id"/)
    expect(src).toMatch(/existing\.length\s*<=\s*128/)
  })

  it("propaga el request id hacia handlers via forwardedHeaders", () => {
    expect(src).toContain("forwardedHeaders")
    expect(src).toContain("forwardedHeaders.set(REQUEST_ID_HEADER")
    expect(src).toContain("request: { headers: forwardedHeaders }")
  })

  it("incluye requestId en los errores de middleware (401/403/413)", () => {
    // Cada NextResponse.json de error pasa requestId en el body
    const errorResponses = src.match(/NextResponse\.json\(\s*\{[^}]*requestId[^}]*\}/g) ?? []
    expect(errorResponses.length).toBeGreaterThanOrEqual(3)
  })

  it("withRid añade el header x-request-id a la respuesta", () => {
    expect(src).toContain("function withRid")
    expect(src).toContain("response.headers.set(REQUEST_ID_HEADER")
  })
})

describe("with-auth.ts — envuelve handlers en runWithRequestId", () => {
  const src = read("lib/backend/middleware/with-auth.ts")

  it("importa runWithRequestId del logger", () => {
    expect(src).toContain("runWithRequestId")
    expect(src).toMatch(/from\s+"@\/lib\/backend\/logger"/)
  })

  it("withAuth corre el handler dentro de runWithRequestId", () => {
    expect(src).toMatch(/return\s+runWithRequestId\(requestId/)
  })

  it("withAuthAdmin también usa runWithRequestId", () => {
    // Contamos al menos 3 llamadas a runWithRequestId (withAuth, withAuthAdmin, withErrorHandler)
    const calls = src.match(/runWithRequestId\(/g) ?? []
    expect(calls.length).toBeGreaterThanOrEqual(3)
  })

  it("aplica el header x-request-id en la respuesta final", () => {
    expect(src).toContain("applyRequestIdHeader")
    expect(src).toContain("REQUEST_ID_HEADER")
  })

  it("incluye requestId en body del 500 genérico", () => {
    expect(src).toContain("getRequestId()")
    expect(src).toMatch(/body\.requestId\s*=\s*requestId/)
  })
})
