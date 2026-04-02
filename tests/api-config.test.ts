// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/config  (GET cualquier usuario / PUT solo admin)
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

vi.mock("@/lib/backend/services/config.service", () => ({
  getConfig:    vi.fn(),
  updateConfig: vi.fn(),
}))

import { getConfig, updateConfig } from "@/lib/backend/services/config.service"
import { GET, PUT } from "@/app/api/config/route"

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

const configBase = {
  id: "singleton",
  etapas: {},
  resultados: [],
  tiposAplicacion: [],
  ambientes: [],
  tiposPrueba: [],
  aplicaciones: [],
}

let adminToken: string
let qaToken:    string

beforeAll(async () => {
  adminToken = await signToken({ sub: "usr-001", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  qaToken    = await signToken({ sub: "usr-006", email: "maria@empresa.com", nombre: "Maria", rol: "qa", grupoId: "grupo-test" })
})

// ── GET /api/config ──────────────────────────────────────

describe("GET /api/config", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("GET", "/api/config"))
    expect(res.status).toBe(401)
  })

  it("cualquier usuario autenticado puede leer la config → 200", async () => {
    vi.mocked(getConfig).mockResolvedValueOnce(configBase as never)

    const res  = await GET(makeReq("GET", "/api/config", undefined, qaToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.config.id).toBe("singleton")
  })
})

// ── PUT /api/config ──────────────────────────────────────

describe("PUT /api/config", () => {
  it("usuario sin rol admin → 403", async () => {
    const res = await PUT(makeReq("PUT", "/api/config", { aplicaciones: ["App A"] }, qaToken))
    expect(res.status).toBe(403)
  })

  it("body inválido → 400", async () => {
    // aplicaciones debe ser array de strings; number no es válido
    const res = await PUT(makeReq("PUT", "/api/config", { aplicaciones: 123 }, adminToken))
    expect(res.status).toBe(400)
  })

  it("admin actualiza config → 200", async () => {
    vi.mocked(updateConfig).mockResolvedValueOnce({ ...configBase, aplicaciones: ["App A", "App B"] } as never)

    const res  = await PUT(
      makeReq("PUT", "/api/config", { aplicaciones: ["App A", "App B"] }, adminToken)
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.config.aplicaciones).toContain("App A")
  })

  it("admin actualiza etapas personalizadas → 200", async () => {
    const etapas = {
      desarrollo: [{ id: "dev-1", label: "En desarrollo", cls: "" }],
      testing:    [{ id: "qa-1",  label: "En QA",         cls: "" }],
    }
    vi.mocked(updateConfig).mockResolvedValueOnce({ ...configBase, etapas } as never)

    const res  = await PUT(
      makeReq("PUT", "/api/config", { etapas }, adminToken)
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.config.etapas).toEqual(etapas)
  })
})
