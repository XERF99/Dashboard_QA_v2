// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — useConfig · filtro de labels vacíos en sync
//  Verifica que el PUT /api/config no envía ítems con label
//  vacío (estado transitorio mientras el usuario está editando).
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useConfig } from "@/lib/hooks/useConfig"

// ── Mock API ─────────────────────────────────────────────
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
    etapas: {}, resultados: [],
    tiposAplicacion: [], ambientes: [], tiposPrueba: [], aplicaciones: [],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === "/api/sprints") return Promise.resolve({ sprints: [] })
    return Promise.resolve(EMPTY_CONFIG)
  })
  vi.mocked(api.put).mockResolvedValue({})
})

// ── Tests ─────────────────────────────────────────────────

describe("useConfig — filtro de labels vacíos en sync a la API", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("tiposAplicacion con label vacío no se incluye en el PUT", async () => {
    const { result } = renderHook(() => useConfig({ isAuthenticated: true }))
    // Esperar carga inicial
    await act(async () => { await Promise.resolve() })

    act(() => {
      result.current.handleTiposChange([
        { id: "web",   label: "Web" },
        { id: "nuevo", label: "" },   // transitorio — no debe enviarse
      ])
    })

    // Avanzar debounce (600 ms)
    await act(async () => { await vi.advanceTimersByTimeAsync(700) })

    const [, body] = vi.mocked(api.put).mock.calls[0] as [string, { tiposAplicacion: { id: string; label: string }[] }]
    expect(body.tiposAplicacion).toHaveLength(1)
    expect(body.tiposAplicacion[0]!.label).toBe("Web")
  })

  it("ambientes con label vacío no se incluyen en el PUT", async () => {
    const { result } = renderHook(() => useConfig({ isAuthenticated: true }))
    await act(async () => { await Promise.resolve() })

    act(() => {
      result.current.setAmbientes([
        { id: "qa",    label: "QA" },
        { id: "empty", label: "" },
      ])
    })

    await act(async () => { await vi.advanceTimersByTimeAsync(700) })

    const [, body] = vi.mocked(api.put).mock.calls[0] as [string, { ambientes: { id: string; label: string }[] }]
    expect(body.ambientes).toHaveLength(1)
    expect(body.ambientes[0]!.label).toBe("QA")
  })

  it("labels válidos se envían sin modificar al PUT", async () => {
    const { result } = renderHook(() => useConfig({ isAuthenticated: true }))
    await act(async () => { await Promise.resolve() })

    act(() => {
      result.current.setTiposPrueba([
        { id: "func",    label: "Funcional" },
        { id: "regress", label: "Regresión" },
      ])
    })

    await act(async () => { await vi.advanceTimersByTimeAsync(700) })

    const [, body] = vi.mocked(api.put).mock.calls[0] as [string, { tiposPrueba: { id: string; label: string }[] }]
    expect(body.tiposPrueba).toHaveLength(2)
    expect(body.tiposPrueba.map((t: { label: string }) => t.label)).toEqual(["Funcional", "Regresión"])
  })
})
