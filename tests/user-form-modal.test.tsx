// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — UserFormModal
//  Verifica que al crear/editar usuarios:
//  1. Se llama a la API correctamente (POST / PUT)
//  2. El grupoId es heredado automáticamente del servidor
//  3. Los errores de la API se muestran en el formulario
//  4. refreshUsers se llama para sincronizar el estado desde la API
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// ── Mocks ──────────────────────────────────────────────────

const mockRefreshUsers = vi.fn().mockResolvedValue(undefined)

vi.mock("@/lib/contexts/auth-context", () => ({
  useAuth: () => ({
    users: [],
    roles: [
      { id: "admin",   label: "Administrador", permisos: ["canManageUsers"], cls: "", description: "Gestiona todo", esBase: true },
      { id: "qa_lead", label: "Lead",           permisos: ["canCreateHU", "canApproveCases"], cls: "", description: "Lead QA", esBase: true },
      { id: "qa",      label: "User",           permisos: ["canEdit", "verSoloPropios"], cls: "", description: "Ejecuta casos", esBase: true },
      { id: "viewer",  label: "Visualizador",   permisos: [], cls: "", description: "Solo lectura", esBase: true },
    ],
    isOwner: false,
    refreshUsers: mockRefreshUsers,
    user: { id: "usr-001", nombre: "Admin Test", email: "admin@test.com", rol: "admin", grupoId: "grupo-test" },
  }),
  PASSWORD_GENERICA: "Qatesting1",
}))

import { UserFormModal } from "@/components/dashboard/usuarios/user-form-modal"
import type { User } from "@/lib/contexts/auth-context"

// ── Mock global fetch ─────────────────────────────────────

const mockFetch = vi.fn()
global.fetch = mockFetch

const USUARIO_API_RESPONSE = {
  id: "cuid-db-001",
  nombre: "María García",
  email: "maria@test.com",
  rol: "qa",
  grupoId: "grupo-test",
  activo: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ user: USUARIO_API_RESPONSE }),
  } as unknown as Response)
})

// ── Helpers ───────────────────────────────────────────────

function renderModal(userToEdit: User | null = null) {
  const onClose = vi.fn()
  render(<UserFormModal open={true} userToEdit={userToEdit} onClose={onClose} />)
  return { onClose }
}

function rellenarFormulario(nombre: string, email: string) {
  fireEvent.change(screen.getByPlaceholderText("Juan Pérez"),       { target: { value: nombre } })
  fireEvent.change(screen.getByPlaceholderText("juan@empresa.com"), { target: { value: email } })
}

// ── Renderizado básico ────────────────────────────────────

describe("UserFormModal — renderizado", () => {
  it("muestra 'Nuevo Usuario' cuando userToEdit es null", () => {
    renderModal(null)
    expect(screen.getByText("Nuevo Usuario")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /crear usuario/i })).toBeInTheDocument()
  })

  it("muestra 'Editar Usuario' cuando hay userToEdit", () => {
    const u = { id: "u1", nombre: "Ana", email: "ana@test.com", rol: "qa", grupoId: "g1", activo: true, password: "x", fechaCreacion: new Date(), debeCambiarPassword: false } as User
    renderModal(u)
    expect(screen.getByText("Editar Usuario")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /guardar cambios/i })).toBeInTheDocument()
  })

  it("pre-rellena los campos al editar", () => {
    const u = { id: "u1", nombre: "Carlos López", email: "carlos@test.com", rol: "viewer", grupoId: "g1", activo: true, password: "x", fechaCreacion: new Date(), debeCambiarPassword: false } as User
    renderModal(u)
    expect(screen.getByDisplayValue("Carlos López")).toBeInTheDocument()
    expect(screen.getByDisplayValue("carlos@test.com")).toBeInTheDocument()
  })

  it("NO muestra el selector de equipo (equipoIds eliminado)", () => {
    renderModal(null)
    expect(screen.queryByText(/miembros del equipo/i)).not.toBeInTheDocument()
  })
})

// ── Crear usuario — integración con API ───────────────────

describe("UserFormModal — crear usuario vía API", () => {
  it("llama a POST /api/users al enviar el formulario", async () => {
    renderModal(null)
    rellenarFormulario("María García", "maria@test.com")
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/users",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("el body NO incluye grupoId — el servidor lo hereda del token", async () => {
    renderModal(null)
    rellenarFormulario("María García", "maria@test.com")
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.grupoId).toBeUndefined()
    expect(body.nombre).toBe("María García")
    expect(body.email).toBe("maria@test.com")
  })

  it("llama a refreshUsers tras crear correctamente", async () => {
    renderModal(null)
    rellenarFormulario("María García", "maria@test.com")
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }))

    await waitFor(() => expect(mockRefreshUsers).toHaveBeenCalled())
  })

  it("cierra el modal tras crear correctamente", async () => {
    const { onClose } = renderModal(null)
    rellenarFormulario("Test User", "test@test.com")
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })
})

// ── Crear usuario — manejo de errores de API ─────────────

describe("UserFormModal — errores de API al crear", () => {
  it("muestra el error cuando el email ya existe (409)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "El email ya está registrado" }),
    } as unknown as Response)

    renderModal(null)
    rellenarFormulario("Duplicado", "duplicado@test.com")
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }))

    await waitFor(() => {
      expect(screen.getByText(/El email ya está registrado/i)).toBeInTheDocument()
    })
  })

  it("NO llama a refreshUsers cuando la API falla", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Error del servidor" }),
    } as unknown as Response)

    renderModal(null)
    rellenarFormulario("Error User", "error@test.com")
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }))

    await waitFor(() => screen.getByText(/Error del servidor/i))
    expect(mockRefreshUsers).not.toHaveBeenCalled()
  })

  it("NO cierra el modal cuando la API falla", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Fallo" }),
    } as unknown as Response)

    const { onClose } = renderModal(null)
    rellenarFormulario("Fail", "fail@test.com")
    fireEvent.click(screen.getByRole("button", { name: /crear usuario/i }))

    await waitFor(() => screen.getByText(/Fallo/i))
    expect(onClose).not.toHaveBeenCalled()
  })
})

// ── Editar usuario — integración con API ─────────────────

describe("UserFormModal — editar usuario vía API", () => {
  const usuarioEditar: User = {
    id: "usr-002",
    nombre: "Laura Mendez",
    email: "laura@test.com",
    rol: "qa_lead",
    grupoId: "grupo-test",
    activo: true,
    password: "xxx",
    fechaCreacion: new Date("2026-01-01"),
    debeCambiarPassword: false,
  }

  it("llama a PUT /api/users/[id] al guardar cambios", async () => {
    renderModal(usuarioEditar)
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/users/${usuarioEditar.id}`,
        expect.objectContaining({ method: "PUT" })
      )
    })
  })

  it("el body de PUT incluye el id del usuario", async () => {
    renderModal(usuarioEditar)
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.id).toBe(usuarioEditar.id)
    expect(body.nombre).toBe("Laura Mendez")
    expect(body.email).toBe("laura@test.com")
  })

  it("el body de PUT NO incluye equipoIds", async () => {
    renderModal(usuarioEditar)
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string)
    expect(body.equipoIds).toBeUndefined()
  })

  it("llama a refreshUsers tras actualizar correctamente", async () => {
    renderModal(usuarioEditar)
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => expect(mockRefreshUsers).toHaveBeenCalled())
  })

  it("muestra error de API al editar con email duplicado", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Email ya en uso por otro usuario" }),
    } as unknown as Response)

    renderModal(usuarioEditar)
    fireEvent.change(screen.getByDisplayValue("laura@test.com"), { target: { value: "otro@test.com" } })
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }))

    await waitFor(() => {
      expect(screen.getByText(/Email ya en uso/i)).toBeInTheDocument()
    })
    expect(mockRefreshUsers).not.toHaveBeenCalled()
  })
})
