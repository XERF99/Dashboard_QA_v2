// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — labelToId · useListConfig
//  Verifica la conversión de label a ID y las operaciones
//  CRUD del hook genérico de listas configurables.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { labelToId, useListConfig } from "@/lib/hooks/useListConfig"
import type { IdLabelItem } from "@/lib/hooks/useListConfig"

// ── labelToId ─────────────────────────────────────────────

describe("labelToId", () => {
  it("convierte a minúsculas", () => {
    expect(labelToId("Web")).toBe("web")
    expect(labelToId("API")).toBe("api")
  })

  it("elimina tildes y diacríticos", () => {
    expect(labelToId("Autenticación")).toBe("autenticacion")
    expect(labelToId("Regresión")).toBe("regresion")
    expect(labelToId("Integración")).toBe("integracion")
  })

  it("reemplaza espacios por guión bajo", () => {
    expect(labelToId("tipo de prueba")).toBe("tipo_de_prueba")
    expect(labelToId("Base de Datos")).toBe("base_de_datos")
  })

  it("elimina caracteres especiales", () => {
    expect(labelToId("QA & Test!")).toBe("qa__test")
    expect(labelToId("v2.0")).toBe("v20")
  })

  it("retorna cadena vacía para entrada vacía", () => {
    expect(labelToId("")).toBe("")
  })

  it("combina varias transformaciones a la vez", () => {
    expect(labelToId("Regresión Funcional")).toBe("regresion_funcional")
    expect(labelToId("Pre-Producción")).toBe("preproduccion")
  })
})

// ── useListConfig ──────────────────────────────────────────

const DEFAULTS: IdLabelItem[] = [
  { id: "web",    label: "Web" },
  { id: "mobile", label: "Mobile" },
]

describe("useListConfig", () => {
  it("agregar nuevo item llama onChange con el item añadido", () => {
    let items: IdLabelItem[] = [...DEFAULTS]
    const onChange = (next: IdLabelItem[]) => { items = next }

    const { result } = renderHook(() => useListConfig(items, onChange, DEFAULTS))

    act(() => { result.current.setNuevoLabel("API") })
    act(() => { result.current.agregar() })

    expect(items).toHaveLength(3)
    expect(items[2]).toEqual({ id: "api", label: "API" })
  })

  it("agregar con id duplicado no modifica la lista", () => {
    let items: IdLabelItem[] = [...DEFAULTS]
    const onChange = (next: IdLabelItem[]) => { items = next }

    const { result } = renderHook(() => useListConfig(items, onChange, DEFAULTS))

    act(() => { result.current.setNuevoLabel("Web") }) // duplicado
    act(() => { result.current.agregar() })

    expect(items).toHaveLength(2)
  })

  it("agregar con label vacío no hace nada", () => {
    let items: IdLabelItem[] = [...DEFAULTS]
    const onChange = (next: IdLabelItem[]) => { items = next }

    const { result } = renderHook(() => useListConfig(items, onChange, DEFAULTS))

    act(() => { result.current.setNuevoLabel("   ") })
    act(() => { result.current.agregar() })

    expect(items).toHaveLength(2)
  })

  it("eliminar por índice quita el item correcto", () => {
    let items: IdLabelItem[] = [...DEFAULTS]
    const onChange = (next: IdLabelItem[]) => { items = next }

    const { result } = renderHook(() => useListConfig(items, onChange, DEFAULTS))

    act(() => { result.current.eliminar(0) })

    expect(items).toHaveLength(1)
    expect(items[0].id).toBe("mobile")
  })

  it("mover hacia arriba intercambia con el elemento anterior", () => {
    let items: IdLabelItem[] = [...DEFAULTS]
    const onChange = (next: IdLabelItem[]) => { items = next }

    const { result } = renderHook(() => useListConfig(items, onChange, DEFAULTS))

    act(() => { result.current.mover(1, -1) }) // mueve "mobile" a posición 0

    expect(items[0].id).toBe("mobile")
    expect(items[1].id).toBe("web")
  })

  it("mover fuera de límites no modifica la lista", () => {
    let items: IdLabelItem[] = [...DEFAULTS]
    const onChange = (next: IdLabelItem[]) => { items = next }

    const { result } = renderHook(() => useListConfig(items, onChange, DEFAULTS))

    act(() => { result.current.mover(0, -1) })  // primer elemento no puede subir
    act(() => { result.current.mover(1, 1) })   // último no puede bajar

    expect(items).toEqual(DEFAULTS)
  })

  it("hayDiferencias es false cuando la lista coincide con defaults", () => {
    const items: IdLabelItem[] = [...DEFAULTS]
    const { result } = renderHook(() => useListConfig(items, () => {}, DEFAULTS))
    expect(result.current.hayDiferencias).toBe(false)
  })

  it("hayDiferencias es true cuando la lista difiere de defaults", () => {
    const items: IdLabelItem[] = [{ id: "web", label: "Web" }] // falta "mobile"
    const { result } = renderHook(() => useListConfig(items, () => {}, DEFAULTS))
    expect(result.current.hayDiferencias).toBe(true)
  })

  it("restaurar llama onChange con copia de defaults", () => {
    let items: IdLabelItem[] = [{ id: "otro", label: "Otro" }]
    const onChange = (next: IdLabelItem[]) => { items = next }

    const { result } = renderHook(() => useListConfig(items, onChange, DEFAULTS))

    act(() => { result.current.restaurar() })

    expect(items).toEqual(DEFAULTS)
    expect(items).not.toBe(DEFAULTS) // debe ser copia, no la misma referencia
  })
})
