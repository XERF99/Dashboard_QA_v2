"use client"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TableCell, TableRow } from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal, Edit, Trash2,
  KeyRound, CheckCircle2, XCircle, Lock, Unlock,
  Layers, UserMinus,
} from "lucide-react"
import type { User } from "@/lib/contexts/auth-context"
import { getRoleIcon } from "./user-management-shared"

interface RoleDef {
  id:          string
  label:       string
  cls:         string
  description: string
  permisos?:   string[]
}

export interface UserRowProps {
  u:               User
  currentUserId?:  string
  isOwner:         boolean
  rolDef:          RoleDef | undefined
  avatarCls:       string
  grupoNombre:     string | null
  canDelete:       boolean
  canQuitWorkspace: boolean
  onEdit:          (u: User) => void
  onReset:         (u: User) => void
  onUnlock:        (u: User) => void
  onQuitar:        (u: User) => void
  onDelete:        (u: User) => void
}

// Fila de la tabla de gestión de usuarios. Memoizada — extraída de
// user-management.tsx (v2.75).
function UserRowImpl({
  u, currentUserId, isOwner, rolDef, avatarCls, grupoNombre,
  canDelete, canQuitWorkspace, onEdit, onReset, onUnlock, onQuitar, onDelete,
}: UserRowProps) {
  return (
    <TableRow className="border-border hover:bg-secondary/50">
      <TableCell className="pl-4">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${avatarCls}`}>
            {u.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground text-sm leading-tight">
              {u.nombre}
              {u.id === currentUserId && (
                <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(Tú)</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground truncate md:hidden">{u.email}</p>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{u.email}</TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Badge variant="outline" className={`${rolDef?.cls ?? "bg-muted text-muted-foreground border-border"} flex items-center gap-1 w-fit text-[11px] px-2 py-0.5`}>
              {getRoleIcon(u.rol)}
              {rolDef?.label ?? u.rol}
            </Badge>
            {isOwner && grupoNombre && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 3,
                fontSize: 10, fontWeight: 600,
                color: "var(--primary)",
                background: "color-mix(in oklch, var(--primary) 10%, transparent)",
                padding: "1px 6px", borderRadius: 6,
                border: "1px solid color-mix(in oklch, var(--primary) 25%, transparent)",
              }}>
                <Layers size={9} />
                {grupoNombre}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2 hidden sm:block" title={rolDef?.description ?? ""}>
            {rolDef?.description ?? ""}
          </p>
        </div>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        <div className="flex flex-col gap-1">
          {u.activo ? (
            <div className="flex items-center gap-1.5 text-chart-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs font-medium">Activo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Inactivo</span>
            </div>
          )}
          {u.bloqueado && (
            <div className="flex items-center gap-1.5 text-chart-4">
              <Lock className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Bloqueado</span>
            </div>
          )}
        </div>
      </TableCell>

      <TableCell className="hidden sm:table-cell">
        {u.debeCambiarPassword ? (
          <Badge variant="outline" className="bg-chart-3/15 text-chart-3 border-chart-3/30 text-[10px] px-2">
            Pendiente cambio
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-chart-2/15 text-chart-2 border-chart-2/30 text-[10px] px-2">
            Configurada
          </Badge>
        )}
      </TableCell>

      <TableCell className="pr-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit(u)}>
              <Edit className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            {u.id !== currentUserId && (
              <DropdownMenuItem onClick={() => onReset(u)}>
                <KeyRound className="mr-2 h-4 w-4" /> Resetear contraseña
              </DropdownMenuItem>
            )}
            {u.bloqueado && u.id !== currentUserId && (
              <DropdownMenuItem onClick={() => onUnlock(u)}>
                <Unlock className="mr-2 h-4 w-4" /> Desbloquear cuenta
              </DropdownMenuItem>
            )}
            {canQuitWorkspace && (
              <DropdownMenuItem
                onClick={() => onQuitar(u)}
                className="text-chart-3 focus:text-chart-3"
              >
                <UserMinus className="mr-2 h-4 w-4" /> Quitar del workspace
              </DropdownMenuItem>
            )}
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(u)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export const UserRow = memo(UserRowImpl)
