// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.75  Fase 4: split de componentes > 500 LOC
//
//  Verifica que:
//  1. Ningún componente de dashboard/UI supera 500 LOC.
//  2. Los orchestradores importan sus sub-piezas extraídas.
//  3. Las filas/items memoizadas usan React.memo.
//  4. Los 5 componentes objetivo están bajo el umbral.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read  = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")
const lines = (f: string) => read(f).split("\n").length

// ── 1. Los 5 objetivos de Fase 4 pasan bajo 500 LOC ─────────
describe("Componentes objetivo de Fase 4 — bajo 500 LOC", () => {
  const targets = [
    "components/dashboard/casos/casos-table.tsx",
    "components/dashboard/casos/caso-prueba-card.tsx",
    "components/dashboard/shared/bloqueos-panel.tsx",
    "components/dashboard/usuarios/user-management.tsx",
    "components/ui/sidebar.tsx",
  ]

  it.each(targets)("%s < 500 LOC", (f) => {
    expect(lines(f)).toBeLessThan(500)
  })
})

// ── 2. casos-table split ───────────────────────────────────
describe("casos-table split", () => {
  it("existen las sub-piezas extraídas", () => {
    expect(fs.existsSync("components/dashboard/casos/casos-row.tsx")).toBe(true)
    expect(fs.existsSync("components/dashboard/casos/casos-card-mobile.tsx")).toBe(true)
    expect(fs.existsSync("components/dashboard/casos/casos-filters-panel.tsx")).toBe(true)
    expect(fs.existsSync("components/dashboard/casos/caso-aprobacion-cfg.ts")).toBe(true)
  })

  it("casos-table importa las sub-piezas", () => {
    const src = read("components/dashboard/casos/casos-table.tsx")
    expect(src).toContain('from "./casos-row"')
    expect(src).toContain('from "./casos-card-mobile"')
    expect(src).toContain('from "./casos-filters-panel"')
    expect(src).toContain('from "./caso-aprobacion-cfg"')
  })

  it("casos-row usa React.memo", () => {
    const src = read("components/dashboard/casos/casos-row.tsx")
    expect(src).toMatch(/export const CasosRow\s*=\s*memo/)
  })

  it("casos-card-mobile usa React.memo", () => {
    const src = read("components/dashboard/casos/casos-card-mobile.tsx")
    expect(src).toMatch(/export const CasosCardMobile\s*=\s*memo/)
  })
})

// ── 3. caso-prueba-card split ──────────────────────────────
describe("caso-prueba-card split", () => {
  it("existen las sub-piezas extraídas", () => {
    expect(fs.existsSync("components/dashboard/casos/tarea-item.tsx")).toBe(true)
    expect(fs.existsSync("components/dashboard/casos/tarea-form-fields.tsx")).toBe(true)
    expect(fs.existsSync("components/dashboard/casos/caso-intentos-historial.tsx")).toBe(true)
  })

  it("caso-prueba-card importa las sub-piezas", () => {
    const src = read("components/dashboard/casos/caso-prueba-card.tsx")
    expect(src).toContain('from "./tarea-item"')
    expect(src).toContain('from "./tarea-form-fields"')
    expect(src).toContain('from "./caso-intentos-historial"')
  })
})

// ── 4. bloqueos-panel split ────────────────────────────────
describe("bloqueos-panel split", () => {
  it("existen las sub-piezas extraídas", () => {
    expect(fs.existsSync("components/dashboard/shared/bloqueos-row.tsx")).toBe(true)
    expect(fs.existsSync("components/dashboard/shared/bloqueos-export.ts")).toBe(true)
  })

  it("bloqueos-panel importa las sub-piezas", () => {
    const src = read("components/dashboard/shared/bloqueos-panel.tsx")
    expect(src).toContain('from "./bloqueos-row"')
    expect(src).toContain('from "./bloqueos-export"')
  })

  it("bloqueos-export exporta funciones CSV y PDF", () => {
    const src = read("components/dashboard/shared/bloqueos-export.ts")
    expect(src).toContain("export function exportarBloqueosPDF")
    expect(src).toContain("export function exportarBloqueosCSV")
  })
})

// ── 5. user-management split ───────────────────────────────
describe("user-management split", () => {
  it("existen las sub-piezas extraídas", () => {
    expect(fs.existsSync("components/dashboard/usuarios/user-row.tsx")).toBe(true)
    expect(fs.existsSync("components/dashboard/usuarios/user-workspace-dialogs.tsx")).toBe(true)
  })

  it("user-management importa las sub-piezas", () => {
    const src = read("components/dashboard/usuarios/user-management.tsx")
    expect(src).toContain('from "./user-row"')
    expect(src).toContain('from "./user-workspace-dialogs"')
  })

  it("user-row usa React.memo", () => {
    const src = read("components/dashboard/usuarios/user-row.tsx")
    expect(src).toMatch(/export const UserRow\s*=\s*memo/)
  })
})

// ── 6. sidebar split ───────────────────────────────────────
describe("sidebar split (shadcn primitive)", () => {
  it("existen las sub-piezas extraídas", () => {
    expect(fs.existsSync("components/ui/sidebar-provider.tsx")).toBe(true)
    expect(fs.existsSync("components/ui/sidebar-menu.tsx")).toBe(true)
  })

  it("sidebar-provider exporta SidebarProvider + useSidebar + contexto", () => {
    const src = read("components/ui/sidebar-provider.tsx")
    expect(src).toContain("export function SidebarProvider")
    expect(src).toContain("export function useSidebar")
    expect(src).toContain("export const SidebarContext")
  })

  it("sidebar-menu exporta todos los Menu*", () => {
    const src = read("components/ui/sidebar-menu.tsx")
    expect(src).toContain("export function SidebarMenu")
    expect(src).toContain("export function SidebarMenuItem")
    expect(src).toContain("export function SidebarMenuButton")
    expect(src).toContain("export function SidebarMenuAction")
    expect(src).toContain("export function SidebarMenuBadge")
    expect(src).toContain("export function SidebarMenuSkeleton")
    expect(src).toContain("export function SidebarMenuSub")
    expect(src).toContain("export function SidebarMenuSubItem")
    expect(src).toContain("export function SidebarMenuSubButton")
  })

  it("sidebar.tsx preserva el barrel de re-exports", () => {
    const src = read("components/ui/sidebar.tsx")
    // Debe seguir re-exportando todos los 24 símbolos originales para
    // no romper consumidores.
    const esperados = [
      "Sidebar", "SidebarContent", "SidebarFooter", "SidebarGroup",
      "SidebarGroupAction", "SidebarGroupContent", "SidebarGroupLabel",
      "SidebarHeader", "SidebarInput", "SidebarInset",
      "SidebarMenu", "SidebarMenuAction", "SidebarMenuBadge", "SidebarMenuButton",
      "SidebarMenuItem", "SidebarMenuSkeleton", "SidebarMenuSub",
      "SidebarMenuSubButton", "SidebarMenuSubItem",
      "SidebarProvider", "SidebarRail", "SidebarSeparator", "SidebarTrigger",
      "useSidebar",
    ]
    for (const s of esperados) {
      expect(src).toContain(s)
    }
  })
})

// ── 7. Ningún componente del repo supera 500 LOC ───────────
describe("Ningún componente supera 500 LOC — cumpliendo objetivo v2.75", () => {
  it("el máximo actual es ≤ 500", () => {
    const dirs = ["components", "lib"]
    let maxLines = 0
    let maxFile  = ""
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(p)
        else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
          const n = fs.readFileSync(p, "utf-8").split("\n").length
          if (n > maxLines) { maxLines = n; maxFile = p }
        }
      }
    }
    for (const d of dirs) if (fs.existsSync(d)) walk(d)
    // Umbral: 500 — documenta el archivo si alguien sube algo grande.
    expect(maxLines, `Archivo más grande: ${maxFile} (${maxLines} LOC)`).toBeLessThanOrEqual(500)
  })
})
