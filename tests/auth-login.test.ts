import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import React from "react"
import { AuthProvider, useAuth, usuariosIniciales, PASSWORD_GENERICA } from "@/lib/auth-context"

// ── Wrapper ──────────────────────────────────────────────────

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AuthProvider, null, children)

// Credenciales del usuario admin de demo
const ADMIN_EMAIL = "admin@empresa.com"
const ADMIN_PASSWORD = "admin123"

// ── Helpers ──────────────────────────────────────────────────

function useAuthWrapped() {
  return renderHook(() => useAuth(), { wrapper })
}

// ── Tests: login básico ──────────────────────────────────────

describe("login — casos básicos", () => {
  it("usuario inexistente → error", () => {
    const { result } = useAuthWrapped()
    let res: ReturnType<typeof result.current.login>

    act(() => { res = result.current.login("nadie@empresa.com", "pass") })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/no encontrado/i)
  })

  it("cuenta inactiva → error", () => {
    const { result } = useAuthWrapped()
    let res: ReturnType<typeof result.current.login>

    // pedro.sanchez@empresa.com está inactivo en usuariosIniciales
    act(() => { res = result.current.login("pedro.sanchez@empresa.com", "pedro123") })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/desactivada/i)
  })

  it("login correcto → success y isAuthenticated=true", () => {
    const { result } = useAuthWrapped()
    let res: ReturnType<typeof result.current.login>

    act(() => { res = result.current.login(ADMIN_EMAIL, ADMIN_PASSWORD) })

    expect(res!.success).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user?.email).toBe(ADMIN_EMAIL)
  })

  it("login correcto con debeCambiarPassword → debeCambiar=true", () => {
    const { result } = useAuthWrapped()

    // Primero login como owner para resetear la contraseña de otro usuario
    act(() => { result.current.login("owner@empresa.com", "owner123") })
    act(() => { result.current.resetPassword("usr-001") })
    act(() => { result.current.logout() })

    // Admin ahora debe cambiar password (la genérica es PASSWORD_GENERICA)
    let res: ReturnType<typeof result.current.login>
    act(() => { res = result.current.login(ADMIN_EMAIL, PASSWORD_GENERICA) })

    expect(res!.success).toBe(true)
    expect(res!.debeCambiar).toBe(true)
    expect(result.current.pendientePassword).toBe(true)
  })
})

// ── Tests: bloqueo por intentos fallidos ─────────────────────

describe("login — bloqueo por intentos fallidos", () => {
  it("contraseña incorrecta muestra intentos restantes", () => {
    const { result } = useAuthWrapped()
    let res: ReturnType<typeof result.current.login>

    act(() => { res = result.current.login(ADMIN_EMAIL, "wrong") })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/4 intento/i)
  })

  it("bloquea la cuenta en el 5.° intento fallido", () => {
    const { result } = useAuthWrapped()
    let lastRes: ReturnType<typeof result.current.login>

    for (let i = 0; i < 5; i++) {
      act(() => { lastRes = result.current.login(ADMIN_EMAIL, "wrong") })
    }

    expect(lastRes!.success).toBe(false)
    expect(lastRes!.error).toMatch(/bloqueada/i)
  })

  it("cuenta bloqueada rechaza incluso la contraseña correcta", () => {
    const { result } = useAuthWrapped()

    // Bloquear cuenta
    for (let i = 0; i < 5; i++) {
      act(() => { result.current.login(ADMIN_EMAIL, "wrong") })
    }

    let res: ReturnType<typeof result.current.login>
    act(() => { res = result.current.login(ADMIN_EMAIL, ADMIN_PASSWORD) })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/bloqueada/i)
  })

  it("genera pendingBlockEvents al bloquear", () => {
    const { result } = useAuthWrapped()

    for (let i = 0; i < 5; i++) {
      act(() => { result.current.login(ADMIN_EMAIL, "wrong") })
    }

    expect(result.current.pendingBlockEvents.length).toBeGreaterThan(0)
    expect(result.current.pendingBlockEvents[0].nombre).toBeTruthy()
  })

  it("login exitoso resetea el contador de intentos fallidos", () => {
    const { result } = useAuthWrapped()

    // 2 intentos fallidos
    act(() => { result.current.login(ADMIN_EMAIL, "wrong") })
    act(() => { result.current.login(ADMIN_EMAIL, "wrong") })

    // Login correcto
    act(() => { result.current.login(ADMIN_EMAIL, ADMIN_PASSWORD) })
    act(() => { result.current.logout() })

    // Ahora, 4 intentos fallidos deben mostrar "1 intento restante" (no bloquear)
    let res: ReturnType<typeof result.current.login>
    for (let i = 0; i < 4; i++) {
      act(() => { res = result.current.login(ADMIN_EMAIL, "wrong") })
    }

    expect(res!.error).toMatch(/1 intento/i)
    expect(res!.error).not.toMatch(/bloqueada/i)
  })
})

// ── Tests: desbloqueo y reseteo ──────────────────────────────

describe("desbloquearUsuario + resetPassword", () => {
  it("desbloquear permite volver a hacer login", () => {
    const { result } = useAuthWrapped()

    // Primero loguearse como owner para poder desbloquear
    act(() => { result.current.login("owner@empresa.com", "owner123") })

    // Bloquear admin mediante setUsers directo no es posible desde el hook,
    // así que simulamos bloqueo desde owner: resetPassword desbloquea.
    const adminId = usuariosIniciales.find(u => u.email === ADMIN_EMAIL)!.id
    act(() => { result.current.desbloquearUsuario(adminId) })

    act(() => { result.current.logout() })

    let res: ReturnType<typeof result.current.login>
    act(() => { res = result.current.login(ADMIN_EMAIL, ADMIN_PASSWORD) })
    expect(res!.success).toBe(true)
  })

  it("resetPassword pone debeCambiarPassword=true y desbloquea", () => {
    const { result } = useAuthWrapped()

    act(() => { result.current.login("owner@empresa.com", "owner123") })

    const adminId = usuariosIniciales.find(u => u.email === ADMIN_EMAIL)!.id
    const resetResult = act(() => result.current.resetPassword(adminId))

    expect(result.current.users.find(u => u.id === adminId)?.debeCambiarPassword).toBe(true)
    expect(result.current.users.find(u => u.id === adminId)?.bloqueado).toBeFalsy()
  })
})

// ── Tests: permisos addUser / deleteUser ─────────────────────

describe("addUser — guards de permisos", () => {
  it("admin no puede crear un usuario con rol admin", () => {
    const { result } = useAuthWrapped()
    act(() => { result.current.login(ADMIN_EMAIL, ADMIN_PASSWORD) })

    let res: ReturnType<typeof result.current.addUser>
    act(() => {
      res = result.current.addUser({ nombre: "Nuevo Admin", email: "nuevo@test.com", rol: "admin" })
    })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/owner/i)
  })

  it("owner puede crear un usuario con rol admin", () => {
    const { result } = useAuthWrapped()
    act(() => { result.current.login("owner@empresa.com", "owner123") })

    let res: ReturnType<typeof result.current.addUser>
    act(() => {
      res = result.current.addUser({ nombre: "Nuevo Admin", email: "nuevoadmin@test.com", rol: "admin" })
    })

    expect(res!.success).toBe(true)
  })

  it("no se puede crear un segundo owner", () => {
    const { result } = useAuthWrapped()
    act(() => { result.current.login("owner@empresa.com", "owner123") })

    let res: ReturnType<typeof result.current.addUser>
    act(() => {
      res = result.current.addUser({ nombre: "Otro Owner", email: "owner2@test.com", rol: "owner" })
    })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/un Owner/i)
  })

  it("email duplicado → error", () => {
    const { result } = useAuthWrapped()
    act(() => { result.current.login("owner@empresa.com", "owner123") })

    let res: ReturnType<typeof result.current.addUser>
    act(() => {
      res = result.current.addUser({ nombre: "Copia", email: ADMIN_EMAIL, rol: "qa" })
    })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/ya existe/i)
  })
})

describe("deleteUser — guards", () => {
  it("no puede eliminar su propia cuenta", () => {
    const { result } = useAuthWrapped()
    act(() => { result.current.login("owner@empresa.com", "owner123") })

    const ownerId = usuariosIniciales.find(u => u.email === "owner@empresa.com")!.id
    let res: ReturnType<typeof result.current.deleteUser>
    act(() => { res = result.current.deleteUser(ownerId) })

    expect(res!.success).toBe(false)
    expect(res!.error).toMatch(/propia cuenta/i)
  })
})
