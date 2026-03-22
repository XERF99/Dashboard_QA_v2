// ═══════════════════════════════════════════════════════════
//  TESTS DE AUTH — login/logout via API
//  fetch está mockeado para simular respuestas del backend.
//  Los tests de addUser/deleteUser/roles siguen usando
//  la lógica localStorage del AuthProvider.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React from "react"
import { AuthProvider, useAuth, usuariosIniciales, PASSWORD_GENERICA } from "@/lib/contexts/auth-context"

// ── Mock de fetch ─────────────────────────────────────────
type LoginResult = { success: boolean; error?: string; bloqueadoAhora?: boolean; userId?: string; nombre?: string; debeCambiar?: boolean; user?: object }

// Estado mutable del mock para simular bloqueos
let mockLoginState: Record<string, { intentos: number; bloqueado: boolean }> = {}

function buildLoginMock(email: string, password: string): { ok: boolean; body: LoginResult } {
  const lowerEmail = email.toLowerCase()
  const user = usuariosIniciales.find(u => u.email.toLowerCase() === lowerEmail)

  if (!user) return { ok: false, body: { success: false, error: "Usuario no encontrado" } }
  if (user.activo === false) return { ok: false, body: { success: false, error: "Tu cuenta está desactivada. Contacta al administrador." } }

  const state = mockLoginState[lowerEmail] ?? { intentos: 0, bloqueado: false }
  if (state.bloqueado) return { ok: false, body: { success: false, error: "Tu cuenta está bloqueada por demasiados intentos fallidos." } }

  if (user.password !== password) {
    const intentos = state.intentos + 1
    const bloqueadoNow = intentos >= 5
    mockLoginState[lowerEmail] = { intentos, bloqueado: bloqueadoNow }
    if (bloqueadoNow) return { ok: false, body: { success: false, error: "Cuenta bloqueada por demasiados intentos fallidos.", bloqueadoAhora: true, userId: user.id, nombre: user.nombre } }
    const restantes = 5 - intentos
    return { ok: false, body: { success: false, error: `Contraseña incorrecta. ${restantes} intento${restantes !== 1 ? "s" : ""} restante${restantes !== 1 ? "s" : ""}.` } }
  }

  // Login exitoso
  mockLoginState[lowerEmail] = { intentos: 0, bloqueado: false }
  const debeCambiar = user.debeCambiarPassword ?? false
  return {
    ok: true,
    body: {
      success: true,
      debeCambiar,
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, activo: true, debeCambiarPassword: debeCambiar },
    },
  }
}

function setupFetchMock() {
  vi.stubGlobal("fetch", async (url: string, options?: RequestInit) => {
    if (typeof url === "string" && url.includes("/api/auth/login")) {
      const body = JSON.parse((options?.body as string) ?? "{}")
      const { ok, body: resBody } = buildLoginMock(body.email, body.password)
      return { ok, json: async () => resBody, text: async () => JSON.stringify(resBody) } as unknown as Response
    }
    if (typeof url === "string" && url.includes("/api/auth/logout")) {
      return { ok: true, json: async () => ({ success: true }), text: async () => "{}" } as unknown as Response
    }
    return { ok: true, json: async () => ({}), text: async () => "{}" } as unknown as Response
  })
}

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children)

function useAuthWrapped() {
  return renderHook(() => useAuth(), { wrapper })
}

const ADMIN_EMAIL    = "admin@empresa.com"
const ADMIN_PASSWORD = "admin123"

beforeEach(() => {
  mockLoginState = {}
  setupFetchMock()
})

// ── Tests: login básico ──────────────────────────────────────

describe("login — casos básicos", () => {
  it("usuario inexistente → error", async () => {
    const { result } = useAuthWrapped()
    let res: Awaited<ReturnType<typeof result.current.login>>

    await act(async () => { res = await result.current.login("nadie@empresa.com", "pass") })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/no encontrado/i)
  })

  it("cuenta inactiva → error", async () => {
    const { result } = useAuthWrapped()
    let res: Awaited<ReturnType<typeof result.current.login>>

    await act(async () => { res = await result.current.login("pedro.sanchez@empresa.com", "pedro123") })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/desactivada/i)
  })

  it("login correcto → success y isAuthenticated=true", async () => {
    const { result } = useAuthWrapped()
    let res: Awaited<ReturnType<typeof result.current.login>>

    await act(async () => { res = await result.current.login(ADMIN_EMAIL, ADMIN_PASSWORD) })

    expect(res!.success).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.email).toBe(ADMIN_EMAIL)
  })
})

// ── Tests: bloqueo por intentos fallidos ─────────────────────

describe("login — bloqueo por intentos fallidos", () => {
  it("contraseña incorrecta muestra intentos restantes", async () => {
    const { result } = useAuthWrapped()
    let res: Awaited<ReturnType<typeof result.current.login>>

    await act(async () => { res = await result.current.login(ADMIN_EMAIL, "wrong") })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/4 intento/i)
  })

  it("bloquea la cuenta en el 5.° intento fallido", async () => {
    const { result } = useAuthWrapped()
    let lastRes: Awaited<ReturnType<typeof result.current.login>>

    for (let i = 0; i < 5; i++) {
      await act(async () => { lastRes = await result.current.login(ADMIN_EMAIL, "wrong") })
    }

    expect(lastRes!.success).toBe(false)
    expect(lastRes!.error).toMatch(/bloqueada/i)
  })

  it("cuenta bloqueada rechaza incluso la contraseña correcta", async () => {
    const { result } = useAuthWrapped()

    for (let i = 0; i < 5; i++) {
      await act(async () => { await result.current.login(ADMIN_EMAIL, "wrong") })
    }

    let res: Awaited<ReturnType<typeof result.current.login>>
    await act(async () => { res = await result.current.login(ADMIN_EMAIL, ADMIN_PASSWORD) })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/bloqueada/i)
  })

  it("genera pendingBlockEvents al bloquear", async () => {
    const { result } = useAuthWrapped()

    for (let i = 0; i < 5; i++) {
      await act(async () => { await result.current.login(ADMIN_EMAIL, "wrong") })
    }

    expect(result.current.pendingBlockEvents.length).toBeGreaterThan(0)
    expect(result.current.pendingBlockEvents[0].nombre).toBeTruthy()
  })
})

// ── Tests: permisos addUser / deleteUser ─────────────────────

describe("addUser — guards de permisos", () => {
  it("admin no puede crear un usuario con rol admin", async () => {
    const { result } = useAuthWrapped()
    await act(async () => { await result.current.login(ADMIN_EMAIL, ADMIN_PASSWORD) })

    let res: ReturnType<typeof result.current.addUser>
    act(() => { res = result.current.addUser({ nombre: "Nuevo Admin", email: "nuevo@test.com", rol: "admin" }) })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/owner/i)
  })

  it("owner puede crear un usuario con rol admin", async () => {
    const { result } = useAuthWrapped()
    await act(async () => { await result.current.login("owner@empresa.com", "owner123") })

    let res: ReturnType<typeof result.current.addUser>
    act(() => { res = result.current.addUser({ nombre: "Nuevo Admin", email: "nuevoadmin@test.com", rol: "admin" }) })

    expect(res!.success).toBe(true)
  })

  it("no se puede crear un segundo owner", async () => {
    const { result } = useAuthWrapped()
    await act(async () => { await result.current.login("owner@empresa.com", "owner123") })

    let res: ReturnType<typeof result.current.addUser>
    act(() => { res = result.current.addUser({ nombre: "Otro Owner", email: "owner2@test.com", rol: "owner" }) })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/un Owner/i)
  })

  it("email duplicado → error", async () => {
    const { result } = useAuthWrapped()
    await act(async () => { await result.current.login("owner@empresa.com", "owner123") })

    let res: ReturnType<typeof result.current.addUser>
    act(() => { res = result.current.addUser({ nombre: "Copia", email: ADMIN_EMAIL, rol: "qa" }) })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/ya existe/i)
  })
})

describe("deleteUser — guards", () => {
  it("no puede eliminar su propia cuenta", async () => {
    const { result } = useAuthWrapped()
    await act(async () => { await result.current.login("owner@empresa.com", "owner123") })

    const ownerId = usuariosIniciales.find(u => u.email === "owner@empresa.com")!.id
    let res: ReturnType<typeof result.current.deleteUser>
    act(() => { res = result.current.deleteUser(ownerId) })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/propia cuenta/i)
  })
})
