// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/tareas  (CRUD + filtros + sync)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
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
    tarea: {
      deleteMany:  vi.fn(),
      findMany:    vi.fn(),
      createMany:  vi.fn(),
      update:      vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        tarea: {
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
  getAllTareas, getTareasByCaso, getTareasByHU,
  createTarea, getTareaById, updateTarea, deleteTarea,
} from "@/lib/backend/services/tarea.service"
import { GET, POST }                   from "@/app/api/tareas/route"
import { GET as getById, PUT, DELETE } from "@/app/api/tareas/[id]/route"
import { POST as syncPOST }            from "@/app/api/tareas/sync/route"

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
const tareaBase = {
  id: "tarea-1", casoPruebaId: "caso-1", huId: "hu-1",
  titulo: "Revisar formulario de login", descripcion: "",
  estado: "pendiente", asignado: "usr-001",
  horasEstimadas: 1, horasReales: 0,
  fechaCreacion: new Date().toISOString(),
}

// Campos válidos según createTareaSchema
const tareaCreateBody = {
  casoPruebaId: "caso-1", huId: "hu-1",
  titulo: "Revisar formulario de login",
  asignado: "usr-001", creadoPor: "usr-001", horasEstimadas: 1,
}

let token: string

beforeAll(async () => {
  token = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin" })
})

// ── GET /api/tareas ──────────────────────────────────────

describe("GET /api/tareas", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("GET", "/api/tareas"))
    expect(res.status).toBe(401)
  })

  it("lista todas las tareas → 200", async () => {
    vi.mocked(getAllTareas).mockResolvedValueOnce([tareaBase] as never)

    const res  = await GET(makeReq("GET", "/api/tareas", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas).toHaveLength(1)
  })

  it("filtra por casoPruebaId → solo tareas de ese caso", async () => {
    vi.mocked(getTareasByCaso).mockResolvedValueOnce([tareaBase] as never)

    const res  = await GET(makeReq("GET", "/api/tareas?casoPruebaId=caso-1", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas[0].casoPruebaId).toBe("caso-1")
  })

  it("filtra por huId → solo tareas de esa HU", async () => {
    vi.mocked(getTareasByHU).mockResolvedValueOnce([tareaBase] as never)

    const res  = await GET(makeReq("GET", "/api/tareas?huId=hu-1", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas[0].huId).toBe("hu-1")
  })
})

// ── POST /api/tareas ─────────────────────────────────────

describe("POST /api/tareas", () => {
  it("body inválido (sin casoPruebaId) → 400", async () => {
    const res = await POST(makeReq("POST", "/api/tareas", { titulo: "Sin caso" }, token))
    expect(res.status).toBe(400)
  })

  it("crea tarea correctamente → 201", async () => {
    vi.mocked(createTarea).mockResolvedValueOnce(tareaBase as never)

    const res  = await POST(makeReq("POST", "/api/tareas", tareaCreateBody, token))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.tarea.casoPruebaId).toBe("caso-1")
  })
})

// ── GET /api/tareas/[id] ─────────────────────────────────

describe("GET /api/tareas/[id]", () => {
  it("tarea no encontrada → 404", async () => {
    vi.mocked(getTareaById).mockResolvedValueOnce(null)

    const res = await getById(
      makeReq("GET", "/api/tareas/tarea-x", undefined, token),
      { params: Promise.resolve({ id: "tarea-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("tarea encontrada → 200", async () => {
    vi.mocked(getTareaById).mockResolvedValueOnce(tareaBase as never)

    const res  = await getById(
      makeReq("GET", "/api/tareas/tarea-1", undefined, token),
      { params: Promise.resolve({ id: "tarea-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tarea.id).toBe("tarea-1")
  })
})

// ── PUT /api/tareas/[id] ─────────────────────────────────

describe("PUT /api/tareas/[id]", () => {
  it("actualiza tarea → 200", async () => {
    vi.mocked(updateTarea).mockResolvedValueOnce({ ...tareaBase, estado: "en_progreso" } as never)

    const res  = await PUT(
      makeReq("PUT", "/api/tareas/tarea-1", { ...tareaCreateBody, estado: "en_progreso" }, token),
      { params: Promise.resolve({ id: "tarea-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tarea.estado).toBe("en_progreso")
  })
})

// ── DELETE /api/tareas/[id] ──────────────────────────────

describe("DELETE /api/tareas/[id]", () => {
  it("elimina tarea → 200", async () => {
    vi.mocked(deleteTarea).mockResolvedValueOnce(undefined as never)

    const res  = await DELETE(
      makeReq("DELETE", "/api/tareas/tarea-1", undefined, token),
      { params: Promise.resolve({ id: "tarea-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})

// ── POST /api/tareas/sync ────────────────────────────────

describe("POST /api/tareas/sync", () => {
  it("sin token → 401", async () => {
    const res = await syncPOST(makeReq("POST", "/api/tareas/sync", { tareas: [] }))
    expect(res.status).toBe(401)
  })

  it("sincroniza array con tareas → count correcto", async () => {
    const res  = await syncPOST(
      makeReq("POST", "/api/tareas/sync", { tareas: [tareaBase, { ...tareaBase, id: "tarea-2" }] }, token)
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.count).toBe(2)
  })
})
