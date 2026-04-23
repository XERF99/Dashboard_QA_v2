// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.77  proxy.ts + Redis real + RSC expandido
//
//  1. middleware.ts ya no existe; proxy.ts asume el rol.
//  2. @upstash/redis es dep oficial + tryCreateRedisStore
//     usa import estático normal (sin new Function hack).
//  3. Nuevos RSC: /overview (workspace KPIs), /kpi (owner global).
//  4. rsc-auth.ts helper existe y usa cookies() de next/headers.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")
const exists = (f: string) => fs.existsSync(path.resolve(f))

// ── 1. Rename middleware → proxy ──────────────────────────
describe("Next 16 — middleware.ts renombrado a proxy.ts", () => {
  it("middleware.ts ya no existe en la raíz", () => {
    expect(exists("middleware.ts")).toBe(false)
  })

  it("proxy.ts existe y exporta función `proxy`", () => {
    expect(exists("proxy.ts")).toBe(true)
    const src = read("proxy.ts")
    expect(src).toMatch(/export\s+async\s+function\s+proxy\s*\(/)
    expect(src).not.toMatch(/export\s+async\s+function\s+middleware\s*\(/)
  })

  it("proxy.ts conserva matcher /api/**", () => {
    const src = read("proxy.ts")
    expect(src).toContain('matcher: ["/api/((?!_next|favicon).*)"]')
  })

  it("proxy.ts sigue emitiendo x-request-id", () => {
    const src = read("proxy.ts")
    expect(src).toContain("function ensureRequestId")
    expect(src).toContain("x-request-id")
  })
})

// ── 2. @upstash/redis como dep oficial ────────────────────
describe("@upstash/redis — dep oficial + import estático", () => {
  it("aparece en package.json dependencies", async () => {
    const pkg = JSON.parse(read("package.json"))
    expect(pkg.dependencies["@upstash/redis"]).toBeTruthy()
  })

  it("rate-limit-store usa import estático (no new Function hack)", () => {
    const src = read("lib/backend/middleware/rate-limit-store.ts")
    expect(src).toContain('await import("@upstash/redis")')
    expect(src).not.toContain('new Function("p"')
  })

  it("tryCreateRedisStore sigue teniendo fallback a memory si faltan envs", () => {
    const src = read("lib/backend/middleware/rate-limit-store.ts")
    expect(src).toMatch(/UPSTASH_REDIS_REST_URL/)
    expect(src).toMatch(/UPSTASH_REDIS_REST_TOKEN/)
    expect(src).toMatch(/Fallback a memory/)
  })
})

// ── 3. RSC auth helper ────────────────────────────────────
describe("rsc-auth.ts — helper para Server Components", () => {
  const src = read("lib/backend/rsc-auth.ts")

  it("importa cookies de next/headers", () => {
    expect(src).toContain('from "next/headers"')
    expect(src).toContain("cookies")
  })

  it("exporta getRscAuth async", () => {
    expect(src).toMatch(/export\s+async\s+function\s+getRscAuth/)
  })

  it("usa verifyToken de auth.middleware", () => {
    expect(src).toContain("verifyToken")
    expect(src).toContain('from "./middleware/auth.middleware"')
  })

  it("lee la cookie tcs_token (misma que el browser)", () => {
    expect(src).toContain('tcs_token')
  })
})

// ── 4. RSC /overview ──────────────────────────────────────
describe("/overview — RSC del workspace del usuario", () => {
  const src = read("app/overview/page.tsx")

  it("NO lleva \"use client\"", () => {
    expect(src.slice(0, 200)).not.toMatch(/["']use client["']/)
  })

  it("export default es async", () => {
    expect(src).toMatch(/export default async function OverviewPage/)
  })

  it("usa getRscAuth + redirect si no hay sesión", () => {
    expect(src).toContain("getRscAuth")
    expect(src).toContain('from "next/navigation"')
    expect(src).toContain("redirect")
  })

  it("scope por grupoId del payload (auth del workspace)", () => {
    expect(src).toContain("payload.grupoId")
    // El loader acepta grupoId opcional para soportar owner.
    expect(src).toMatch(/scopeHU\s*=\s*grupoId\s*\?\s*\{\s*grupoId\s*\}\s*:\s*\{\s*\}/)
  })

  it("consulta Prisma para HUs, casos, tareas, bloqueos", () => {
    expect(src).toContain("prisma.historiaUsuario.count")
    expect(src).toContain("prisma.casoPrueba.count")
    expect(src).toContain("prisma.tarea.count")
  })

  it("no usa hooks cliente", () => {
    expect(src).not.toMatch(/\buseState\(|\buseEffect\(|\buseMemo\(/)
  })

  it("force-dynamic para datos frescos", () => {
    expect(src).toContain('export const dynamic = "force-dynamic"')
  })
})

// ── 5. RSC /kpi (owner only) ──────────────────────────────
describe("/kpi — RSC owner-only cross-workspace", () => {
  const src = read("app/kpi/page.tsx")

  it("es RSC (sin use client, export default async)", () => {
    expect(src.slice(0, 200)).not.toMatch(/["']use client["']/)
    expect(src).toMatch(/export default async function KpiPage/)
  })

  it("bloquea acceso a no-owners (si payload.grupoId → 403 visual)", () => {
    expect(src).toMatch(/payload\.grupoId/)
    expect(src).toContain("Acceso restringido")
  })

  it("agrega datos cross-workspace (prisma.grupo.findMany)", () => {
    expect(src).toContain("prisma.grupo.findMany")
  })

  it("calcula totales y % completadas / % aprobados", () => {
    expect(src).toContain("pctCompletadas")
    expect(src).toContain("pctAprobados")
  })
})

// ── 6. Invariante: RSCs no importan hooks de React ─────────
describe("RSC invariantes — sin hooks cliente", () => {
  const rscFiles = [
    "app/status/page.tsx",
    "app/overview/page.tsx",
    "app/kpi/page.tsx",
  ]

  it.each(rscFiles)("%s no importa hooks cliente", (f) => {
    const src = read(f)
    // Sin "use client"
    expect(src.slice(0, 200)).not.toMatch(/["']use client["']/)
    // Sin useState/useEffect/useMemo/useCallback
    expect(src).not.toMatch(/\b(useState|useEffect|useMemo|useCallback|useRef)\b/)
    // Consume Prisma directamente (patrón RSC)
    expect(src).toContain('from "@/lib/backend/prisma"')
  })
})
