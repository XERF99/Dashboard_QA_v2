// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — lib/backend/metricas-cache  +  cache hit en /api/metricas
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, beforeAll, afterEach } from "vitest"
import {
  getMetricasCache,
  setMetricasCache,
  invalidateMetricasCache,
} from "@/lib/backend/metricas-cache"
import type { MetricasData } from "@/lib/backend/metricas-cache"

// ── Mock de getMetricas para el test de la ruta ───────────
vi.mock("@/lib/backend/services/metricas.service", () => ({
  getMetricas: vi.fn(),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:  { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo: { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
  },
}))

import { getMetricas } from "@/lib/backend/services/metricas.service"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"
import { GET } from "@/app/api/metricas/route"

// ── Fixture ───────────────────────────────────────────────
const metricasMock: MetricasData = {
  historiasPorEstado:          [{ estado: "en_progreso", total: 1 }],
  historiasPorSprint:          [],
  casosPorEstado:              [],
  tareasPorEstado:             [],
  tareasPendientesPorAsignado: [],
  velocidadPorSprint:          [],
  tasaDefectos:                { total: 5, fallidos: 1, porcentaje: 20 },
}

function makeReq(token: string) {
  return new NextRequest("http://localhost/api/metricas", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  })
}

let token: string
let tokenGrupoA: string
let tokenGrupoB: string

beforeAll(async () => {
  token       = await signToken({ sub: "usr-001", email: "owner@empresa.com",   nombre: "Owner",    rol: "owner" })
  tokenGrupoA = await signToken({ sub: "usr-002", email: "adminA@empresa.com",  nombre: "AdminA",   rol: "admin", grupoId: "grupo-A" })
  tokenGrupoB = await signToken({ sub: "usr-003", email: "adminB@empresa.com",  nombre: "AdminB",   rol: "admin", grupoId: "grupo-B" })
})

// ── Tests: módulo cache ────────────────────────────────────

describe("metricas-cache — módulo", () => {
  beforeEach(() => {
    invalidateMetricasCache()
  })

  afterEach(() => {
    invalidateMetricasCache()
  })

  it("getMetricasCache() retorna null cuando el caché está vacío", () => {
    expect(getMetricasCache()).toBeNull()
  })

  it("setMetricasCache + getMetricasCache retorna los datos guardados", () => {
    setMetricasCache(metricasMock)
    const cached = getMetricasCache()
    expect(cached).not.toBeNull()
    expect(cached!.tasaDefectos.porcentaje).toBe(20)
  })

  it("invalidateMetricasCache limpia el caché", () => {
    setMetricasCache(metricasMock)
    invalidateMetricasCache()
    expect(getMetricasCache()).toBeNull()
  })

  it("caché de grupo-A y grupo-B son independientes", () => {
    const metricasA: MetricasData = { ...metricasMock, tasaDefectos: { total: 10, fallidos: 2, porcentaje: 20 } }
    const metricasB: MetricasData = { ...metricasMock, tasaDefectos: { total: 5,  fallidos: 0, porcentaje: 0 } }

    setMetricasCache(metricasA, "grupo-A")
    setMetricasCache(metricasB, "grupo-B")

    expect(getMetricasCache("grupo-A")!.tasaDefectos.total).toBe(10)
    expect(getMetricasCache("grupo-B")!.tasaDefectos.total).toBe(5)
    expect(getMetricasCache()).toBeNull()            // owner (sin grupoId) vacío
  })

  it("invalidateMetricasCache limpia todas las particiones", () => {
    setMetricasCache(metricasMock, "grupo-A")
    setMetricasCache(metricasMock, "grupo-B")
    setMetricasCache(metricasMock)

    invalidateMetricasCache()

    expect(getMetricasCache("grupo-A")).toBeNull()
    expect(getMetricasCache("grupo-B")).toBeNull()
    expect(getMetricasCache()).toBeNull()
  })
})

// ── Tests: cache hit en GET /api/metricas ─────────────────

describe("GET /api/metricas — comportamiento de caché", () => {
  beforeEach(() => {
    invalidateMetricasCache()
    vi.mocked(getMetricas).mockReset()
  })

  afterEach(() => {
    invalidateMetricasCache()
  })

  it("primera llamada invoca getMetricas() y guarda en caché", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    const res = await GET(makeReq(token))
    expect(res.status).toBe(200)
    expect(getMetricas).toHaveBeenCalledTimes(1)

    // El caché ahora debe tener datos (clave owner)
    expect(getMetricasCache(undefined)).not.toBeNull()
  })

  it("segunda llamada NO invoca getMetricas() — sirve desde caché", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    await GET(makeReq(token))
    const res2 = await GET(makeReq(token))

    expect(getMetricas).toHaveBeenCalledTimes(1) // solo una vez total
    expect(res2.status).toBe(200)
  })

  it("tras invalidateMetricasCache(), vuelve a invocar getMetricas()", async () => {
    vi.mocked(getMetricas).mockResolvedValue(metricasMock)

    await GET(makeReq(token))     // llena caché
    invalidateMetricasCache()     // simula escritura
    await GET(makeReq(token))     // debe ir a DB de nuevo

    expect(getMetricas).toHaveBeenCalledTimes(2)
  })

  it("respuesta desde caché contiene la misma estructura que la original", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    await GET(makeReq(token))                    // llena caché
    const res = await GET(makeReq(token))        // desde caché
    const { metricas } = await res.json()

    expect(metricas.tasaDefectos.porcentaje).toBe(20)
    expect(metricas.historiasPorEstado[0].total).toBe(1)
  })
})

// ── Tests: aislamiento de workspace en el caché ───────────

describe("GET /api/metricas — aislamiento de workspace en caché", () => {
  beforeEach(() => {
    invalidateMetricasCache()
    vi.mocked(getMetricas).mockReset()
  })

  afterEach(() => {
    invalidateMetricasCache()
  })

  it("grupo-A y grupo-B tienen particiones de caché independientes", async () => {
    const metricasA: MetricasData = { ...metricasMock, tasaDefectos: { total: 10, fallidos: 2, porcentaje: 20 } }
    const metricasB: MetricasData = { ...metricasMock, tasaDefectos: { total: 3,  fallidos: 0, porcentaje: 0  } }

    vi.mocked(getMetricas)
      .mockResolvedValueOnce(metricasA)  // primera llamada → grupo-A
      .mockResolvedValueOnce(metricasB)  // segunda llamada → grupo-B

    await GET(makeReq(tokenGrupoA))
    await GET(makeReq(tokenGrupoB))

    // Cada workspace tiene su propio caché
    expect(getMetricasCache("grupo-A")!.tasaDefectos.total).toBe(10)
    expect(getMetricasCache("grupo-B")!.tasaDefectos.total).toBe(3)
  })

  it("usuario de grupo-A sirve desde su propio caché sin afectar a grupo-B", async () => {
    vi.mocked(getMetricas).mockResolvedValue(metricasMock)

    await GET(makeReq(tokenGrupoA))  // llena caché grupo-A
    await GET(makeReq(tokenGrupoA))  // hit en caché grupo-A

    // grupo-B no tiene caché aún
    expect(getMetricasCache("grupo-B")).toBeNull()
    // getMetricas solo fue invocado 1 vez (grupo-A), grupo-B no tocó el caché
    expect(getMetricas).toHaveBeenCalledTimes(1)
  })

  it("invalidar caché limpia todas las particiones incluyendo workspaces", async () => {
    vi.mocked(getMetricas).mockResolvedValue(metricasMock)

    await GET(makeReq(token))        // owner
    await GET(makeReq(tokenGrupoA))  // grupo-A
    await GET(makeReq(tokenGrupoB))  // grupo-B

    invalidateMetricasCache()

    expect(getMetricasCache(undefined)).toBeNull()
    expect(getMetricasCache("grupo-A")).toBeNull()
    expect(getMetricasCache("grupo-B")).toBeNull()
  })
})
