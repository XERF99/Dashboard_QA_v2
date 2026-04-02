// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — /api/notificaciones
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { signToken } from "@/lib/backend/middleware/auth.middleware"

// ── Mocks ────────────────────────────────────────────────
vi.mock("@/lib/backend/services/notificacion.service", () => ({
  getNotificacionesByDestinatario: vi.fn(),
  createNotificacion:              vi.fn(),
  marcarLeida:                     vi.fn(),
  marcarTodasLeidas:               vi.fn(),
  rolToDestinatario:               vi.fn((rol: string) =>
    ["owner", "admin"].includes(rol) ? "admin" : "qa"
  ),
}))

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    user:         { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    grupo:        { findUnique: vi.fn().mockResolvedValue({ activo: true, grupo: { activo: true } }) },
    notificacion: { findUnique: vi.fn() },
  },
}))

import {
  getNotificacionesByDestinatario,
  createNotificacion,
  marcarLeida,
  marcarTodasLeidas,
} from "@/lib/backend/services/notificacion.service"
import { prisma } from "@/lib/backend/prisma"

import { GET, POST }           from "@/app/api/notificaciones/route"
import { PATCH }               from "@/app/api/notificaciones/[id]/route"
import { PATCH as patchTodas } from "@/app/api/notificaciones/marcar-todas/route"

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

const notifBase = {
  id:           "notif-1",
  tipo:         "bloqueo_reportado",
  titulo:       "Caso bloqueado",
  descripcion:  "CP-001 fue bloqueado",
  fecha:        new Date().toISOString(),
  leida:        false,
  destinatario: "admin",
  casoId:       "CP-001",
  huId:         "hu-1",
  huTitulo:     "Migración OAuth",
  casoTitulo:   "Validar login",
}

let adminToken: string
let qaToken:    string

beforeAll(async () => {
  adminToken = await signToken({ sub: "u-1", email: "admin@empresa.com", nombre: "Admin", rol: "admin", grupoId: "grupo-test" })
  qaToken    = await signToken({ sub: "u-2", email: "qa@empresa.com",    nombre: "QA",    rol: "qa",    grupoId: "grupo-test" })
})

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(prisma.user.findUnique).mockResolvedValue({ activo: true, grupo: { activo: true } } as never)
  ;(prisma as unknown as { grupo: { findUnique: ReturnType<typeof vi.fn> } }).grupo.findUnique
    .mockResolvedValue({ activo: true, grupo: { activo: true } })
})

// ── GET /api/notificaciones ──────────────────────────────

describe("GET /api/notificaciones", () => {
  it("sin token → 401", async () => {
    const res = await GET(makeReq("GET", "/api/notificaciones"))
    expect(res.status).toBe(401)
  })

  it("admin recibe notificaciones destinadas a 'admin' → 200", async () => {
    vi.mocked(getNotificacionesByDestinatario).mockResolvedValueOnce(
      { notificaciones: [notifBase], total: 1, page: 1, limit: 50, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/notificaciones", undefined, adminToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.notificaciones).toHaveLength(1)
    expect(data.notificaciones[0].destinatario).toBe("admin")
  })

  it("qa recibe notificaciones destinadas a 'qa' → 200", async () => {
    const qaNotif = { ...notifBase, id: "notif-2", destinatario: "qa" }
    vi.mocked(getNotificacionesByDestinatario).mockResolvedValueOnce(
      { notificaciones: [qaNotif], total: 1, page: 1, limit: 50, pages: 1 } as never
    )

    const res  = await GET(makeReq("GET", "/api/notificaciones", undefined, qaToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.notificaciones[0].destinatario).toBe("qa")
  })

  it("devuelve array vacío si no hay notificaciones", async () => {
    vi.mocked(getNotificacionesByDestinatario).mockResolvedValueOnce(
      { notificaciones: [], total: 0, page: 1, limit: 50, pages: 0 } as never
    )

    const res  = await GET(makeReq("GET", "/api/notificaciones", undefined, adminToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.notificaciones).toHaveLength(0)
  })
})

// ── POST /api/notificaciones ─────────────────────────────

describe("POST /api/notificaciones", () => {
  it("sin token → 401", async () => {
    const res = await POST(makeReq("POST", "/api/notificaciones", notifBase))
    expect(res.status).toBe(401)
  })

  it("campos requeridos faltantes → 400", async () => {
    const res = await POST(makeReq("POST", "/api/notificaciones", { tipo: "bloqueo_reportado" }, adminToken))
    expect(res.status).toBe(400)
  })

  it("crea notificación → 201", async () => {
    vi.mocked(createNotificacion).mockResolvedValueOnce(notifBase as never)

    const res  = await POST(makeReq("POST", "/api/notificaciones", {
      tipo: notifBase.tipo, titulo: notifBase.titulo,
      descripcion: notifBase.descripcion, destinatario: notifBase.destinatario,
      grupoId: "grupo-test",
    }, adminToken))
    const data = await res.json()

    expect(res.status).toBe(201)
    expect(data.notificacion.id).toBe("notif-1")
  })
})

// ── PATCH /api/notificaciones/[id] ──────────────────────

describe("PATCH /api/notificaciones/[id]", () => {
  it("sin token → 401", async () => {
    const res = await PATCH(
      makeReq("PATCH", "/api/notificaciones/notif-1"),
      { params: Promise.resolve({ id: "notif-1" }) }
    )
    expect(res.status).toBe(401)
  })

  it("marca notificación como leída → 200", async () => {
    vi.mocked(prisma.notificacion.findUnique).mockResolvedValueOnce(
      { grupoId: "grupo-test", destinatario: "admin" } as never
    )
    vi.mocked(marcarLeida).mockResolvedValueOnce({ ...notifBase, leida: true } as never)

    const res  = await PATCH(
      makeReq("PATCH", "/api/notificaciones/notif-1", undefined, adminToken),
      { params: Promise.resolve({ id: "notif-1" }) }
    )
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.notificacion.leida).toBe(true)
  })
})

// ── PATCH /api/notificaciones/marcar-todas ───────────────

describe("PATCH /api/notificaciones/marcar-todas", () => {
  it("sin token → 401", async () => {
    const res = await patchTodas(makeReq("PATCH", "/api/notificaciones/marcar-todas"))
    expect(res.status).toBe(401)
  })

  it("marca todas como leídas → 200 success", async () => {
    vi.mocked(marcarTodasLeidas).mockResolvedValueOnce({ count: 3 } as never)

    const res  = await patchTodas(makeReq("PATCH", "/api/notificaciones/marcar-todas", undefined, adminToken))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
