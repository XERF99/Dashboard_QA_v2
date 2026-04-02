// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — useConfig · sprints conectados a /api/sprints
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useConfig } from "@/lib/hooks/useConfig"

// ── Mock API client ───────────────────────────────────────
vi.mock("@/lib/services/api/client", () => ({
  api: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from "@/lib/services/api/client"

const EMPTY_CONFIG = {
  config: {
    etapas: {},
    resultados: [],
    tiposAplicacion: [],
    ambientes: [],
    tiposPrueba: [],
    aplicaciones: [],
  },
}

const sprintA = {
  id: "sp-abc",
  nombre: "Sprint 1",
  fechaInicio: new Date("2026-03-01"),
  fechaFin:    new Date("2026-03-14"),
  objetivo:    "Módulo auth",
}

const sprintB = {
  id: "sp-def",
  nombre: "Sprint 2",
  fechaInicio: new Date("2026-03-15"),
  fechaFin:    new Date("2026-03-28"),
}

beforeEach(() => {
  vi.clearAllMocks()
  // Por defecto: config vacía y lista de sprints vacía
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === "/api/sprints") return Promise.resolve({ sprints: [] })
    return Promise.resolve(EMPTY_CONFIG)
  })
  vi.mocked(api.post).mockResolvedValue({ sprint: sprintA })
  vi.mocked(api.put).mockResolvedValue({ sprint: sprintA })
  vi.mocked(api.delete).mockResolvedValue({ success: true })
})

// ── Carga inicial ─────────────────────────────────────────

describe("carga inicial desde API", () => {
  it("llama a GET /api/sprints al montar", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/sprints") return Promise.resolve({ sprints: [sprintA] })
      return Promise.resolve(EMPTY_CONFIG)
    })

    const { result } = renderHook(() => useConfig({ isAuthenticated: true }))

    await waitFor(() => {
      expect(result.current.sprints).toHaveLength(1)
    })

    expect(vi.mocked(api.get)).toHaveBeenCalledWith("/api/sprints")
    expect(result.current.sprints[0].nombre).toBe("Sprint 1")
  })

  it("mantiene localStorage si la API falla", async () => {
    vi.mocked(api.get).mockRejectedValue(new Error("network"))

    const { result } = renderHook(() => useConfig())

    // El estado inicial (localStorage vacío en jsdom) se mantiene sin errores
    await waitFor(() => {
      expect(Array.isArray(result.current.sprints)).toBe(true)
    })
  })
})

// ── addSprint ─────────────────────────────────────────────

describe("addSprint", () => {
  it("rechaza nombre duplicado sin llamar a la API", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/sprints") return Promise.resolve({ sprints: [sprintA] })
      return Promise.resolve(EMPTY_CONFIG)
    })

    const { result } = renderHook(() => useConfig({ isAuthenticated: true }))

    // Esperar a que la carga inicial termine antes de probar el duplicado
    await waitFor(() => expect(result.current.sprints).toHaveLength(1))

    let res: { success: boolean; error?: string } = { success: true }
    act(() => {
      res = result.current.addSprint({
        nombre: "Sprint 1", // duplicado
        fechaInicio: new Date("2026-04-01"),
        fechaFin: new Date("2026-04-14"),
      })
    })

    expect(res.success).toBe(false)
    expect(res.error).toMatch(/ya existe/i)
    expect(vi.mocked(api.post)).not.toHaveBeenCalled()
  })

  it("inserta optimisticamente y llama a POST /api/sprints", async () => {
    const { result } = renderHook(() => useConfig())

    act(() => {
      result.current.addSprint({
        nombre: "Sprint Nuevo",
        fechaInicio: new Date("2026-04-01"),
        fechaFin:    new Date("2026-04-14"),
      })
    })

    // Inserción optimista inmediata
    expect(result.current.sprints.some(s => s.nombre === "Sprint Nuevo")).toBe(true)

    await waitFor(() => {
      expect(vi.mocked(api.post)).toHaveBeenCalledWith("/api/sprints", expect.objectContaining({ nombre: "Sprint Nuevo" }))
    })
  })

  it("reemplaza el ID temporal con el ID real devuelto por la API", async () => {
    const serverSprint = { ...sprintA, id: "cuid-real-123", nombre: "Sprint Nuevo" }
    vi.mocked(api.post).mockResolvedValue({ sprint: serverSprint })

    const { result } = renderHook(() => useConfig({ isAuthenticated: true }))

    // Esperar a que la carga inicial resuelva para que no pise el estado optimista
    await waitFor(() => expect(vi.mocked(api.get)).toHaveBeenCalledWith("/api/sprints"))

    act(() => {
      result.current.addSprint({
        nombre: "Sprint Nuevo",
        fechaInicio: new Date("2026-04-01"),
        fechaFin:    new Date("2026-04-14"),
      })
    })

    await waitFor(() => {
      const sprint = result.current.sprints.find(s => s.nombre === "Sprint Nuevo")
      expect(sprint?.id).toBe("cuid-real-123")
    })
  })

  it("retorna { success: true } cuando el nombre es único", () => {
    const { result } = renderHook(() => useConfig())

    let res: { success: boolean; error?: string } = { success: false }
    act(() => {
      res = result.current.addSprint({
        nombre: "Sprint Único",
        fechaInicio: new Date("2026-05-01"),
        fechaFin:    new Date("2026-05-14"),
      })
    })

    expect(res.success).toBe(true)
    expect(res.error).toBeUndefined()
  })
})

// ── updateSprint ──────────────────────────────────────────

describe("updateSprint", () => {
  it("actualiza el estado localmente y llama a PUT /api/sprints/[id]", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/sprints") return Promise.resolve({ sprints: [sprintA, sprintB] })
      return Promise.resolve(EMPTY_CONFIG)
    })

    const { result } = renderHook(() => useConfig({ isAuthenticated: true }))

    await waitFor(() => expect(result.current.sprints).toHaveLength(2))

    act(() => {
      result.current.updateSprint({ ...sprintA, nombre: "Sprint 1 (rev)" })
    })

    expect(result.current.sprints.find(s => s.id === "sp-abc")?.nombre).toBe("Sprint 1 (rev)")

    await waitFor(() => {
      expect(vi.mocked(api.put)).toHaveBeenCalledWith(
        "/api/sprints/sp-abc",
        expect.objectContaining({ nombre: "Sprint 1 (rev)" })
      )
    })
  })

  it("retorna { success: true }", () => {
    const { result } = renderHook(() => useConfig())

    let res: { success: boolean } = { success: false }
    act(() => {
      res = result.current.updateSprint(sprintA)
    })

    expect(res.success).toBe(true)
  })
})

// ── deleteSprint ──────────────────────────────────────────

describe("deleteSprint", () => {
  it("elimina del estado local y llama a DELETE /api/sprints/[id]", async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === "/api/sprints") return Promise.resolve({ sprints: [sprintA, sprintB] })
      return Promise.resolve(EMPTY_CONFIG)
    })

    const { result } = renderHook(() => useConfig({ isAuthenticated: true }))

    await waitFor(() => expect(result.current.sprints).toHaveLength(2))

    act(() => {
      result.current.deleteSprint("sp-abc")
    })

    expect(result.current.sprints.find(s => s.id === "sp-abc")).toBeUndefined()
    expect(result.current.sprints).toHaveLength(1)

    await waitFor(() => {
      expect(vi.mocked(api.delete)).toHaveBeenCalledWith("/api/sprints/sp-abc")
    })
  })

  it("retorna { success: true }", () => {
    const { result } = renderHook(() => useConfig())

    let res: { success: boolean } = { success: false }
    act(() => {
      res = result.current.deleteSprint("sp-abc")
    })

    expect(res.success).toBe(true)
  })
})
