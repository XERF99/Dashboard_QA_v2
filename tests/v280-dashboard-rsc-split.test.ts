// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.80  Dashboard `/` migrado a Server Component wrapper
//
//  app/page.tsx pasó de "use client" a Server Component. Ahora:
//    - Hace auth check server-side con getRscAuth()
//    - Sin sesión → renderiza <LoginScreen /> directamente
//      (bundle dashboard NO se carga en esa rama)
//    - Con sesión → renderiza <DashboardClient /> (body client
//      en app/_dashboard-client.tsx, misma lógica interactiva)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")
const exists = (f: string) => fs.existsSync(path.resolve(f))

// ── 1. app/page.tsx es Server Component ────────────────────
describe("app/page.tsx — Server Component wrapper", () => {
  const src = read("app/page.tsx")

  it("NO lleva \"use client\" (es Server Component)", () => {
    const firstNonComment = src.split("\n").find(l => {
      const t = l.trim()
      return t.length > 0 && !t.startsWith("//") && !t.startsWith("/*") && !t.startsWith("*")
    })
    expect(firstNonComment ?? "").not.toMatch(/^["']use client["']/)
  })

  it("export default es async", () => {
    expect(src).toMatch(/export default async function DashboardPage/)
  })

  it("usa getRscAuth para el auth check server-side", () => {
    expect(src).toContain("getRscAuth")
    expect(src).toContain('from "@/lib/backend/rsc-auth"')
  })

  it("sin sesión renderiza <LoginScreen /> directamente (evita bundle dashboard)", () => {
    expect(src).toContain("LoginScreen")
    expect(src).toMatch(/if\s*\(!payload\)\s*\{?\s*return\s*<LoginScreen\s*\/>/)
  })

  it("con sesión renderiza <DashboardClient />", () => {
    expect(src).toContain("DashboardClient")
    expect(src).toContain('from "./_dashboard-client"')
  })

  it("usa dynamic=force-dynamic (auth debe correr por request, no cachearse)", () => {
    expect(src).toContain('export const dynamic = "force-dynamic"')
  })

  it("no importa hooks cliente (useState, useEffect, useMemo, useCallback)", () => {
    expect(src).not.toMatch(/\buse(State|Effect|Memo|Callback|Ref)\b/)
  })
})

// ── 2. app/_dashboard-client.tsx tiene toda la lógica cliente ──
describe("app/_dashboard-client.tsx — body cliente extraído", () => {
  it("existe el archivo", () => {
    expect(exists("app/_dashboard-client.tsx")).toBe(true)
  })

  const src = read("app/_dashboard-client.tsx")

  it("lleva \"use client\" como primera sentencia", () => {
    const firstNonComment = src.split("\n").find(l => {
      const t = l.trim()
      return t.length > 0 && !t.startsWith("//") && !t.startsWith("/*") && !t.startsWith("*")
    })
    expect(firstNonComment ?? "").toMatch(/^["']use client["']/)
  })

  it("exporta DashboardClient (named, no default)", () => {
    expect(src).toMatch(/export\s+function\s+DashboardClient\s*\(/)
    // No debe haber un export default DashboardPage (eso está ahora en page.tsx)
    expect(src).not.toMatch(/export\s+default\s+function\s+DashboardPage/)
  })

  it("conserva useDashboardState como motor de estado", () => {
    expect(src).toContain("useDashboardState()")
  })

  it("conserva los dynamic imports de v2.76", () => {
    expect(src).toContain('const CSVImportModal = dynamic(')
    expect(src).toContain('const HUForm = dynamic(')
    expect(src).toContain('const HistoriaUsuarioDetail = dynamic(')
  })

  it("conserva el fallback a LoginScreen defensivo (sesión expirada)", () => {
    expect(src).toContain("LoginScreen")
  })
})

// ── 3. Boundary server/client bien definida ──────────────────
describe("Boundary server → client (v2.80)", () => {
  it("page.tsx NO importa ni llama useDashboardState (es hook cliente)", () => {
    const src = read("app/page.tsx")
    // No debe haber un import o llamada — mencionarlo en un comentario ok.
    expect(src).not.toMatch(/import\s+\{[^}]*useDashboardState[^}]*\}/)
    expect(src).not.toMatch(/\buseDashboardState\s*\(/)
  })

  it("page.tsx NO importa dynamic (es API client side)", () => {
    const src = read("app/page.tsx")
    expect(src).not.toMatch(/from\s+["']next\/dynamic["']/)
  })

  it("_dashboard-client.tsx NO importa getRscAuth (es server-only)", () => {
    const src = read("app/_dashboard-client.tsx")
    expect(src).not.toContain("getRscAuth")
  })

  it("page.tsx no consulta Prisma (el auth check con cookies basta)", () => {
    const src = read("app/page.tsx")
    // Prisma acá sería una sobrecarga — el auth JWT + /api/auth/me al
    // hidratar cubren todos los datos. El wrapper queda minimalista.
    expect(src).not.toContain('from "@/lib/backend/prisma"')
  })
})

// ── 4. Los 4 RSC dedicados (/home, /overview, /kpi, /status) siguen vivos ──
describe("RSC páginas dedicadas siguen siendo RSC (v2.79)", () => {
  const rscPages = [
    "app/home/page.tsx",
    "app/overview/page.tsx",
    "app/kpi/page.tsx",
    "app/status/page.tsx",
  ]

  it.each(rscPages)("%s sigue siendo RSC (sin use client)", (f) => {
    const src = read(f)
    const firstNonComment = src.split("\n").find(l => {
      const t = l.trim()
      return t.length > 0 && !t.startsWith("//") && !t.startsWith("/*") && !t.startsWith("*")
    })
    expect(firstNonComment ?? "").not.toMatch(/^["']use client["']/)
  })
})

// ── 5. Inventario final: 5 rutas RSC (añadimos / ahora) ──
describe("Inventario RSC v2.80", () => {
  it("hay 5 rutas con Server Components: /, /home, /overview, /kpi, /status", () => {
    const pages = [
      "app/page.tsx",       // v2.80 — wrapper RSC
      "app/home/page.tsx",
      "app/overview/page.tsx",
      "app/kpi/page.tsx",
      "app/status/page.tsx",
    ]
    for (const p of pages) {
      expect(exists(p), `${p} debe existir`).toBe(true)
      const src = read(p)
      const firstNonComment = src.split("\n").find(l => {
        const t = l.trim()
        return t.length > 0 && !t.startsWith("//") && !t.startsWith("/*") && !t.startsWith("*")
      })
      expect(firstNonComment ?? "", `${p} NO debe ser cliente`).not.toMatch(/^["']use client["']/)
      expect(src).toMatch(/export default async function/)
    }
  })
})
