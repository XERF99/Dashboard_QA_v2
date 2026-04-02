// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.54 nuevas funcionalidades
//  · Caché selectiva por workspace  (invalidateMetricasCache)
//  · Filtros ?sprint= y ?responsable= en GET /api/historias
//  · Cross-entity validation 422 en POST /api/casos y POST /api/tareas
//  · Rate limiting 429 en export / sync / batch
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ═══════════════════════════════════════════════════════════
//  BLOQUE 1 — Caché selectiva por workspace
// ═══════════════════════════════════════════════════════════

import {
  getMetricasCache,
  setMetricasCache,
  invalidateMetricasCache,
} from "@/lib/backend/metricas-cache"
import type { MetricasData } from "@/lib/backend/metricas-cache"

const metricasBase: MetricasData = {
  historiasPorEstado:          [],
  historiasPorSprint:          [],
  casosPorEstado:              [],
  tareasPorEstado:             [],
  tareasPendientesPorAsignado: [],
  velocidadPorSprint:          [],
  tasaDefectos:                { total: 5, fallidos: 1, porcentaje: 20 },
}

describe("invalidateMetricasCache — invalidación selectiva por workspace", () => {
  beforeEach(() => { invalidateMetricasCache() })
  afterEach(()  => { invalidateMetricasCache() })

  it("invalidar solo grupo-A no afecta a grupo-B", () => {
    setMetricasCache({ ...metricasBase }, "grupo-A")
    setMetricasCache({ ...metricasBase }, "grupo-B")

    invalidateMetricasCache("grupo-A")

    expect(getMetricasCache("grupo-A")).toBeNull()                 // limpiado
    expect(getMetricasCache("grupo-B")).not.toBeNull()             // intacto
  })

  it("invalidar solo grupo-A no afecta al caché del owner", () => {
    setMetricasCache({ ...metricasBase })           // owner (sin grupoId)
    setMetricasCache({ ...metricasBase }, "grupo-A")

    invalidateMetricasCache("grupo-A")

    expect(getMetricasCache("grupo-A")).toBeNull()
    expect(getMetricasCache()).not.toBeNull()        // owner intacto
  })

  it("invalidar sin argumento limpia todas las particiones", () => {
    setMetricasCache({ ...metricasBase })
    setMetricasCache({ ...metricasBase }, "grupo-A")
    setMetricasCache({ ...metricasBase }, "grupo-B")

    invalidateMetricasCache()

    expect(getMetricasCache()).toBeNull()
    expect(getMetricasCache("grupo-A")).toBeNull()
    expect(getMetricasCache("grupo-B")).toBeNull()
  })

  it("invalidar un grupoId que no existe en caché no lanza error", () => {
    expect(() => invalidateMetricasCache("grupo-inexistente")).not.toThrow()
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 2 — Filtros ?sprint= y ?responsable= en GET /api/historias
// ═══════════════════════════════════════════════════════════

vi.mock("@/lib/backend/services/historia.service", () => ({
  getAllHistorias:  vi.fn(),
  createHistoria:  vi.fn(),
  getHistoriaById: vi.fn(),
  updateHistoria:  vi.fn(),
  deleteHistoria:  vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:            { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo:           { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    historiaUsuario: { findUnique: vi.fn().mockResolvedValue({ grupoId: "grupo-test" }) },
    casoPrueba:      { findUnique: vi.fn().mockResolvedValue({ huId: "hu-1", hu: { grupoId: "grupo-test" } }) },
  },
}))

vi.mock("@/lib/backend/middleware/rate-limit", () => ({
  checkRateLimit: vi.fn().mockReturnValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60_000 }),
  getClientIp:    vi.fn().mockReturnValue("127.0.0.1"),
  rlKey:          vi.fn((ip: string, route: string) => `${ip}:${route}`),
}))

import { getAllHistorias } from "@/lib/backend/services/historia.service"
import { prisma }         from "@/lib/backend/prisma"
import { checkRateLimit } from "@/lib/backend/middleware/rate-limit"
import { GET as getHistorias, POST as postHistoria } from "@/app/api/historias/route"
import { POST as postCaso }   from "@/app/api/casos/route"
import { POST as postTarea }  from "@/app/api/tareas/route"
import { GET as getExport }   from "@/app/api/export/route"
import { POST as syncHistorias } from "@/app/api/historias/sync/route"
import { POST as syncCasos }     from "@/app/api/casos/sync/route"
import { POST as syncTareas }    from "@/app/api/tareas/sync/route"

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

const huBase = {
  id: "hu-1", codigo: "HU-001", titulo: "Historia test",
  estado: "sin_iniciar", responsable: "Maria Garcia",
  sprint: "Sprint 2", tipoAplicacion: "web", creadoPor: "usr-001",
  fechaCreacion: new Date().toISOString(),
}

let token: string
let ownerToken: string

beforeAll(async () => {
  token      = await signToken({ sub: "usr-001", email: "admin@e.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  ownerToken = await signToken({ sub: "usr-000", email: "owner@e.com", nombre: "Owner", rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
  vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValue({ grupoId: "grupo-test" } as never)
  vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValue({ huId: "hu-1", hu: { grupoId: "grupo-test" } } as never)
  vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 29, resetAt: Date.now() + 60_000 })
})

describe("GET /api/historias — filtros ?sprint= y ?responsable=", () => {
  it("?sprint= pasa el filtro al servicio", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(pageResult([huBase], "historias") as never)

    await getHistorias(makeReq("GET", "/api/historias?sprint=Sprint+2", undefined, token))

    expect(getAllHistorias).toHaveBeenCalledWith(
      "grupo-test", 1, 50, { sprint: "Sprint 2", responsable: undefined }
    )
  })

  it("?responsable= pasa el filtro al servicio", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(pageResult([huBase], "historias") as never)

    await getHistorias(makeReq("GET", "/api/historias?responsable=Maria+Garcia", undefined, token))

    expect(getAllHistorias).toHaveBeenCalledWith(
      "grupo-test", 1, 50, { sprint: undefined, responsable: "Maria Garcia" }
    )
  })

  it("?sprint= y ?responsable= combinados se pasan juntos", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(pageResult([huBase], "historias") as never)

    await getHistorias(
      makeReq("GET", "/api/historias?sprint=Sprint+2&responsable=Maria+Garcia", undefined, token)
    )

    expect(getAllHistorias).toHaveBeenCalledWith(
      "grupo-test", 1, 50, { sprint: "Sprint 2", responsable: "Maria Garcia" }
    )
  })

  it("sin filtros pasa sprint y responsable como undefined", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(pageResult([], "historias", 0) as never)

    await getHistorias(makeReq("GET", "/api/historias", undefined, token))

    expect(getAllHistorias).toHaveBeenCalledWith(
      "grupo-test", 1, 50, { sprint: undefined, responsable: undefined }
    )
  })

  it("respuesta incluye las historias filtradas por sprint", async () => {
    vi.mocked(getAllHistorias).mockResolvedValueOnce(
      { historias: [huBase], total: 1, page: 1, limit: 50, pages: 1 } as never
    )

    const res  = await getHistorias(makeReq("GET", "/api/historias?sprint=Sprint+2", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.historias[0].sprint).toBe("Sprint 2")
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 3 — Cross-entity validation 422
// ═══════════════════════════════════════════════════════════

const casoCreateBody = {
  huId: "hu-1", titulo: "Login exitoso", descripcion: "desc",
  entorno: "test", tipoPrueba: "funcional", horasEstimadas: 2,
  complejidad: "baja", creadoPor: "usr-001",
}

const tareaCreateBody = {
  casoPruebaId: "caso-1", huId: "hu-1",
  titulo: "Revisar formulario de login",
  asignado: "usr-001", creadoPor: "usr-001", horasEstimadas: 1,
}

describe("POST /api/casos — cross-entity validation", () => {
  it("HU inexistente → 422 con mensaje de error", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce(null)

    const res  = await postCaso(makeReq("POST", "/api/casos", casoCreateBody, token))
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.error).toMatch(/Historia de Usuario no existe/i)
  })

  it("HU de otro workspace → 422 con mensaje de workspace", async () => {
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce(
      { grupoId: "grupo-otro" } as never
    )

    const res  = await postCaso(makeReq("POST", "/api/casos", casoCreateBody, token))
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.error).toMatch(/workspace/i)
  })

  it("HU válida del mismo workspace → 201", async () => {
    const { createCaso } = await import("@/lib/backend/services/caso.service")
    vi.mocked(createCaso).mockResolvedValueOnce({ id: "caso-1", ...casoCreateBody } as never)

    const res = await postCaso(makeReq("POST", "/api/casos", casoCreateBody, token))

    expect(res.status).toBe(201)
  })

  it("owner (sin grupoId) puede crear caso sin restricción de workspace", async () => {
    // owner no tiene grupoId → el check de workspace no se aplica
    vi.mocked(prisma.historiaUsuario.findUnique).mockResolvedValueOnce(
      { grupoId: "grupo-cualquiera" } as never
    )
    const { createCaso } = await import("@/lib/backend/services/caso.service")
    vi.mocked(createCaso).mockResolvedValueOnce({ id: "caso-2", ...casoCreateBody } as never)

    const res = await postCaso(makeReq("POST", "/api/casos", casoCreateBody, ownerToken))

    expect(res.status).toBe(201)
  })
})

describe("POST /api/tareas — cross-entity validation", () => {
  it("Caso inexistente → 422 con mensaje de error", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValueOnce(null)

    const res  = await postTarea(makeReq("POST", "/api/tareas", tareaCreateBody, token))
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.error).toMatch(/Caso de Prueba no existe/i)
  })

  it("Caso de otro workspace → 422 con mensaje de workspace", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValueOnce(
      { huId: "hu-1", hu: { grupoId: "grupo-otro" } } as never
    )

    const res  = await postTarea(makeReq("POST", "/api/tareas", tareaCreateBody, token))
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.error).toMatch(/workspace/i)
  })

  it("huId no corresponde al caso → 422 con mensaje de coherencia", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValueOnce(
      { huId: "hu-OTRO", hu: { grupoId: "grupo-test" } } as never
    )

    const res  = await postTarea(makeReq("POST", "/api/tareas", tareaCreateBody, token))
    const data = await res.json()

    expect(res.status).toBe(422)
    expect(data.error).toMatch(/huId no corresponde/i)
  })

  it("Caso válido del mismo workspace → 201", async () => {
    const { createTarea } = await import("@/lib/backend/services/tarea.service")
    vi.mocked(createTarea).mockResolvedValueOnce({ id: "t-1", ...tareaCreateBody } as never)

    const res = await postTarea(makeReq("POST", "/api/tareas", tareaCreateBody, token))

    expect(res.status).toBe(201)
  })

  it("owner (sin grupoId) puede crear tarea sin restricción de workspace", async () => {
    vi.mocked(prisma.casoPrueba.findUnique).mockResolvedValueOnce(
      { huId: "hu-1", hu: { grupoId: "grupo-cualquiera" } } as never
    )
    const { createTarea } = await import("@/lib/backend/services/tarea.service")
    vi.mocked(createTarea).mockResolvedValueOnce({ id: "t-2", ...tareaCreateBody } as never)

    const res = await postTarea(makeReq("POST", "/api/tareas", tareaCreateBody, ownerToken))

    expect(res.status).toBe(201)
  })
})

// ═══════════════════════════════════════════════════════════
//  BLOQUE 4 — Rate limiting 429 en rutas de alto tráfico
// ═══════════════════════════════════════════════════════════

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

describe("Rate limiting — 429 en rutas de negocio", () => {
  it("GET /api/export → 429 cuando se supera el límite", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })

    const res  = await getExport(makeReq("GET", "/api/export?tipo=historias", undefined, token))
    const data = await res.json()

    expect(res.status).toBe(429)
    expect(data.error).toMatch(/peticiones/i)
  })

  it("POST /api/historias/sync → 429 cuando se supera el límite", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })

    const res  = await syncHistorias(makeReq("POST", "/api/historias/sync", { historias: [] }, ownerToken))
    const data = await res.json()

    expect(res.status).toBe(429)
    expect(data.error).toMatch(/peticiones/i)
  })

  it("POST /api/casos/sync → 429 cuando se supera el límite", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })

    const res  = await syncCasos(makeReq("POST", "/api/casos/sync", { casos: [] }, ownerToken))
    const data = await res.json()

    expect(res.status).toBe(429)
    expect(data.error).toMatch(/peticiones/i)
  })

  it("POST /api/tareas/sync → 429 cuando se supera el límite", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false, remaining: 0, resetAt: Date.now() + 60_000 })

    const res  = await syncTareas(makeReq("POST", "/api/tareas/sync", { tareas: [] }, ownerToken))
    const data = await res.json()

    expect(res.status).toBe(429)
    expect(data.error).toMatch(/peticiones/i)
  })

  it("petición permitida (allowed=true) no devuelve 429", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60_000 })
    vi.mocked(prisma.historiaUsuario as unknown as { findMany: ReturnType<typeof vi.fn> })

    // El export necesita prisma mocks para no fallar
    ;(prisma as unknown as { historiaUsuario: { findMany: ReturnType<typeof vi.fn> } })
      .historiaUsuario.findMany = vi.fn().mockResolvedValue([])

    const res = await getExport(makeReq("GET", "/api/export?tipo=historias", undefined, token))

    expect(res.status).not.toBe(429)
  })
})
