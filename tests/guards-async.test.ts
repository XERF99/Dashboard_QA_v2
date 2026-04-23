// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.73  Guards async migration
//
//  Verifica que:
//  1. requireRateLimit es async y lanza RateLimitError async.
//  2. Todas las rutas API llaman con `await requireRateLimit`.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest"
import fs from "fs"
import path from "path"
import { NextRequest } from "next/server"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { RateLimitError } from "@/lib/backend/errors"
import {
  MemoryRateLimitStore,
  _setRateLimitStoreForTests,
} from "@/lib/backend/middleware/rate-limit-store"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

describe("requireRateLimit — async", () => {
  beforeEach(() => {
    _setRateLimitStoreForTests(new MemoryRateLimitStore())
  })

  it("permite petición bajo el límite (no lanza)", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    })
    await expect(
      requireRateLimit(req, "test-route-" + Math.random(), 5, 60_000)
    ).resolves.toBeUndefined()
  })

  it("lanza RateLimitError al superar el cupo", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.5" },
    })
    const route = "test-burst-" + Math.random()
    for (let i = 0; i < 3; i++) {
      await requireRateLimit(req, route, 3, 60_000)
    }
    await expect(requireRateLimit(req, route, 3, 60_000)).rejects.toBeInstanceOf(RateLimitError)
  })

  it("el RateLimitError expone resetAt y limit", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.6" },
    })
    const route = "test-err-" + Math.random()
    for (let i = 0; i < 2; i++) await requireRateLimit(req, route, 2, 60_000)
    try {
      await requireRateLimit(req, route, 2, 60_000)
      expect.fail("debería haber lanzado")
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError)
      const err = e as RateLimitError
      expect(err.limit).toBe(2)
      expect(err.resetAt).toBeGreaterThan(Date.now())
    }
  })

  it("escopa el bucket por usuario con keyExtra", async () => {
    const req = new NextRequest("http://localhost/api/test", {
      headers: { "x-forwarded-for": "1.2.3.7" },
    })
    const route = "test-keyextra-" + Math.random()
    for (let i = 0; i < 3; i++) {
      await requireRateLimit(req, route, 3, 60_000, "user-A")
    }
    // user-A agotado, user-B debería seguir con cupo
    await expect(
      requireRateLimit(req, route, 3, 60_000, "user-B")
    ).resolves.toBeUndefined()
  })
})

describe("Rutas API — uso de await requireRateLimit", () => {
  const files = [
    "app/api/audit/route.ts",
    "app/api/auth/login/route.ts",
    "app/api/auth/password/route.ts",
    "app/api/auth/refresh/route.ts",
    "app/api/casos/batch/route.ts",
    "app/api/casos/route.ts",
    "app/api/casos/sync/route.ts",
    "app/api/casos/[id]/route.ts",
    "app/api/config/route.ts",
    "app/api/export/pdf/route.ts",
    "app/api/export/route.ts",
    "app/api/historias/route.ts",
    "app/api/historias/sync/route.ts",
    "app/api/historias/[id]/route.ts",
    "app/api/metricas/route.ts",
    "app/api/sprints/route.ts",
    "app/api/sprints/[id]/route.ts",
    "app/api/tareas/route.ts",
    "app/api/tareas/sync/route.ts",
    "app/api/tareas/[id]/route.ts",
    "app/api/users/route.ts",
    "app/api/users/[id]/route.ts",
  ]

  it.each(files)("%s usa await requireRateLimit", (f) => {
    const src = read(f)
    // Toda instancia de requireRateLimit( debe venir precedida por await.
    const bareCalls = src.match(/(?<!await\s)requireRateLimit\s*\(/g) ?? []
    // Permite `import { requireRateLimit }` y firmas (no precedidas por await).
    const imports = src.match(/import[^}]*requireRateLimit[^}]*\}/g) ?? []
    expect(bareCalls.length).toBeLessThanOrEqual(imports.length)
  })

  it("guards.ts define requireRateLimit como async", () => {
    const src = read("lib/backend/middleware/guards.ts")
    expect(src).toContain("export async function requireRateLimit")
    expect(src).toContain("Promise<void>")
    expect(src).toContain("await store.check")
  })
})
