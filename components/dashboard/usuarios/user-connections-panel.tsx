"use client"

import { History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { User } from "@/lib/contexts/auth-context"
import { formatFechaConexion, formatDuracion } from "./user-management-shared"

interface RoleDef {
  id: string
  label: string
  cls: string
}

interface UserConnectionsPanelProps {
  workspaceUsers: User[]
  currentUserId: string | undefined
  getRoleDef: (rolId: string) => RoleDef | undefined
  getAvatarCls: (rolId: string) => string
}

export function UserConnectionsPanel({ workspaceUsers, currentUserId, getRoleDef: getRoleDef_, getAvatarCls }: UserConnectionsPanelProps) {
  return (
    <Card className="bg-card border-border overflow-hidden">
      <div style={{ height: 3, background: "#eab308" }} />
      <CardHeader className="p-4 pb-3">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <History size={14} style={{ color: "#eab308" }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>Actividad de Conexiones</span>
          <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-500 border-yellow-500/30 ml-1">
            Solo Owner
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <Table className="sm:min-w-105">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground pl-4">Usuario</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Rol</TableHead>
              <TableHead className="text-muted-foreground">Último acceso</TableHead>
              <TableHead className="text-muted-foreground hidden sm:table-cell">Duración sesión</TableHead>
              <TableHead className="text-muted-foreground text-right pr-4 hidden sm:table-cell">Sesiones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaceUsers.map(u => {
              const hist = u.historialConexiones ?? []
              const last = hist[hist.length - 1]
              const ultimoAcceso = last?.entrada ? formatFechaConexion(last.entrada) : "—"
              const duracion = last
                ? last.salida
                  ? formatDuracion(new Date(last.salida).getTime() - new Date(last.entrada).getTime())
                  : <span style={{ color: "var(--chart-2)", fontWeight: 600 }}>En sesión</span>
                : "—"
              const rolDef = getRoleDef_(u.rol)
              return (
                <TableRow key={u.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="pl-4">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs ${getAvatarCls(u.rol)}`}>
                        {u.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                        {u.nombre}
                        {u.id === currentUserId && (
                          <span style={{ marginLeft: 5, fontSize: 10, color: "var(--muted-foreground)" }}>(Tú)</span>
                        )}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className={`${rolDef?.cls ?? "bg-muted text-muted-foreground border-border"} text-[10px] px-2 py-0.5`}>
                      {rolDef?.label ?? u.rol}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{ultimoAcceso}</TableCell>
                  <TableCell className="hidden sm:table-cell" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{duracion}</TableCell>
                  <TableCell className="text-right pr-4 hidden sm:table-cell" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                    {hist.length > 0 ? hist.length : "—"}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
