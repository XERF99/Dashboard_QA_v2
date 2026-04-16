// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.68 Phase 5: Quality (Tailwind conversion + test hygiene)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ── 1. Tailwind migration (Task 9) ────────────────────────
describe("Task 9 — inline styles → Tailwind utilities", () => {
  it("audit-log-viewer.tsx uses Tailwind classes for layout", () => {
    const src = read("components/dashboard/shared/audit-log-viewer.tsx")
    expect(src).toContain("className=")
    expect(src).toContain("flex flex-col gap-")
    expect(src).toContain("rounded-lg")
  })

  it("audit-log-viewer.tsx retains dynamic color styles inline (intentional)", () => {
    const src = read("components/dashboard/shared/audit-log-viewer.tsx")
    expect(src).toContain("style.color")
    expect(src).toContain("color-mix(in oklch")
  })

  it("bloqueos-panel.tsx uses Tailwind classes for layout", () => {
    const src = read("components/dashboard/shared/bloqueos-panel.tsx")
    expect(src).toContain("className=")
    expect(src).toContain("rounded-")
  })

  it("bloqueos-panel.tsx retains dynamic NIVEL_CFG colors inline", () => {
    const src = read("components/dashboard/shared/bloqueos-panel.tsx")
    expect(src).toContain("color-mix(in oklch")
  })

  it("home-dashboard.tsx uses Tailwind + utility constants", () => {
    const src = read("components/dashboard/analytics/home-dashboard.tsx")
    expect(src).toContain("CARD_CLS")
    expect(src).toContain("border-l-chart-")
  })

  it("home-dashboard.tsx preserves dynamic color-mix expressions", () => {
    const src = read("components/dashboard/analytics/home-dashboard.tsx")
    expect(src).toContain("color-mix(in oklch")
  })
})

// ── 2. Test factories (Task 11) ───────────────────────────
describe("Task 11 — shared test factories", () => {
  it("tests/factories/index.ts exists with makeBloqueoActivo/Resuelto", () => {
    const src = read("tests/factories/index.ts")
    expect(src).toContain("export function makeBloqueoActivo")
    expect(src).toContain("export function makeBloqueoResuelto")
    expect(src).toContain("export function makeBloqueo")
  })

  it("factories cover main domain entities", () => {
    const src = read("tests/factories/index.ts")
    expect(src).toContain("export function makeTarea")
    expect(src).toContain("export function makeHU")
    expect(src).toContain("export function makeCaso")
  })

  it("factories produce correctly-typed discriminated union members", () => {
    const src = read("tests/factories/index.ts")
    expect(src).toContain("BloqueoActivo")
    expect(src).toContain("BloqueoResuelto")
    expect(src).toContain("resuelto: false")
    expect(src).toContain("resuelto: true")
    expect(src).toContain("fechaResolucion")
    expect(src).toContain("resueltoPor")
  })
})
