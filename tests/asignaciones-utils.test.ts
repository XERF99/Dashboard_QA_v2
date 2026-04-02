// ═══════════════════════════════════════════════════════════
//  TESTS — isResponsableActivo (lib/utils/asignaciones.ts)
//  Verifica cuándo un responsable/asignado se considera
//  activo en el workspace y cuándo queda huérfano.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import { isResponsableActivo } from "@/lib/utils/asignaciones"

const users = [
  { nombre: "Laura Méndez", activo: true  },
  { nombre: "Carlos López", activo: false },
  { nombre: "Admin",        activo: true  },
]

describe("isResponsableActivo", () => {
  it("devuelve true si el nombre existe y el usuario está activo", () => {
    expect(isResponsableActivo("Laura Méndez", users)).toBe(true)
  })

  it("devuelve false si el usuario existe pero está inactivo", () => {
    expect(isResponsableActivo("Carlos López", users)).toBe(false)
  })

  it("devuelve false si el nombre no está en la lista (usuario quitado del workspace)", () => {
    expect(isResponsableActivo("Juan Pérez", users)).toBe(false)
  })

  it("devuelve false si el nombre es string vacío", () => {
    expect(isResponsableActivo("", users)).toBe(false)
  })

  it("devuelve false con lista de usuarios vacía", () => {
    expect(isResponsableActivo("Laura Méndez", [])).toBe(false)
  })

  it("es sensible a mayúsculas (comparación exacta)", () => {
    expect(isResponsableActivo("laura méndez", users)).toBe(false)
    expect(isResponsableActivo("LAURA MÉNDEZ", users)).toBe(false)
  })

  it("devuelve true para múltiples usuarios activos", () => {
    expect(isResponsableActivo("Admin", users)).toBe(true)
  })
})
