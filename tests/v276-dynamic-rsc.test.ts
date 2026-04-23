// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.76  Fase 5: dynamic imports + RSC
//
//  Verifica que:
//  1. Los componentes pesados se cargan via next/dynamic
//     (HistoriasKanban, CSV modals, HUForm, HistoriaUsuarioDetail).
//  2. La página /status es un Server Component (no lleva "use client").
//  3. /status usa Prisma directamente (no fetch a API).
//  4. Los consumidores no importan estáticamente los componentes dinámicos.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ── 1. historias-table: Kanban dinámico ─────────────────────
describe("historias-table — HistoriasKanban dinámico", () => {
  const src = read("components/dashboard/historias/historias-table.tsx")

  it("importa `dynamic` de next/dynamic", () => {
    expect(src).toContain('from "next/dynamic"')
  })

  it("HistoriasKanban se declara via dynamic()", () => {
    expect(src).toMatch(/const HistoriasKanban\s*=\s*dynamic\(/)
    expect(src).toContain("./historias-kanban")
  })

  it("no hay import estático de HistoriasKanban", () => {
    const staticImport = /import\s+\{[^}]*HistoriasKanban[^}]*\}\s+from\s+["']\.\/historias-kanban["']/
    expect(src).not.toMatch(staticImport)
  })

  it("ssr:false para evitar dependencias server (motion, window)", () => {
    expect(src).toContain("ssr: false")
  })
})

// ── 2. app/_dashboard-client.tsx: modales dinámicos ────────
// v2.80 — los dynamic imports se mudaron al body client cuando
// app/page.tsx pasó a Server Component.
describe("app/_dashboard-client.tsx — modales dinámicos", () => {
  const src = read("app/_dashboard-client.tsx")

  it("importa next/dynamic", () => {
    expect(src).toContain('from "next/dynamic"')
  })

  it("CSVImportModal via dynamic", () => {
    expect(src).toMatch(/const CSVImportModal\s*=\s*dynamic\(/)
  })

  it("CSVImportCasosModal via dynamic", () => {
    expect(src).toMatch(/const CSVImportCasosModal\s*=\s*dynamic\(/)
  })

  it("HUForm via dynamic", () => {
    expect(src).toMatch(/const HUForm\s*=\s*dynamic\(/)
  })

  it("HistoriaUsuarioDetail via dynamic", () => {
    expect(src).toMatch(/const HistoriaUsuarioDetail\s*=\s*dynamic\(/)
  })

  it("ya no importa CSVImportModal / HUForm / HistoriaUsuarioDetail estáticamente", () => {
    const staticImport = /^import\s+\{[^}]*(?:CSVImportModal|CSVImportCasosModal|HUForm|HistoriaUsuarioDetail)[^}]*\}\s+from\s+["']@\/components\/dashboard/m
    expect(src).not.toMatch(staticImport)
  })
})

// ── 3. RSC: /status page ───────────────────────────────────
describe("/status page — React Server Component", () => {
  const src = read("app/status/page.tsx")

  it("NO lleva \"use client\"", () => {
    expect(src.slice(0, 200)).not.toMatch(/["']use client["']/)
  })

  it("export default es async (Server Component)", () => {
    expect(src).toMatch(/export default async function StatusPage/)
  })

  it("consume Prisma directamente (no fetch a /api)", () => {
    expect(src).toContain('from "@/lib/backend/prisma"')
    expect(src).toContain("prisma.historiaUsuario.count")
    expect(src).toContain("prisma.casoPrueba.count")
    expect(src).toContain("prisma.tarea.count")
    expect(src).toContain("prisma.user.count")
    // No debe hacer fetch a la API interna — si estuviera en cliente sí.
    expect(src).not.toMatch(/fetch\(['"]\/api/)
  })

  it("usa force-dynamic para tiempo real", () => {
    expect(src).toContain('export const dynamic = "force-dynamic"')
    expect(src).toContain("export const revalidate = 0")
  })

  it("no usa hooks de React (ni useState ni useEffect)", () => {
    expect(src).not.toMatch(/\buseState\(/)
    expect(src).not.toMatch(/\buseEffect\(/)
    expect(src).not.toMatch(/\buseMemo\(/)
    expect(src).not.toMatch(/\buseCallback\(/)
  })
})

// ── 4. Invariante: sin imports estáticos de deps pesadas ──
describe("Invariantes de bundle", () => {
  it("app/page.tsx + _dashboard-client.tsx no importan @dnd-kit estáticamente", () => {
    const p = read("app/page.tsx")
    const c = read("app/_dashboard-client.tsx")
    expect(p).not.toMatch(/from\s+["']@dnd-kit/)
    expect(c).not.toMatch(/from\s+["']@dnd-kit/)
  })

  it("app/page.tsx + _dashboard-client.tsx no importan jspdf/html2canvas estáticamente", () => {
    const p = read("app/page.tsx")
    const c = read("app/_dashboard-client.tsx")
    expect(p).not.toMatch(/from\s+["']jspdf["']/)
    expect(p).not.toMatch(/from\s+["']html2canvas["']/)
    expect(c).not.toMatch(/from\s+["']jspdf["']/)
    expect(c).not.toMatch(/from\s+["']html2canvas["']/)
  })
})
