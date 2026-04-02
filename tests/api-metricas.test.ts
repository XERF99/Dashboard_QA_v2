// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/metricas
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:  { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo: { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
  },
}))

vi.mock("@/lib/backend/services/metricas.service", () => ({
  getMetricas: vi.fn(),
}))

import { getMetricas } from "@/lib/backend/services/metricas.service"
import { GET } from "@/app/api/metricas/route"

// ── Helper ───────────────────────────────────────────────
function makeReq(token?: string) {
  return new NextRequest("http://localhost/api/metricas", {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

const metricasMock = {
  historiasPorEstado:           [{ estado: "en_progreso", total: 2 }, { estado: "exitosa", total: 1 }],
  historiasPorSprint:           [{ sprint: "Sprint 3", total: 2 }],
  casosPorEstado:               [{ estado: "aprobado", total: 4 }, { estado: "borrador", total: 1 }],
  tareasPorEstado:              [{ estado: "completada", total: 3 }, { estado: "pendiente", total: 2 }],
  tareasPendientesPorAsignado:  [{ asignado: "Maria Garcia", estado: "pendiente", total: 2 }],
  velocidadPorSprint:           [{ sprint: "Sprint 2", puntosCompletados: 3, historias: 1 }],
  tasaDefectos:                 { total: 9, fallidos: 1, porcentaje: 11.1 },
}

let token: string

beforeAll(async () => {
  token = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
})

// ── Tests ────────────────────────────────────────────────

describe("GET /api/metricas", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq())
    expect(res.status).toBe(401)
  })

  it("devuelve métricas agregadas → 200", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    const res  = await GET(makeReq(token))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.metricas).toBeDefined()
    expect(data.metricas.historiasPorEstado).toHaveLength(2)
    expect(data.metricas.tasaDefectos.porcentaje).toBe(11.1)
  })

  it("estructura completa de la respuesta", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    const res  = await GET(makeReq(token))
    const { metricas } = await res.json()

    expect(metricas).toHaveProperty("historiasPorEstado")
    expect(metricas).toHaveProperty("historiasPorSprint")
    expect(metricas).toHaveProperty("casosPorEstado")
    expect(metricas).toHaveProperty("tareasPorEstado")
    expect(metricas).toHaveProperty("tareasPendientesPorAsignado")
    expect(metricas).toHaveProperty("velocidadPorSprint")
    expect(metricas).toHaveProperty("tasaDefectos")
  })

  it("velocidadPorSprint contiene puntosCompletados e historias", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    const res  = await GET(makeReq(token))
    const { metricas } = await res.json()

    expect(metricas.velocidadPorSprint[0]).toMatchObject({
      sprint: "Sprint 2",
      puntosCompletados: 3,
      historias: 1,
    })
  })

  it("tareasPendientesPorAsignado agrupa correctamente", async () => {
    vi.mocked(getMetricas).mockResolvedValueOnce(metricasMock)

    const res  = await GET(makeReq(token))
    const { metricas } = await res.json()

    const entry = metricas.tareasPendientesPorAsignado[0]
    expect(entry.asignado).toBe("Maria Garcia")
    expect(entry.estado).toBe("pendiente")
    expect(entry.total).toBe(2)
  })
})
