// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — OwnerPanel
//  Verifica el renderizado del panel de grupos del Owner:
//  carga, tarjetas, métricas, formulario, confirmación de
//  eliminación y estados de error/vacío.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import React from "react"
import { OwnerPanel } from "@/components/dashboard/owner/owner-panel"

// ── Fixtures ──────────────────────────────────────────────

const grupoAlpha = {
  id: "g-1",
  nombre: "Equipo Alpha",
  descripcion: "Primer equipo",
  activo: true,
  createdAt: "2026-01-01T00:00:00.000Z",
}

const gruposBeta = {
  id: "g-2",
  nombre: "Equipo Beta",
  descripcion: "",
  activo: false,
  createdAt: "2026-02-01T00:00:00.000Z",
}

const metricasAlpha = {
  totalHUs: 10,
  totalCasos: 25,
  totalTareas: 40,
  totalUsuarios: 4,
  husPorEstado:    [{ estado: "exitosa", total: 7 }, { estado: "sin_iniciar", total: 3 }],
  casosPorEstado:  [{ estado: "aprobado", total: 20 }],
  tareasPorEstado: [{ estado: "completada", total: 30 }],
}

const metricasBeta = {
  totalHUs: 0,
  totalCasos: 0,
  totalTareas: 0,
  totalUsuarios: 2,
  husPorEstado:    [],
  casosPorEstado:  [],
  tareasPorEstado: [],
}

// ── Mock de fetch ─────────────────────────────────────────

function mockFetch(overrides: Record<string, unknown> = {}) {
  global.fetch = vi.fn(async (url: string | URL | Request) => {
    const u = url.toString()
    if (u === "/api/grupos")              return { ok: true, json: async () => ({ grupos: [grupoAlpha, gruposBeta] }) }
    if (u === "/api/users")               return { ok: true, json: async () => ({ users: [] }) }
    if (u === `/api/grupos/g-1/metricas`) return { ok: true, json: async () => ({ metricas: metricasAlpha }) }
    if (u === `/api/grupos/g-2/metricas`) return { ok: true, json: async () => ({ metricas: metricasBeta }) }
    return { ok: true, json: async () => ({}) }
  }) as unknown as typeof fetch
  void overrides
}

// ── Tests de renderizado ──────────────────────────────────

describe("OwnerPanel — renderizado inicial", () => {
  beforeEach(() => mockFetch())

  it("muestra el título del panel", async () => {
    render(<OwnerPanel />)
    await waitFor(() => expect(screen.getByText("Panel de Grupos")).toBeInTheDocument())
  })

  it("muestra la tarjeta del Equipo Alpha", async () => {
    render(<OwnerPanel />)
    // Alpha appears in both the sidebar button and the detail panel header (auto-selected)
    await waitFor(() => expect(screen.getAllByText("Equipo Alpha").length).toBeGreaterThan(0))
  })

  it("muestra la tarjeta del Equipo Beta", async () => {
    render(<OwnerPanel />)
    await waitFor(() => expect(screen.getByText("Equipo Beta")).toBeInTheDocument())
  })

  it("muestra badge Inactivo para grupos no activos", async () => {
    render(<OwnerPanel />)
    // Click Beta in the sidebar to load its detail panel, which shows the "Inactivo" badge
    await waitFor(() => screen.getByText("Equipo Beta"))
    fireEvent.click(screen.getByText("Equipo Beta"))
    await waitFor(() => expect(screen.getByText("Inactivo")).toBeInTheDocument())
  })

  it("muestra el botón Nuevo grupo", async () => {
    render(<OwnerPanel />)
    await waitFor(() => expect(screen.getByText("Nuevo grupo")).toBeInTheDocument())
  })
})

// ── Tests de métricas ─────────────────────────────────────

describe("OwnerPanel — métricas", () => {
  beforeEach(() => mockFetch())

  it("muestra los totales globales de grupos activos", async () => {
    render(<OwnerPanel />)
    await waitFor(() => {
      // 1 grupo activo (Alpha)
      expect(screen.getByText("1")).toBeInTheDocument()
    })
  })

  it("muestra la barra de progreso de HUs para grupos con datos", async () => {
    render(<OwnerPanel />)
    await waitFor(() => {
      expect(screen.getByText("Progreso de Historias")).toBeInTheDocument()
      expect(screen.getByText(/70%/)).toBeInTheDocument() // 7/10 exitosas
    })
  })

  it("no muestra barra de progreso para grupos sin HUs", async () => {
    render(<OwnerPanel />)
    await waitFor(() => screen.getAllByText("Equipo Beta"))
    // Alpha is auto-selected so its progress bar is visible; Beta has no HUs
    const progBarItems = screen.queryAllByText("Progreso de Historias")
    expect(progBarItems).toHaveLength(1)
  })
})

// ── Tests de formulario ───────────────────────────────────

describe("OwnerPanel — formulario crear grupo", () => {
  beforeEach(() => mockFetch())

  it("abre el formulario al hacer clic en Nuevo grupo", async () => {
    render(<OwnerPanel />)
    await waitFor(() => screen.getByText("Nuevo grupo"))
    fireEvent.click(screen.getByText("Nuevo grupo"))
    // Dialog opens — check that the name input appears
    await waitFor(() => expect(screen.getByPlaceholderText(/Ej: Equipo/i)).toBeInTheDocument())
  })

  it("el botón Crear está deshabilitado con nombre vacío", async () => {
    render(<OwnerPanel />)
    await waitFor(() => screen.getByText("Nuevo grupo"))
    fireEvent.click(screen.getByText("Nuevo grupo"))
    const createBtn = screen.getByRole("button", { name: /crear grupo/i })
    expect(createBtn).toBeDisabled()
  })

  it("el botón Crear se habilita al escribir un nombre", async () => {
    render(<OwnerPanel />)
    await waitFor(() => screen.getByText("Nuevo grupo"))
    fireEvent.click(screen.getByText("Nuevo grupo"))
    fireEvent.change(screen.getByPlaceholderText(/Ej: Equipo/i), { target: { value: "Equipo Gamma" } })
    expect(screen.getByRole("button", { name: /crear grupo/i })).not.toBeDisabled()
  })

  it("cierra el formulario al hacer clic en Cancelar", async () => {
    render(<OwnerPanel />)
    await waitFor(() => screen.getByText("Nuevo grupo"))
    fireEvent.click(screen.getByText("Nuevo grupo"))
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))
    expect(screen.queryByPlaceholderText(/Ej: Equipo/i)).not.toBeInTheDocument()
  })

  it("llama POST /api/grupos al crear un grupo", async () => {
    global.fetch = vi.fn(async (url: string | URL | Request, options?: RequestInit) => {
      const u = url.toString()
      if (u === "/api/grupos" && options?.method === "POST")
        return { ok: true, json: async () => ({ grupo: grupoAlpha }) }
      if (u === "/api/grupos/g-1/metricas") return { ok: true, json: async () => ({ metricas: metricasAlpha }) }
      if (u === "/api/grupos/g-2/metricas") return { ok: true, json: async () => ({ metricas: metricasBeta }) }
      if (u === "/api/users") return { ok: true, json: async () => ({ users: [] }) }
      // Default GET /api/grupos: return both groups so sidebar shows "Nuevo grupo" button
      return { ok: true, json: async () => ({ grupos: [grupoAlpha, gruposBeta] }) }
    }) as unknown as typeof fetch

    render(<OwnerPanel />)
    // "Nuevo grupo" button is in the sidebar; click the first occurrence
    await waitFor(() => screen.getAllByText("Nuevo grupo"))
    fireEvent.click(screen.getAllByText("Nuevo grupo")[0])
    fireEvent.change(screen.getByPlaceholderText(/Ej: Equipo/i), { target: { value: "Equipo Gamma" } })
    fireEvent.click(screen.getByRole("button", { name: /crear grupo/i }))

    await waitFor(() => {
      const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls
      const postCall = calls.find((c: unknown[]) => {
        const opts = c[1] as RequestInit | undefined
        return opts?.method === "POST" && (c[0] as string) === "/api/grupos"
      })
      expect(postCall).toBeTruthy()
    })
  })
})

// ── Tests de eliminación ──────────────────────────────────

describe("OwnerPanel — eliminar grupo", () => {
  beforeEach(() => mockFetch())

  it("muestra confirmación al hacer clic en eliminar", async () => {
    render(<OwnerPanel />)
    // Alpha appears in sidebar + detail panel; wait for either
    await waitFor(() => screen.getAllByText("Equipo Alpha"))
    const deleteButtons = document.querySelectorAll("button[title='Eliminar grupo']")
    fireEvent.click(deleteButtons[0])
    // Dialog title + confirm button both say "Eliminar grupo"
    expect(screen.getAllByText("Eliminar grupo").length).toBeGreaterThan(0)
    expect(screen.getByText(/Esta acción es irreversible/i)).toBeInTheDocument()
  })

  it("cancela la eliminación al hacer clic en Cancelar", async () => {
    render(<OwnerPanel />)
    await waitFor(() => screen.getAllByText("Equipo Alpha"))
    const deleteButtons = document.querySelectorAll("button[title='Eliminar grupo']")
    fireEvent.click(deleteButtons[0])
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }))
    expect(screen.queryByText(/Esta acción es irreversible/i)).not.toBeInTheDocument()
  })
})

// ── Test estado vacío ─────────────────────────────────────

describe("OwnerPanel — estado vacío", () => {
  it("muestra estado vacío cuando no hay grupos", async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ grupos: [] }),
    })) as unknown as typeof fetch

    render(<OwnerPanel />)
    await waitFor(() =>
      expect(screen.getByText("No hay grupos creados")).toBeInTheDocument()
    )
    expect(screen.getByText(/Crea el primer workspace/i)).toBeInTheDocument()
  })
})

// ── Test estado de error ──────────────────────────────────

describe("OwnerPanel — estado de error", () => {
  it("muestra mensaje de error cuando la API falla", async () => {
    global.fetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    })) as unknown as typeof fetch

    render(<OwnerPanel />)
    await waitFor(() =>
      expect(screen.getByText(/Error al cargar grupos/i)).toBeInTheDocument()
    )
  })
})
