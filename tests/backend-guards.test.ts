import { describe, it, expect, vi, beforeEach } from "vitest"
import { z } from "zod"
import { NextRequest } from "next/server"

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    historiaUsuario: { findUnique: vi.fn() },
    casoPrueba:      { findUnique: vi.fn() },
    tarea:           { findUnique: vi.fn() },
  },
}))

import {
  requireRateLimit,
  requireBody,
  requireHU,
  requireCaso,
  requireTarea,
} from "@/lib/backend/middleware/guards"
import {
  RateLimitError,
  ValidationError,
  NotFoundError,
  UnprocessableEntityError,
} from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"

function makeRequest(body?: unknown, ip = "10.0.0.1"): NextRequest {
  return new NextRequest("http://localhost/test", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

describe("requireRateLimit", () => {
  it("passes silently under the limit", async () => {
    const req = makeRequest(undefined, "1.1.1.1")
    await expect(requireRateLimit(req, "test-route-pass", 5, 60_000)).resolves.toBeUndefined()
  })

  it("throws RateLimitError when exceeded", async () => {
    const req = makeRequest(undefined, "2.2.2.2")
    for (let i = 0; i < 3; i++) await requireRateLimit(req, "test-route-exceed", 3, 60_000)
    await expect(requireRateLimit(req, "test-route-exceed", 3, 60_000)).rejects.toBeInstanceOf(RateLimitError)
  })

  it("separates buckets by keyExtra (per-user scoping)", async () => {
    const req = makeRequest(undefined, "3.3.3.3")
    for (let i = 0; i < 2; i++) await requireRateLimit(req, "test-scoped", 2, 60_000, "userA")
    // userA is at cap; userB should still have room
    await expect(requireRateLimit(req, "test-scoped", 2, 60_000, "userA")).rejects.toBeInstanceOf(RateLimitError)
    await expect(requireRateLimit(req, "test-scoped", 2, 60_000, "userB")).resolves.toBeUndefined()
  })
})

describe("requireBody", () => {
  const schema = z.object({ name: z.string(), age: z.number().min(0).optional() })

  it("returns validated value on success", async () => {
    const req = makeRequest({ name: "Ana", age: 30 })
    const result = await requireBody(req, schema)
    expect(result).toEqual({ name: "Ana", age: 30 })
  })

  it("throws ValidationError for invalid JSON body", async () => {
    const req = new NextRequest("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not json",
    })
    await expect(requireBody(req, schema)).rejects.toThrow(ValidationError)
  })

  it("throws ValidationError with details for schema failures", async () => {
    const req = makeRequest({ age: -1 })
    try {
      await requireBody(req, schema)
      expect.fail("should have thrown")
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      expect((e as ValidationError).details?.length).toBeGreaterThan(0)
    }
  })

  it("rejects unknown fields by default", async () => {
    const req = makeRequest({ name: "Ana", extra: "x" })
    await expect(requireBody(req, schema)).rejects.toThrow(ValidationError)
  })

  it("allows unknown fields with allowUnknown option", async () => {
    const req = makeRequest({ name: "Ana", extra: "x" })
    const result = await requireBody(req, schema, { allowUnknown: true })
    expect(result).toEqual({ name: "Ana", extra: "x" })
  })
})

describe("requireHU / requireCaso / requireTarea", () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it("requireHU throws NotFoundError when HU missing", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue(null)
    await expect(requireHU("hu-1", "group-a")).rejects.toThrow(NotFoundError)
  })

  it("requireHU throws UnprocessableEntityError with asUnprocessable", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue(null)
    await expect(
      requireHU("hu-1", "group-a", { asUnprocessable: true })
    ).rejects.toThrow(UnprocessableEntityError)
  })

  it("requireHU throws NotFoundError when grupoId mismatches", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue({ grupoId: "other-group" } as never)
    await expect(requireHU("hu-1", "group-a")).rejects.toThrow(NotFoundError)
  })

  it("requireHU returns HU when access is granted", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue({ grupoId: "group-a" } as never)
    const hu = await requireHU("hu-1", "group-a")
    expect(hu).toEqual({ grupoId: "group-a" })
  })

  it("requireHU allows owner (undefined grupoId)", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue({ grupoId: "any-group" } as never)
    await expect(requireHU("hu-1", undefined)).resolves.toBeDefined()
  })

  it("requireCaso throws NotFoundError when not found", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValue(null)
    await expect(requireCaso("c-1", "g")).rejects.toThrow(NotFoundError)
  })

  it("requireTarea throws NotFoundError when not found", async () => {
    vi.mocked(prisma.tarea.findUnique).mockResolvedValue(null)
    await expect(requireTarea("t-1", "g")).rejects.toThrow(NotFoundError)
  })

  it("requireCaso throws UnprocessableEntityError with asUnprocessable", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValue(null)
    await expect(
      requireCaso("c-1", "g", { asUnprocessable: true })
    ).rejects.toThrow(UnprocessableEntityError)
  })
})
