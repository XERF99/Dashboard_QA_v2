// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.55 nuevas funcionalidades
//  · Paginación en GET /api/notificaciones, /api/sprints,
//    /api/grupos, /api/users
//  · Límites de tamaño en validators (historia/caso/tarea)
//  · Contraseña mínima 8 chars en loginSchema
//  · Batch máx 1000 IDs
//  · Export con ?limit= (máx 5000)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ─────────────────────────────────────────────────
vi.mock("@/lib/backend/services/notificacion.service", () => ({
  getNotificacionesByDestinatario: vi.fn(),
  createNotificacion:              vi.fn(),
  marcarLeida:                     vi.fn(),
  marcarTodasLeidas:               vi.fn(),
  rolToDestinatario:               vi.fn((rol: string) =>
    ["owner", "admin"].includes(rol) ? "admin" : "qa"
  ),
}))

vi.mock("@/lib/backend/services/sprint.service", () => ({
  getAllSprints:    vi.fn(),
  getSprintActivo: vi.fn(),
  getSprintById:   vi.fn(),
  createSprint:    vi.fn(),
  updateSprint:    vi.fn(),
  deleteSprint:    vi.fn(),
}))

vi.mock("@/lib/backend/services/grupo.service", () => ({
  getAllGrupos:         vi.fn(),
  getGrupoById:        vi.fn(),
  createGrupo:         vi.fn(),
  updateGrupo:         vi.fn(),
  deleteGrupo:         vi.fn(),
  getMetricasGrupo:    vi.fn(),
  getMetricasGlobales: vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:         { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }), findMany: vi.fn(), count: vi.fn() },
    grupo:        { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    casoPrueba:   { findUnique: vi.fn().mockResolvedValue({ huId: "hu-1", hu: { grupoId: "grupo-test" } }), updateMany: vi.fn() },
    historiaUsuario: { findMany: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(async (arr: unknown[]) => Promise.all(arr)),
  },
}))

vi.mock("@/lib/backend/middleware/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 19, resetAt: Date.now() + 60_000 }),
  getClientIp:    vi.fn().mockReturnValue("127.0.0.1"),
  rlKey:          vi.fn((ip: string, route: string) => `${ip}:${route}`),
}))

import { getNotificacionesByDestinatario } from "@/lib/backend/services/notificacion.service"
import { getAllSprints }                   from "@/lib/backend/services/sprint.service"
import { getAllGrupos }                    from "@/lib/backend/services/grupo.service"
import { prisma }                         from "@/lib/backend/prisma"
import { checkRateLimit }                 from "@/lib/backend/middleware/rate-limit"

import { GET as getNotificaciones }  from "@/app/api/notificaciones/route"
import { GET as getSprints }         from "@/app/api/sprints/route"
import { GET as getGrupos }          from "@/app/api/grupos/route"
import { GET as getUsers }           from "@/app/api/users/route"
import { GET as getExport }          from "@/app/api/export/route"
import { PATCH as patchBatch }       from "@/app/api/casos/batch/route"

import { loginSchema }        from "@/lib/backend/validators/auth.validator"
import { createHistoriaSchema } from "@/lib/backend/validators/historia.validator"
import { createCasoSchema }   from "@/lib/backend/validators/caso.validator"
import { createTareaSchema }  from "@/lib/backend/validators/tarea.validator"

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

const pageResult = (items: unknown[], key: string, total = 1, page = 1, limit = 50) => ({
  [key]: items, total, page, limit, pages: Math.ceil(total / limit),
})

let adminToken: string
let ownerToken: string

beforeAll(async () => {
  adminToken = await signToken({ sub: "u-1", email: "admin@e.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  ownerToken = await signToken({ sub: "u-0", email: "owner@e.com", nombre: "Owner", rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
  vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 19, resetAt: Date.now() + 60_000 })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 1 — Paginación en GET /api/notificaciones
// ═══════════════════════════════════════════════════════════

describe("GET /api/notificaciones — paginación", () => {
  it("respuesta incluye metadatos de paginación", async () => {
    vi.mocked(getNotificacionesByDestinatario).mockResolvedValueOnce(
      pageResult([{ id: "n-1" }], "notificaciones", 10, 1, 5) as never
    )
    const res  = await getNotificaciones(makeReq("GET", "/api/notificaciones?page=1&limit=5", undefined, adminToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(10)
    expect(data.page).toBe(1)
    expect(data.limit).toBe(5)
    expect(data.pages).toBe(2)
  })

  it("pasa page y limit al servicio", async () => {
    vi.mocked(getNotificacionesByDestinatario).mockResolvedValueOnce(
      pageResult([], "notificaciones", 0) as never
    )
    await getNotificaciones(makeReq("GET", "/api/notificaciones?page=2&limit=10", undefined, adminToken))

    expect(getNotificacionesByDestinatario).toHaveBeenCalledWith("admin", "grupo-test", 2, 10)
  })

  it("limit máximo capped a 200", async () => {
    vi.mocked(getNotificacionesByDestinatario).mockResolvedValueOnce(
      pageResult([], "notificaciones", 0) as never
    )
    await getNotificaciones(makeReq("GET", "/api/notificaciones?limit=9999", undefined, adminToken))

    const [,,, limitArg] = vi.mocked(getNotificacionesByDestinatario).mock.calls[0]!
    expect(limitArg).toBe(200)
  })

  it("valores por defecto: page=1, limit=50", async () => {
    vi.mocked(getNotificacionesByDestinatario).mockResolvedValueOnce(
      pageResult([], "notificaciones", 0) as never
    )
    await getNotificaciones(makeReq("GET", "/api/notificaciones", undefined, adminToken))

    expect(getNotificacionesByDestinatario).toHaveBeenCalledWith("admin", "grupo-test", 1, 50)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 2 — Paginación en GET /api/sprints
// ═══════════════════════════════════════════════════════════

describe("GET /api/sprints — paginación", () => {
  it("respuesta incluye metadatos de paginación", async () => {
    vi.mocked(getAllSprints).mockResolvedValueOnce(
      pageResult([{ id: "sp-1" }], "sprints", 8, 2, 3) as never
    )
    const res  = await getSprints(makeReq("GET", "/api/sprints?page=2&limit=3", undefined, adminToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(8)
    expect(data.page).toBe(2)
    expect(data.pages).toBe(3)
  })

  it("pasa page y limit al servicio", async () => {
    vi.mocked(getAllSprints).mockResolvedValueOnce(
      pageResult([], "sprints", 0) as never
    )
    await getSprints(makeReq("GET", "/api/sprints?page=3&limit=15", undefined, adminToken))

    expect(getAllSprints).toHaveBeenCalledWith("grupo-test", 3, 15)
  })

  it("valores por defecto: page=1, limit=50", async () => {
    vi.mocked(getAllSprints).mockResolvedValueOnce(
      pageResult([], "sprints", 0) as never
    )
    await getSprints(makeReq("GET", "/api/sprints", undefined, adminToken))

    expect(getAllSprints).toHaveBeenCalledWith("grupo-test", 1, 50)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 3 — Paginación en GET /api/grupos
// ═══════════════════════════════════════════════════════════

describe("GET /api/grupos — paginación", () => {
  it("respuesta incluye metadatos de paginación", async () => {
    vi.mocked(getAllGrupos).mockResolvedValueOnce(
      pageResult([{ id: "g-1" }], "grupos", 4, 1, 2) as never
    )
    const res  = await getGrupos(makeReq("GET", "/api/grupos?page=1&limit=2", undefined, ownerToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(4)
    expect(data.pages).toBe(2)
    expect(data.grupos).toHaveLength(1)
  })

  it("pasa page y limit al servicio", async () => {
    vi.mocked(getAllGrupos).mockResolvedValueOnce(
      pageResult([], "grupos", 0) as never
    )
    await getGrupos(makeReq("GET", "/api/grupos?page=2&limit=10", undefined, ownerToken))

    expect(getAllGrupos).toHaveBeenCalledWith(2, 10)
  })

  it("sin página → defaults 1 y 50", async () => {
    vi.mocked(getAllGrupos).mockResolvedValueOnce(
      pageResult([], "grupos", 0) as never
    )
    await getGrupos(makeReq("GET", "/api/grupos", undefined, ownerToken))

    expect(getAllGrupos).toHaveBeenCalledWith(1, 50)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 4 — Paginación en GET /api/users
// ═══════════════════════════════════════════════════════════

describe("GET /api/users — paginación", () => {
  it("respuesta incluye metadatos de paginación", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([
      [{ id: "u-1", nombre: "Ana", email: "ana@e.com", rol: "qa", grupoId: "grupo-test",
         activo: true, debeCambiarPassword: false, bloqueado: false,
         fechaCreacion: new Date(), historialConexiones: [] }],
      12,
    ] as never)

    const res  = await getUsers(makeReq("GET", "/api/users?page=1&limit=5", undefined, adminToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.total).toBe(12)
    expect(data.page).toBe(1)
    expect(data.limit).toBe(5)
    expect(data.pages).toBe(3)
    expect(data.users).toHaveLength(1)
  })

  it("limit máximo capped a 200", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([[], 0] as never)

    const res = await getUsers(makeReq("GET", "/api/users?limit=999", undefined, adminToken))
    const data = await res.json()

    expect(data.limit).toBe(200)
  })

  it("defaults page=1 limit=50", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([[], 0] as never)

    const res = await getUsers(makeReq("GET", "/api/users", undefined, adminToken))
    const data = await res.json()

    expect(data.page).toBe(1)
    expect(data.limit).toBe(50)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 5 — Validators: límites de tamaño
// ═══════════════════════════════════════════════════════════

describe("createHistoriaSchema — límites de tamaño", () => {
  const baseOk = {
    codigo: "HU-001", titulo: "Test HU", responsable: "Ana",
    tipoAplicacion: "web", creadoPor: "Admin",
  }

  it("titulo > 500 chars → error de validación", () => {
    const { error } = createHistoriaSchema.validate({ ...baseOk, titulo: "x".repeat(501) })
    expect(error).toBeDefined()
    expect(error!.message).toMatch(/500/)
  })

  it("codigo > 50 chars → error de validación", () => {
    const { error } = createHistoriaSchema.validate({ ...baseOk, codigo: "H".repeat(51) })
    expect(error).toBeDefined()
  })

  it("descripcion > 10000 chars → error de validación", () => {
    const { error } = createHistoriaSchema.validate({ ...baseOk, descripcion: "x".repeat(10001) })
    expect(error).toBeDefined()
  })

  it("payload válido pasa sin errores", () => {
    const { error } = createHistoriaSchema.validate(baseOk)
    expect(error).toBeUndefined()
  })
})

describe("createCasoSchema — límites de tamaño", () => {
  const baseOk = {
    huId: "hu-1", titulo: "Test caso", creadoPor: "Admin",
  }

  it("titulo > 500 chars → error", () => {
    const { error } = createCasoSchema.validate({ ...baseOk, titulo: "x".repeat(501) })
    expect(error).toBeDefined()
  })

  it("descripcion > 10000 chars → error", () => {
    const { error } = createCasoSchema.validate({ ...baseOk, descripcion: "x".repeat(10001) })
    expect(error).toBeDefined()
  })

  it("archivosAnalizados > 100 items → error", () => {
    const { error } = createCasoSchema.validate({
      ...baseOk,
      archivosAnalizados: Array.from({ length: 101 }, (_, i) => `file-${i}.txt`),
    })
    expect(error).toBeDefined()
  })

  it("payload válido pasa sin errores", () => {
    const { error } = createCasoSchema.validate(baseOk)
    expect(error).toBeUndefined()
  })
})

describe("createTareaSchema — límites de tamaño", () => {
  const baseOk = {
    casoPruebaId: "caso-1", huId: "hu-1",
    titulo: "Test tarea", asignado: "Ana", creadoPor: "Admin",
  }

  it("titulo > 500 chars → error", () => {
    const { error } = createTareaSchema.validate({ ...baseOk, titulo: "x".repeat(501) })
    expect(error).toBeDefined()
  })

  it("horasEstimadas > 9999 → error", () => {
    const { error } = createTareaSchema.validate({ ...baseOk, horasEstimadas: 10000 })
    expect(error).toBeDefined()
  })

  it("descripcion > 5000 chars → error", () => {
    const { error } = createTareaSchema.validate({ ...baseOk, descripcion: "x".repeat(5001) })
    expect(error).toBeDefined()
  })

  it("payload válido pasa sin errores", () => {
    const { error } = createTareaSchema.validate(baseOk)
    expect(error).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 6 — loginSchema: mínimo 8 chars
// ═══════════════════════════════════════════════════════════

describe("loginSchema — mínimo 8 chars en contraseña", () => {
  it("contraseña < 8 chars → error de validación", () => {
    const { error } = loginSchema.validate({ email: "a@b.com", password: "short" })
    expect(error).toBeDefined()
    expect(error!.message).toMatch(/8/)
  })

  it("contraseña exactamente 8 chars → válida", () => {
    const { error } = loginSchema.validate({ email: "a@b.com", password: "12345678" })
    expect(error).toBeUndefined()
  })

  it("contraseña vacía → error requerido", () => {
    const { error } = loginSchema.validate({ email: "a@b.com", password: "" })
    expect(error).toBeDefined()
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 7 — Batch máx 1000 IDs
// ═══════════════════════════════════════════════════════════

describe("PATCH /api/casos/batch — máx 1000 IDs", () => {
  it("array de 1001 IDs → 400", async () => {
    const ids = Array.from({ length: 1001 }, (_, i) => `caso-${i}`)
    const res  = await patchBatch(makeReq("PATCH", "/api/casos/batch", { ids, accion: "aprobar" }, adminToken))
    expect(res.status).toBe(400)
  })

  it("array de 1000 IDs es válido (no 400 por tamaño)", async () => {
    const ids = Array.from({ length: 1000 }, (_, i) => `caso-${i}`)
    vi.mocked(prisma.casoPrueba.updateMany).mockResolvedValueOnce({ count: 0 } as never)

    const res = await patchBatch(makeReq("PATCH", "/api/casos/batch", { ids, accion: "aprobar" }, adminToken))
    expect(res.status).not.toBe(400)
  })

  it("array vacío → 400", async () => {
    const res = await patchBatch(makeReq("PATCH", "/api/casos/batch", { ids: [], accion: "aprobar" }, adminToken))
    expect(res.status).toBe(400)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 8 — Export con ?limit= (máx 5000)
// ═══════════════════════════════════════════════════════════

describe("GET /api/export — límite de registros", () => {
  beforeEach(() => {
    ;(prisma as unknown as { historiaUsuario: { findMany: ReturnType<typeof vi.fn> } })
      .historiaUsuario.findMany = vi.fn().mockResolvedValue([])
  })

  it("sin ?limit usa 5000 como default", async () => {
    const res = await getExport(makeReq("GET", "/api/export?tipo=historias", undefined, adminToken))
    expect(res.status).toBe(200)

    const findManyCall = vi.mocked(prisma.historiaUsuario.findMany).mock.calls[0]?.[0] as { take?: number } | undefined
    expect(findManyCall?.take).toBe(5000)
  })

  it("?limit=100 pasa take=100 a prisma", async () => {
    const res = await getExport(makeReq("GET", "/api/export?tipo=historias&limit=100", undefined, adminToken))
    expect(res.status).toBe(200)

    const findManyCall = vi.mocked(prisma.historiaUsuario.findMany).mock.calls[0]?.[0] as { take?: number } | undefined
    expect(findManyCall?.take).toBe(100)
  })

  it("?limit=9999 se cappa a 5000", async () => {
    const res = await getExport(makeReq("GET", "/api/export?tipo=historias&limit=9999", undefined, adminToken))
    expect(res.status).toBe(200)

    const findManyCall = vi.mocked(prisma.historiaUsuario.findMany).mock.calls[0]?.[0] as { take?: number } | undefined
    expect(findManyCall?.take).toBe(5000)
  })
})
