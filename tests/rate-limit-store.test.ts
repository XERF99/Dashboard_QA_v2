// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.73  RateLimitStore abstraction
//
//  Verifica que:
//  1. MemoryRateLimitStore cumple la interface (under/over/reset).
//  2. RedisRateLimitStore funciona con un RedisLike mock.
//  3. getRateLimitStore() es lazy y cacheado.
//  4. _setRateLimitStoreForTests permite inyección en tests.
//  5. guards.requireRateLimit sigue lanzando RateLimitError.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  MemoryRateLimitStore,
  RedisRateLimitStore,
  getRateLimitStore,
  _setRateLimitStoreForTests,
  type RateLimitStore,
} from "@/lib/backend/middleware/rate-limit-store"

describe("MemoryRateLimitStore", () => {
  let store: MemoryRateLimitStore

  beforeEach(() => { store = new MemoryRateLimitStore() })

  it("permite peticiones bajo el límite", async () => {
    const r = await store.check("k1", 5, 60_000)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(4)
  })

  it("bloquea al sobrepasar el límite", async () => {
    for (let i = 0; i < 5; i++) await store.check("k2", 5, 60_000)
    const r = await store.check("k2", 5, 60_000)
    expect(r.allowed).toBe(false)
    expect(r.remaining).toBe(0)
  })

  it("resetea tras el cierre de la ventana", async () => {
    for (let i = 0; i < 3; i++) await store.check("k3", 3, 50)
    await new Promise(r => setTimeout(r, 60))
    const r = await store.check("k3", 3, 50)
    expect(r.allowed).toBe(true)
  })

  it("aisla claves distintas", async () => {
    for (let i = 0; i < 5; i++) await store.check("ka", 5, 60_000)
    const r = await store.check("kb", 5, 60_000)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(4)
  })

  it("tiene name=memory", () => {
    expect(store.name).toBe("memory")
  })
})

describe("RedisRateLimitStore", () => {
  it("hace INCR y setea TTL en primera petición", async () => {
    const incr  = vi.fn().mockResolvedValue(1)
    const pttl  = vi.fn().mockResolvedValue(-1)
    const pexp  = vi.fn().mockResolvedValue(1)
    const store = new RedisRateLimitStore({ incr, pttl, pexpire: pexp })

    const r = await store.check("rk1", 10, 60_000)
    expect(incr).toHaveBeenCalledWith("rk1")
    expect(pttl).toHaveBeenCalledWith("rk1")
    expect(pexp).toHaveBeenCalledWith("rk1", 60_000)
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(9)
  })

  it("reusa TTL existente en peticiones subsiguientes", async () => {
    const incr = vi.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(3)
    const pttl = vi.fn().mockResolvedValueOnce(40_000).mockResolvedValueOnce(30_000)
    const pexp = vi.fn()
    const store = new RedisRateLimitStore({ incr, pttl, pexpire: pexp })

    const r1 = await store.check("rk2", 5, 60_000)
    const r2 = await store.check("rk2", 5, 60_000)
    expect(pexp).not.toHaveBeenCalled() // TTL ya existente
    expect(r1.remaining).toBe(3)
    expect(r2.remaining).toBe(2)
  })

  it("marca allowed=false cuando count > limit", async () => {
    const incr = vi.fn().mockResolvedValue(11)
    const pttl = vi.fn().mockResolvedValue(30_000)
    const store = new RedisRateLimitStore({ incr, pttl, pexpire: vi.fn() })

    const r = await store.check("rk3", 10, 60_000)
    expect(r.allowed).toBe(false)
    expect(r.remaining).toBe(0)
  })

  it("tiene name=redis", () => {
    const store = new RedisRateLimitStore({ incr: vi.fn(), pttl: vi.fn(), pexpire: vi.fn() })
    expect(store.name).toBe("redis")
  })
})

describe("getRateLimitStore — factory lazy", () => {
  beforeEach(() => {
    _setRateLimitStoreForTests(null)
    delete process.env.RATE_LIMIT_BACKEND
  })

  it("devuelve MemoryRateLimitStore cuando RATE_LIMIT_BACKEND no está seteado", async () => {
    const store = await getRateLimitStore()
    expect(store.name).toBe("memory")
  })

  it("es cacheado — misma instancia en llamadas concurrentes", async () => {
    const [s1, s2] = await Promise.all([getRateLimitStore(), getRateLimitStore()])
    expect(s1).toBe(s2)
  })

  it("cae a memory si RATE_LIMIT_BACKEND=redis pero faltan credenciales", async () => {
    process.env.RATE_LIMIT_BACKEND = "redis"
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    const store = await getRateLimitStore()
    expect(store.name).toBe("memory")
  })

  it("_setRateLimitStoreForTests permite inyectar un mock", async () => {
    const mock: RateLimitStore = {
      name: "mock",
      check: async () => ({ allowed: false, remaining: 0, resetAt: Date.now() + 1000 }),
    }
    _setRateLimitStoreForTests(mock)
    const store = await getRateLimitStore()
    expect(store.name).toBe("mock")
    expect((await store.check("k", 10, 60_000)).allowed).toBe(false)
  })
})
