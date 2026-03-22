// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/casos  (CRUD + filtro huId + sync)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/services/caso.service", () => ({
  getAllCasos:    vi.fn(),
  getCasosByHU:  vi.fn(),
  createCaso:    vi.fn(),
  getCasoById:   vi.fn(),
  updateCaso:    vi.fn(),
  deleteCaso:    vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    casoPrueba: {
      deleteMany:  vi.fn(),
      findMany:    vi.fn(),
      createMany:  vi.fn(),
      update:      vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        casoPrueba: {
          deleteMany:  vi.fn(),
          findMany:    vi.fn().mockResolvedValue([]),
          createMany:  vi.fn(),
          update:      vi.fn(),
        },
      })
    ),
  },
}))

import {
  getAllCasos, getCasosByHU, createCaso,
  getCasoById, updateCaso, deleteCaso,
} from "@/lib/backend/services/caso.service"
import { GET, POST }                    from "@/app/api/casos/route"
import { GET as getById, PUT, DELETE }  from "@/app/api/casos/[id]/route"
import { POST as syncPOST }             from "@/app/api/casos/sync/route"

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

// Campos que devuelve la DB (para mocks de respuesta)
const casoBase = {
  id: "caso-1", huId: "hu-1", titulo: "Login exitoso",
  descripcion: "Verificar login", entorno: "test",
  tipoPrueba: "funcional", horasEstimadas: 2,
  archivosAnalizados: [], complejidad: "baja",
  estadoAprobacion: "borrador", resultadosPorEtapa: [],
  fechaCreacion: new Date().toISOString(), tareasIds: [],
  bloqueos: [], creadoPor: "usr-001", modificacionHabilitada: false, comentarios: [],
}

// Campos válidos según createCasoSchema (sin campos desconocidos por Joi)
const casoCreateBody = {
  huId: "hu-1", titulo: "Login exitoso",
  descripcion: "Verificar login", entorno: "test" as const,
  tipoPrueba: "funcional", horasEstimadas: 2,
  complejidad: "baja" as const, creadoPor: "usr-001",
}

let token: string

beforeAll(async () => {
  token = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin" })
})

// ── GET /api/casos ───────────────────────────────────────

describe("GET /api/casos", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("GET", "/api/casos"))
    expect(res.status).toBe(401)
  })

  it("lista todos los casos → 200", async () => {
    vi.mocked(getAllCasos).mockResolvedValueOnce([casoBase] as never)

    const res  = await GET(makeReq("GET", "/api/casos", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.casos).toHaveLength(1)
  })

  it("filtra por huId → solo casos de esa HU", async () => {
    vi.mocked(getCasosByHU).mockResolvedValueOnce([casoBase] as never)

    const res  = await GET(makeReq("GET", "/api/casos?huId=hu-1", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.casos[0].huId).toBe("hu-1")
  })
})

// ── POST /api/casos ──────────────────────────────────────

describe("POST /api/casos", () => {
  it("body inválido (sin huId) → 400", async () => {
    const res = await POST(makeReq("POST", "/api/casos", { titulo: "Sin HU" }, token))
    expect(res.status).toBe(400)
  })

  it("crea caso correctamente → 201", async () => {
    vi.mocked(createCaso).mockResolvedValueOnce(casoBase as never)

    const res  = await POST(makeReq("POST", "/api/casos", casoCreateBody, token))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.caso.huId).toBe("hu-1")
  })
})

// ── GET /api/casos/[id] ──────────────────────────────────

describe("GET /api/casos/[id]", () => {
  it("caso no encontrado → 404", async () => {
    vi.mocked(getCasoById).mockResolvedValueOnce(null)

    const res = await getById(
      makeReq("GET", "/api/casos/caso-x", undefined, token),
      { params: Promise.resolve({ id: "caso-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("caso encontrado → 200", async () => {
    vi.mocked(getCasoById).mockResolvedValueOnce(casoBase as never)

    const res  = await getById(
      makeReq("GET", "/api/casos/caso-1", undefined, token),
      { params: Promise.resolve({ id: "caso-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.caso.id).toBe("caso-1")
  })
})

// ── PUT /api/casos/[id] ──────────────────────────────────

describe("PUT /api/casos/[id]", () => {
  it("actualiza caso → 200", async () => {
    vi.mocked(updateCaso).mockResolvedValueOnce({ ...casoBase, titulo: "Actualizado" } as never)

    const res  = await PUT(
      makeReq("PUT", "/api/casos/caso-1", { ...casoCreateBody, titulo: "Actualizado" }, token),
      { params: Promise.resolve({ id: "caso-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.caso.titulo).toBe("Actualizado")
  })
})

// ── DELETE /api/casos/[id] ───────────────────────────────

describe("DELETE /api/casos/[id]", () => {
  it("elimina caso → 200", async () => {
    vi.mocked(deleteCaso).mockResolvedValueOnce(undefined as never)

    const res  = await DELETE(
      makeReq("DELETE", "/api/casos/caso-1", undefined, token),
      { params: Promise.resolve({ id: "caso-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ── POST /api/casos/sync ─────────────────────────────────

describe("POST /api/casos/sync", () => {
  it("sincroniza array vacío → 200 con count 0", async () => {
    const res  = await syncPOST(makeReq("POST", "/api/casos/sync", { casos: [] }, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.count).toBe(0)
  })

  it("sincroniza array con casos → count correcto", async () => {
    const res  = await syncPOST(
      makeReq("POST", "/api/casos/sync", { casos: [casoBase, { ...casoBase, id: "caso-2" }] }, token)
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.count).toBe(2)
  })
})
