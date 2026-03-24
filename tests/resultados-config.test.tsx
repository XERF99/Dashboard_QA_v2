// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — ResultadosConfig
//  Verifica renderizado, toggle aceptado, restricciones de
//  estados base, adición de estados personalizados y restaurar.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { ResultadosConfig } from "@/components/dashboard/config/resultados-config"
import { RESULTADOS_PREDETERMINADOS } from "@/lib/constants"
import type { ResultadoDef } from "@/lib/types"

// ── Fixtures ──────────────────────────────────────────────

const BASE = RESULTADOS_PREDETERMINADOS   // [exitoso, fallido, error_preexistente, bloqueado]

const CON_CUSTOM: ResultadoDef[] = [
  ...BASE,
  { id: "parcial", label: "Parcial", esAceptado: false, esBase: false, cls: "bg-blue-500/20 text-blue-500 border-blue-500/30" },
]

// ── Tests ─────────────────────────────────────────────────

describe("ResultadosConfig — renderizado", () => {
  it("muestra los labels de todos los resultados recibidos", () => {
    render(<ResultadosConfig resultados={BASE} onChange={() => {}} />)
    expect(screen.getByDisplayValue("Exitoso")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Fallido")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Error preexistente")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Bloqueado")).toBeInTheDocument()
  })

  it("muestra el campo 'Máx. ret.' solo para resultados no aceptados", () => {
    render(<ResultadosConfig resultados={BASE} onChange={() => {}} />)
    // "fallido" es el único base con esAceptado=false
    expect(screen.getByText("Máx. ret.")).toBeInTheDocument()
  })
})

describe("ResultadosConfig — estados base vs personalizados", () => {
  it("no muestra botón Eliminar para estados base", () => {
    render(<ResultadosConfig resultados={BASE} onChange={() => {}} />)
    // No debe haber ningún botón con title "Eliminar estado" (solo spans de relleno)
    expect(screen.queryByTitle("Eliminar estado")).not.toBeInTheDocument()
  })

  it("muestra botón Eliminar para estados personalizados", () => {
    render(<ResultadosConfig resultados={CON_CUSTOM} onChange={() => {}} />)
    expect(screen.getByTitle("Eliminar estado")).toBeInTheDocument()
  })

  it("confirmar eliminación de estado personalizado llama onChange sin ese estado", () => {
    const onChange = vi.fn()
    render(<ResultadosConfig resultados={CON_CUSTOM} onChange={onChange} />)

    // Primer clic → abre confirmación
    fireEvent.click(screen.getByTitle("Eliminar estado"))
    // Segundo clic → confirma
    fireEvent.click(screen.getByTitle("Confirmar eliminación"))

    expect(onChange).toHaveBeenCalledOnce()
    const resultado = onChange.mock.calls[0][0] as ResultadoDef[]
    expect(resultado.find(r => r.id === "parcial")).toBeUndefined()
    expect(resultado).toHaveLength(BASE.length)
  })
})

describe("ResultadosConfig — toggle aceptado", () => {
  it("toggle en estado aceptado llama onChange con esAceptado=false", () => {
    const onChange = vi.fn()
    render(<ResultadosConfig resultados={BASE} onChange={onChange} />)

    // "exitoso" es aceptado → su toggle muestra "✓ Aceptado"
    const toggles = screen.getAllByText(/Aceptado/)
    const toggleExitoso = toggles.find(t => t.textContent === "✓ Aceptado")!
    fireEvent.click(toggleExitoso)

    expect(onChange).toHaveBeenCalledOnce()
    const updated = onChange.mock.calls[0][0] as ResultadoDef[]
    expect(updated.find(r => r.id === "exitoso")?.esAceptado).toBe(false)
  })

  it("toggle en estado no aceptado llama onChange con esAceptado=true", () => {
    const onChange = vi.fn()
    render(<ResultadosConfig resultados={BASE} onChange={onChange} />)

    // "fallido" es no aceptado → toggle muestra "✗ No aceptado"
    fireEvent.click(screen.getByText("✗ No aceptado"))

    expect(onChange).toHaveBeenCalledOnce()
    const updated = onChange.mock.calls[0][0] as ResultadoDef[]
    expect(updated.find(r => r.id === "fallido")?.esAceptado).toBe(true)
  })
})

describe("ResultadosConfig — agregar estado personalizado", () => {
  it("escribir un label y hacer clic en Agregar llama onChange con el nuevo estado", () => {
    const onChange = vi.fn()
    render(<ResultadosConfig resultados={BASE} onChange={onChange} />)

    fireEvent.change(
      screen.getByPlaceholderText(/Nombre del estado/i),
      { target: { value: "Incompleto" } }
    )
    fireEvent.click(screen.getByRole("button", { name: /agregar/i }))

    expect(onChange).toHaveBeenCalledOnce()
    const resultado = onChange.mock.calls[0][0] as ResultadoDef[]
    expect(resultado.at(-1)?.id).toBe("incompleto")
    expect(resultado.at(-1)?.label).toBe("Incompleto")
    expect(resultado.at(-1)?.esBase).toBe(false)
  })
})

describe("ResultadosConfig — restaurar", () => {
  it("botón Restaurar aparece cuando hay diferencias y llama onChange con defaults", () => {
    const onChange = vi.fn()
    const modificados: ResultadoDef[] = [
      { ...BASE[0], label: "Nombre cambiado" },
      ...BASE.slice(1),
    ]
    render(<ResultadosConfig resultados={modificados} onChange={onChange} />)

    fireEvent.click(screen.getByText(/Restaurar estados predeterminados/i))

    expect(onChange).toHaveBeenCalledWith(RESULTADOS_PREDETERMINADOS)
  })

  it("botón Restaurar no aparece cuando la lista coincide con defaults", () => {
    render(<ResultadosConfig resultados={BASE} onChange={() => {}} />)
    expect(screen.queryByText(/Restaurar estados predeterminados/i)).not.toBeInTheDocument()
  })
})
