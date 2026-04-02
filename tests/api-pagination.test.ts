// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — Paginación en GET /api/historias, /api/casos, /api/tareas
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/services/historia.service", () => ({
  getAllHistorias:  vi.fn(),
  createHistoria:  vi.fn(),
  getHistoriaById: vi.fn(),
  updateHistoria:  vi.fn(),
  deleteHistoria:  vi.fn(),
}))

vi.mock("@/lib/backend/services/caso.service", () => ({
  getAllCasos:   vi.fn(),
  getCasosByHU: vi.fn(),
  createCaso:   vi.fn(),
  getCasoById:  vi.fn(),
  updateCaso:   vi.fn(),
  deleteCaso:   vi.fn(),
}))

vi.mock("@/lib/backend/services/tarea.service", () => ({
  getAllTareas:     vi.fn(),
  getTareasByCaso: vi.fn(),
  getTareasByHU:   vi.fn(),
  createTarea:     vi.fn(),
  getTareaById:    vi.fn(),
  updateTarea:     vi.fn(),
  deleteTarea:     vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:  { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo: { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    historiaUsuario: { findUnique: vi.fn().mockResolvedValue({ grupoId: "grupo-test" }) },
    casoPrueba:      { findUnique: vi.fn().mockResolvedValue({ hu: { grupoId: "grupo-test" } }) },
  },
}))

import { getAllHistorias } from "@/lib/backend/services/historia.service"
import { getAllCasos }     from "@/lib/backend/services/caso.service"
import { getAllTareas }    from "@/lib/backend/services/tarea.service"
import { prisma }         from "@/lib/backend/prisma"
import { GET as getHistorias } from "@/app/api/historias/route"
import { GET as getCasos }     from "@/app/api/casos/route"
import { GET as getTareas }    from "@/app/api/tareas/route"

function makeReq(path: string, token: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
}

const pageResult = (items: unknown[], key: string, total = 1, page = 1, limit = 50) => ({
  [key]: items, total, page, limit, pages: Math.ceil(total / limit),
})

let token: string

beforeAll(async () => {
  token = await signToken({ sub: "u-1", email: "admin@e.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
})

// ── GET /api/historias — paginación ──────────────────────

describe("GET /api/historias — paginación", () => {
  it("respuesta incluye total, page, limit, pages", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(
      pageResult([{ id: "hu-1" }], "historias", 10, 1, 5) as never
    )
    const res  = await getHistorias(makeReq("/api/historias?page=1&limit=5", token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(10)
    expect(data.page).toBe(1)
    expect(data.limit).toBe(5)
    expect(data.pages).toBe(2)
  })

  it("pasa page y limit al servicio", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(
      pageResult([], "historias", 0) as never
    )
    await getHistorias(makeReq("/api/historias?page=3&limit=20", token))

    expect(getAllHistorias).toHaveBeenCalledWith("grupo-test", 3, 20, { sprint: undefined, responsable: undefined })
  })

  it("limit máximo limitado a 200", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(
      pageResult([], "historias", 0) as never
    )
    await getHistorias(makeReq("/api/historias?limit=999", token))

    const [, , limit] = vi.mocked(getAllHistorias).mock.calls[0]
    expect(limit).toBe(200)
  })

  it("valores por defecto: page=1, limit=50", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(
      pageResult([], "historias", 0) as never
    )
    await getHistorias(makeReq("/api/historias", token))

    expect(getAllHistorias).toHaveBeenCalledWith("grupo-test", 1, 50, { sprint: undefined, responsable: undefined })
  })
})

// ── GET /api/casos — paginación ───────────────────────────

describe("GET /api/casos — paginación", () => {
  it("respuesta incluye metadatos de paginación", async () => {
    vi.mocked(getAllCasos).mockResolvedValueOnce(
      pageResult([{ id: "caso-1" }], "casos", 3, 1, 2) as never
    )
    const res  = await getCasos(makeReq("/api/casos?page=1&limit=2", token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(3)
    expect(data.pages).toBe(2)
    expect(data.casos).toHaveLength(1)
  })

  it("pasa page y limit al servicio", async () => {
    vi.mocked(getAllCasos).mockResolvedValueOnce(
      pageResult([], "casos", 0) as never
    )
    await getCasos(makeReq("/api/casos?page=2&limit=10", token))

    expect(getAllCasos).toHaveBeenCalledWith("grupo-test", 2, 10)
  })
})

// ── GET /api/tareas — paginación + filtro asignado ────────

describe("GET /api/tareas — paginación y filtro asignado", () => {
  it("respuesta incluye metadatos de paginación", async () => {
    vi.mocked(getAllTareas).mockResolvedValueOnce(
      pageResult([{ id: "t-1" }], "tareas", 5, 2, 2) as never
    )
    const res  = await getTareas(makeReq("/api/tareas?page=2&limit=2", token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(5)
    expect(data.page).toBe(2)
    expect(data.tareas).toHaveLength(1)
  })

  it("pasa asignado al servicio cuando se filtra", async () => {
    vi.mocked(getAllTareas).mockResolvedValueOnce(
      pageResult([], "tareas", 0) as never
    )
    await getTareas(makeReq("/api/tareas?asignado=Maria+Garcia", token))

    expect(getAllTareas).toHaveBeenCalledWith("grupo-test", "Maria Garcia", 1, 200)
  })

  it("sin filtro asignado → pasa undefined", async () => {
    vi.mocked(getAllTareas).mockResolvedValueOnce(
      pageResult([], "tareas", 0) as never
    )
    await getTareas(makeReq("/api/tareas", token))

    expect(getAllTareas).toHaveBeenCalledWith("grupo-test", undefined, 1, 200)
  })
})
