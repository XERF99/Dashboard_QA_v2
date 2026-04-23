"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth, type User } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Users, UserPlus, Info, CheckCircle2, Layers, UserCheck2,
} from "lucide-react"
import { UserFormModal }         from "./user-form-modal"
import { UserConfirmDialogs }    from "./user-confirm-dialogs"
import { UserStatsCards }        from "./user-stats-cards"
import { UserConnectionsPanel }  from "./user-connections-panel"
import { UserRow }               from "./user-row"
import { UserWorkspaceDialogs }  from "./user-workspace-dialogs"
import { getRoleIcon }           from "./user-management-shared"

export function UserManagement() {
  const {
    users, roles, user: currentUser, isOwner, isAdmin,
    resetPassword, desbloquearUsuario, refreshUsers,
  } = useAuth()

  const [grupoNombre, setGrupoNombre] = useState<string | null>(null)
  useEffect(() => {
    if (isOwner || !currentUser?.grupoId) return
    fetch(`/api/grupos/${currentUser.grupoId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.grupo?.nombre) setGrupoNombre(d.grupo.nombre) })
      .catch(() => {})
  }, [isOwner, currentUser?.grupoId])

  useEffect(() => { refreshUsers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [gruposMap, setGruposMap] = useState<Record<string, string>>({})
  useEffect(() => {
    if (!isOwner) return
    fetch("/api/grupos")
      .then(r => r.ok ? r.json() : null)
      .then((d: { grupos?: { id: string; nombre: string }[] } | null) => {
        if (!d?.grupos) return
        const map: Record<string, string> = {}
        d.grupos.forEach(g => { map[g.id] = g.nombre })
        setGruposMap(map)
      })
      .catch(() => {})
  }, [isOwner])

  const getNombreGrupo = (u: User): string | null => {
    if (!u.grupoId) return null
    if (isOwner) return gruposMap[u.grupoId] ?? u.grupoId
    return grupoNombre
  }

  const isOwnerUser = (u: User) => roles.find(r => r.id === u.rol)?.permisos.includes("isSuperAdmin") ?? false

  const workspaceUsers: User[] = isOwner
    ? users.filter(u => isOwnerUser(u) || !!u.grupoId)
    : users.filter(u => !isOwnerUser(u) && !!u.grupoId)

  const sinWorkspaceUsers: User[] = isAdmin
    ? users.filter(u => !isOwnerUser(u) && !u.grupoId)
    : []

  // ── Quitar del workspace ──
  const [quitarDialogOpen, setQuitarDialogOpen]   = useState(false)
  const [userToQuitar, setUserToQuitar]           = useState<User | null>(null)
  const [quitting, setQuitting]                   = useState(false)
  const [asignaciones, setAsignaciones]           = useState<{ historias: number; tareas: number } | null>(null)
  const [loadingAsignaciones, setLoadingAsignaciones] = useState(false)

  const abrirQuitarDialog = useCallback((u: User) => {
    setUserToQuitar(u)
    setAsignaciones(null)
    setQuitarDialogOpen(true)
    setLoadingAsignaciones(true)
    fetch(`/api/users/${u.id}/asignaciones`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { historias: number; tareas: number } | null) => { if (d) setAsignaciones(d) })
      .catch(() => {})
      .finally(() => setLoadingAsignaciones(false))
  }, [])

  const handleQuitarWorkspace = async () => {
    if (!userToQuitar) return
    setQuitting(true)
    try {
      const res = await fetch(`/api/users/${userToQuitar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userToQuitar.id, grupoId: null }),
      })
      if (res.ok) await refreshUsers()
    } finally {
      setQuitting(false)
      setQuitarDialogOpen(false)
      setUserToQuitar(null)
    }
  }

  // ── Asignar a workspace ──
  const [asignarDialogOpen, setAsignarDialogOpen] = useState(false)
  const [userToAsignar, setUserToAsignar]         = useState<User | null>(null)
  const [targetGrupoId, setTargetGrupoId]         = useState<string>("")
  const [asignando, setAsignando]                 = useState(false)

  const handleAsignarWorkspace = async () => {
    const grupoIdFinal = isOwner ? targetGrupoId : (currentUser?.grupoId ?? "")
    if (!userToAsignar || !grupoIdFinal) return
    setAsignando(true)
    try {
      const res = await fetch(`/api/users/${userToAsignar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userToAsignar.id, grupoId: grupoIdFinal }),
      })
      if (res.ok) await refreshUsers()
    } finally {
      setAsignando(false)
      setAsignarDialogOpen(false)
      setUserToAsignar(null)
      setTargetGrupoId("")
    }
  }

  // ── Modal state ──
  const [formOpen, setFormOpen]     = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)

  // ── Confirm-dialog state ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete]         = useState<User | null>(null)
  const [resetDialogOpen, setResetDialogOpen]   = useState(false)
  const [userToReset, setUserToReset]           = useState<User | null>(null)
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false)
  const [userToUnlock, setUserToUnlock]         = useState<User | null>(null)

  const getRoleDef = (rolId: string) => roles.find(r => r.id === rolId)

  const getAvatarCls = (rolId: string) => {
    const cls = getRoleDef(rolId)?.cls ?? "bg-muted text-muted-foreground"
    return cls.split(" ").filter(c => c.startsWith("bg-") || c.startsWith("text-")).join(" ")
  }

  const canDeleteTarget = (target: User) => {
    if (target.id === currentUser?.id) return false
    const targetIsOwner = getRoleDef(target.rol)?.permisos.includes("isSuperAdmin") ?? false
    if (targetIsOwner && !isOwner) return false
    if (!isOwner && !target.grupoId) return false
    return true
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    const res = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" })
    setDeleteDialogOpen(false)
    setUserToDelete(null)
    if (res.ok) await refreshUsers()
  }
  const handleResetPassword = () => {
    if (userToReset) { resetPassword(userToReset.id); setResetDialogOpen(false); setUserToReset(null) }
  }
  const handleUnlock = () => {
    if (userToUnlock) { desbloquearUsuario(userToUnlock.id); setUnlockDialogOpen(false); setUserToUnlock(null) }
  }

  // Handlers estables para React.memo en UserRow.
  const openEdit   = useCallback((u: User) => { setUserToEdit(u); setFormOpen(true) }, [])
  const openReset  = useCallback((u: User) => { setUserToReset(u); setResetDialogOpen(true) }, [])
  const openUnlock = useCallback((u: User) => { setUserToUnlock(u); setUnlockDialogOpen(true) }, [])
  const openDelete = useCallback((u: User) => { setUserToDelete(u); setDeleteDialogOpen(true) }, [])

  return (
    <div className="space-y-6">

      {!isOwner && grupoNombre && (
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-sm">
          <Layers className="h-4 w-4 shrink-0 text-primary" />
          <span className="text-muted-foreground">Workspace actual:</span>
          <span className="font-semibold text-foreground">{grupoNombre}</span>
          <Badge variant="outline" className="ml-auto text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
            Activo
          </Badge>
        </div>
      )}

      <UserStatsCards workspaceUsers={workspaceUsers} roles={roles} isOwner={isOwner} />

      {isOwner && (
        <UserConnectionsPanel
          workspaceUsers={workspaceUsers}
          currentUserId={currentUser?.id}
          getRoleDef={getRoleDef}
          getAvatarCls={getAvatarCls}
        />
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px",
        borderRadius: 8, background: "color-mix(in oklch, var(--primary) 8%, transparent)",
        border: "1px solid color-mix(in oklch, var(--primary) 22%, transparent)" }}>
        <Info size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
          Los nuevos usuarios se crean con la contraseña genérica{" "}
          <strong style={{ color: "var(--foreground)" }}>Qatesting1</strong>.
          Deben cambiarla en su primer inicio de sesión.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="h-5 w-5 text-muted-foreground shrink-0" />
          <h2 className="text-lg font-semibold text-foreground">Gestión de Usuarios</h2>
          <span className="text-sm text-muted-foreground shrink-0">({workspaceUsers.length})</span>
        </div>
        <Button onClick={() => { setUserToEdit(null); setFormOpen(true) }} className="bg-primary hover:bg-primary/90 shrink-0">
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-80">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground pl-4">Usuario</TableHead>
                <TableHead className="text-muted-foreground hidden md:table-cell">Email</TableHead>
                <TableHead className="text-muted-foreground">Rol</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell">Estado</TableHead>
                <TableHead className="text-muted-foreground hidden sm:table-cell">Contraseña</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workspaceUsers.map(u => (
                <UserRow
                  key={u.id}
                  u={u}
                  currentUserId={currentUser?.id}
                  isOwner={isOwner}
                  rolDef={getRoleDef(u.rol)}
                  avatarCls={getAvatarCls(u.rol)}
                  grupoNombre={getNombreGrupo(u)}
                  canDelete={canDeleteTarget(u)}
                  canQuitWorkspace={(isOwner || isAdmin) && !!u.grupoId && u.id !== currentUser?.id && !isOwnerUser(u)}
                  onEdit={openEdit}
                  onReset={openReset}
                  onUnlock={openUnlock}
                  onQuitar={abrirQuitarDialog}
                  onDelete={openDelete}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {sinWorkspaceUsers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck2 className="h-5 w-5 text-muted-foreground shrink-0" />
            <h2 className="text-lg font-semibold text-foreground">Usuarios Disponibles</h2>
            <span className="text-sm text-muted-foreground shrink-0">({sinWorkspaceUsers.length})</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: -4 }}>
            Usuarios creados por el Owner sin workspace asignado. Puedes incorporarlos a tu workspace.
          </p>
          <Card className="bg-card border-border">
            <CardContent className="p-0 overflow-x-auto">
              <Table className="min-w-80">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground pl-4">Usuario</TableHead>
                    <TableHead className="text-muted-foreground hidden md:table-cell">Email</TableHead>
                    <TableHead className="text-muted-foreground">Rol</TableHead>
                    <TableHead className="w-40"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sinWorkspaceUsers.map(u => {
                    const rolDef = getRoleDef(u.rol)
                    return (
                      <TableRow key={u.id} className="border-border hover:bg-secondary/50">
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${getAvatarCls(u.rol)}`}>
                              {u.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm">{u.nombre}</p>
                              <p className="text-[11px] text-muted-foreground truncate md:hidden">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${rolDef?.cls ?? "bg-muted text-muted-foreground border-border"} flex items-center gap-1 w-fit text-[11px] px-2 py-0.5`}>
                            {getRoleIcon(u.rol)}
                            {rolDef?.label ?? u.rol}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setUserToAsignar(u); setTargetGrupoId(""); setAsignarDialogOpen(true) }}
                            className="text-xs"
                          >
                            {isOwner ? "Asignar a workspace..." : "Asignar a mi workspace"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <UserWorkspaceDialogs
        asignarDialogOpen={asignarDialogOpen}
        userToAsignar={userToAsignar}
        targetGrupoId={targetGrupoId}
        onTargetGrupoId={setTargetGrupoId}
        asignando={asignando}
        grupoNombre={grupoNombre}
        gruposMap={gruposMap}
        isOwner={isOwner}
        onConfirmAsignar={handleAsignarWorkspace}
        onCancelAsignar={() => { setAsignarDialogOpen(false); setUserToAsignar(null); setTargetGrupoId("") }}
        quitarDialogOpen={quitarDialogOpen}
        userToQuitar={userToQuitar}
        quitting={quitting}
        loadingAsignaciones={loadingAsignaciones}
        asignaciones={asignaciones}
        onConfirmQuitar={handleQuitarWorkspace}
        onCancelQuitar={() => { setQuitarDialogOpen(false); setUserToQuitar(null) }}
      />

      <UserFormModal
        open={formOpen}
        userToEdit={userToEdit}
        onClose={() => setFormOpen(false)}
      />
      <UserConfirmDialogs
        deleteDialogOpen={deleteDialogOpen}
        userToDelete={userToDelete}
        onConfirmDelete={handleDelete}
        onCancelDelete={() => { setDeleteDialogOpen(false); setUserToDelete(null) }}
        resetDialogOpen={resetDialogOpen}
        userToReset={userToReset}
        onConfirmReset={handleResetPassword}
        onCancelReset={() => { setResetDialogOpen(false); setUserToReset(null) }}
        unlockDialogOpen={unlockDialogOpen}
        userToUnlock={userToUnlock}
        onConfirmUnlock={handleUnlock}
        onCancelUnlock={() => { setUnlockDialogOpen(false); setUserToUnlock(null) }}
      />
    </div>
  )
}
