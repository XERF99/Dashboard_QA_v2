// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/auth/me · /api/auth/logout · /api/auth/password
//  Mockea prisma y los servicios; usa signToken para generar
//  JWTs reales sin necesidad de DB.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }),
    },
  },
}))

vi.mock("@/lib/backend/services/auth.service", () => ({
  cambiarPasswordService: vi.fn(),
  logoutService:          vi.fn(),
}))

import { prisma } from "@/lib/backend/prisma"
import { cambiarPasswordService, logoutService } from "@/lib/backend/services/auth.service"
import { GET  as meGET  }   from "@/app/api/auth/me/route"
import { POST as logoutPOST } from "@/app/api/auth/logout/route"
import { PUT  as passwordPUT } from "@/app/api/auth/password/route"

// ── Helper ───────────────────────────────────────────────
function makeReq(method: string, path: string, body?: unknown, token?: string) {
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

let userToken: string

beforeAll(async () => {
  userToken = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin" })
})

// ── GET /api/auth/me ─────────────────────────────────────

describe("GET /api/auth/me", () => {
  it("sin token → 401", async () => {
    const res = await meGET(makeReq("GET", "/api/auth/me"))
    expect(res.status).toBe(401)
  })

  it("token válido → 200 con datos del usuario", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true } as never)   // requireAuth activo check
      .mockResolvedValueOnce({                            // /me route handler
        id: "usr-001", nombre: "Admin Principal", email: "admin@empresa.com",
        rol: "admin", activo: true, debeCambiarPassword: false,
        fechaCreacion: new Date("2026-01-01"),
      } as never)

    const res  = await meGET(makeReq("GET", "/api/auth/me", undefined, userToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.user.email).toBe("admin@empresa.com")
  })

  it("usuario no existe en DB → 404", async () => {
    vi.mocked(prisma.user.findUnique)
      .mockResolvedValueOnce({ activo: true } as never)  // requireAuth activo check
      .mockResolvedValueOnce(null)                       // /me route handler → 404

    const res = await meGET(makeReq("GET", "/api/auth/me", undefined, userToken))
    expect(res.status).toBe(404)
  })
})

// ── POST /api/auth/logout ────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("sin token → 401 (logout requiere sesión activa)", async () => {
    const res = await logoutPOST(makeReq("POST", "/api/auth/logout"))
    expect(res.status).toBe(401)
  })

  it("con token válido → 200 y borra cookie tcs_token", async () => {
    vi.mocked(logoutService).mockResolvedValueOnce(undefined as never)

    const res = await logoutPOST(makeReq("POST", "/api/auth/logout", undefined, userToken))
    expect(res.status).toBe(200)
    const setCookie = res.headers.get("set-cookie") ?? ""
    expect(setCookie).toMatch(/tcs_token/)
  })
})

// ── PUT /api/auth/password ───────────────────────────────

describe("PUT /api/auth/password", () => {
  it("sin token → 401", async () => {
    const res = await passwordPUT(makeReq("PUT", "/api/auth/password", { actual: "a", nueva: "b" }))
    expect(res.status).toBe(401)
  })

  it("body inválido (nueva muy corta) → 400", async () => {
    const res = await passwordPUT(
      makeReq("PUT", "/api/auth/password", { actual: "admin123", nueva: "ab" }, userToken)
    )
    expect(res.status).toBe(400)
  })

  it("contraseña actual incorrecta → 400 con error del servicio", async () => {
    vi.mocked(cambiarPasswordService).mockResolvedValueOnce({ success: false, error: "Contraseña actual incorrecta" })

    const res  = await passwordPUT(
      makeReq("PUT", "/api/auth/password", { actual: "wrong", nueva: "Nueva@123" }, userToken)
    )
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toMatch(/incorrecta/i)
  })

  it("cambio exitoso → 200", async () => {
    vi.mocked(cambiarPasswordService).mockResolvedValueOnce({ success: true })

    const res  = await passwordPUT(
      makeReq("PUT", "/api/auth/password", { actual: "admin123", nueva: "Nueva@123" }, userToken)
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
