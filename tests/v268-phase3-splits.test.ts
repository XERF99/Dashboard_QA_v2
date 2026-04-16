// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.68 Phase 3: Component splits
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

// ── 1. historia-usuario-detail split ──────────────────────
describe("historia-usuario-detail — split into sub-files", () => {
  it("hu-detail-shared.ts exports PNL, SLBL, fmt", () => {
    const src = read("components/dashboard/historias/hu-detail-shared.ts")
    expect(src).toContain("export const PNL")
    expect(src).toContain("export const SLBL")
    expect(src).toContain("export function fmt")
  })

  it("hu-bloqueos.tsx exports HUBloqueos and imports shared", () => {
    const src = read("components/dashboard/historias/hu-bloqueos.tsx")
    expect(src).toContain("export function HUBloqueos")
    expect(src).toContain('from "./hu-detail-shared"')
    expect(src).toContain("useHUDetail")
  })

  it("hu-historial.tsx exports HUHistorialPanel and imports shared", () => {
    const src = read("components/dashboard/historias/hu-historial.tsx")
    expect(src).toContain("export function HUHistorialPanel")
    expect(src).toContain('from "./hu-detail-shared"')
    expect(src).toContain("fmtCorto")
    expect(src).toContain("fmtHora")
  })

  it("hu-casos-panel.tsx exports HUCasosPanel and imports shared", () => {
    const src = read("components/dashboard/historias/hu-casos-panel.tsx")
    expect(src).toContain("export function HUCasosPanel")
    expect(src).toContain('from "./hu-detail-shared"')
    expect(src).toContain("useHUDetail")
    expect(src).toContain("CasoPruebaCard")
  })

  it("main file imports from extracted sub-files", () => {
    const src = read("components/dashboard/historias/historia-usuario-detail.tsx")
    expect(src).toContain('from "./hu-bloqueos"')
    expect(src).toContain('from "./hu-historial"')
    expect(src).toContain('from "./hu-casos-panel"')
    expect(src).toContain('from "./hu-detail-shared"')
  })

  it("main file no longer defines HUBloqueos, HUHistorialPanel, HUCasosPanel inline", () => {
    const src = read("components/dashboard/historias/historia-usuario-detail.tsx")
    expect(src).not.toContain("function HUBloqueos")
    expect(src).not.toContain("function HUHistorialPanel")
    expect(src).not.toContain("function HUCasosPanel")
    expect(src).not.toContain("function CasoFormFields")
  })
})

// ── 2. owner-panel split ──────────────────────────────────
describe("owner-panel — split into sub-files", () => {
  it("owner-panel-shared.ts exports types and helpers", () => {
    const src = read("components/dashboard/owner/owner-panel-shared.ts")
    expect(src).toContain("export interface Grupo")
    expect(src).toContain("export interface MetricasGrupo")
    expect(src).toContain("export interface GrupoConMetricas")
    expect(src).toContain("export interface Usuario")
    expect(src).toContain("export const ROLES_MIEMBRO")
    expect(src).toContain("export function getRolDef")
    expect(src).toContain("export function getInitials")
    expect(src).toContain("export function getAvatarCls")
  })

  it("owner-panel-dialogs.tsx exports all dialog components", () => {
    const src = read("components/dashboard/owner/owner-panel-dialogs.tsx")
    expect(src).toContain("export function GrupoFormDialog")
    expect(src).toContain("export function MemberFormDialog")
    expect(src).toContain("export function AssignUserDialog")
    expect(src).toContain("export function ConfirmDialog")
    expect(src).toContain('from "./owner-panel-shared"')
  })

  it("owner-panel-members.tsx exports MembersTable", () => {
    const src = read("components/dashboard/owner/owner-panel-members.tsx")
    expect(src).toContain("export function MembersTable")
    expect(src).toContain('from "./owner-panel-shared"')
    expect(src).toContain('from "./owner-panel-dialogs"')
  })

  it("owner-panel-detail.tsx exports GrupoDetail", () => {
    const src = read("components/dashboard/owner/owner-panel-detail.tsx")
    expect(src).toContain("export function GrupoDetail")
    expect(src).toContain('from "./owner-panel-shared"')
    expect(src).toContain('from "./owner-panel-members"')
    expect(src).toContain("KpiTile")
  })

  it("main owner-panel imports from extracted files", () => {
    const src = read("components/dashboard/owner/owner-panel.tsx")
    expect(src).toContain('from "./owner-panel-shared"')
    expect(src).toContain('from "./owner-panel-dialogs"')
    expect(src).toContain('from "./owner-panel-detail"')
    expect(src).toContain("export function OwnerPanel")
  })

  it("main file no longer defines internal sub-components", () => {
    const src = read("components/dashboard/owner/owner-panel.tsx")
    expect(src).not.toContain("function KpiTile")
    expect(src).not.toContain("function GrupoFormDialog")
    expect(src).not.toContain("function MemberFormDialog")
    expect(src).not.toContain("function AssignUserDialog")
    expect(src).not.toContain("function ConfirmDialog")
    expect(src).not.toContain("function MembersTable")
    expect(src).not.toContain("function GrupoDetail")
  })
})

// ── 3. user-management split ──────────────────────────────
describe("user-management — split into sub-files", () => {
  it("user-management-shared.ts exports helpers", () => {
    const src = read("components/dashboard/usuarios/user-management-shared.ts")
    expect(src).toContain("export function formatFechaConexion")
    expect(src).toContain("export function formatDuracion")
    expect(src).toContain("export function getRoleIcon")
    expect(src).toContain("export function getRoleAccentColor")
  })

  it("user-stats-cards.tsx exports UserStatsCards", () => {
    const src = read("components/dashboard/usuarios/user-stats-cards.tsx")
    expect(src).toContain("export function UserStatsCards")
    expect(src).toContain('from "./user-management-shared"')
    expect(src).toContain("getRoleAccentColor")
  })

  it("user-connections-panel.tsx exports UserConnectionsPanel", () => {
    const src = read("components/dashboard/usuarios/user-connections-panel.tsx")
    expect(src).toContain("export function UserConnectionsPanel")
    expect(src).toContain('from "./user-management-shared"')
    expect(src).toContain("formatFechaConexion")
    expect(src).toContain("formatDuracion")
  })

  it("main file imports extracted components", () => {
    const src = read("components/dashboard/usuarios/user-management.tsx")
    expect(src).toContain('from "./user-stats-cards"')
    expect(src).toContain('from "./user-connections-panel"')
    expect(src).toContain('from "./user-management-shared"')
    expect(src).toContain("UserStatsCards")
    expect(src).toContain("UserConnectionsPanel")
  })

  it("main file no longer defines inline helpers", () => {
    const src = read("components/dashboard/usuarios/user-management.tsx")
    expect(src).not.toContain("function formatFechaConexion")
    expect(src).not.toContain("function formatDuracion")
    expect(src).not.toContain("function getRoleAccentColor")
  })
})
