// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.67  SoftDeleteService, split useDomainData,
//  Admin audit viewer, React Query integration
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ── 1. base-crud.service.ts ─────────────────────────────
describe("base-crud.service — shared CRUD utilities", () => {
  it("exports notDeleted constant", () => {
    const src = read("lib/backend/services/base-crud.service.ts")
    expect(src).toContain("export const notDeleted")
    expect(src).toContain("deletedAt: null")
  })

  it("exports paginatedQuery helper", () => {
    const src = read("lib/backend/services/base-crud.service.ts")
    expect(src).toContain("export async function paginatedQuery")
    expect(src).toContain("PaginatedResult")
  })

  it("exports softDelete helper", () => {
    const src = read("lib/backend/services/base-crud.service.ts")
    expect(src).toContain("export function softDelete")
    expect(src).toContain("deletedAt: new Date()")
  })

  it("exports createRecord and updateRecord", () => {
    const src = read("lib/backend/services/base-crud.service.ts")
    expect(src).toContain("export function createRecord")
    expect(src).toContain("export function updateRecord")
  })
})

// ── 2. Services use base-crud ───────────────────────────
describe("Services — use base-crud utilities", () => {
  it("historia.service imports from base-crud", () => {
    const src = read("lib/backend/services/historia.service.ts")
    expect(src).toContain('from "./base-crud.service"')
    expect(src).toContain("notDeleted")
    expect(src).toContain("paginatedQuery")
    expect(src).toContain("createRecord")
    expect(src).toContain("updateRecord")
  })

  it("caso.service imports from base-crud", () => {
    const src = read("lib/backend/services/caso.service.ts")
    expect(src).toContain('from "./base-crud.service"')
    expect(src).toContain("softDelete")
    expect(src).toContain("paginatedQuery")
  })

  it("tarea.service imports from base-crud", () => {
    const src = read("lib/backend/services/tarea.service.ts")
    expect(src).toContain('from "./base-crud.service"')
    expect(src).toContain("softDelete")
    expect(src).toContain("paginatedQuery")
  })

  it("historia.service still has cascading delete (not generic)", () => {
    const src = read("lib/backend/services/historia.service.ts")
    expect(src).toContain("$transaction")
    expect(src).toContain("casoPrueba.updateMany")
    expect(src).toContain("tarea.updateMany")
  })

  it("caso.service uses softDelete for simple delete", () => {
    const src = read("lib/backend/services/caso.service.ts")
    expect(src).toMatch(/export async function deleteCaso.*\n.*softDelete/)
  })

  it("tarea.service uses softDelete for simple delete", () => {
    const src = read("lib/backend/services/tarea.service.ts")
    expect(src).toMatch(/export async function deleteTarea.*\n.*softDelete/)
  })

  it("services no longer declare their own notDeleted", () => {
    const historias = read("lib/backend/services/historia.service.ts")
    const casos = read("lib/backend/services/caso.service.ts")
    const tareas = read("lib/backend/services/tarea.service.ts")
    // Should import it, not declare it
    expect(historias).not.toMatch(/^const notDeleted/m)
    expect(casos).not.toMatch(/^const notDeleted/m)
    expect(tareas).not.toMatch(/^const notDeleted/m)
  })
})

// ── 3. Split useDomainData into independent hooks ───────
describe("Split useDomainData", () => {
  it("useHistoriasData hook exists and exports correctly", () => {
    const src = read("lib/hooks/useHistoriasData.ts")
    expect(src).toContain("export function useHistoriasData")
    expect(src).toContain("useApiQuery")
    expect(src).toContain("API.historias")
    expect(src).toContain("parseHistorias")
  })

  it("useCasosData hook exists and exports correctly", () => {
    const src = read("lib/hooks/useCasosData.ts")
    expect(src).toContain("export function useCasosData")
    expect(src).toContain("useApiQuery")
    expect(src).toContain("API.casos")
    expect(src).toContain("parseCasos")
  })

  it("useTareasData hook exists and exports correctly", () => {
    const src = read("lib/hooks/useTareasData.ts")
    expect(src).toContain("export function useTareasData")
    expect(src).toContain("useApiQuery")
    expect(src).toContain("API.tareas")
    expect(src).toContain("parseTareas")
  })

  it("useDomainData now composes the independent hooks", () => {
    const src = read("lib/hooks/useDomainData.ts")
    expect(src).toContain("useHistoriasData")
    expect(src).toContain("useCasosData")
    expect(src).toContain("useTareasData")
    // Should NOT contain the inline parse functions anymore
    expect(src).not.toContain("function parseHistorias")
    expect(src).not.toContain("function parseCasos")
    expect(src).not.toContain("function parseTareas")
  })

  it("useDomainData still exports the same public API", () => {
    const src = read("lib/hooks/useDomainData.ts")
    expect(src).toContain("isLoading")
    expect(src).toContain("createHUHandlers")
    expect(src).toContain("createCasoHandlers")
    expect(src).toContain("createTareaHandlers")
    expect(src).toContain("createBloqueoHandlers")
    expect(src).toContain("createComentarioHandlers")
  })

  it("each hook imports centralized parsers", () => {
    for (const file of ["useHistoriasData.ts", "useCasosData.ts", "useTareasData.ts"]) {
      const src = read(`lib/hooks/${file}`)
      expect(src).toContain('from "@/lib/utils/parsers"')
      expect(src).toContain("parseBloqueo")
      expect(src).not.toContain("function d(")
      expect(src).not.toContain("function dOpt(")
    }
  })

  it("parsers.ts exports d, dOpt, parseBloqueo", () => {
    const src = read("lib/utils/parsers.ts")
    expect(src).toContain("export function d(")
    expect(src).toContain("export function dOpt(")
    expect(src).toContain("export function parseBloqueo(")
  })
})

// ── 4. Admin audit API — admin access ───────────────────
describe("Audit API — admin access", () => {
  it("allows admin role (not just owner)", () => {
    const src = read("app/api/audit/route.ts")
    expect(src).toContain('"owner", "admin"')
    expect(src).not.toMatch(/payload\.rol !== "owner"/)
  })

  it("scopes admin queries to their workspace", () => {
    const src = read("app/api/audit/route.ts")
    expect(src).toContain("payload.grupoId")
  })
})

// ── 5. AuditLogViewer component ─────────────────────────
describe("AuditLogViewer component", () => {
  it("exists with React Query integration", () => {
    const src = read("components/dashboard/shared/audit-log-viewer.tsx")
    expect(src).toContain("export function AuditLogViewer")
    expect(src).toContain("useAuditLog")
  })

  it("has action and resource filters", () => {
    const src = read("components/dashboard/shared/audit-log-viewer.tsx")
    expect(src).toContain("filterAction")
    expect(src).toContain("filterResource")
    expect(src).toContain("ACTION_STYLES")
    expect(src).toContain("RESOURCE_LABELS")
  })

  it("is integrated in tab-admin", () => {
    const src = read("components/dashboard/tabs/tab-admin.tsx")
    expect(src).toContain("AuditLogViewer")
    expect(src).toContain("audit-log")
  })
})

// ── 6. useAuditLog React Query hook ─────────────────────
describe("useAuditLog — React Query hook", () => {
  it("uses useQuery from tanstack", () => {
    const src = read("lib/hooks/useAuditLog.ts")
    expect(src).toContain("useQuery")
    expect(src).toContain("@tanstack/react-query")
    expect(src).toContain("keepPreviousData")
  })

  it("has proper query key with pagination and filters", () => {
    const src = read("lib/hooks/useAuditLog.ts")
    expect(src).toContain("audit-log")
    expect(src).toContain("page")
    expect(src).toContain("action")
    expect(src).toContain("resource")
  })

  it("calls the audit endpoint via API constant", () => {
    const src = read("lib/hooks/useAuditLog.ts")
    expect(src).toContain("API.audit")
  })
})

// ── 7. PaginatedResult type ─────────────────────────────
describe("PaginatedResult type in base-crud", () => {
  it("defines a generic PaginatedResult interface", () => {
    const src = read("lib/backend/services/base-crud.service.ts")
    expect(src).toContain("export interface PaginatedResult<T>")
    expect(src).toContain("data: T[]")
    expect(src).toContain("total: number")
    expect(src).toContain("pages: number")
  })
})
