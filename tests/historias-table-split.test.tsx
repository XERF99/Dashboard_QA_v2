// ═══════════════════════════════════════════════════════════
//  Regresión — split de HistoriasTable (v2.69)
//
//  Garantiza que las 4 piezas extraídas mantienen el mismo
//  contrato de render y eventos que la versión monolítica:
//  - UrgenciaBadge
//  - BulkActionSelect
//  - HistoriasFiltersPanel
//  - HistoriasRow (memo)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UrgenciaBadge } from "@/components/dashboard/historias/historia-urgencia-badge"
import { BulkActionSelect } from "@/components/dashboard/historias/historias-bulk-action-select"
import { HistoriasRow } from "@/components/dashboard/historias/historias-row"
import { HistoriasFiltersPanel } from "@/components/dashboard/historias/historias-filters-panel"
import { ETAPAS_PREDETERMINADAS } from "@/lib/types"
import { makeHU, makeCaso } from "./factories"

describe("UrgenciaBadge", () => {
  it("no renderiza si no hay fecha", () => {
    const { container } = render(<UrgenciaBadge estado="en_progreso" />)
    expect(container.firstChild).toBeNull()
  })

  it("no renderiza si la HU está exitosa", () => {
    const fecha = new Date(Date.now() + 86_400_000)
    const { container } = render(<UrgenciaBadge fecha={fecha} estado="exitosa" />)
    expect(container.firstChild).toBeNull()
  })

  it("no renderiza si la HU está cancelada", () => {
    const fecha = new Date(Date.now() + 86_400_000)
    const { container } = render(<UrgenciaBadge fecha={fecha} estado="cancelada" />)
    expect(container.firstChild).toBeNull()
  })

  it("no renderiza si faltan más de 14 días", () => {
    const fecha = new Date(Date.now() + 30 * 86_400_000)
    const { container } = render(<UrgenciaBadge fecha={fecha} estado="en_progreso" />)
    expect(container.firstChild).toBeNull()
  })

  it("muestra 'Vencida' cuando fecha ya pasó", () => {
    const fecha = new Date(Date.now() - 86_400_000)
    render(<UrgenciaBadge fecha={fecha} estado="en_progreso" />)
    expect(screen.getByText("Vencida")).toBeInTheDocument()
  })

  it("muestra 'Mañana' cuando fecha es dentro de 24h", () => {
    // ceil((fecha - now)/86400000) === 1 requiere diff en (0, 86400000]
    const fecha = new Date(Date.now() + 86_400_000 - 60_000)
    render(<UrgenciaBadge fecha={fecha} estado="en_progreso" />)
    expect(screen.getByText("Mañana")).toBeInTheDocument()
  })

  it("muestra N días cuando falta menos de 14", () => {
    const fecha = new Date(Date.now() + 5 * 86_400_000 + 60_000)
    render(<UrgenciaBadge fecha={fecha} estado="en_progreso" />)
    expect(screen.getByText(/\dd/)).toBeInTheDocument()
  })
})

describe("BulkActionSelect", () => {
  it("muestra el label y las opciones al abrir", () => {
    const onSelect = vi.fn()
    render(
      <BulkActionSelect
        label="Cambiar estado"
        options={[{ value: "a", label: "Estado A" }, { value: "b", label: "Estado B" }]}
        onSelect={onSelect}
      />
    )
    expect(screen.getByText("Cambiar estado")).toBeInTheDocument()

    fireEvent.click(screen.getByText("Cambiar estado"))
    expect(screen.getByText("Estado A")).toBeInTheDocument()
    expect(screen.getByText("Estado B")).toBeInTheDocument()
  })

  it("dispara onSelect con el valor correcto y cierra el menu", () => {
    const onSelect = vi.fn()
    render(
      <BulkActionSelect
        label="Acciones"
        options={[{ value: "delete", label: "Eliminar" }]}
        onSelect={onSelect}
      />
    )
    fireEvent.click(screen.getByText("Acciones"))
    fireEvent.click(screen.getByText("Eliminar"))
    expect(onSelect).toHaveBeenCalledWith("delete")
    expect(onSelect).toHaveBeenCalledTimes(1)
    // menu cerrado
    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument()
  })
})

describe("HistoriasRow", () => {
  const baseProps = {
    casos: [],
    selected: false,
    canEdit: true,
    configEtapas: ETAPAS_PREDETERMINADAS,
    users: [{ nombre: "QA", activo: true }],
    onVer: vi.fn(),
    onEditar: vi.fn(),
    onEliminar: vi.fn(),
    onToggleSelect: vi.fn(),
  }

  it("renderiza código, título y responsable", () => {
    const hu = makeHU({ codigo: "HU-999", titulo: "Login con SSO", responsable: "QA" })
    render(<HistoriasRow hu={hu} {...baseProps} />)
    expect(screen.getByText("HU-999")).toBeInTheDocument()
    expect(screen.getByText("Login con SSO")).toBeInTheDocument()
    expect(screen.getByText("QA")).toBeInTheDocument()
  })

  it("llama onVer al hacer click en Ver", () => {
    const onVer = vi.fn()
    const hu = makeHU({ id: "hu-99" })
    render(<HistoriasRow hu={hu} {...baseProps} onVer={onVer} />)
    fireEvent.click(screen.getByText(/Ver/))
    expect(onVer).toHaveBeenCalledWith(hu)
  })

  it("oculta acciones editar/eliminar cuando canEdit=false", () => {
    const hu = makeHU()
    render(<HistoriasRow hu={hu} {...baseProps} canEdit={false} />)
    expect(screen.queryByTitle("Editar")).not.toBeInTheDocument()
    expect(screen.queryByTitle("Eliminar")).not.toBeInTheDocument()
  })

  it("llama onToggleSelect con el id de la HU al marcar checkbox", () => {
    const onToggleSelect = vi.fn()
    const hu = makeHU({ id: "hu-42" })
    render(<HistoriasRow hu={hu} {...baseProps} onToggleSelect={onToggleSelect} />)
    fireEvent.click(screen.getByRole("checkbox"))
    expect(onToggleSelect).toHaveBeenCalledWith("hu-42")
  })

  it("muestra % de completitud cuando hay casos aprobados", () => {
    const hu = makeHU({ id: "hu-1", casosIds: ["caso-1"] })
    const caso = makeCaso({
      id: "caso-1",
      huId: "hu-1",
      estadoAprobacion: "aprobado",
      resultadosPorEtapa: [{ etapa: "qa", estado: "completado", resultado: "exitoso", fechaFin: new Date(), intentos: [] }],
    })
    render(<HistoriasRow hu={hu} {...baseProps} casos={[caso]} />)
    expect(screen.getByText("100%")).toBeInTheDocument()
  })

  it("marca responsable huérfano cuando el usuario no existe en el workspace", () => {
    const hu = makeHU({ responsable: "Fantasma" })
    render(<HistoriasRow hu={hu} {...baseProps} users={[{ nombre: "QA", activo: true }]} />)
    expect(screen.getByLabelText("Responsable sin workspace activo")).toBeInTheDocument()
  })
})

describe("HistoriasFiltersPanel", () => {
  const baseProps = {
    filtroEstado: "todos" as const,           setFiltroEstado: vi.fn(),
    filtroPrioridad: "todos" as const,        setFiltroPrioridad: vi.fn(),
    filtroResponsable: "todos",               setFiltroResponsable: vi.fn(),
    filtroTipo: "todos" as const,             setFiltroTipo: vi.fn(),
    filtroSprint: "todos",                    setFiltroSprint: vi.fn(),
    filtroAmbiente: "todos",                  setFiltroAmbiente: vi.fn(),
    filtroTipoPrueba: "todos",                setFiltroTipoPrueba: vi.fn(),
    filtroFechaDesde: "",                     setFiltroFechaDesde: vi.fn(),
    filtroFechaHasta: "",                     setFiltroFechaHasta: vi.fn(),
    responsables: ["QA1", "QA2"],
    tiposApp: ["web" as const, "mobile" as const],
    sprints: ["S1"],
    ambientesUnicos: ["qa", "prod"],
    tiposPruebaUnicos: ["funcional"],
  }

  it("renderiza selectores de estado y prioridad siempre", () => {
    render(<HistoriasFiltersPanel {...baseProps} />)
    expect(screen.getByText("Filtrar por")).toBeInTheDocument()
    // Cada select renderiza su label actual
    expect(screen.getAllByText(/Todos los estados|Todas las prioridades/i).length).toBeGreaterThan(0)
  })

  it("dispara setFiltroFechaDesde al cambiar input", () => {
    const setFiltroFechaDesde = vi.fn()
    render(<HistoriasFiltersPanel {...baseProps} setFiltroFechaDesde={setFiltroFechaDesde} />)
    const inputs = document.querySelectorAll("input[type='date']")
    expect(inputs.length).toBe(2)
    fireEvent.change(inputs[0]!, { target: { value: "2025-01-01" } })
    expect(setFiltroFechaDesde).toHaveBeenCalledWith("2025-01-01")
  })

  it("oculta el select de responsables si hay <= 1", () => {
    render(<HistoriasFiltersPanel {...baseProps} responsables={["SoloQA"]} />)
    expect(screen.queryByText("Responsable")).not.toBeInTheDocument()
  })
})
