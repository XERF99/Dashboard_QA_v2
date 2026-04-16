"use client"

import { Users } from "lucide-react"
import { Card, CardHeader } from "@/components/ui/card"
import type { User } from "@/lib/contexts/auth-context"
import { getRoleIcon, getRoleAccentColor } from "./user-management-shared"

interface RoleDef {
  id: string
  label: string
  cls: string
  description?: string
  permisos: string[]
}

interface UserStatsCardsProps {
  workspaceUsers: User[]
  roles: RoleDef[]
  isOwner: boolean
}

export function UserStatsCards({ workspaceUsers, roles, isOwner }: UserStatsCardsProps) {
  const activeCount   = workspaceUsers.filter(u => u.activo).length
  const inactiveCount = workspaceUsers.length - activeCount

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
      <Card className="bg-card border-border overflow-hidden">
        <div style={{ height: 3, background: "var(--primary)" }} />
        <CardHeader className="p-3">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 28, height: 28, borderRadius: 6, flexShrink: 0,
              background: "color-mix(in oklch, var(--primary) 12%, transparent)",
            }}>
              <Users className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: "var(--foreground)" }}>{workspaceUsers.length}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</span>
              </div>
              <div className="hidden sm:flex" style={{ gap: 6, marginTop: 3, alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--chart-2)", display: "inline-block" }} />
                  <span style={{ color: "var(--chart-2)", fontWeight: 600 }}>{activeCount} activos</span>
                </span>
                {inactiveCount > 0 && (
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted-foreground)", display: "inline-block" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>{inactiveCount} inactivos</span>
                  </span>
                )}
              </div>
            </div>
            <span className="hidden sm:inline-flex" style={{
              fontSize: 10, fontWeight: 700, color: "var(--chart-2)", flexShrink: 0,
              background: "color-mix(in oklch, var(--chart-2) 10%, transparent)",
              padding: "1px 6px", borderRadius: 999,
            }}>{workspaceUsers.length > 0 ? Math.round((activeCount / workspaceUsers.length) * 100) : 0}%</span>
          </div>
          <div style={{ marginTop: 8, height: 2, background: "var(--border)", borderRadius: 999 }}>
            <div style={{
              height: "100%", borderRadius: 999, transition: "width 0.4s",
              width: `${workspaceUsers.length > 0 ? (activeCount / workspaceUsers.length) * 100 : 0}%`,
              background: "var(--chart-2)",
            }} />
          </div>
        </CardHeader>
      </Card>

      {roles.filter(r => isOwner || !r.permisos.includes("isSuperAdmin")).map(r => {
        const count  = workspaceUsers.filter(u => u.rol === r.id).length
        const pct    = workspaceUsers.length > 0 ? (count / workspaceUsers.length) * 100 : 0
        const accent = getRoleAccentColor(r.id)
        return (
          <Card key={r.id} className="bg-card border-border overflow-hidden">
            <div style={{ height: 3, background: accent }} />
            <CardHeader className="p-3">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: `color-mix(in oklch, ${accent} 12%, transparent)`,
                }}>
                  <span style={{ color: accent, display: "flex" }}>{getRoleIcon(r.id)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: "var(--foreground)" }}>{count}</div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                </div>
                <span className="hidden sm:inline-flex" style={{
                  fontSize: 10, fontWeight: 700, color: accent, flexShrink: 0,
                  background: `color-mix(in oklch, ${accent} 10%, transparent)`,
                  padding: "1px 6px", borderRadius: 999,
                }}>{Math.round(pct)}%</span>
              </div>
              <div style={{ marginTop: 8, height: 2, background: "var(--border)", borderRadius: 999 }}>
                <div style={{ height: "100%", borderRadius: 999, transition: "width 0.4s", width: `${pct}%`, background: accent }} />
              </div>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
