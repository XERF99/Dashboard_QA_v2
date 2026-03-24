// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — useHistoriasFilters
//  Verifica filtrado, ordenamiento y paginación del hook
//  usado en la tabla de Historias de Usuario.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useHistoriasFilters } from "@/lib/hooks/useHistoriasFilters"
import type { HistoriaUsuario } from "@/lib/types"

// ── Fixture ───────────────────────────────────────────────

function mkHU(overrides: Partial<HistoriaUsuario>): HistoriaUsuario {
  return {
    id: "hu-1",
    codigo: "HU-001",
    titulo: "Historia base",
    descripcion: "",
    criteriosAceptacion: "",
    responsable: "Ana",
    prioridad: "media",
    estado: "sin_iniciar",
    puntos: 3,
    aplicacion: "App A",
    tipoAplicacion: "aplicacion",
    requiriente: "",
    areaSolicitante: "",
    fechaCreacion: new Date("2024-03-01"),
    etapa: "sin_iniciar",
    ambiente: "test",
    tipoPrueba: "funcional",
    casosIds: [],
    bloqueos: [],
    historial: [],
    creadoPor: "admin",
    delegadoPor: "",
    permitirCasosAdicionales: false,
    comentarios: [],
    ...overrides,
  }
}

const HU_A = mkHU({ id: "a", codigo: "HU-001", estado: "en_progreso", prioridad: "alta",   responsable: "Ana",   tipoAplicacion: "aplicacion",    ambiente: "test",         tipoPrueba: "funcional",  sprint: "Sprint 1", fechaCreacion: new Date("2024-01-10") })
const HU_B = mkHU({ id: "b", codigo: "HU-002", estado: "exitosa",     prioridad: "media",  responsable: "Carlos",tipoAplicacion: "infraestructura",ambiente: "preproduccion",tipoPrueba: "regresion",  sprint: "Sprint 2", fechaCreacion: new Date("2024-02-15") })
const HU_C = mkHU({ id: "c", codigo: "HU-003", estado: "sin_iniciar", prioridad: "baja",   responsable: "Ana",   tipoAplicacion: "mixto",          ambiente: "test",         tipoPrueba: "funcional",  sprint: undefined,  fechaCreacion: new Date("2024-03-20") })

const HISTORIAS = [HU_A, HU_B, HU_C]

// ── Filtros ───────────────────────────────────────────────

describe("useHistoriasFilters — filtros", () => {
  it("sin filtros activos devuelve todas las HUs", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    expect(result.current.historiasFiltradas).toHaveLength(3)
  })

  it("filtro por estado devuelve solo las HUs con ese estado", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.setFiltroEstado("en_progreso") })
    expect(result.current.historiasFiltradas).toHaveLength(1)
    expect(result.current.historiasFiltradas[0].id).toBe("a")
  })

  it("filtro por prioridad devuelve solo las HUs con esa prioridad", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.setFiltroPrioridad("baja") })
    expect(result.current.historiasFiltradas).toHaveLength(1)
    expect(result.current.historiasFiltradas[0].id).toBe("c")
  })

  it("filtro por responsable devuelve solo sus HUs", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.setFiltroResponsable("Ana") })
    expect(result.current.historiasFiltradas).toHaveLength(2)
    expect(result.current.historiasFiltradas.map(h => h.id)).toEqual(expect.arrayContaining(["a", "c"]))
  })

  it("filtro por tipo de aplicación devuelve solo ese tipo", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.setFiltroTipo("infraestructura") })
    expect(result.current.historiasFiltradas).toHaveLength(1)
    expect(result.current.historiasFiltradas[0].id).toBe("b")
  })

  it("filtro por sprint devuelve HUs de ese sprint", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.setFiltroSprint("Sprint 1") })
    expect(result.current.historiasFiltradas).toHaveLength(1)
    expect(result.current.historiasFiltradas[0].id).toBe("a")
  })

  it("filtro __sin_sprint__ devuelve HUs sin sprint asignado", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.setFiltroSprint("__sin_sprint__") })
    expect(result.current.historiasFiltradas).toHaveLength(1)
    expect(result.current.historiasFiltradas[0].id).toBe("c")
  })

  it("filtro por ambiente devuelve solo ese ambiente", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.setFiltroAmbiente("preproduccion") })
    expect(result.current.historiasFiltradas).toHaveLength(1)
    expect(result.current.historiasFiltradas[0].id).toBe("b")
  })

  it("filtros combinados aplican condición AND", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => {
      result.current.setFiltroResponsable("Ana")
      result.current.setFiltroAmbiente("test")
    })
    // Ana tiene HU_A (test) y HU_C (test) → ambas
    expect(result.current.historiasFiltradas).toHaveLength(2)
  })

  it("limpiarFiltros resetea a todos los valores por defecto", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => {
      result.current.setFiltroEstado("exitosa")
      result.current.setFiltroPrioridad("alta")
    })
    expect(result.current.historiasFiltradas).toHaveLength(0)

    act(() => { result.current.limpiarFiltros() })
    expect(result.current.historiasFiltradas).toHaveLength(3)
    expect(result.current.filtroEstado).toBe("todos")
  })

  it("filtrosActivos cuenta solo los filtros distintos de 'todos'", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    expect(result.current.filtrosActivos).toBe(0)

    act(() => {
      result.current.setFiltroEstado("exitosa")
      result.current.setFiltroPrioridad("media")
    })
    expect(result.current.filtrosActivos).toBe(2)
  })
})

// ── Ordenamiento ──────────────────────────────────────────

describe("useHistoriasFilters — ordenamiento", () => {
  it("sort por código asc por defecto", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    const codigos = result.current.historiasOrdenadas.map(h => h.codigo)
    expect(codigos).toEqual(["HU-001", "HU-002", "HU-003"])
  })

  it("toggleSort en el mismo campo invierte la dirección", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.toggleSort("codigo") }) // asc → desc
    expect(result.current.sortDir).toBe("desc")
    const codigos = result.current.historiasOrdenadas.map(h => h.codigo)
    expect(codigos).toEqual(["HU-003", "HU-002", "HU-001"])
  })

  it("toggleSort en campo diferente cambia campo y resetea a asc", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    act(() => { result.current.toggleSort("codigo") }) // desc
    act(() => { result.current.toggleSort("titulo") }) // nuevo campo → asc
    expect(result.current.sortCampo).toBe("titulo")
    expect(result.current.sortDir).toBe("asc")
  })
})

// ── Valores únicos para selects ───────────────────────────

describe("useHistoriasFilters — valores únicos", () => {
  it("responsables contiene los responsables únicos ordenados", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    expect(result.current.responsables).toEqual(["Ana", "Carlos"])
  })

  it("sprints contiene los sprints únicos (excluye undefined)", () => {
    const { result } = renderHook(() => useHistoriasFilters(HISTORIAS))
    expect(result.current.sprints).toEqual(["Sprint 1", "Sprint 2"])
  })
})
