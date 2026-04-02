// ═══════════════════════════════════════════════════════════
//  TESTS — Grupos (workspaces)
//  Verifica el servicio de grupos y las rutas API.
//  Usa mocks de Prisma para no depender de la BD en tests.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"

// ── Mock de Prisma (hoisted para evitar TDZ con vi.mock) ──

const { mockPrisma, mockGrupo } = vi.hoisted(() => {
  const mockGrupo = {
    id: "g-1",
    nombre: "Equipo Alpha",
    descripcion: "Descripción de prueba",
    activo: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }

  const mockPrisma = {
    grupo: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
      update:     vi.fn(),
      delete:     vi.fn(),
      count:      vi.fn().mockResolvedValue(0),
    },
    user:           { count: vi.fn() },
    historiaUsuario: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    casoPrueba: { count: vi.fn(), groupBy: vi.fn() },
    tarea:      { count: vi.fn(), groupBy: vi.fn() },
    config:       { create: vi.fn(), deleteMany: vi.fn() },
    sprint:       { count: vi.fn() },
    notificacion: { deleteMany: vi.fn() },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  }

  return { mockPrisma, mockGrupo }
})

vi.mock("@/lib/backend/prisma", () => ({ prisma: mockPrisma }))

import {
  getAllGrupos,
  getGrupoById,
  createGrupo,
  updateGrupo,
  deleteGrupo,
  getMetricasGrupo,
} from "@/lib/backend/services/grupo.service"

// Limpia el historial de llamadas entre tests para evitar falsos positivos
beforeEach(() => { vi.clearAllMocks() })

// ── getAllGrupos ───────────────────────────────────────────

describe("getAllGrupos", () => {
  it("devuelve los grupos ordenados por createdAt", async () => {
    mockPrisma.grupo.findMany.mockResolvedValue([mockGrupo])
    mockPrisma.grupo.count.mockResolvedValue(1)
    const result = await getAllGrupos()
    expect(result.grupos).toHaveLength(1)
    expect(result.grupos[0].nombre).toBe("Equipo Alpha")
    expect(result.total).toBe(1)
    expect(mockPrisma.grupo.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "asc" }, skip: 0, take: 50,
    })
  })
})

// ── getGrupoById ──────────────────────────────────────────

describe("getGrupoById", () => {
  it("devuelve el grupo cuando existe", async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(mockGrupo)
    const result = await getGrupoById("g-1")
    expect(result).toEqual(mockGrupo)
  })

  it("devuelve null cuando no existe", async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null)
    const result = await getGrupoById("g-inexistente")
    expect(result).toBeNull()
  })
})

// ── createGrupo ───────────────────────────────────────────

describe("createGrupo", () => {
  beforeEach(() => {
    mockPrisma.grupo.findUnique.mockResolvedValue(null) // nombre libre
    mockPrisma.grupo.create.mockResolvedValue(mockGrupo)
    mockPrisma.config.create.mockResolvedValue({ id: "cfg-1", grupoId: "g-1" })
  })

  it("crea el grupo y su config cuando el nombre es único", async () => {
    const result = await createGrupo({ nombre: "Equipo Alpha", descripcion: "Desc" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.grupo.nombre).toBe("Equipo Alpha")
    expect(mockPrisma.config.create).toHaveBeenCalledOnce()
  })

  it("falla si el nombre ya existe", async () => {
    mockPrisma.grupo.findUnique.mockResolvedValue(mockGrupo) // nombre ocupado
    const result = await createGrupo({ nombre: "Equipo Alpha" })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/ya existe/i)
    expect(mockPrisma.grupo.create).not.toHaveBeenCalled()
  })

  it("descripcion vacía por defecto", async () => {
    await createGrupo({ nombre: "Nuevo" })
    expect(mockPrisma.grupo.create).toHaveBeenCalledWith({
      data: { nombre: "Nuevo", descripcion: "" },
    })
  })
})

// ── updateGrupo ───────────────────────────────────────────

describe("updateGrupo", () => {
  it("actualiza el grupo y devuelve success:true", async () => {
    const updated = { ...mockGrupo, nombre: "Equipo Beta" }
    mockPrisma.grupo.update.mockResolvedValue(updated)

    const result = await updateGrupo("g-1", { nombre: "Equipo Beta" })
    expect(result.success).toBe(true)
    expect(result.grupo.nombre).toBe("Equipo Beta")
  })

  it("puede desactivar un grupo", async () => {
    mockPrisma.grupo.update.mockResolvedValue({ ...mockGrupo, activo: false })
    const result = await updateGrupo("g-1", { activo: false })
    expect(result.grupo.activo).toBe(false)
  })
})

// ── deleteGrupo ───────────────────────────────────────────

describe("deleteGrupo", () => {
  it("elimina el grupo cuando está vacío", async () => {
    mockPrisma.user.count.mockResolvedValue(0)
    mockPrisma.historiaUsuario.count.mockResolvedValue(0)
    mockPrisma.sprint.count.mockResolvedValue(0)
    mockPrisma.notificacion.deleteMany.mockResolvedValue({ count: 0 })
    mockPrisma.grupo.delete.mockResolvedValue(mockGrupo)
    mockPrisma.config.deleteMany.mockResolvedValue({ count: 0 })

    const result = await deleteGrupo("g-1")
    expect(result.success).toBe(true)
    // Verifica que la transacción se ejecutó (elimina config + grupo)
    expect(mockPrisma.$transaction).toHaveBeenCalled()
  })

  it("rechaza eliminar si tiene usuarios", async () => {
    mockPrisma.user.count.mockResolvedValue(3)

    const result = await deleteGrupo("g-1")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/3 usuario/i)
    expect(mockPrisma.grupo.delete).not.toHaveBeenCalled()
  })

  it("rechaza eliminar si tiene historias", async () => {
    mockPrisma.user.count.mockResolvedValue(0)
    mockPrisma.historiaUsuario.count.mockResolvedValue(5)

    const result = await deleteGrupo("g-1")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/histori/i)
  })

  it("rechaza eliminar si tiene sprints", async () => {
    mockPrisma.user.count.mockResolvedValue(0)
    mockPrisma.historiaUsuario.count.mockResolvedValue(0)
    mockPrisma.sprint.count.mockResolvedValue(2)

    const result = await deleteGrupo("g-1")
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/sprint/i)
    expect(mockPrisma.grupo.delete).not.toHaveBeenCalled()
  })
})

// ── getMetricasGrupo ──────────────────────────────────────

describe("getMetricasGrupo", () => {
  beforeEach(() => {
    mockPrisma.historiaUsuario.count.mockResolvedValue(10)
    mockPrisma.casoPrueba.count.mockResolvedValue(25)
    mockPrisma.tarea.count.mockResolvedValue(40)
    mockPrisma.user.count.mockResolvedValue(4)
    mockPrisma.historiaUsuario.groupBy.mockResolvedValue([
      { estado: "exitosa",     _count: { _all: 7 } },
      { estado: "sin_iniciar", _count: { _all: 3 } },
    ])
    mockPrisma.casoPrueba.groupBy.mockResolvedValue([
      { estadoAprobacion: "aprobado", _count: { _all: 20 } },
      { estadoAprobacion: "borrador", _count: { _all: 5 } },
    ])
    mockPrisma.tarea.groupBy.mockResolvedValue([
      { estado: "completada", _count: { _all: 30 } },
      { estado: "pendiente",  _count: { _all: 10 } },
    ])
  })

  it("devuelve totales correctos", async () => {
    const metricas = await getMetricasGrupo("g-1")
    expect(metricas.totalHUs).toBe(10)
    expect(metricas.totalCasos).toBe(25)
    expect(metricas.totalTareas).toBe(40)
    expect(metricas.totalUsuarios).toBe(4)
  })

  it("devuelve husPorEstado mapeados correctamente", async () => {
    const metricas = await getMetricasGrupo("g-1")
    expect(metricas.husPorEstado).toHaveLength(2)
    expect(metricas.husPorEstado.find(h => h.estado === "exitosa")?.total).toBe(7)
  })

  it("devuelve casosPorEstado con 'aprobado'", async () => {
    const metricas = await getMetricasGrupo("g-1")
    expect(metricas.casosPorEstado.find(c => c.estado === "aprobado")?.total).toBe(20)
  })
})
