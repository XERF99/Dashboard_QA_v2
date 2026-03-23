// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — lib/backend/services/notificacion.service
//  Cubre: rolToDestinatario
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import { rolToDestinatario } from "@/lib/backend/services/notificacion.service"

describe("rolToDestinatario", () => {
  it.each([
    ["owner",   "admin"],
    ["admin",   "admin"],
    ["qa_lead", "qa"],
    ["qa",      "qa"],
    ["viewer",  "qa"],
  ])("rol '%s' → '%s'", (rol, expected) => {
    expect(rolToDestinatario(rol)).toBe(expected)
  })
})
