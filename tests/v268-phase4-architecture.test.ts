// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.68 Phase 4: Architecture
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ── 1. useDashboardState extraction (Task 5) ─────────────
describe("useDashboardState — facade hook extracted from page.tsx", () => {
  it("useDashboardState.ts exports the hook", () => {
    const src = read("lib/hooks/useDashboardState.ts")
    expect(src).toContain("export function useDashboardState")
  })

  it("composes useAuth, useConfig, useDomainData, useHUModals, useHistoriasVisibles", () => {
    const src = read("lib/hooks/useDashboardState.ts")
    expect(src).toContain("useAuth")
    expect(src).toContain("useConfig")
    expect(src).toContain("useDomainData")
    expect(src).toContain("useHUModals")
    expect(src).toContain("useHistoriasVisibles")
  })

  it("returns auth state, config, domain, UI state, and filtered data", () => {
    const src = read("lib/hooks/useDashboardState.ts")
    expect(src).toContain("isAuthenticated")
    expect(src).toContain("config")
    expect(src).toContain("domain")
    expect(src).toContain("historiasVisibles")
    expect(src).toContain("casosVisibles")
    expect(src).toContain("tareasVisibles")
    expect(src).toContain("tabActiva")
  })

  it("page.tsx uses useDashboardState instead of direct hook calls", () => {
    const src = read("app/page.tsx")
    expect(src).toContain("useDashboardState")
    expect(src).not.toContain("useCallback")
    expect(src).not.toContain("useEffect")
    expect(src).not.toContain("useMemo")
  })
})

// ── 2. auth-context split (Task 10) ──────────────────────
describe("auth-context — split into auth-types + auth-crud", () => {
  it("auth-types.ts exports types and constants", () => {
    const src = read("lib/contexts/auth-types.ts")
    expect(src).toContain("export type PermisoId")
    expect(src).toContain("export const PERMISOS_INFO")
    expect(src).toContain("export interface RoleDef")
    expect(src).toContain("export const ROLES_PREDETERMINADOS")
    expect(src).toContain("export interface User")
    expect(src).toContain("export type UserSafe")
    expect(src).toContain("export const usuariosIniciales")
  })

  it("auth-crud.ts exports useUserCrud and useRoleCrud", () => {
    const src = read("lib/contexts/auth-crud.ts")
    expect(src).toContain("export function useUserCrud")
    expect(src).toContain("export function useRoleCrud")
    expect(src).toContain('from "./auth-types"')
  })

  it("auth-crud.ts contains user CRUD operations", () => {
    const src = read("lib/contexts/auth-crud.ts")
    expect(src).toContain("addUser")
    expect(src).toContain("updateUser")
    expect(src).toContain("deleteUser")
    expect(src).toContain("toggleUserActive")
    expect(src).toContain("resetPassword")
    expect(src).toContain("desbloquearUsuario")
  })

  it("auth-crud.ts contains role CRUD operations", () => {
    const src = read("lib/contexts/auth-crud.ts")
    expect(src).toContain("addRole")
    expect(src).toContain("updateRole")
    expect(src).toContain("deleteRole")
  })

  it("auth-context.tsx re-exports from auth-types for backwards compatibility", () => {
    const src = read("lib/contexts/auth-context.tsx")
    expect(src).toContain('from "./auth-types"')
    expect(src).toContain('from "./auth-crud"')
    expect(src).toContain("export function AuthProvider")
    expect(src).toContain("export function useAuth")
  })

  it("auth-context.tsx no longer contains inline CRUD logic", () => {
    const src = read("lib/contexts/auth-context.tsx")
    expect(src).not.toContain("function addUser")
    expect(src).not.toContain("function deleteUser")
    expect(src).not.toContain("function addRole")
    expect(src).not.toContain("function deleteRole")
  })
})

// ── 3. React Query migration (Task 6) ────────────────────
describe("React Query migration — useApiMirroredState → useApiQuery", () => {
  it("useApiQuery.ts exists and uses React Query", () => {
    const src = read("lib/hooks/useApiQuery.ts")
    expect(src).toContain("export function useApiQuery")
    expect(src).toContain("useQuery")
    expect(src).toContain("useMutation")
    expect(src).toContain("useQueryClient")
  })

  it("useHistoriasData uses useApiQuery", () => {
    const src = read("lib/hooks/useHistoriasData.ts")
    expect(src).toContain("useApiQuery")
    expect(src).not.toContain("useApiMirroredState")
  })

  it("useCasosData uses useApiQuery", () => {
    const src = read("lib/hooks/useCasosData.ts")
    expect(src).toContain("useApiQuery")
    expect(src).not.toContain("useApiMirroredState")
  })

  it("useTareasData uses useApiQuery", () => {
    const src = read("lib/hooks/useTareasData.ts")
    expect(src).toContain("useApiQuery")
    expect(src).not.toContain("useApiMirroredState")
  })

  it("QueryProvider is configured in layout", () => {
    const src = read("app/layout.tsx")
    expect(src).toContain("QueryProvider")
    expect(src).toContain("query-provider")
  })
})
