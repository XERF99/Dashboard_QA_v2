// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — GET /api/historias/[id]/historial
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/services/historia.service", () => ({
  getHistoriaById: vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:            { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo:           { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    historiaUsuario: { findUnique: vi.fn() },
  },
}))

import { getHistoriaById } from "@/lib/backend/services/historia.service"
import { prisma } from "@/lib/backend/prisma"
import { GET } from "@/app/api/historias/[id]/historial/route"

// ── Helper ───────────────────────────────────────────────
function makeReq(id: string, search = "", token?: string) {
  const url = `http://localhost/api/historias/${id}/historial${search ? `?${search}` : ""}`
  return new NextRequest(url, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })

// ── Datos de prueba ──────────────────────────────────────
const ev = (id: string, fecha: string) => ({
  id,
  tipo:        "hu_creada",
  descripcion: `Evento ${id}`,
  fecha,
  usuario:     "Admin",
})

const historiaConHistorial = {
  id:       "hu-1",
  codigo:   "HU-001",
  titulo:   "Historia test",
  historial: [
    ev("ev-1", "2026-03-01T08:00:00.000Z"),
    ev("ev-2", "2026-03-03T10:00:00.000Z"),
    ev("ev-3", "2026-03-02T09:00:00.000Z"),
    ev("ev-4", "2026-03-05T12:00:00.000Z"),
    ev("ev-5", "2026-03-04T11:00:00.000Z"),
  ],
}

let token: string
let tokenGrupoA: string
let ownerToken: string

beforeAll(async () => {
  token       = await signToken({ sub: "u-1", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  tokenGrupoA = await signToken({ sub: "u-2", email: "member@empresa.com", nombre: "Member", rol: "admin", grupoId: "grupo-A" })
  ownerToken  = await signToken({ sub: "u-0", email: "owner@empresa.com",  nombre: "Owner", rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
  // Workspace isolation default: the HU belongs to the test workspace
  vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue({ grupoId: "grupo-test" } as never)
})

// ── Tests ────────────────────────────────────────────────

describe("GET /api/historias/[id]/historial", () => {

  it("sin token → 401", async () => {
    const res = await GET(makeReq("hu-1"), params("hu-1"))
    expect(res.status).toBe(401)
  })

  it("historia no encontrada → 404", async () => {
    vi.mocked(getHistoriaById).mockResolvedValueOnce(null)

    const res  = await GET(makeReq("hu-x", "", token), params("hu-x"))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toMatch(/historia no encontrada/i)
  })

  it("devuelve historial paginado → 200 con estructura completa", async () => {
    vi.mocked(getHistoriaById).mockResolvedValueOnce(historiaConHistorial as never)

    const res  = await GET(makeReq("hu-1", "", token), params("hu-1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty("historial")
    expect(data).toHaveProperty("total", 5)
    expect(data).toHaveProperty("page",  1)
    expect(data).toHaveProperty("limit", 20)
    expect(data).toHaveProperty("pages", 1)
  })

  it("eventos ordenados por fecha descendente (más reciente primero)", async () => {
    vi.mocked(getHistoriaById).mockResolvedValueOnce(historiaConHistorial as never)

    const res  = await GET(makeReq("hu-1", "", token), params("hu-1"))
    const { historial } = await res.json()

    const fechas = historial.map((e: { fecha: string }) => new Date(e.fecha).getTime())
    for (let i = 1; i < fechas.length; i++) {
      expect(fechas[i]).toBeLessThanOrEqual(fechas[i - 1])
    }
    // El primero es el más reciente (ev-4: 2026-03-05)
    expect(historial[0].id).toBe("ev-4")
  })

  it("paginación: page=2 limit=2 devuelve los eventos correctos", async () => {
    vi.mocked(getHistoriaById).mockResolvedValueOnce(historiaConHistorial as never)

    const res  = await GET(makeReq("hu-1", "page=2&limit=2", token), params("hu-1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.page).toBe(2)
    expect(data.limit).toBe(2)
    expect(data.pages).toBe(3)   // ceil(5 / 2)
    expect(data.historial).toHaveLength(2)
  })

  it("limit máximo se limita a 100", async () => {
    const historiaGrande = {
      ...historiaConHistorial,
      historial: Array.from({ length: 150 }, (_, i) =>
        ev(`ev-${i}`, new Date(2026, 2, i + 1).toISOString())
      ),
    }
    vi.mocked(getHistoriaById).mockResolvedValueOnce(historiaGrande as never)

    const res  = await GET(makeReq("hu-1", "limit=200", token), params("hu-1"))
    const data = await res.json()

    expect(data.limit).toBe(100)
    expect(data.historial).toHaveLength(100)
    expect(data.total).toBe(150)
  })

  it("historia con historial vacío → array vacío, total 0, pages 1", async () => {
    vi.mocked(getHistoriaById).mockResolvedValueOnce({
      ...historiaConHistorial,
      historial: [],
    } as never)

    const res  = await GET(makeReq("hu-1", "", token), params("hu-1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.historial).toHaveLength(0)
    expect(data.total).toBe(0)
    expect(data.pages).toBe(1)
  })

  it("página fuera de rango devuelve array vacío", async () => {
    vi.mocked(getHistoriaById).mockResolvedValueOnce(historiaConHistorial as never)

    const res  = await GET(makeReq("hu-1", "page=99&limit=20", token), params("hu-1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.historial).toHaveLength(0)
    expect(data.total).toBe(5)
  })

})

// ── Workspace isolation ──────────────────────────────────

describe("GET /api/historias/[id]/historial — aislamiento de workspace", () => {

  it("usuario en grupo-A no puede acceder al historial de historia de grupo-B → 404", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce({ grupoId: "grupo-B" } as never)

    const res  = await GET(makeReq("hu-1", "", tokenGrupoA), params("hu-1"))
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toMatch(/historia no encontrada/i)
  })

  it("historia no existente con grupoId → 404", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce(null)

    const res = await GET(makeReq("hu-x", "", tokenGrupoA), params("hu-x"))
    expect(res.status).toBe(404)
  })

  it("usuario en grupo-A puede acceder al historial de su propia historia", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce({ grupoId: "grupo-A" } as never)
    vi.mocked(getHistoriaById).mockResolvedValueOnce(historiaConHistorial as never)

    const res  = await GET(makeReq("hu-1", "", tokenGrupoA), params("hu-1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(5)
  })

  it("owner (sin grupoId) puede acceder al historial de cualquier historia", async () => {
    // Owner token has no grupoId → workspace check is skipped
    vi.mocked(getHistoriaById).mockResolvedValueOnce(historiaConHistorial as never)

    const res  = await GET(makeReq("hu-1", "", ownerToken), params("hu-1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(5)
  })

})
