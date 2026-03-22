// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/export (CSV)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mock Prisma ──────────────────────────────────────────
vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    historiaUsuario: { findMany: vi.fn() },
    casoPrueba:      { findMany: vi.fn() },
  },
}))

import { prisma } from "@/lib/backend/prisma"
import { GET } from "@/app/api/export/route"

// ── Helper ───────────────────────────────────────────────
function makeReq(search: string, token?: string) {
  return new NextRequest(`http://localhost/api/export?${search}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

const historiaBase = {
  id: "hu-1", codigo: "HU-001", titulo: "Migración OAuth",
  estado: "en_progreso", prioridad: "alta", sprint: "Sprint 3",
  responsable: "Maria Garcia", puntos: 13, etapa: "despliegue",
  ambiente: "test", tipoPrueba: "funcional",
  aplicacion: "Portal Web", requiriente: "Seguridad", areaSolicitante: "IT",
  fechaCreacion: new Date("2026-03-01"), fechaFinEstimada: new Date("2026-03-20"),
  fechaCierre: null,
}

const casoBase = {
  id: "cp-1", huId: "hu-1", titulo: "Validar login OAuth",
  estadoAprobacion: "aprobado", tipoPrueba: "funcional",
  entorno: "test", complejidad: "alta", horasEstimadas: 8,
  aprobadoPor: "Admin", fechaAprobacion: new Date("2026-03-04"),
  creadoPor: "Maria Garcia", fechaCreacion: new Date("2026-03-02"),
}

let token: string

beforeAll(async () => {
  token = await signToken({ sub: "u-1", email: "admin@empresa.com", nombre: "Admin", rol: "admin" })
})

// ── Tests ────────────────────────────────────────────────

describe("GET /api/export", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("tipo=historias"))
    expect(res.status).toBe(401)
  })

  it("tipo inválido → 400", async () => {
    const res  = await GET(makeReq("tipo=tareas", token))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toMatch(/tipo/i)
  })

  it("tipo faltante → 400", async () => {
    const res = await GET(makeReq("", token))
    expect(res.status).toBe(400)
  })

  it("exporta historias como CSV → 200 con Content-Type text/csv", async () => {
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValueOnce([historiaBase] as never)

    const res = await GET(makeReq("tipo=historias", token))

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("text/csv")
    expect(res.headers.get("Content-Disposition")).toContain("historias")
  })

  it("CSV de historias contiene cabecera con los campos correctos", async () => {
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValueOnce([historiaBase] as never)

    const res  = await GET(makeReq("tipo=historias", token))
    const text = await res.text()
    const [header] = text.split("\n")

    expect(header).toContain("codigo")
    expect(header).toContain("titulo")
    expect(header).toContain("estado")
    expect(header).toContain("sprint")
  })

  it("CSV de historias contiene los datos de la fila", async () => {
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValueOnce([historiaBase] as never)

    const res  = await GET(makeReq("tipo=historias", token))
    const text = await res.text()

    expect(text).toContain("HU-001")
    expect(text).toContain("Migración OAuth")
    expect(text).toContain("Sprint 3")
  })

  it("filtra historias por sprint", async () => {
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValueOnce([historiaBase] as never)

    const res = await GET(makeReq("tipo=historias&sprint=Sprint+3", token))
    expect(res.status).toBe(200)

    // Verifica que prisma fue llamado con el filtro correcto
    expect(vi.mocked(prisma.historiaUsuario.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ sprint: "Sprint 3" }) })
    )
    const disp = res.headers.get("Content-Disposition") ?? ""
    expect(disp).toContain("Sprint_3")
  })

  it("exporta casos como CSV → 200", async () => {
    vi.mocked(prisma.casoPrueba.findMany).mockResolvedValueOnce([casoBase] as never)

    const res  = await GET(makeReq("tipo=casos", token))
    const text = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("text/csv")
    expect(text).toContain("estadoAprobacion")
    expect(text).toContain("Validar login OAuth")
  })

  it("filtra casos por estadoAprobacion", async () => {
    vi.mocked(prisma.casoPrueba.findMany).mockResolvedValueOnce([casoBase] as never)

    const res = await GET(makeReq("tipo=casos&estado=aprobado", token))
    expect(res.status).toBe(200)

    expect(vi.mocked(prisma.casoPrueba.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ estadoAprobacion: "aprobado" }) })
    )
  })

  it("historias vacías genera solo la cabecera CSV", async () => {
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValueOnce([])

    const res  = await GET(makeReq("tipo=historias", token))
    const text = await res.text()
    const lines = text.trim().split("\n")

    // Solo cabecera, sin filas de datos
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain("codigo")
  })
})
