// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/tareas  (CRUD + filtros + sync)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
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
    user:            { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo:           { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    historiaUsuario: {
      findUnique: vi.fn(),
    },
    casoPrueba: {
      findUnique: vi.fn(),
    },
    tarea: {
      deleteMany:  vi.fn(),
      findMany:    vi.fn(),
      findUnique:  vi.fn(),
      createMany:  vi.fn(),
      update:      vi.fn(),
    },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        tarea: {
          deleteMany:  vi.fn(),
          findMany:    vi.fn().mockResolvedValue([]),
          findUnique:  vi.fn(),
          createMany:  vi.fn(),
          update:      vi.fn(),
        },
        casoPrueba: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      })
    ),
  },
}))

import {
  getAllTareas, getTareasByCaso, getTareasByHU,
  createTarea, getTareaById, updateTarea, deleteTarea,
} from "@/lib/backend/services/tarea.service"
import { prisma } from "@/lib/backend/prisma"
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
let tokenGrupoA: string
let ownerToken: string

beforeAll(async () => {
  token       = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  tokenGrupoA = await signToken({ sub: "usr-002", email: "member@empresa.com", nombre: "Member", rol: "admin", grupoId: "grupo-A" })
  ownerToken  = await signToken({ sub: "usr-000", email: "owner@empresa.com",  nombre: "Owner", rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
  vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue({ grupoId: "grupo-test" } as never)
  vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValue({ huId: "hu-1", hu: { grupoId: "grupo-test" } } as never)
  vi.mocked(prisma.tarea.findUnique).mockResolvedValue({ caso: { hu: { grupoId: "grupo-test" } } } as never)
})

// ── GET /api/tareas ──────────────────────────────────────

describe("GET /api/tareas", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("GET", "/api/tareas"))
    expect(res.status).toBe(401)
  })

  it("lista todas las tareas → 200", async () => {
    vi.mocked(getAllTareas).mockResolvedValueOnce(
      { tareas: [tareaBase], total: 1, page: 1, limit: 50, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/tareas", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas).toHaveLength(1)
  })

  it("filtra por casoPruebaId → solo tareas de ese caso", async () => {
    vi.mocked(getTareasByCaso).mockResolvedValueOnce(
      { tareas: [tareaBase], total: 1, page: 1, limit: 200, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/tareas?casoPruebaId=caso-1", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas[0].casoPruebaId).toBe("caso-1")
  })

  it("filtra por huId → solo tareas de esa HU", async () => {
    vi.mocked(getTareasByHU).mockResolvedValueOnce(
      { tareas: [tareaBase], total: 1, page: 1, limit: 200, pages: 1 } as never
    )

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
    vi.mocked(prisma.tarea.findUnique).mockResolvedValueOnce(null)

    const res = await getById(
      makeReq("GET", "/api/tareas/tarea-x", undefined, token),
      { params: Promise.resolve({ id: "tarea-x" }) }
    )
    expect(res.status).toBe(404)
  })

  it("tarea encontrada → 200", async () => {
    vi.mocked(prisma.tarea.findUnique).mockResolvedValueOnce(
      { ...tareaBase, caso: { hu: { grupoId: "grupo-test" } } } as never
    )

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
      makeReq("POST", "/api/tareas/sync", { tareas: [tareaBase, { ...tareaBase, id: "tarea-2" }] }, ownerToken)
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.count).toBe(2)
  })
})

// ── Workspace isolation ──────────────────────────────────

describe("GET /api/tareas?casoPruebaId — aislamiento de workspace", () => {

  it("usuario en grupo-A no puede ver tareas de un caso de grupo-B → array vacío", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValueOnce(
      { hu: { grupoId: "grupo-B" } } as never
    )

    const res  = await GET(makeReq("GET", "/api/tareas?casoPruebaId=caso-externo", undefined, tokenGrupoA))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas).toHaveLength(0)
  })

  it("caso no encontrado con filtro de workspace → array vacío", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValueOnce(null)

    const res  = await GET(makeReq("GET", "/api/tareas?casoPruebaId=caso-inexistente", undefined, tokenGrupoA))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas).toHaveLength(0)
  })

  it("usuario en grupo-A puede ver tareas de su propio caso", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValueOnce(
      { hu: { grupoId: "grupo-A" } } as never
    )
    vi.mocked(getTareasByCaso).mockResolvedValueOnce(
      { tareas: [tareaBase], total: 1, page: 1, limit: 200, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/tareas?casoPruebaId=caso-1", undefined, tokenGrupoA))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas).toHaveLength(1)
  })

})

describe("GET /api/tareas?huId — aislamiento de workspace", () => {

  it("usuario en grupo-A no puede ver tareas de una HU de grupo-B → array vacío", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce({ grupoId: "grupo-B" } as never)

    const res  = await GET(makeReq("GET", "/api/tareas?huId=hu-externo", undefined, tokenGrupoA))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas).toHaveLength(0)
  })

  it("usuario en grupo-A puede ver tareas de su propia HU", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce({ grupoId: "grupo-A" } as never)
    vi.mocked(getTareasByHU).mockResolvedValueOnce(
      { tareas: [tareaBase], total: 1, page: 1, limit: 200, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/tareas?huId=hu-1", undefined, tokenGrupoA))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas).toHaveLength(1)
  })

  it("owner (sin grupoId) puede ver tareas de cualquier HU sin restricción", async () => {
    vi.mocked(getTareasByHU).mockResolvedValueOnce(
      { tareas: [tareaBase], total: 1, page: 1, limit: 200, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/tareas?huId=hu-1", undefined, ownerToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.tareas).toHaveLength(1)
  })

})

describe("POST /api/tareas/sync — aislamiento de workspace", () => {

  it("usuario con grupoId no puede sincronizar tareas fuera de su workspace → 500", async () => {
    // The mocked $transaction will be called; we need to override it to throw
    const { prisma: mockPrisma } = await import("@/lib/backend/prisma")
    vi.mocked(mockPrisma.$transaction).mockRejectedValueOnce(
      new Error("Acceso denegado: tareas fuera del workspace")
    )

    const tareaFuera = { ...tareaBase, casoPruebaId: "caso-externo" }
    const res  = await syncPOST(
      makeReq("POST", "/api/tareas/sync", { tareas: [tareaFuera] }, tokenGrupoA)
    )
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toContain("Acceso denegado")
  })

})
