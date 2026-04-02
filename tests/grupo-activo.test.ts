// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — Bloqueo por grupo inactivo
//  Cubre los dos niveles de enforcement:
//    A) loginService rechaza si el grupo del usuario está inactivo
//    B) requireAuth rechaza peticiones en curso si el grupo está inactivo
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// ── Mocks (hoisted para evitar TDZ con vi.mock) ────────────

const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    user:  { findUnique: vi.fn(), update: vi.fn() },
    grupo: { findUnique: vi.fn() },
  }
  return { mockPrisma }
})

vi.mock("@/lib/backend/prisma", () => ({ prisma: mockPrisma }))

vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
  compare: vi.fn(),
  hash: vi.fn(),
}))

vi.mock("@/lib/contexts/auth-context", () => ({
  PASSWORD_GENERICA: "Cambiar123!",
}))

import bcrypt from "bcryptjs"
import { loginService } from "@/lib/backend/services/auth.service"
import { requireAuth, signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Fixtures ──────────────────────────────────────────────

const mockGrupoActivo   = { id: "g-1", nombre: "Equipo Alpha",    activo: true  }
const mockGrupoInactivo = { id: "g-2", nombre: "Equipo Inactivo", activo: false }

const mockUser = {
  id: "usr-admin",
  nombre: "Admin Test",
  email: "admin@test.com",
  passwordHash: "$2a$10$hashed",
  rol: "admin",
  activo: true,
  bloqueado: false,
  grupoId: "g-1",
  intentosFallidos: 0,
  historialConexiones: [],
  debeCambiarPassword: false,
  fechaCreacion: new Date(),
  grupo: mockGrupoActivo,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.user.update.mockResolvedValue({})
  mockPrisma.user.findUnique.mockResolvedValue({ activo: true, grupo: { activo: true } })
})

// ════════════════════════════════════════════════════════════
// NIVEL A — loginService rechaza si el grupo está inactivo
// ════════════════════════════════════════════════════════════

describe("loginService — bloqueo por grupo inactivo", () => {
  beforeEach(() => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never)
  })

  it("permite login cuando el grupo está activo", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, grupo: mockGrupoActivo })

    const result = await loginService("admin@test.com", "admin123")

    expect(result.success).toBe(true)
  })

  it("rechaza login cuando el grupo está inactivo", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      grupoId: "g-2",
      grupo: mockGrupoInactivo,
    })

    const result = await loginService("admin@test.com", "admin123")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/grupo.*desactivado/i)
      expect(result.error).toMatch(/owner/i)
    }
  })

  it("el owner (sin grupo) nunca es bloqueado por grupo", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      id: "usr-owner",
      rol: "owner",
      grupoId: null,
      grupo: null,
    })

    const result = await loginService("owner@test.com", "owner123")

    expect(result.success).toBe(true)
  })

  it("el error de grupo inactivo ocurre antes de verificar la contraseña", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never)
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      grupoId: "g-2",
      grupo: mockGrupoInactivo,
    })

    const result = await loginService("admin@test.com", "wrong-pass")

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toMatch(/grupo.*desactivado/i)
    }
    // No debe haber actualizado intentos fallidos
    expect(mockPrisma.user.update).not.toHaveBeenCalled()
  })

  it("cuenta desactivada se rechaza antes que el grupo inactivo", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...mockUser,
      activo: false,
      grupo: mockGrupoInactivo,
    })

    const result = await loginService("admin@test.com", "admin123")

    expect(result.success).toBe(false)
    if (!result.success) {
      // El mensaje debe ser el de cuenta desactivada, no el de grupo
      expect(result.error).toMatch(/desactivada/i)
      expect(result.error).not.toMatch(/grupo/i)
    }
  })
})

// ════════════════════════════════════════════════════════════
// NIVEL B — requireAuth rechaza sesiones de grupos inactivos
// ════════════════════════════════════════════════════════════

function makeReq(token: string) {
  return new NextRequest("http://localhost/api/historias", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
}

describe("requireAuth — bloqueo de sesiones cuando grupo se desactiva", () => {
  it("permite la petición cuando el grupo está activo", async () => {
    const token = await signToken({ sub: "usr-admin", email: "admin@test.com", nombre: "Admin", rol: "admin", grupoId: "g-1" })
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: { activo: true } })

    const result = await requireAuth(makeReq(token))

    expect(result).not.toBeInstanceOf(Response)
    if (!(result instanceof Response)) {
      expect(result.sub).toBe("usr-admin")
    }
  })

  it("rechaza la petición cuando el grupo fue desactivado después de iniciar sesión", async () => {
    const token = await signToken({ sub: "usr-admin", email: "admin@test.com", nombre: "Admin", rol: "admin", grupoId: "g-2" })
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: { activo: false } })

    const result = await requireAuth(makeReq(token))

    expect(result).toBeInstanceOf(Response)
    const body = await (result as Response).json()
    expect((result as Response).status).toBe(403)
    expect(body.code).toBe("GRUPO_INACTIVO")
    expect(body.error).toMatch(/grupo.*desactivado/i)
  })

  it("rechaza la petición cuando el grupo fue eliminado (null en DB)", async () => {
    const token = await signToken({ sub: "usr-admin", email: "admin@test.com", nombre: "Admin", rol: "admin", grupoId: "g-borrado" })
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: null })

    const result = await requireAuth(makeReq(token))

    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(403)
  })

  it("el owner (sin grupoId en token) nunca es bloqueado por grupo", async () => {
    const token = await signToken({ sub: "usr-owner", email: "owner@test.com", nombre: "Owner", rol: "owner" })

    const result = await requireAuth(makeReq(token))

    expect(result).not.toBeInstanceOf(Response)
    // El owner consulta user.findUnique para verificar activo, pero no verifica grupo
    expect(mockPrisma.grupo.findUnique).not.toHaveBeenCalled()
  })

  it("sin token retorna 401 (comportamiento original sin cambios)", async () => {
    const req = new NextRequest("http://localhost/api/historias", { method: "GET" })
    const result = await requireAuth(req)

    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  it("token inválido retorna 401 (comportamiento original sin cambios)", async () => {
    const result = await requireAuth(makeReq("token-invalido"))

    expect(result).toBeInstanceOf(Response)
    expect((result as Response).status).toBe(401)
  })

  it("reactivar el grupo permite las peticiones nuevamente", async () => {
    const token = await signToken({ sub: "usr-admin", email: "admin@test.com", nombre: "Admin", rol: "admin", grupoId: "g-1" })

    // Primero inactivo
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: { activo: false } })
    const blocked = await requireAuth(makeReq(token))
    expect((blocked as Response).status).toBe(403)

    // Luego reactivado
    mockPrisma.user.findUnique.mockResolvedValueOnce({ activo: true, grupo: { activo: true } })
    const allowed = await requireAuth(makeReq(token))
    expect(allowed).not.toBeInstanceOf(Response)
  })
})
