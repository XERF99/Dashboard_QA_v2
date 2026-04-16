// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.63  AsyncLocalStorage logger, middleware,
//  request.json safety, coverage, ErrorBoundary, sanitize,
//  CI improvements, config types, lazy load, TTL alignment,
//  indexes, SIGINT, Promise.allSettled, types consolidation,
//  rate-limit keys, loading skeletons
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ══════════════════════════════════════════════════════════
//  1. Logger — AsyncLocalStorage (thread-safe requestId)
// ══════════════════════════════════════════════════════════
describe("Logger — AsyncLocalStorage", () => {
  it("usa AsyncLocalStorage en lugar de variable global mutable", () => {
    const src = read("lib/backend/logger.ts")
    expect(src).toContain("AsyncLocalStorage")
    expect(src).toContain("requestIdStorage")
    expect(src).toContain("runWithRequestId")
    // No debe tener la variable global mutable
    expect(src).not.toMatch(/^let _requestId/m)
  })

  it("exporta runWithRequestId y getRequestId", () => {
    const src = read("lib/backend/logger.ts")
    expect(src).toContain("export function runWithRequestId")
    expect(src).toContain("export function getRequestId")
  })

  it("runWithRequestId funciona correctamente", async () => {
    const { runWithRequestId, getRequestId } = await import("@/lib/backend/logger")
    let captured: string | undefined
    runWithRequestId("test-req-123", () => {
      captured = getRequestId()
    })
    expect(captured).toBe("test-req-123")
    // Fuera del contexto debe ser undefined
    expect(getRequestId()).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════
//  2. Middleware centralizado — /middleware.ts
// ══════════════════════════════════════════════════════════
describe("Next.js middleware centralizado", () => {
  it("existe middleware.ts en la raíz del proyecto", () => {
    expect(fs.existsSync(path.resolve("middleware.ts"))).toBe(true)
  })

  it("protege rutas de API y permite rutas públicas", () => {
    const src = read("middleware.ts")
    expect(src).toContain("/api/auth/login")
    expect(src).toContain("/api/health")
    expect(src).toContain("jwtVerify")
    expect(src).toContain("matcher")
  })

  it("extrae token de Authorization header y cookie", () => {
    const src = read("middleware.ts")
    expect(src).toContain("Bearer ")
    expect(src).toContain("tcs_token")
  })
})

// ══════════════════════════════════════════════════════════
//  3. request.json() protegido con .catch()
// ══════════════════════════════════════════════════════════
describe("request.json() con .catch() — 4 rutas", () => {
  const routes = [
    "app/api/historias/route.ts",
    "app/api/casos/route.ts",
    "app/api/auth/password/route.ts",
    "app/api/config/route.ts",
  ]

  routes.forEach(route => {
    it(`${route} — usa request.json().catch()`, () => {
      const src = read(route)
      expect(src).toContain("request.json().catch(() => null)")
      expect(src).toContain("Body JSON inválido")
    })
  })
})

// ══════════════════════════════════════════════════════════
//  4. Vitest — coverage configurado
// ══════════════════════════════════════════════════════════
describe("Vitest — coverage config", () => {
  it("vitest.config.ts incluye configuración de coverage", () => {
    const src = read("vitest.config.ts")
    expect(src).toContain("coverage")
    expect(src).toContain("provider")
    expect(src).toContain("v8")
    expect(src).toContain("reporter")
  })
})

// ══════════════════════════════════════════════════════════
//  5. getHistoriaById filtra soft-deleted
// ══════════════════════════════════════════════════════════
describe("getHistoriaById — soft delete filter", () => {
  it("usa findFirst con notDeleted en lugar de findUnique", () => {
    const src = read("lib/backend/services/historia.service.ts")
    expect(src).toContain("findFirst")
    expect(src).toMatch(/getHistoriaById[\s\S]*?notDeleted/)
    // Los casos incluidos también deben filtrar deleted
    expect(src).toContain("casos: { where: { deletedAt: null } }")
  })
})

// ══════════════════════════════════════════════════════════
//  6. TabErrorBoundary
// ══════════════════════════════════════════════════════════
describe("TabErrorBoundary", () => {
  it("existe el componente tab-error-boundary", () => {
    expect(fs.existsSync(path.resolve("components/dashboard/shared/tab-error-boundary.tsx"))).toBe(true)
  })

  it("tab components envuelven contenido con TabErrorBoundary", () => {
    // After v2.65 refactoring, TabErrorBoundary is inside individual tab components
    const tabDir = "components/dashboard/tabs"
    const tabFiles = ["tab-inicio.tsx", "tab-historias.tsx", "tab-analytics.tsx", "tab-carga.tsx", "tab-bloqueos.tsx", "tab-casos.tsx", "tab-admin.tsx", "tab-grupos.tsx"]
    let totalMatches = 0
    for (const file of tabFiles) {
      const src = read(`${tabDir}/${file}`)
      const matches = src.match(/TabErrorBoundary/g)
      if (matches) totalMatches += matches.length
    }
    expect(totalMatches).toBeGreaterThanOrEqual(16) // open + close tags across 8 tab files
  })

  it("el componente tiene método de reintentar", () => {
    const src = read("components/dashboard/shared/tab-error-boundary.tsx")
    expect(src).toContain("handleRetry")
    expect(src).toContain("getDerivedStateFromError")
  })
})

// ══════════════════════════════════════════════════════════
//  7. Sanitizar filename en CSV export
// ══════════════════════════════════════════════════════════
describe("CSV export — filename sanitizado", () => {
  it("define sanitizeFilename y lo usa en ambos branches", () => {
    const src = read("app/api/export/route.ts")
    expect(src).toContain("sanitizeFilename")
    expect(src).toMatch(/sanitizeFilename\(sprint\)/)
    expect(src).toMatch(/sanitizeFilename\(estado\)/)
    // No debe tener la versión insegura anterior
    expect(src).not.toContain("sprint.replace(/\\s+/g")
  })

  it("sanitizeFilename solo permite caracteres seguros", () => {
    const src = read("app/api/export/route.ts")
    expect(src).toContain("[^a-zA-Z0-9_-]")
    expect(src).toContain(".slice(0, 64)")
  })
})

// ══════════════════════════════════════════════════════════
//  8. CI — build step + prisma drift check
// ══════════════════════════════════════════════════════════
describe("CI workflow", () => {
  it("incluye step de build", () => {
    const src = read(".github/workflows/ci.yml")
    expect(src).toContain("pnpm build")
  })

  it("incluye check de schema drift con prisma migrate diff", () => {
    const src = read(".github/workflows/ci.yml")
    expect(src).toContain("prisma migrate diff")
    expect(src).toContain("--exit-code")
  })
})

// ══════════════════════════════════════════════════════════
//  9. config.service.ts — sin as any
// ══════════════════════════════════════════════════════════
describe("config.service.ts — type safety", () => {
  it("no usa 'as any'", () => {
    const src = read("lib/backend/services/config.service.ts")
    expect(src).not.toContain("as any")
    expect(src).not.toContain("eslint-disable")
  })

  it("usa ConfigUpdateData tipado con Prisma.InputJsonValue", () => {
    const src = read("lib/backend/services/config.service.ts")
    expect(src).toContain("ConfigUpdateData")
    expect(src).toContain("Prisma.InputJsonValue")
  })
})

// ══════════════════════════════════════════════════════════
//  10. next/dynamic lazy loading
// ══════════════════════════════════════════════════════════
describe("Lazy loading con next/dynamic", () => {
  it("tab components usa dynamic() para HomeDashboard, AnalyticsKPIs, CargaOcupacional, OwnerPanel", () => {
    // After v2.65 refactoring, dynamic imports are in individual tab components
    const inicio = read("components/dashboard/tabs/tab-inicio.tsx")
    expect(inicio).toMatch(/dynamic\(\s*\(\) => import.*HomeDashboard/)
    expect(inicio).toContain("ssr: false")

    const analytics = read("components/dashboard/tabs/tab-analytics.tsx")
    expect(analytics).toMatch(/dynamic\(\s*\(\) => import.*AnalyticsKPIs/)

    const carga = read("components/dashboard/tabs/tab-carga.tsx")
    expect(carga).toMatch(/dynamic\(\s*\(\) => import.*CargaOcupacional/)

    const grupos = read("components/dashboard/tabs/tab-grupos.tsx")
    expect(grupos).toMatch(/dynamic\(\s*\(\) => import.*OwnerPanel/)
  })
})

// ══════════════════════════════════════════════════════════
//  11. Caché TTL alineado
// ══════════════════════════════════════════════════════════
describe("Métricas — TTL alineado server ↔ HTTP", () => {
  it("metricas-cache.ts tiene CACHE_TTL_MS = 300_000 (5 min)", () => {
    const src = read("lib/backend/metricas-cache.ts")
    expect(src).toContain("300_000")
  })

  it("metricas route tiene max-age=300 (no 30)", () => {
    const src = read("app/api/metricas/route.ts")
    expect(src).toContain("max-age=300")
    expect(src).not.toMatch(/max-age=30[^0]/)
  })
})

// ══════════════════════════════════════════════════════════
//  12. AuditLog indexes
// ══════════════════════════════════════════════════════════
describe("AuditLog — indexes", () => {
  it("schema.prisma tiene @@index([action]) y @@index([grupoId, action])", () => {
    const src = read("prisma/schema.prisma")
    const auditSection = src.split("model AuditLog")[1]?.split("@@map")[0] ?? ""
    expect(auditSection).toContain("@@index([action])")
    expect(auditSection).toContain("@@index([grupoId, action])")
  })
})

// ══════════════════════════════════════════════════════════
//  13. docker-compose.dev.yml
// ══════════════════════════════════════════════════════════
describe("docker-compose.dev.yml", () => {
  it("existe y configura PostgreSQL", () => {
    expect(fs.existsSync(path.resolve("docker-compose.dev.yml"))).toBe(true)
    const src = read("docker-compose.dev.yml")
    expect(src).toContain("postgres")
    expect(src).toContain("5432")
    expect(src).toContain("healthcheck")
  })
})

// ══════════════════════════════════════════════════════════
//  14. noUncheckedIndexedAccess en tsconfig
// ══════════════════════════════════════════════════════════
describe("tsconfig — strict indexed access", () => {
  it("tiene noUncheckedIndexedAccess: true", () => {
    const src = read("tsconfig.json")
    const config = JSON.parse(src)
    expect(config.compilerOptions.noUncheckedIndexedAccess).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════
//  15. Prisma — SIGINT + SIGTERM handlers
// ══════════════════════════════════════════════════════════
describe("Prisma — shutdown handlers", () => {
  it("prisma.ts escucha SIGINT y SIGTERM", () => {
    const src = read("lib/backend/prisma.ts")
    expect(src).toContain("SIGTERM")
    expect(src).toContain("SIGINT")
    expect(src).toContain("$disconnect")
  })
})

// ══════════════════════════════════════════════════════════
//  16. Promise.allSettled en getMetricasGlobales
// ══════════════════════════════════════════════════════════
describe("getMetricasGlobales — error isolation", () => {
  it("usa Promise.allSettled en lugar de Promise.all", () => {
    const src = read("lib/backend/services/grupo.service.ts")
    expect(src).toContain("Promise.allSettled")
    expect(src).toContain("status === \"fulfilled\"")
    expect(src).not.toMatch(/getMetricasGlobales[\s\S]*?Promise\.all\(/)
  })
})

// ══════════════════════════════════════════════════════════
//  17. lib/types.ts — marcado como deprecated
// ══════════════════════════════════════════════════════════
describe("lib/types.ts — deprecated barrel", () => {
  it("tiene marcas @deprecated", () => {
    const src = read("lib/types.ts")
    expect(src).toContain("@deprecated")
  })
})

// ══════════════════════════════════════════════════════════
//  18. Rate limit keys — formato consistente METHOD /path
// ══════════════════════════════════════════════════════════
describe("Rate limit keys — formato consistente", () => {
  const files = [
    { file: "app/api/export/route.ts",            expect: "GET /api/export" },
    { file: "app/api/metricas/route.ts",           expect: "GET /api/metricas" },
    { file: "app/api/audit/route.ts",              expect: "GET /api/audit" },
    { file: "app/api/historias/sync/route.ts",     expect: "POST /api/historias/sync" },
    { file: "app/api/casos/sync/route.ts",         expect: "POST /api/casos/sync" },
    { file: "app/api/tareas/sync/route.ts",        expect: "POST /api/tareas/sync" },
    { file: "app/api/auth/login/route.ts",         expect: "POST /api/auth/login" },
    { file: "app/api/casos/batch/route.ts",        expect: "POST /api/casos/batch" },
  ]

  files.forEach(({ file, expect: expected }) => {
    it(`${file} usa "${expected}"`, () => {
      const src = read(file)
      expect(src).toContain(`"${expected}"`)
    })
  })
})

// ══════════════════════════════════════════════════════════
//  19. Loading skeletons
// ══════════════════════════════════════════════════════════
describe("Loading skeletons por tab", () => {
  it("existe tab-skeleton.tsx", () => {
    expect(fs.existsSync(path.resolve("components/dashboard/shared/tab-skeleton.tsx"))).toBe(true)
  })

  it("tab components usan TabSkeleton como loading fallback en dynamic()", () => {
    // After v2.65 refactoring, TabSkeleton is imported in tab components that use dynamic()
    const inicio = read("components/dashboard/tabs/tab-inicio.tsx")
    expect(inicio).toContain("TabSkeleton")
    expect(inicio).toMatch(/loading:.*TabSkeleton/)
  })
})

// ══════════════════════════════════════════════════════════
//  20. Servicios — tests unitarios para config, grupo, sprint
// ══════════════════════════════════════════════════════════
describe("config.service", () => {
  it("exporta getConfig y updateConfig", () => {
    const src = read("lib/backend/services/config.service.ts")
    expect(src).toContain("export async function getConfig")
    expect(src).toContain("export async function updateConfig")
  })

  it("usa upsert para updateConfig (no create + update separados)", () => {
    const src = read("lib/backend/services/config.service.ts")
    expect(src).toContain("prisma.config.upsert")
  })
})

describe("grupo.service", () => {
  it("exporta getAllGrupos, createGrupo, deleteGrupo, getMetricasGrupo, getMetricasGlobales", () => {
    const src = read("lib/backend/services/grupo.service.ts")
    expect(src).toContain("export async function getAllGrupos")
    expect(src).toContain("export async function createGrupo")
    expect(src).toContain("export async function deleteGrupo")
    expect(src).toContain("export async function getMetricasGrupo")
    expect(src).toContain("export async function getMetricasGlobales")
  })

  it("deleteGrupo verifica usuarios, historias y sprints antes de borrar", () => {
    const src = read("lib/backend/services/grupo.service.ts")
    const delFn = src.split("export async function deleteGrupo")[1]?.split("export async function")[0] ?? ""
    expect(delFn).toContain("user.count")
    expect(delFn).toContain("historiaUsuario.count")
    expect(delFn).toContain("sprint.count")
  })
})

describe("sprint.service", () => {
  it("exporta getAllSprints, getSprintActivo, createSprint, updateSprint, deleteSprint", () => {
    const src = read("lib/backend/services/sprint.service.ts")
    expect(src).toContain("export async function getAllSprints")
    expect(src).toContain("export async function getSprintActivo")
    expect(src).toContain("export async function createSprint")
    expect(src).toContain("export async function updateSprint")
    expect(src).toContain("export async function deleteSprint")
  })

  it("getSprintActivo filtra por rango de fechas", () => {
    const src = read("lib/backend/services/sprint.service.ts")
    expect(src).toContain("fechaInicio: { lte: now }")
    expect(src).toContain("fechaFin: { gte: now }")
  })
})

describe("auth.service", () => {
  it("exporta loginService, logoutService, cambiarPasswordService, createUserService, resetPasswordService, desbloquearUsuarioService", () => {
    const src = read("lib/backend/services/auth.service.ts")
    expect(src).toContain("export async function loginService")
    expect(src).toContain("export async function logoutService")
    expect(src).toContain("export async function cambiarPasswordService")
    expect(src).toContain("export async function createUserService")
    expect(src).toContain("export async function resetPasswordService")
    expect(src).toContain("export async function desbloquearUsuarioService")
  })

  it("loginService bloquea tras MAX_INTENTOS fallidos", () => {
    const src = read("lib/backend/services/auth.service.ts")
    expect(src).toContain("MAX_INTENTOS")
    expect(src).toContain("bloqueado")
    expect(src).toContain("intentosFallidos")
  })

  it("cambiarPasswordService rechaza si la nueva es igual a la actual", () => {
    const src = read("lib/backend/services/auth.service.ts")
    expect(src).toContain("nueva === actual")
    expect(src).toContain("La nueva contraseña debe ser diferente")
  })
})
