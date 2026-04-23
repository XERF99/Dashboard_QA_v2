// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.79  Dashboard shell RSC + server action logout
//
//  Verifica que:
//  1. Existe un RSC shell compartido (components/rsc/rsc-shell.tsx).
//  2. Hay una server action de logout en app/actions/auth-actions.ts.
//  3. Nueva página /home es RSC y usa el shell.
//  4. /status, /overview, /kpi fueron refactorizados al shell.
//  5. El shell incluye nav, user info, form de logout (no fetch client).
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")
const exists = (f: string) => fs.existsSync(path.resolve(f))

// ── 1. Shell compartido ──────────────────────────────────────
describe("components/rsc/rsc-shell.tsx — shell compartido", () => {
  it("existe el archivo", () => {
    expect(exists("components/rsc/rsc-shell.tsx")).toBe(true)
  })

  it("NO lleva \"use client\" (es Server Component)", () => {
    const src = read("components/rsc/rsc-shell.tsx")
    // La directiva debe ser la primera sentencia no-comentario del archivo.
    // Buscamos una línea que sea exactamente `"use client"` o `'use client'`.
    const firstNonComment = src.split("\n").find(l => {
      const t = l.trim()
      return t.length > 0 && !t.startsWith("//") && !t.startsWith("/*") && !t.startsWith("*")
    })
    expect(firstNonComment ?? "").not.toMatch(/^["']use client["']/)
  })

  it("exporta RscShell", () => {
    const src = read("components/rsc/rsc-shell.tsx")
    expect(src).toContain("export function RscShell")
  })

  it("renderiza nav con enlaces a las páginas RSC", () => {
    const src = read("components/rsc/rsc-shell.tsx")
    expect(src).toMatch(/href:\s*["']\/home["']/)
    expect(src).toMatch(/href:\s*["']\/overview["']/)
    expect(src).toMatch(/href:\s*["']\/status["']/)
    // /kpi sólo aparece para owners
    expect(src).toMatch(/href:\s*["']\/kpi["']/)
  })

  it("usa <form action={logoutAction}> (no fetch cliente)", () => {
    const src = read("components/rsc/rsc-shell.tsx")
    expect(src).toContain("logoutAction")
    expect(src).toMatch(/<form\s+action=\{logoutAction\}/)
  })

  it("muestra nombre de usuario + workspace en el header", () => {
    const src = read("components/rsc/rsc-shell.tsx")
    expect(src).toContain("user.nombre")
    expect(src).toContain("workspaceName")
  })

  it("no importa hooks cliente", () => {
    const src = read("components/rsc/rsc-shell.tsx")
    expect(src).not.toMatch(/\buse(State|Effect|Memo|Callback|Ref)\b/)
  })
})

// ── 2. Server action de logout ───────────────────────────────
describe("app/actions/auth-actions.ts — logout server action", () => {
  it("existe con directive \"use server\"", () => {
    expect(exists("app/actions/auth-actions.ts")).toBe(true)
    const src = read("app/actions/auth-actions.ts")
    expect(src).toMatch(/^"use server"/m)
  })

  it("exporta logoutAction async", () => {
    const src = read("app/actions/auth-actions.ts")
    expect(src).toMatch(/export async function logoutAction/)
  })

  it("limpia tcs_token y tcs_refresh cookies", () => {
    const src = read("app/actions/auth-actions.ts")
    expect(src).toContain('store.delete("tcs_token")')
    expect(src).toContain('tcs_refresh')
    expect(src).toContain("/api/auth/refresh") // path scope match
  })

  it("invalida refresh token en DB vía logoutService", () => {
    const src = read("app/actions/auth-actions.ts")
    expect(src).toContain("logoutService")
  })

  it("registra LOGOUT en audit", () => {
    const src = read("app/actions/auth-actions.ts")
    expect(src).toContain('action:     "LOGOUT"')
  })

  it("redirige a /", () => {
    const src = read("app/actions/auth-actions.ts")
    expect(src).toContain('redirect("/")')
  })
})

// ── 3. /home RSC ─────────────────────────────────────────────
describe("/home — RSC landing post-login", () => {
  const src = read("app/home/page.tsx")

  it("es Server Component (async, sin use client)", () => {
    expect(src.slice(0, 200)).not.toMatch(/["']use client["']/)
    expect(src).toMatch(/export default async function HomePage/)
  })

  it("usa RscShell + getRscAuth + redirect cuando no hay sesión", () => {
    expect(src).toContain("RscShell")
    expect(src).toContain("getRscAuth")
    expect(src).toContain('redirect("/")')
  })

  it("consulta Prisma directamente para KPIs top-line", () => {
    expect(src).toContain("prisma.historiaUsuario.count")
    expect(src).toContain("prisma.casoPrueba.count")
    expect(src).toContain("prisma.tarea.count")
  })

  it("renderiza tarjetas de accesos rápidos + link al dashboard interactivo", () => {
    expect(src).toContain('href="/overview"')
    expect(src).toContain('href="/"')
    // Mensaje del saludo dinámico
    expect(src).toMatch(/function getSaludo/)
  })

  it("scope por grupoId del payload", () => {
    expect(src).toContain("payload.grupoId")
  })
})

// ── 4. Refactor /status, /overview, /kpi al shell ────────────
describe("/status, /overview, /kpi usan el shell compartido", () => {
  const rscPages = ["app/status/page.tsx", "app/overview/page.tsx", "app/kpi/page.tsx"]

  it.each(rscPages)("%s importa RscShell", (f) => {
    const src = read(f)
    expect(src).toContain("RscShell")
    expect(src).toContain('from "@/components/rsc/rsc-shell"')
  })

  it.each(rscPages)("%s renderiza <RscShell>", (f) => {
    const src = read(f)
    expect(src).toMatch(/<RscShell[\s\S]*?>/)
  })

  it.each(rscPages)("%s sigue siendo RSC (sin use client)", (f) => {
    const src = read(f)
    expect(src.slice(0, 200)).not.toMatch(/["']use client["']/)
  })
})

// ── 5. Invariante global: 4 páginas RSC ─────────────────────
describe("Inventario de páginas RSC", () => {
  it("hay 4 rutas RSC: /status, /overview, /kpi, /home", () => {
    const pages = ["app/status/page.tsx", "app/overview/page.tsx", "app/kpi/page.tsx", "app/home/page.tsx"]
    for (const p of pages) {
      expect(exists(p), `${p} debe existir`).toBe(true)
      const src = read(p)
      expect(src.slice(0, 200), `${p} no debe ser client`).not.toMatch(/["']use client["']/)
      expect(src).toMatch(/export default async function/)
      expect(src).toContain('from "@/lib/backend/prisma"')
    }
  })
})
