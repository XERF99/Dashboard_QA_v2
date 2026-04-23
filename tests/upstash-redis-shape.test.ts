// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.77  Integración @upstash/redis
//
//  Verifica (sin hacer red) que:
//  1. El paquete @upstash/redis expone `Redis` con los métodos
//     que espera nuestra interface `RedisLike`.
//  2. La migración live es segura: el RedisRateLimitStore va a
//     funcionar con el cliente oficial sin cambios de código.
//  3. Una instancia stub con credenciales falsas crea correctamente
//     el objeto (falla solo al hacer llamadas reales, que no
//     hacemos aquí).
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import { Redis } from "@upstash/redis"
import { RedisRateLimitStore } from "@/lib/backend/middleware/rate-limit-store"

describe("@upstash/redis — shape compatible con RedisLike", () => {
  it("exporta la clase Redis", () => {
    expect(typeof Redis).toBe("function")
  })

  it("una instancia expone incr, pexpire, pttl", () => {
    // Credenciales dummy — NO se hacen llamadas, sólo shape-check.
    const redis = new Redis({ url: "https://fake.upstash.io", token: "fake" })
    expect(typeof redis.incr).toBe("function")
    expect(typeof redis.pexpire).toBe("function")
    expect(typeof redis.pttl).toBe("function")
  })

  it("compila como RedisLike — se puede pasar a RedisRateLimitStore", () => {
    // Si los tipos de @upstash/redis cambian y ya no satisfacen
    // `RedisLike`, este test deja de compilar en CI (typecheck).
    const redis = new Redis({ url: "https://fake.upstash.io", token: "fake" })
    const store = new RedisRateLimitStore(redis)
    expect(store.name).toBe("redis")
  })
})

describe("@upstash/redis — dep registrada", () => {
  it("aparece en package.json dependencies", async () => {
    const pkg = await import("../package.json")
    expect(pkg.default.dependencies["@upstash/redis"]).toBeTruthy()
  })
})
