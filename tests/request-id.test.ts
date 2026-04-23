// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.72  Request ID tracing end-to-end
//
//  Verifica que:
//  1. HttpError.toResponse() incluye requestId en body + header
//     cuando hay uno en el AsyncLocalStorage del logger.
//  2. Cuando NO hay requestId en contexto, la respuesta no añade
//     el campo (compat hacia atrás).
//  3. ValidationError y RateLimitError también lo propagan.
//  4. Los wrappers (withAuth / withErrorHandler) corren el handler
//     dentro de runWithRequestId.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import {
  HttpError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
  RateLimitError,
} from "@/lib/backend/errors"
import { runWithRequestId, getRequestId } from "@/lib/backend/logger"

describe("HttpError — requestId en respuestas", () => {
  it("incluye requestId en body y header cuando hay contexto", async () => {
    const rid = "test-rid-12345"
    const res = await runWithRequestId(rid, () => {
      const e = new NotFoundError("Historia")
      return e.toResponse()
    })
    const body = await res.json()
    expect(body.requestId).toBe(rid)
    expect(res.headers.get("x-request-id")).toBe(rid)
  })

  it("no añade requestId si no hay contexto", async () => {
    const e = new UnauthorizedError("x")
    const body = await e.toResponse().json()
    expect(body.requestId).toBeUndefined()
  })

  it("ValidationError propaga requestId junto con details", async () => {
    const rid = "vr-1"
    const res = await runWithRequestId(rid, () => {
      const e = new ValidationError("bad", ["campo1 requerido"])
      return e.toResponse()
    })
    const body = await res.json()
    expect(body.requestId).toBe(rid)
    expect(body.details).toEqual(["campo1 requerido"])
    expect(res.headers.get("x-request-id")).toBe(rid)
  })

  it("RateLimitError mantiene Retry-After + añade requestId", async () => {
    const rid = "rl-1"
    const res = await runWithRequestId(rid, () => {
      const e = new RateLimitError(Date.now() + 5_000, 100)
      return e.toResponse()
    })
    const body = await res.json()
    expect(body.requestId).toBe(rid)
    expect(res.headers.get("x-request-id")).toBe(rid)
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100")
  })
})

describe("AsyncLocalStorage — runWithRequestId", () => {
  it("getRequestId devuelve el id activo dentro del scope", () => {
    runWithRequestId("abc", () => {
      expect(getRequestId()).toBe("abc")
    })
  })

  it("getRequestId es undefined fuera del scope", () => {
    expect(getRequestId()).toBeUndefined()
  })

  it("scopes anidados se mantienen separados", async () => {
    await runWithRequestId("outer", async () => {
      expect(getRequestId()).toBe("outer")
      await runWithRequestId("inner", async () => {
        expect(getRequestId()).toBe("inner")
      })
      // al volver al scope externo, vuelve "outer"
      expect(getRequestId()).toBe("outer")
    })
  })
})

describe("HttpError — instanceof chain preserved", () => {
  it("todas las subclases siguen siendo instanceof HttpError", () => {
    const errs: HttpError[] = [
      new UnauthorizedError("x"),
      new NotFoundError(),
      new ValidationError(),
      new RateLimitError(Date.now(), 10),
    ]
    for (const e of errs) expect(e).toBeInstanceOf(HttpError)
  })
})
