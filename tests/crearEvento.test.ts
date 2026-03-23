import { describe, it, expect } from "vitest"
import { crearEvento } from "@/lib/utils/domain"

describe("crearEvento", () => {
  it("retorna el tipo, descripcion y usuario correctos", () => {
    const ev = crearEvento("hu_iniciada", "HU iniciada por QA", "QA User")
    expect(ev.tipo).toBe("hu_iniciada")
    expect(ev.descripcion).toBe("HU iniciada por QA")
    expect(ev.usuario).toBe("QA User")
  })

  it("fecha es una instancia de Date", () => {
    const ev = crearEvento("caso_creado", "Caso creado", "Admin")
    expect(ev.fecha).toBeInstanceOf(Date)
  })

  it("ID empieza con 'ev-'", () => {
    const ev = crearEvento("hu_cancelada", "Cancelada", "Admin")
    expect(ev.id).toMatch(/^ev-/)
  })

  it("genera IDs únicos en llamadas rápidas sucesivas", () => {
    const ids = Array.from({ length: 100 }, () =>
      crearEvento("caso_completado", "Completado", "QA").id
    )
    expect(new Set(ids).size).toBe(100)
  })
})
