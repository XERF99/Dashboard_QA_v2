"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Users, Pencil, MoreHorizontal, UserPlus, UserMinus, UserCheck,
  CheckCircle2, AlertCircle, Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type Usuario, getRolDef, getInitials, getAvatarCls } from "./owner-panel-shared"
import { MemberFormDialog, AssignUserDialog, ConfirmDialog } from "./owner-panel-dialogs"

export function MembersTable({ miembros, sinGrupo, grupoNombre, grupoId, onRefresh, saving, setSaving, setError }: {
  miembros: Usuario[]
  sinGrupo: Usuario[]
  grupoNombre: string
  grupoId: string
  onRefresh: () => void
  saving: boolean
  setSaving: (v: boolean) => void
  setError: (e: string | null) => void
}) {
  const [memberFormOpen, setMemberFormOpen]     = useState(false)
  const [editTarget, setEditTarget]             = useState<Usuario | null>(null)
  const [assignOpen, setAssignOpen]             = useState(false)
  const [removeConfirm, setRemoveConfirm]       = useState<Usuario | null>(null)

  const handleCreateMember = async (data: { nombre: string; email: string; rol: string }) => {
    setSaving(true)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, grupoId }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al crear usuario"); return }
      setMemberFormOpen(false)
      onRefresh()
    } finally { setSaving(false) }
  }

  const handleEditMember = async (data: { nombre: string; email: string; rol: string }) => {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editTarget.id, ...data }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al actualizar usuario"); return }
      setEditTarget(null)
      onRefresh()
    } finally { setSaving(false) }
  }

  const handleAssign = async (userId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, grupoId }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al asignar usuario"); return }
      setAssignOpen(false)
      onRefresh()
    } finally { setSaving(false) }
  }

  const handleRemove = async (u: Usuario) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: u.id, grupoId: null }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al remover miembro"); return }
      setRemoveConfirm(null)
      onRefresh()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Miembros</span>
          <Badge variant="secondary" className="text-xs">{miembros.length}</Badge>
        </div>
        <div className="flex gap-2 flex-wrap">
          {sinGrupo.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
              <UserCheck className="h-3.5 w-3.5" />
              Asignar existente
            </Button>
          )}
          <Button size="sm" onClick={() => { setEditTarget(null); setMemberFormOpen(true) }}>
            <UserPlus className="h-3.5 w-3.5" />
            Añadir miembro
          </Button>
        </div>
      </div>

      {miembros.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 text-center">
          <div className="rounded-full bg-muted p-3">
            <Users className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm font-medium">Sin miembros</p>
            <p className="text-xs text-muted-foreground mt-0.5">Añade usuarios a este grupo para que puedan trabajar en él.</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-xs pl-4">Usuario</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Email</TableHead>
                <TableHead className="text-xs">Rol</TableHead>
                <TableHead className="text-xs hidden sm:table-cell">Estado</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {miembros.map(u => {
                const rolDef = getRolDef(u.rol)
                return (
                  <TableRow key={u.id} className="hover:bg-muted/30 border-border">
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold", getAvatarCls(u.rol))}>
                          {getInitials(u.nombre)}
                        </div>
                        <span className="text-sm font-medium truncate max-w-30">{u.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden sm:table-cell truncate max-w-40">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] px-2 flex items-center gap-1 w-fit", rolDef?.cls ?? "bg-muted text-muted-foreground")}>
                        {rolDef?.icon}
                        {rolDef?.label ?? u.rol}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {u.activo ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3.5 w-3.5" /> Inactivo
                        </span>
                      )}
                      {u.bloqueado && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 mt-0.5">
                          <Lock className="h-3 w-3" /> Bloqueado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pr-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => { setEditTarget(u); setMemberFormOpen(true) }}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar datos
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setRemoveConfirm(u)}
                            className="text-destructive focus:text-destructive"
                          >
                            <UserMinus className="mr-2 h-4 w-4" /> Remover del grupo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <MemberFormDialog
        open={memberFormOpen || !!editTarget}
        initial={editTarget ?? undefined}
        grupoNombre={grupoNombre}
        onSave={editTarget ? handleEditMember : handleCreateMember}
        onClose={() => { setMemberFormOpen(false); setEditTarget(null) }}
        loading={saving}
      />
      <AssignUserDialog
        open={assignOpen}
        sinGrupo={sinGrupo}
        grupoNombre={grupoNombre}
        onAssign={handleAssign}
        onClose={() => setAssignOpen(false)}
        loading={saving}
      />
      <ConfirmDialog
        open={!!removeConfirm}
        title="Remover del grupo"
        description={`¿Remover a "${removeConfirm?.nombre}" de este grupo? El usuario seguirá existiendo en el sistema sin grupo asignado.`}
        destructive
        confirmLabel="Remover"
        onConfirm={() => removeConfirm && handleRemove(removeConfirm)}
        onClose={() => setRemoveConfirm(null)}
        loading={saving}
      />
    </div>
  )
}
