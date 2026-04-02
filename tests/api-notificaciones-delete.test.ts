// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — DELETE /api/notificaciones/[id]
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:          { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo:         { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    notificacion:  { findUnique: vi.fn(), delete: vi.fn() },
  },
}))

import { prisma } from "@/lib/backend/prisma"
import { DELETE } from "@/app/api/notificaciones/[id]/route"

function makeReq(id: string, token?: string) {
  return new NextRequest(`http://localhost/api/notificaciones/${id}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}
const params = (id: string) => ({ params: Promise.resolve({ id }) })

let adminToken: string
let qaToken:    string

beforeAll(async () => {
  adminToken = await signToken({ sub: "u-1", email: "admin@e.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  qaToken    = await signToken({ sub: "u-2", email: "qa@e.com",    nombre: "QA",    rol: "qa",    grupoId: "grupo-test" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
})

describe("DELETE /api/notificaciones/[id]", () => {
  it("sin token → 401", async () => {
    const res = await DELETE(makeReq("notif-1"), params("notif-1"))
    expect(res.status).toBe(401)
  })

  it("notificación no encontrada → 404", async () => {
    vi.mocked(prisma.notificacion.findUnique).mockResolvedValueOnce(null)

    const res = await DELETE(makeReq("notif-x", adminToken), params("notif-x"))
    expect(res.status).toBe(404)
  })

  it("notificación de otro workspace → 404", async () => {
    vi.mocked(prisma.notificacion.findUnique).mockResolvedValueOnce(
      { grupoId: "grupo-otro", destinatario: "admin" } as never
    )
    const res = await DELETE(makeReq("notif-1", adminToken), params("notif-1"))
    expect(res.status).toBe(404)
  })

  it("notificación de destinatario incorrecto → 404", async () => {
    // qaToken tiene rol "qa" → destinatario "qa"; notif.destinatario = "admin"
    vi.mocked(prisma.notificacion.findUnique).mockResolvedValueOnce(
      { grupoId: "grupo-test", destinatario: "admin" } as never
    )
    const res = await DELETE(makeReq("notif-1", qaToken), params("notif-1"))
    expect(res.status).toBe(404)
  })

  it("admin elimina su propia notificación → 200 con success", async () => {
    vi.mocked(prisma.notificacion.findUnique).mockResolvedValueOnce(
      { grupoId: "grupo-test", destinatario: "admin" } as never
    )
    vi.mocked(prisma.notificacion.delete).mockResolvedValueOnce(undefined as never)

    const res  = await DELETE(makeReq("notif-1", adminToken), params("notif-1"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(prisma.notificacion.delete).toHaveBeenCalledWith({ where: { id: "notif-1" } })
  })

  it("qa elimina su propia notificación → 200", async () => {
    vi.mocked(prisma.notificacion.findUnique).mockResolvedValueOnce(
      { grupoId: "grupo-test", destinatario: "qa" } as never
    )
    vi.mocked(prisma.notificacion.delete).mockResolvedValueOnce(undefined as never)

    const res  = await DELETE(makeReq("notif-2", qaToken), params("notif-2"))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
