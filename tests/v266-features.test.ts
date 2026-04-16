// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.66  Command Palette, Refresh Token, CSRF,
//  Docker, E2E CI, Kanban DnD
//
//  Cubre:
//  1. Command Palette component exists with required exports
//  2. useKeyboardShortcuts has Cmd+K binding
//  3. Refresh token — signRefreshToken, REFRESH_EXPIRY
//  4. POST /api/auth/refresh route exists
//  5. Login sets refresh token cookie
//  6. Logout clears refresh token cookie
//  7. CSRF protection in Edge middleware
//  8. Dockerfile multi-stage build
//  9. docker-compose.yml production config
//  10. CI workflow includes E2E job
//  11. Kanban has DnD imports and onMoverHU prop
//  12. Header has command palette trigger
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ── 1. Command Palette ──────────────────────────────────
describe("Command Palette", () => {
  it("component exports CommandPalette", () => {
    const src = read("components/dashboard/shared/command-palette.tsx")
    expect(src).toContain("export function CommandPalette")
    expect(src).toContain("CommandDialog")
    expect(src).toContain("CommandInput")
    expect(src).toContain("CommandGroup")
    expect(src).toContain("CommandItem")
  })

  it("has navigation, actions, and theme groups", () => {
    const src = read("components/dashboard/shared/command-palette.tsx")
    expect(src).toContain("Navegacion")
    expect(src).toContain("Acciones")
    expect(src).toContain("Tema")
  })

  it("is integrated in page.tsx", () => {
    const src = read("app/page.tsx")
    expect(src).toContain("CommandPalette")
    expect(src).toContain("cmdPaletteOpen")
    expect(src).toContain("onOpenCommandPalette")
  })
})

// ── 2. useKeyboardShortcuts — Cmd+K ────────────────────
describe("useKeyboardShortcuts — Cmd+K", () => {
  it("registers mod+k binding", () => {
    const src = read("lib/hooks/useKeyboardShortcuts.ts")
    expect(src).toContain("mod+k")
    expect(src).toContain("onOpenCommandPalette")
  })

  it("has onOpenCommandPalette in ShortcutActions interface", () => {
    const src = read("lib/hooks/useKeyboardShortcuts.ts")
    expect(src).toMatch(/onOpenCommandPalette\??\s*:\s*\(\)\s*=>\s*void/)
  })
})

// ── 3. Refresh Token ────────────────────────────────────
describe("Refresh Token mechanism", () => {
  it("auth.middleware exports signRefreshToken and REFRESH_EXPIRY", () => {
    const src = read("lib/backend/middleware/auth.middleware.ts")
    expect(src).toContain("export async function signRefreshToken")
    expect(src).toContain('REFRESH_EXPIRY')
    expect(src).toContain('"7d"')
  })

  it("signRefreshToken sets type=refresh in payload", () => {
    const src = read("lib/backend/middleware/auth.middleware.ts")
    expect(src).toContain('type: "refresh"')
  })

  it("signRefreshToken produces a valid JWT", async () => {
    const { signRefreshToken, verifyToken } = await import("@/lib/backend/middleware/auth.middleware")
    const token = await signRefreshToken({
      sub: "test-user", email: "t@t.com", nombre: "Test", rol: "admin",
    })
    expect(typeof token).toBe("string")
    expect(token.split(".")).toHaveLength(3)
    const payload = await verifyToken(token)
    expect(payload).toBeTruthy()
    expect(payload!.sub).toBe("test-user")
    expect((payload as unknown as Record<string, unknown>).type).toBe("refresh")
  })
})

// ── 4. POST /api/auth/refresh route ─────────────────────
describe("POST /api/auth/refresh route", () => {
  it("route file exists with POST handler", () => {
    const src = read("app/api/auth/refresh/route.ts")
    expect(src).toContain("export async function POST")
    expect(src).toContain("tcs_refresh")
    expect(src).toContain("signRefreshToken")
  })

  it("verifies user is active before refreshing", () => {
    const src = read("app/api/auth/refresh/route.ts")
    expect(src).toContain("prisma.user.findUnique")
    expect(src).toContain("dbUser.activo")
  })

  it("rotates refresh token on use", () => {
    const src = read("app/api/auth/refresh/route.ts")
    // Both a new access token and new refresh token are issued
    expect(src).toContain("signToken(tokenPayload)")
    expect(src).toContain("signRefreshToken(tokenPayload)")
  })

  it("is listed as a public route in Edge middleware", () => {
    const src = read("middleware.ts")
    expect(src).toContain("/api/auth/refresh")
  })
})

// ── 5. Login sets refresh cookie ────────────────────────
describe("Login — refresh token cookie", () => {
  it("sets tcs_refresh cookie on successful login", () => {
    const src = read("app/api/auth/login/route.ts")
    expect(src).toContain('tcs_refresh')
    expect(src).toContain("signRefreshToken")
    expect(src).toContain("/api/auth/refresh")
  })

  it("refresh cookie is httpOnly and strict sameSite", () => {
    const src = read("app/api/auth/login/route.ts")
    const refreshSection = src.slice(src.indexOf("tcs_refresh"))
    expect(refreshSection).toContain("httpOnly: true")
    expect(refreshSection).toContain('sameSite: "strict"')
  })
})

// ── 6. Logout clears refresh cookie ────────────────────
describe("Logout — clears refresh token", () => {
  it("deletes tcs_refresh cookie on logout", () => {
    const src = read("app/api/auth/logout/route.ts")
    expect(src).toContain("tcs_refresh")
  })
})

// ── 7. CSRF protection ─────────────────────────────────
describe("CSRF protection in Edge middleware", () => {
  it("validates origin/referer for mutating methods", () => {
    const src = read("middleware.ts")
    expect(src).toContain("MUTATING_METHODS")
    expect(src).toContain("isValidOrigin")
    expect(src).toMatch(/POST.*PUT.*PATCH.*DELETE/)
  })

  it("checks origin header against host", () => {
    const src = read("middleware.ts")
    expect(src).toContain('request.headers.get("origin")')
    expect(src).toContain('request.headers.get("referer")')
    expect(src).toContain('request.headers.get("host")')
  })

  it("returns 403 for invalid origin", () => {
    const src = read("middleware.ts")
    expect(src).toContain("CSRF")
    expect(src).toContain("403")
  })
})

// ── 8. Dockerfile ───────────────────────────────────────
describe("Production Dockerfile", () => {
  it("exists with multi-stage build", () => {
    const src = read("Dockerfile")
    expect(src).toContain("FROM node:20-alpine AS deps")
    expect(src).toContain("FROM node:20-alpine AS builder")
    expect(src).toContain("FROM node:20-alpine AS runner")
  })

  it("runs prisma generate in build stage", () => {
    const src = read("Dockerfile")
    expect(src).toContain("prisma generate")
  })

  it("runs migrations on startup", () => {
    const src = read("Dockerfile")
    expect(src).toContain("prisma migrate deploy")
  })

  it("runs as non-root user", () => {
    const src = read("Dockerfile")
    expect(src).toContain("USER nextjs")
    expect(src).toContain("adduser --system --uid 1001 nextjs")
  })
})

// ── 9. docker-compose.yml ───────────────────────────────
describe("Production docker-compose.yml", () => {
  it("defines app and postgres services", () => {
    const src = read("docker-compose.yml")
    expect(src).toContain("postgres:")
    expect(src).toContain("app:")
    expect(src).toContain("depends_on:")
  })

  it("requires JWT_SECRET and POSTGRES_PASSWORD", () => {
    const src = read("docker-compose.yml")
    expect(src).toContain("JWT_SECRET:")
    expect(src).toContain("POSTGRES_PASSWORD:")
  })
})

// ── 10. CI workflow includes E2E ────────────────────────
describe("CI workflow — E2E job", () => {
  it("has e2e job with postgres service", () => {
    const src = read(".github/workflows/ci.yml")
    expect(src).toContain("e2e:")
    expect(src).toContain("postgres:")
    expect(src).toContain("playwright")
  })

  it("installs Playwright browsers", () => {
    const src = read(".github/workflows/ci.yml")
    expect(src).toContain("playwright install")
  })

  it("uploads report on failure", () => {
    const src = read(".github/workflows/ci.yml")
    expect(src).toContain("playwright-report")
    expect(src).toContain("upload-artifact")
  })

  it("seeds the database before E2E", () => {
    const src = read(".github/workflows/ci.yml")
    expect(src).toContain("db:seed")
  })
})

// ── 11. Kanban DnD ──────────────────────────────────────
describe("Kanban — Drag and Drop", () => {
  it("uses @dnd-kit library", () => {
    const src = read("components/dashboard/historias/historias-kanban.tsx")
    expect(src).toContain("@dnd-kit/core")
    expect(src).toContain("DndContext")
    expect(src).toContain("DragOverlay")
    expect(src).toContain("useSortable")
  })

  it("has onMoverHU prop for state changes", () => {
    const src = read("components/dashboard/historias/historias-kanban.tsx")
    expect(src).toContain("onMoverHU")
    expect(src).toMatch(/onMoverHU\??\s*:\s*\(huId:\s*string/)
  })

  it("has GripVertical drag handle on cards", () => {
    const src = read("components/dashboard/historias/historias-kanban.tsx")
    expect(src).toContain("GripVertical")
    expect(src).toContain("cursor-grab")
  })

  it("defines defaultEstado for each column", () => {
    const src = read("components/dashboard/historias/historias-kanban.tsx")
    expect(src).toContain("defaultEstado")
    // Each column has a default estado for drops
    expect(src).toMatch(/defaultEstado:\s*"sin_iniciar"/)
    expect(src).toMatch(/defaultEstado:\s*"en_progreso"/)
    expect(src).toMatch(/defaultEstado:\s*"exitosa"/)
    expect(src).toMatch(/defaultEstado:\s*"cancelada"/)
  })

  it("historias-table passes onMoverHU using onBulkCambiarEstado", () => {
    const src = read("components/dashboard/historias/historias-table.tsx")
    expect(src).toContain("onMoverHU=")
    expect(src).toContain("onBulkCambiarEstado")
  })
})

// ── 12. Header — command palette trigger ────────────────
describe("Header — command palette trigger", () => {
  it("has onOpenCommandPalette prop", () => {
    const src = read("components/dashboard/shared/header.tsx")
    expect(src).toContain("onOpenCommandPalette")
  })

  it("renders Cmd+K button with Command icon", () => {
    const src = read("components/dashboard/shared/header.tsx")
    expect(src).toContain("Command")
    expect(src).toContain("onOpenCommandPalette")
  })
})

// ── 13. Auth context — silent refresh on 401 ───────────
describe("Auth context — silent refresh", () => {
  it("attempts /api/auth/refresh before setting sessionExpired", () => {
    const src = read("lib/contexts/auth-context.tsx")
    expect(src).toContain("/api/auth/refresh")
    expect(src).toContain("silent refresh")
  })
})

// ── 14. .dockerignore ───────────────────────────────────
describe(".dockerignore", () => {
  it("excludes node_modules, .next, tests, .git", () => {
    const src = read(".dockerignore")
    expect(src).toContain("node_modules")
    expect(src).toContain(".next")
    expect(src).toContain("tests")
    expect(src).toContain(".git")
  })
})

// ── 15. next.config — standalone output for Docker ─────
describe("next.config — standalone output", () => {
  it("enables standalone when DOCKER_BUILD=1", () => {
    const src = read("next.config.mjs")
    expect(src).toContain("DOCKER_BUILD")
    expect(src).toContain('"standalone"')
  })
})
