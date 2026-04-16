// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — PATCH /api/casos/batch (aprobación masiva)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:       { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo:      { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    casoPrueba: { updateMany: vi.fn() },
  },
}))

vi.mock("@/lib/backend/metricas-cache", () => ({
  invalidateMetricasCache: vi.fn(),
}))

import { prisma } from "@/lib/backend/prisma"
import { PATCH } from "@/app/api/casos/batch/route"

function makeReq(body: unknown, token?: string) {
  return new NextRequest("http://localhost/api/casos/batch", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

let adminToken: string
let qaToken:    string
let ownerToken: string

beforeAll(async () => {
  adminToken = await signToken({ sub: "u-1", email: "admin@e.com", nombre: "Admin Leal", rol: "admin", grupoId: "grupo-test" })
  qaToken    = await signToken({ sub: "u-2", email: "qa@e.com",    nombre: "QA",          rol: "qa",    grupoId: "grupo-test" })
  ownerToken = await signToken({ sub: "u-0", email: "owner@e.com", nombre: "Owner",        rol: "owner" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
})

describe("PATCH /api/casos/batch", () => {
  it("sin token → 401", async () => {
    const res = await PATCH(makeReq({ ids: ["c-1"], accion: "aprobar" }))
    expect(res.status).toBe(401)
  })

  it("QA no puede usar batch → 403", async () => {
    const res = await PATCH(makeReq({ ids: ["c-1"], accion: "aprobar" }, qaToken))
    expect(res.status).toBe(403)
  })

  it("body inválido — ids vacío → 400", async () => {
    const res  = await PATCH(makeReq({ ids: [], accion: "aprobar" }, adminToken))
    const data = await res.json()
    expect(res.status).toBe(400)
    expect(data.error).toMatch(/inválido/i)
  })

  it("body inválido — accion desconocida → 400", async () => {
    const res = await PATCH(makeReq({ ids: ["c-1"], accion: "eliminar" }, adminToken))
    expect(res.status).toBe(400)
  })

  it("admin aprueba lote → 200 con count correcto", async () => {
    vi.mocked(prisma.casoPrueba.updateMany).mockResolvedValueOnce({ count: 3 } as never)

    const res  = await PATCH(makeReq({ ids: ["c-1", "c-2", "c-3"], accion: "aprobar" }, adminToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.count).toBe(3)
  })

  it("admin rechaza lote con motivo → updateMany recibe motivoRechazo", async () => {
    vi.mocked(prisma.casoPrueba.updateMany).mockResolvedValueOnce({ count: 2 } as never)

    await PATCH(makeReq({ ids: ["c-1", "c-2"], accion: "rechazar", motivo: "No cumple criterios" }, adminToken))

    expect(prisma.casoPrueba.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estadoAprobacion: "rechazado",
          motivoRechazo: "No cumple criterios",
        }),
      })
    )
  })

  it("admin aprueba → updateMany recibe aprobadoPor y fechaAprobacion", async () => {
    vi.mocked(prisma.casoPrueba.updateMany).mockResolvedValueOnce({ count: 1 } as never)

    await PATCH(makeReq({ ids: ["c-1"], accion: "aprobar" }, adminToken))

    expect(prisma.casoPrueba.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estadoAprobacion: "aprobado",
          aprobadoPor: "Admin Leal",
          fechaAprobacion: expect.any(Date),
        }),
      })
    )
  })

  it("admin con grupoId → where incluye filtro de workspace", async () => {
    vi.mocked(prisma.casoPrueba.updateMany).mockResolvedValueOnce({ count: 0 } as never)

    await PATCH(makeReq({ ids: ["c-1"], accion: "aprobar" }, adminToken))

    expect(prisma.casoPrueba.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          hu: { grupoId: "grupo-test" },
          estadoAprobacion: "pendiente_aprobacion",
        }),
      })
    )
  })

  it("owner (sin grupoId) → where no incluye filtro de grupo", async () => {
    vi.mocked(prisma.casoPrueba.updateMany).mockResolvedValueOnce({ count: 1 } as never)

    await PATCH(makeReq({ ids: ["c-1"], accion: "aprobar" }, ownerToken))

    const callArg = vi.mocked(prisma.casoPrueba.updateMany).mock.calls[0]![0] as {
      where: Record<string, unknown>
    }
    expect(callArg.where).not.toHaveProperty("hu")
  })

  it("solo actualiza casos en estado pendiente_aprobacion", async () => {
    vi.mocked(prisma.casoPrueba.updateMany).mockResolvedValueOnce({ count: 1 } as never)

    await PATCH(makeReq({ ids: ["c-1", "c-2"] , accion: "aprobar" }, adminToken))

    expect(prisma.casoPrueba.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estadoAprobacion: "pendiente_aprobacion" }),
      })
    )
  })
})
