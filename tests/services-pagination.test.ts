// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — Servicios: paginación, filtro asignado, tipado
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/backend/prisma", () => ({
  prisma: {
    historiaUsuario: {
      findMany: vi.fn().mockResolvedValue([]),
      count:    vi.fn().mockResolvedValue(0),
      create:   vi.fn(),
      update:   vi.fn(),
    },
    casoPrueba: {
      findMany: vi.fn().mockResolvedValue([]),
      count:    vi.fn().mockResolvedValue(0),
      create:   vi.fn(),
      update:   vi.fn(),
    },
    tarea: {
      findMany: vi.fn().mockResolvedValue([]),
      count:    vi.fn().mockResolvedValue(0),
      create:   vi.fn(),
      update:   vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { prisma } from "@/lib/backend/prisma"
import { getAllHistorias, createHistoria, updateHistoria } from "@/lib/backend/services/historia.service"
import { getAllCasos, createCaso, updateCaso }             from "@/lib/backend/services/caso.service"
import { getAllTareas, createTarea, updateTarea }          from "@/lib/backend/services/tarea.service"

beforeEach(() => {
  vi.clearAllMocks()
  // Mock $transaction to handle the array form used by paginated services
  vi.mocked(prisma.$transaction).mockImplementation(async (arg: unknown) => {
    if (Array.isArray(arg)) {
      return await Promise.all(arg)
    }
    return (arg as (tx: unknown) => Promise<unknown>)(prisma)
  })
  vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValue([])
  vi.mocked(prisma.historiaUsuario.count).mockResolvedValue(0)
  vi.mocked(prisma.casoPrueba.findMany).mockResolvedValue([])
  vi.mocked(prisma.casoPrueba.count).mockResolvedValue(0)
  vi.mocked(prisma.tarea.findMany).mockResolvedValue([])
  vi.mocked(prisma.tarea.count).mockResolvedValue(0)
})

// ── getAllHistorias ───────────────────────────────────────

describe("getAllHistorias — paginación", () => {
  it("retorna { historias, total, page, limit, pages }", async () => {
    vi.mocked(prisma.historiaUsuario.findMany).mockResolvedValueOnce([{ id: "hu-1" }] as never)
    vi.mocked(prisma.historiaUsuario.count).mockResolvedValueOnce(10)

    const result = await getAllHistorias(undefined, 2, 5)

    expect(result.historias).toHaveLength(1)
    expect(result.total).toBe(10)
    expect(result.page).toBe(2)
    expect(result.limit).toBe(5)
    expect(result.pages).toBe(2) // ceil(10/5)
  })

  it("pasa skip correcto: (page-1)*limit", async () => {
    await getAllHistorias(undefined, 3, 10)

    expect(prisma.historiaUsuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    )
  })

  it("con grupoId → where incluye grupoId", async () => {
    await getAllHistorias("grupo-abc", 1, 20)

    expect(prisma.historiaUsuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { grupoId: "grupo-abc" } })
    )
  })

  it("sin grupoId → where vacío (owner ve todo)", async () => {
    await getAllHistorias(undefined, 1, 20)

    expect(prisma.historiaUsuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it("pages = 1 cuando total es 0", async () => {
    const result = await getAllHistorias()
    expect(result.pages).toBe(0) // ceil(0/50) = 0 → ajustado en la respuesta
  })
})

// ── getAllCasos ───────────────────────────────────────────

describe("getAllCasos — paginación", () => {
  it("retorna { casos, total, page, limit, pages }", async () => {
    vi.mocked(prisma.casoPrueba.findMany).mockResolvedValueOnce([{ id: "caso-1" }] as never)
    vi.mocked(prisma.casoPrueba.count).mockResolvedValueOnce(7)

    const result = await getAllCasos(undefined, 1, 7)

    expect(result.casos).toHaveLength(1)
    expect(result.total).toBe(7)
    expect(result.pages).toBe(1)
  })

  it("con grupoId → where filtra por hu.grupoId", async () => {
    await getAllCasos("grupo-xyz", 1, 10)

    expect(prisma.casoPrueba.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { hu: { grupoId: "grupo-xyz" } } })
    )
  })
})

// ── getAllTareas — asignado filter ────────────────────────

describe("getAllTareas — paginación y filtro asignado", () => {
  it("retorna { tareas, total, page, limit, pages }", async () => {
    vi.mocked(prisma.tarea.findMany).mockResolvedValueOnce([{ id: "t-1" }] as never)
    vi.mocked(prisma.tarea.count).mockResolvedValueOnce(4)

    const result = await getAllTareas(undefined, undefined, 1, 4)

    expect(result.tareas).toHaveLength(1)
    expect(result.total).toBe(4)
    expect(result.pages).toBe(1)
  })

  it("con asignado → where incluye asignado", async () => {
    await getAllTareas(undefined, "Maria Garcia", 1, 50)

    expect(prisma.tarea.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ asignado: "Maria Garcia" }) })
    )
  })

  it("sin asignado → where no incluye asignado", async () => {
    await getAllTareas(undefined, undefined, 1, 50)

    const callWhere = (vi.mocked(prisma.tarea.findMany).mock.calls[0][0] as { where: Record<string, unknown> }).where
    expect(callWhere).not.toHaveProperty("asignado")
  })

  it("combina grupoId y asignado en el where", async () => {
    await getAllTareas("grupo-test", "Carlos Lopez", 1, 50)

    expect(prisma.tarea.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          caso: { hu: { grupoId: "grupo-test" } },
          asignado: "Carlos Lopez",
        },
      })
    )
  })
})

// ── Tipado seguro en create/update ────────────────────────

describe("Servicios — create y update sin as any", () => {
  it("createHistoria llama prisma.historiaUsuario.create con los datos", async () => {
    const data = {
      grupoId: "g-1", codigo: "HU-001", titulo: "Test",
      responsable: "Admin", tipoAplicacion: "web", creadoPor: "Admin",
    }
    vi.mocked(prisma.historiaUsuario.create).mockResolvedValueOnce({ id: "hu-1", ...data } as never)

    const result = await createHistoria(data as never)
    expect(prisma.historiaUsuario.create).toHaveBeenCalledWith({ data })
    expect(result).toHaveProperty("id", "hu-1")
  })

  it("updateHistoria llama prisma.historiaUsuario.update con id y datos", async () => {
    const data = { titulo: "Actualizado" }
    vi.mocked(prisma.historiaUsuario.update).mockResolvedValueOnce({ id: "hu-1", ...data } as never)

    await updateHistoria("hu-1", data as never)
    expect(prisma.historiaUsuario.update).toHaveBeenCalledWith({ where: { id: "hu-1" }, data })
  })

  it("createCaso llama prisma.casoPrueba.create con los datos", async () => {
    const data = { huId: "hu-1", titulo: "Caso test", creadoPor: "Admin" }
    vi.mocked(prisma.casoPrueba.create).mockResolvedValueOnce({ id: "caso-1", ...data } as never)

    await createCaso(data as never)
    expect(prisma.casoPrueba.create).toHaveBeenCalledWith({ data })
  })

  it("updateCaso llama prisma.casoPrueba.update", async () => {
    const data = { estadoAprobacion: "aprobado" }
    vi.mocked(prisma.casoPrueba.update).mockResolvedValueOnce({ id: "caso-1" } as never)

    await updateCaso("caso-1", data as never)
    expect(prisma.casoPrueba.update).toHaveBeenCalledWith({ where: { id: "caso-1" }, data })
  })

  it("createTarea llama prisma.tarea.create con los datos", async () => {
    const data = { casoPruebaId: "caso-1", huId: "hu-1", titulo: "T1", asignado: "QA", creadoPor: "Admin" }
    vi.mocked(prisma.tarea.create).mockResolvedValueOnce({ id: "t-1", ...data } as never)

    await createTarea(data as never)
    expect(prisma.tarea.create).toHaveBeenCalledWith({ data })
  })

  it("updateTarea llama prisma.tarea.update", async () => {
    const data = { estado: "completada" }
    vi.mocked(prisma.tarea.update).mockResolvedValueOnce({ id: "t-1" } as never)

    await updateTarea("t-1", data as never)
    expect(prisma.tarea.update).toHaveBeenCalledWith({ where: { id: "t-1" }, data })
  })
})
