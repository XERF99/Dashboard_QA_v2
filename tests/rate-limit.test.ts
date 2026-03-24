// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — rate-limit · checkRateLimit + getClientIp
//  Verifica el limitador de tasa en memoria: conteo,
//  bloqueo al superar el límite, ventana de tiempo y
//  extracción de IP desde headers.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { checkRateLimit, getClientIp } from "@/lib/backend/middleware/rate-limit"

// Nota: el store es un singleton del módulo. Se usan IPs únicas por grupo
// para aislar los tests sin necesidad de resetear el módulo.

// ── checkRateLimit ─────────────────────────────────────────

describe("checkRateLimit — conteo y bloqueo", () => {
  it("primera petición: allowed=true y remaining=limit-1", () => {
    const result = checkRateLimit("1.1.1.1", 5, 60_000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("peticiones sucesivas dentro del límite son todas permitidas", () => {
    const ip = "2.2.2.2"
    for (let i = 0; i < 5; i++) {
      const r = checkRateLimit(ip, 5, 60_000)
      expect(r.allowed).toBe(true)
    }
  })

  it("petición que supera el límite: allowed=false y remaining=0", () => {
    const ip = "3.3.3.3"
    for (let i = 0; i < 10; i++) checkRateLimit(ip, 10, 60_000)
    const over = checkRateLimit(ip, 10, 60_000)
    expect(over.allowed).toBe(false)
    expect(over.remaining).toBe(0)
  })

  it("IPs distintas tienen contadores independientes", () => {
    checkRateLimit("4.4.4.1", 2, 60_000)
    checkRateLimit("4.4.4.1", 2, 60_000)
    checkRateLimit("4.4.4.1", 2, 60_000) // supera límite para .1

    const other = checkRateLimit("4.4.4.2", 2, 60_000)
    expect(other.allowed).toBe(true)  // .2 no se ha visto antes
  })

  it("resetAt es mayor que Date.now()", () => {
    const before = Date.now()
    const result = checkRateLimit("5.5.5.5", 5, 60_000)
    expect(result.resetAt).toBeGreaterThan(before)
  })
})

describe("checkRateLimit — expiración de ventana", () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it("después de que expira la ventana el contador se reinicia", () => {
    const ip = "6.6.6.6"
    const limit = 3
    const window = 5_000 // 5 segundos

    // Consumir todo el límite
    for (let i = 0; i < limit; i++) checkRateLimit(ip, limit, window)
    expect(checkRateLimit(ip, limit, window).allowed).toBe(false)

    // Avanzar el tiempo más allá de la ventana
    vi.advanceTimersByTime(window + 100)

    // Ahora debe reiniciar
    const reset = checkRateLimit(ip, limit, window)
    expect(reset.allowed).toBe(true)
    expect(reset.remaining).toBe(limit - 1)
  })
})

// ── getClientIp ────────────────────────────────────────────

describe("getClientIp", () => {
  it("extrae la primera IP de x-forwarded-for cuando hay varias", () => {
    const headers = new Headers({ "x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3" })
    expect(getClientIp(headers)).toBe("10.0.0.1")
  })

  it("usa x-real-ip si no hay x-forwarded-for", () => {
    const headers = new Headers({ "x-real-ip": "192.168.1.5" })
    expect(getClientIp(headers)).toBe("192.168.1.5")
  })

  it("retorna 'unknown' si no hay ningún header de IP", () => {
    const headers = new Headers()
    expect(getClientIp(headers)).toBe("unknown")
  })

  it("x-forwarded-for tiene precedencia sobre x-real-ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "172.16.0.1",
      "x-real-ip": "192.168.1.1",
    })
    expect(getClientIp(headers)).toBe("172.16.0.1")
  })
})
