// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/sprints (CRUD)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/services/sprint.service", () => ({
  getAllSprints:   vi.fn(),
  getSprintActivo: vi.fn(),
  getSprintById:  vi.fn(),
  createSprint:   vi.fn(),
  updateSprint:   vi.fn(),
  deleteSprint:   vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:   { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo:  { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    sprint: { findUnique: vi.fn().mockResolvedValue({ grupoId: "grupo-default" }) },
  },
}))

import {
  getAllSprints, getSprintActivo, getSprintById,
  createSprint, updateSprint, deleteSprint,
} from "@/lib/backend/services/sprint.service"
import { GET, POST }                    from "@/app/api/sprints/route"
import { GET as getById, PUT, DELETE }  from "@/app/api/sprints/[id]/route"

// ── Helper ───────────────────────────────────────────────
function makeReq(method: string, path: string, body?: unknown, token?: string, search?: string) {
  const url = `http://localhost${path}${search ? `?${search}` : ""}`
  return new NextRequest(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const sprintBase = {
  id: "sp-1",
  nombre: "Sprint 3",
  grupoId:     "grupo-default",
  fechaInicio: new Date("2026-03-01"),
  fechaFin:    new Date("2026-03-14"),
  objetivo:    "Completar módulo auth",
  createdAt:   new Date().toISOString(),
  updatedAt:   new Date().toISOString(),
}

const sprintBody = {
  nombre:      "Sprint 3",
  fechaInicio: "2026-03-01",
  fechaFin:    "2026-03-14",
  objetivo:    "Completar módulo auth",
}

let token: string

beforeAll(async () => {
  token = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-default" })
})

// ── GET /api/sprints ─────────────────────────────────────

describe("GET /api/sprints", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("GET", "/api/sprints"))
    expect(res.status).toBe(401)
  })

  it("lista todos los sprints → 200", async () => {
    vi.mocked(getAllSprints).mockResolvedValueOnce(
      { sprints: [sprintBase], total: 1, page: 1, limit: 50, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/sprints", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sprints).toHaveLength(1)
    expect(data.sprints[0].nombre).toBe("Sprint 3")
  })

  it("?activo=true devuelve solo el sprint activo", async () => {
    vi.mocked(getSprintActivo).mockResolvedValueOnce(sprintBase as never)

    const res  = await GET(makeReq("GET", "/api/sprints", undefined, token, "activo=true"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sprint).toBeDefined()
    expect(data.sprint.nombre).toBe("Sprint 3")
  })

  it("?activo=true sin sprint activo → sprint: null", async () => {
    vi.mocked(getSprintActivo).mockResolvedValueOnce(null)

    const res  = await GET(makeReq("GET", "/api/sprints", undefined, token, "activo=true"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sprint).toBeNull()
  })
})

// ── POST /api/sprints ────────────────────────────────────

describe("POST /api/sprints", () => {
  it("sin token → 401", async () => {
    const res = await POST(makeReq("POST", "/api/sprints", sprintBody))
    expect(res.status).toBe(401)
  })

  it("faltan campos requeridos → 400", async () => {
    const res = await POST(makeReq("POST", "/api/sprints", { nombre: "Solo nombre" }, token))
    expect(res.status).toBe(400)
  })

  it("fechaInicio >= fechaFin → 400", async () => {
    const res = await POST(makeReq("POST", "/api/sprints", {
      ...sprintBody,
      fechaInicio: "2026-03-14",
      fechaFin:    "2026-03-01",
    }, token))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/fechaInicio/i)
  })

  it("nombre vacío → 400", async () => {
    const res = await POST(makeReq("POST", "/api/sprints", {
      nombre: "", fechaInicio: "2026-03-01", fechaFin: "2026-03-14",
    }, token))
    expect(res.status).toBe(400)
  })

  it("crea sprint correctamente → 201", async () => {
    vi.mocked(createSprint).mockResolvedValueOnce(sprintBase as never)

    const res  = await POST(makeReq("POST", "/api/sprints", sprintBody, token))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.sprint.id).toBe("sp-1")
    expect(data.sprint.nombre).toBe("Sprint 3")
  })
})

// ── GET /api/sprints/[id] ────────────────────────────────

describe("GET /api/sprints/[id]", () => {
  it("sprint no encontrado → 404", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(null)

    const res = await getById(
      makeReq("GET", "/api/sprints/sp-x", undefined, token),
      { params: Promise.resolve({ id: "sp-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("sprint encontrado → 200", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(sprintBase as never)

    const res  = await getById(
      makeReq("GET", "/api/sprints/sp-1", undefined, token),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sprint.id).toBe("sp-1")
  })
})

// ── PUT /api/sprints/[id] ────────────────────────────────

describe("PUT /api/sprints/[id]", () => {
  it("fechas inválidas → 400", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(sprintBase as never)
    const res = await PUT(
      makeReq("PUT", "/api/sprints/sp-1", { fechaInicio: "2026-03-14", fechaFin: "2026-03-01" }, token),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    expect(res.status).toBe(400)
  })

  it("nombre vacío → 400", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(sprintBase as never)
    const res = await PUT(
      makeReq("PUT", "/api/sprints/sp-1", { nombre: "" }, token),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    expect(res.status).toBe(400)
  })

  it("actualiza sprint → 200", async () => {
    vi.mocked(getSprintById).mockResolvedValueOnce(sprintBase as never)
    vi.mocked(updateSprint).mockResolvedValueOnce({ ...sprintBase, nombre: "Sprint 3 (rev)" } as never)

    const res  = await PUT(
      makeReq("PUT", "/api/sprints/sp-1", { nombre: "Sprint 3 (rev)" }, token),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.sprint.nombre).toBe("Sprint 3 (rev)")
  })
})

// ── DELETE /api/sprints/[id] ─────────────────────────────

describe("DELETE /api/sprints/[id]", () => {
  it("elimina sprint → 200", async () => {
    vi.mocked(deleteSprint).mockResolvedValueOnce(undefined as never)

    const res  = await DELETE(
      makeReq("DELETE", "/api/sprints/sp-1", undefined, token),
      { params: Promise.resolve({ id: "sp-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
