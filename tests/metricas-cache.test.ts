// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — lib/backend/metricas-cache  +  cache hit en /api/metricas
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest"
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

beforeAll(async () => {
  token = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin" })
})

// ── Tests: módulo cache ────────────────────────────────────

describe("metricas-cache — módulo", () => {
  beforeEach(() => {
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
})

// ── Tests: cache hit en GET /api/metricas ─────────────────

describe("GET /api/metricas — comportamiento de caché", () => {
  beforeEach(() => {
    invalidateMetricasCache()
    vi.mocked(getMetricas).mockReset()
  })

  it("primera llamada invoca getMetricas() y guarda en caché", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    const res = await GET(makeReq(token))
    expect(res.status).toBe(200)
    expect(getMetricas).toHaveBeenCalledTimes(1)

    // El caché ahora debe tener datos
    expect(getMetricasCache()).not.toBeNull()
  })

  it("segunda llamada NO invoca getMetricas() — sirve desde caché", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    // Primera llamada llena el caché
    await GET(makeReq(token))
    // Segunda llamada debe usar el caché
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
