import { describe, it, expect } from "vitest"
import {
  HttpError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError,
  UnprocessableEntityError,
  RateLimitError,
} from "@/lib/backend/errors"

describe("HTTP errors — status codes", () => {
  it("UnauthorizedError → 401", () => {
    const e = new UnauthorizedError("No auth")
    expect(e.status).toBe(401)
    expect(e.message).toBe("No auth")
  })

  it("ForbiddenError → 403", () => {
    const e = new ForbiddenError("Prohibido")
    expect(e.status).toBe(403)
  })

  it("NotFoundError defaults entity to 'Recurso' and status 404", () => {
    const e = new NotFoundError()
    expect(e.status).toBe(404)
    expect(e.message).toBe("Recurso no encontrado")
  })

  it("NotFoundError with feminine entity uses 'encontrada'", () => {
    const e = new NotFoundError("Historia")
    expect(e.message).toBe("Historia no encontrada")
  })

  it("NotFoundError with masculine entity uses 'encontrado'", () => {
    const e = new NotFoundError("Caso")
    expect(e.message).toBe("Caso no encontrado")
  })

  it("ValidationError → 400 with details array", () => {
    const e = new ValidationError("Invalid", ["field1 required", "field2 too short"])
    expect(e.status).toBe(400)
    expect(e.details).toEqual(["field1 required", "field2 too short"])
  })

  it("ConflictError → 409", () => {
    const e = new ConflictError("Duplicado")
    expect(e.status).toBe(409)
  })

  it("UnprocessableEntityError → 422", () => {
    const e = new UnprocessableEntityError("No procesable")
    expect(e.status).toBe(422)
  })

  it("RateLimitError → 429 with Retry-After computation", () => {
    const resetAt = Date.now() + 30_000
    const e = new RateLimitError(resetAt, 60)
    expect(e.status).toBe(429)
    expect(e.limit).toBe(60)
    expect(e.resetAt).toBe(resetAt)
  })
})

describe("HttpError.toResponse() serialization", () => {
  it("serializes basic error body", async () => {
    const e = new ForbiddenError("x")
    const res = e.toResponse()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: "x" })
  })

  it("serializes ValidationError with details", async () => {
    const e = new ValidationError("bad", ["a", "b"])
    const body = await e.toResponse().json()
    expect(body).toEqual({ error: "bad", details: ["a", "b"] })
  })

  it("RateLimitError response includes Retry-After + X-RateLimit-* headers", async () => {
    const e = new RateLimitError(Date.now() + 5_000, 100)
    const res = e.toResponse()
    expect(res.headers.get("Retry-After")).toBeTruthy()
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100")
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0")
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1)
  })

  it("instanceof HttpError chain holds for all typed errors", () => {
    const errors: HttpError[] = [
      new UnauthorizedError("x"),
      new ForbiddenError("x"),
      new NotFoundError(),
      new ValidationError(),
      new ConflictError("x"),
      new UnprocessableEntityError("x"),
      new RateLimitError(Date.now(), 10),
    ]
    for (const e of errors) expect(e).toBeInstanceOf(HttpError)
  })
})
