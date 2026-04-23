// ═══════════════════════════════════════════════════════════
//  RATE LIMIT STORE — Abstracción del backend de throttle
//
//  Hasta v2.72 el rate-limit vivía en un Map en memoria. Eso
//  funciona para un solo proceso, pero en serverless con N
//  réplicas cada instancia tiene su propio contador y los
//  límites se vuelven laxos (N × limit real).
//
//  Esta capa introduce una interface `RateLimitStore` con dos
//  implementaciones:
//    • MemoryStore — Map in-process (default, dev/single-instance)
//    • RedisStore  — Upstash/ioredis, atómico vía INCR+EXPIRE
//                    (opcional, se activa con RATE_LIMIT_BACKEND=redis
//                    y UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
//
//  La selección es lazy: si Redis falla al inicializarse se
//  cae al MemoryStore y se emite un `logger.warn`.
// ═══════════════════════════════════════════════════════════

import { logger } from "@/lib/backend/logger"
import { checkRateLimit } from "./rate-limit"

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number
}

export interface RateLimitStore {
  readonly name: string
  check(key: string, limit: number, windowMs: number): Promise<RateLimitResult>
}

// ── Memoria in-process (default) ─────────────────────────────
// Delega en `checkRateLimit` de rate-limit.ts para preservar el
// contador global (compartido entre routes) y mantener compatibilidad
// con tests existentes que mockean ese símbolo.
export class MemoryRateLimitStore implements RateLimitStore {
  readonly name = "memory"

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    return checkRateLimit(key, limit, windowMs)
  }
}

// ── Redis (Upstash REST) ─────────────────────────────────────
// Implementación basada en INCR + PEXPIRE atómico. La primera
// petición crea la clave con TTL; sucesivas incrementan un contador
// que vive hasta que expira. Para Upstash se usa el cliente REST
// que es compatible con edge runtime.

interface RedisLike {
  // Devuelve el valor tras incrementar
  incr(key: string): Promise<number>
  // Establece TTL en milisegundos si la clave no tiene ya uno
  pexpire(key: string, ms: number): Promise<number>
  // TTL restante en ms (−1 si no existe, −2 si no hay TTL)
  pttl(key: string): Promise<number>
}

export class RedisRateLimitStore implements RateLimitStore {
  readonly name = "redis"
  constructor(private readonly redis: RedisLike) {}

  async check(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
    const count = await this.redis.incr(key)
    // Si es el primer hit de la ventana, pon el TTL.
    // Si ya existía, pexpire con NX haría esto mejor; pero la API REST
    // no lo expone siempre — usamos pttl como fallback.
    let ttl = await this.redis.pttl(key)
    if (ttl < 0) {
      await this.redis.pexpire(key, windowMs)
      ttl = windowMs
    }
    const resetAt = Date.now() + ttl
    const remaining = Math.max(0, limit - count)
    return { allowed: count <= limit, remaining, resetAt }
  }
}

// ── Factory ─────────────────────────────────────────────────
// Lazy: sólo intenta Redis si el env lo pide y las credenciales
// están presentes. Si la importación del cliente falla, cae a
// memoria y loggea warn (no rompe el boot).

async function tryCreateRedisStore(): Promise<RateLimitStore | null> {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    logger.warn("rate-limit-store", "RATE_LIMIT_BACKEND=redis pero faltan credenciales UPSTASH_REDIS_REST_*")
    return null
  }
  try {
    // Desde v2.77 `@upstash/redis` es dep oficial — import estático normal.
    // En runtime Edge el cliente usa fetch() contra la REST API de Upstash.
    const { Redis } = await import("@upstash/redis")
    const redis = new Redis({ url, token })
    return new RedisRateLimitStore(redis)
  } catch (err) {
    logger.warn("rate-limit-store", `Error inicializando Redis — ${err instanceof Error ? err.message : String(err)}`)
    return null
  }
}

let _store: RateLimitStore | null = null
let _initPromise: Promise<RateLimitStore> | null = null

async function initStore(): Promise<RateLimitStore> {
  if (process.env.RATE_LIMIT_BACKEND === "redis") {
    const redis = await tryCreateRedisStore()
    if (redis) {
      logger.info("rate-limit-store", "Backend seleccionado: redis")
      return redis
    }
    logger.warn("rate-limit-store", "Fallback a memory (Redis no disponible)")
  }
  return new MemoryRateLimitStore()
}

/** Devuelve el store activo (lazy, cacheado). Seguro para llamadas concurrentes. */
export async function getRateLimitStore(): Promise<RateLimitStore> {
  if (_store) return _store
  if (!_initPromise) _initPromise = initStore().then(s => (_store = s))
  return _initPromise
}

/** Sustituye el store activo — SOLO para tests. */
export function _setRateLimitStoreForTests(s: RateLimitStore | null): void {
  _store = s
  _initPromise = null
}
