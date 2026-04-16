"use client"

import { useState, useEffect } from "react"
import { useAuth, type User } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users, MoreHorizontal, Edit, Trash2, Eye,
  UserPlus, KeyRound, Info, CheckCircle2, XCircle,
  Lock, Unlock, Layers, UserCheck2, UserMinus,
} from "lucide-react"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { UserFormModal } from "./user-form-modal"
import { UserConfirmDialogs } from "./user-confirm-dialogs"
import { UserStatsCards } from "./user-stats-cards"
import { UserConnectionsPanel } from "./user-connections-panel"
import { getRoleIcon } from "./user-management-shared"

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

  // Quitar del workspace
  const [quitarDialogOpen, setQuitarDialogOpen]   = useState(false)
  const [userToQuitar, setUserToQuitar]           = useState<User | null>(null)
  const [quitting, setQuitting]                   = useState(false)
  const [asignaciones, setAsignaciones]           = useState<{ historias: number; tareas: number } | null>(null)
  const [loadingAsignaciones, setLoadingAsignaciones] = useState(false)

  const abrirQuitarDialog = (u: User) => {
    setUserToQuitar(u)
    setAsignaciones(null)
    setQuitarDialogOpen(true)
    setLoadingAsignaciones(true)
    fetch(`/api/users/${u.id}/asignaciones`)
      .then(r => r.ok ? r.json() : null)
      .then((d: { historias: number; tareas: number } | null) => { if (d) setAsignaciones(d) })
      .catch(() => {})
      .finally(() => setLoadingAsignaciones(false))
  }

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

  // Asignar a workspace
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

  // Modal state
  const [formOpen, setFormOpen]     = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)

  // Confirm-dialog state
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

  const renderUserRow = (u: User) => {
    const rolDef = getRoleDef(u.rol)
    return (
      <TableRow key={u.id} className="border-border hover:bg-secondary/50">
        <TableCell className="pl-4">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${getAvatarCls(u.rol)}`}>
              {u.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm leading-tight">
                {u.nombre}
                {u.id === currentUser?.id && (
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
              {isOwner && getNombreGrupo(u) && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: 10, fontWeight: 600,
                  color: "var(--primary)",
                  background: "color-mix(in oklch, var(--primary) 10%, transparent)",
                  padding: "1px 6px", borderRadius: 6,
                  border: "1px solid color-mix(in oklch, var(--primary) 25%, transparent)",
                }}>
                  <Layers size={9} />
                  {getNombreGrupo(u)}
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
              <DropdownMenuItem onClick={() => { setUserToEdit(u); setFormOpen(true) }}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
              {u.id !== currentUser?.id && (
                <DropdownMenuItem onClick={() => { setUserToReset(u); setResetDialogOpen(true) }}>
                  <KeyRound className="mr-2 h-4 w-4" /> Resetear contraseña
                </DropdownMenuItem>
              )}
              {u.bloqueado && u.id !== currentUser?.id && (
                <DropdownMenuItem onClick={() => { setUserToUnlock(u); setUnlockDialogOpen(true) }}>
                  <Unlock className="mr-2 h-4 w-4" /> Desbloquear cuenta
                </DropdownMenuItem>
              )}
              {(isOwner || isAdmin) && !!u.grupoId && u.id !== currentUser?.id && !isOwnerUser(u) && (
                <DropdownMenuItem
                  onClick={() => abrirQuitarDialog(u)}
                  className="text-chart-3 focus:text-chart-3"
                >
                  <UserMinus className="mr-2 h-4 w-4" /> Quitar del workspace
                </DropdownMenuItem>
              )}
              {canDeleteTarget(u) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { setUserToDelete(u); setDeleteDialogOpen(true) }}
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
              {workspaceUsers.map(u => renderUserRow(u))}
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

      <Dialog
        open={asignarDialogOpen}
        onOpenChange={open => { if (!open) { setAsignarDialogOpen(false); setUserToAsignar(null); setTargetGrupoId("") } }}
      >
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Asignar a Workspace</DialogTitle>
            <DialogDescription>
              {isOwner
                ? <>Selecciona el workspace al que quieres asignar a <strong>{userToAsignar?.nombre}</strong>.</>
                : <>¿Confirmas que quieres incorporar a <strong>{userToAsignar?.nombre}</strong> al workspace <strong>{grupoNombre}</strong>?</>
              }
            </DialogDescription>
          </DialogHeader>
          {isOwner && (
            <Select value={targetGrupoId} onValueChange={setTargetGrupoId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar workspace..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(gruposMap).map(([id, nombre]) => (
                  <SelectItem key={id} value={id}>{nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setAsignarDialogOpen(false); setUserToAsignar(null); setTargetGrupoId("") }}
            >
              Cancelar
            </Button>
            <Button
              disabled={asignando || (isOwner && !targetGrupoId)}
              onClick={handleAsignarWorkspace}
              className="bg-primary hover:bg-primary/90"
            >
              <UserCheck2 className="h-4 w-4 mr-2" />
              {asignando ? "Asignando..." : "Confirmar asignación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={quitarDialogOpen} onOpenChange={open => { if (!open) { setQuitarDialogOpen(false); setUserToQuitar(null) } }}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Quitar del Workspace</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">{userToQuitar?.nombre}</strong> quedará sin workspace asignado.
                  Su cuenta no se eliminará, pero <strong className="text-foreground">perderá el acceso al sistema de inmediato</strong>:
                  no podrá iniciar sesión ni ver datos hasta que se le asigne un nuevo workspace.
                </p>

                {loadingAsignaciones && (
                  <p className="text-xs text-muted-foreground">Verificando asignaciones...</p>
                )}
                {!loadingAsignaciones && asignaciones && (asignaciones.historias > 0 || asignaciones.tareas > 0) && (
                  <div className="rounded-md border border-chart-4/30 bg-chart-4/10 px-3 py-2 text-xs text-chart-4">
                    <p className="font-semibold mb-1">Asignaciones que quedarán sin responsable:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {asignaciones.historias > 0 && (
                        <li>{asignaciones.historias} Historia{asignaciones.historias !== 1 ? "s" : ""} de Usuario</li>
                      )}
                      {asignaciones.tareas > 0 && (
                        <li>{asignaciones.tareas} Tarea{asignaciones.tareas !== 1 ? "s" : ""}</li>
                      )}
                    </ul>
                    <p className="mt-1">Reasígnalas antes de continuar o hazlo después desde la lista de HUs.</p>
                  </div>
                )}
                {!loadingAsignaciones && asignaciones && asignaciones.historias === 0 && asignaciones.tareas === 0 && (
                  <p className="text-xs text-muted-foreground">Este usuario no tiene HUs ni tareas asignadas.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setQuitarDialogOpen(false); setUserToQuitar(null) }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={quitting}
              onClick={handleQuitarWorkspace}
              className="bg-chart-3 hover:bg-chart-3/90 text-white"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              {quitting ? "Quitando..." : "Quitar del workspace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
