// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — auth-context · expiración automática de sesión
//  Verifica que el polling periódico detecta JWT vencido,
//  actualiza sessionExpired y que el login lo resetea.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import React from "react"
import { AuthProvider, useAuth } from "@/lib/contexts/auth-context"

// ── Fixture de usuario ────────────────────────────────────
const MOCK_USER = {
  id: "usr-001", nombre: "Admin", email: "admin@empresa.com", rol: "admin",
  activo: true, debeCambiarPassword: false, fechaCreacion: new Date().toISOString(),
}

// ── Respuestas mock reutilizables ─────────────────────────
const meOk = {
  ok: true, status: 200,
  text: async () => JSON.stringify({ user: MOCK_USER }),
  json: async () => ({ user: MOCK_USER }),
} as unknown as Response

const me401 = {
  ok: false, status: 401,
  text: async () => JSON.stringify({ error: "No autenticado" }),
  json: async () => ({ error: "No autenticado" }),
} as unknown as Response

const refresh401 = {
  ok: false, status: 401,
  text: async () => JSON.stringify({ error: "No refresh token" }),
  json: async () => ({ error: "No refresh token" }),
} as unknown as Response

const empty = {
  ok: true, status: 200,
  text: async () => "{}",
  json: async () => ({}),
} as unknown as Response

const loginOk = {
  ok: true, status: 200,
  text: async () => JSON.stringify({ user: MOCK_USER }),
  json: async () => ({ user: MOCK_USER }),
} as unknown as Response

// ── Wrapper ───────────────────────────────────────────────
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children)

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// ── Tests ─────────────────────────────────────────────────

describe("auth-context — expiración de sesión", () => {

  it("sessionExpired es false al iniciar la sesión", async () => {
    vi.stubGlobal("fetch", async (url: string) => {
      if ((url as string).includes("/api/auth/me")) return meOk
      return empty
    })

    const { result } = renderHook(() => useAuth(), { wrapper })
    await waitFor(() => expect(result.current.sessionLoading).toBe(false))

    expect(result.current.sessionExpired).toBe(false)
  })

  it("polling 401 → sessionExpired=true, user=null, isAuthenticated=false", async () => {
    vi.useFakeTimers()
    let meCount = 0
    vi.stubGlobal("fetch", async (url: string) => {
      if ((url as string).includes("/api/auth/me")) return meCount++ === 0 ? meOk : me401
      if ((url as string).includes("/api/auth/refresh")) return refresh401
      return empty
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Flush initial /api/auth/me (microtask — not affected by fake timers)
    await act(async () => { await Promise.resolve() })
    await act(async () => { await Promise.resolve() })

    expect(result.current.user?.email).toBe("admin@empresa.com")
    expect(result.current.sessionExpired).toBe(false)

    // Avanzar 5 minutos → dispara el intervalo
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 500)
    })

    expect(result.current.sessionExpired).toBe(true)
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("login exitoso después de expirar → sessionExpired=false, isAuthenticated=true", async () => {
    vi.useFakeTimers()
    let meCount = 0
    vi.stubGlobal("fetch", async (url: string, _options?: RequestInit) => {
      if ((url as string).includes("/api/auth/me")) return meCount++ === 0 ? meOk : me401
      if ((url as string).includes("/api/auth/refresh")) return refresh401
      if ((url as string).includes("/api/auth/login")) return loginOk
      return empty
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => { await Promise.resolve() })
    await act(async () => { await Promise.resolve() })

    // Expirar sesión
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 500)
    })

    expect(result.current.sessionExpired).toBe(true)

    // Login de nuevo
    await act(async () => {
      await result.current.login("admin@empresa.com", "admin123")
    })

    expect(result.current.sessionExpired).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("sin usuario autenticado, avanzar el tiempo no activa sessionExpired", async () => {
    vi.useFakeTimers()
    // /api/auth/me siempre 401 → user nunca se establece
    vi.stubGlobal("fetch", async (url: string) => {
      if ((url as string).includes("/api/auth/me")) return me401
      if ((url as string).includes("/api/auth/refresh")) return refresh401
      return empty
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => { await Promise.resolve() })
    await act(async () => { await Promise.resolve() })

    expect(result.current.user).toBeNull()

    // Avanzar 5 min — el intervalo NO se inicia cuando user===null
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 500)
    })

    // sessionExpired sigue false porque el intervalo nunca arrancó
    expect(result.current.sessionExpired).toBe(false)
  })

  it("polling exitoso repetido → sessionExpired permanece false", async () => {
    vi.useFakeTimers()
    // /api/auth/me siempre ok
    vi.stubGlobal("fetch", async (url: string) => {
      if ((url as string).includes("/api/auth/me")) return meOk
      return empty
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => { await Promise.resolve() })
    await act(async () => { await Promise.resolve() })

    expect(result.current.user?.email).toBe("admin@empresa.com")

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 500)
    })

    expect(result.current.sessionExpired).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
  })
})
