"use client"

import { useState, useEffect } from "react"
import { useAuth, type User } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Users, MoreHorizontal, Edit, Trash2, Shield, Eye, FlaskConical,
  UserPlus, KeyRound, Info, Crown, CheckCircle2, XCircle,
  Star, History, Lock, Unlock, Layers, UserCheck2, UserMinus,
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

// ── Helpers de formato para conexiones ────────────────────────
function formatFechaConexion(raw: Date | string): string {
  const d   = new Date(raw)
  const hoy  = new Date()
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  const hora = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
  if (d.toDateString() === hoy.toDateString())  return `Hoy ${hora}`
  if (d.toDateString() === ayer.toDateString()) return `Ayer ${hora}`
  return d.toLocaleDateString("es", { day: "2-digit", month: "2-digit" }) + " " + hora
}

function formatDuracion(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 1) return "< 1 min"
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function UserManagement() {
  const {
    users, roles, user: currentUser, isOwner, isAdmin,
    resetPassword, desbloquearUsuario, refreshUsers,
  } = useAuth()

  // Nombre del workspace actual (solo para no-owners con grupoId)
  const [grupoNombre, setGrupoNombre] = useState<string | null>(null)
  useEffect(() => {
    if (isOwner || !currentUser?.grupoId) return
    fetch(`/api/grupos/${currentUser.grupoId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.grupo?.nombre) setGrupoNombre(d.grupo.nombre) })
      .catch(() => {})
  }, [isOwner, currentUser?.grupoId])

  // Cargar usuarios frescos desde la API al montar el componente
  useEffect(() => { refreshUsers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mapa grupoId → nombre (solo para owner, que ve todos los grupos)
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

  // Helper: nombre del workspace de un usuario
  const getNombreGrupo = (u: User): string | null => {
    if (!u.grupoId) return null
    if (isOwner) return gruposMap[u.grupoId] ?? u.grupoId
    return grupoNombre
  }

  // ── Separación workspace / sin-workspace ─────────────────
  // La API ya devuelve: para admin → workspace propio + sin-workspace; para owner → todos
  const isOwnerUser = (u: User) => roles.find(r => r.id === u.rol)?.permisos.includes("isSuperAdmin") ?? false

  // workspaceUsers: usuarios CON workspace asignado
  // Owner: se incluye a sí mismo (isOwnerUser) + todos los que tienen grupoId
  // Admin: solo los de su workspace (API ya filtra)
  const workspaceUsers: User[] = isOwner
    ? users.filter(u => isOwnerUser(u) || !!u.grupoId)
    : users.filter(u => !isOwnerUser(u) && !!u.grupoId)

  // sinWorkspaceUsers: usuarios sin workspace, visibles para Owner y Admin
  // isAdmin = canManageUsers, que incluye tanto owner como admin
  const sinWorkspaceUsers: User[] = isAdmin
    ? users.filter(u => !isOwnerUser(u) && !u.grupoId)
    : []

  // ── Quitar usuario del workspace (solo Owner) ─────────────
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

  // ── Asignar usuario sin workspace ────────────────────────
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

  const getRoleIcon = (rolId: string) => {
    switch (rolId) {
      case "owner":   return <Star className="h-3.5 w-3.5" />
      case "admin":   return <Shield className="h-3.5 w-3.5" />
      case "qa_lead": return <Crown className="h-3.5 w-3.5" />
      case "qa":      return <FlaskConical className="h-3.5 w-3.5" />
      case "viewer":  return <Eye className="h-3.5 w-3.5" />
      default:        return <Users className="h-3.5 w-3.5" />
    }
  }

  const getAvatarCls = (rolId: string) => {
    const cls = getRoleDef(rolId)?.cls ?? "bg-muted text-muted-foreground"
    return cls.split(" ").filter(c => c.startsWith("bg-") || c.startsWith("text-")).join(" ")
  }

  const getRoleAccentColor = (rolId: string) => {
    switch (rolId) {
      case "owner":   return "#eab308"
      case "admin":   return "var(--chart-4)"
      case "qa_lead": return "rgb(168 85 247)"
      case "qa":      return "var(--chart-1)"
      case "viewer":  return "var(--chart-2)"
      default:        return "var(--primary)"
    }
  }

  const canDeleteTarget = (target: User) => {
    if (target.id === currentUser?.id) return false
    const targetIsOwner = getRoleDef(target.rol)?.permisos.includes("isSuperAdmin") ?? false
    if (targetIsOwner && !isOwner) return false
    // Admin cannot delete sin-workspace users
    if (!isOwner && !target.grupoId) return false
    return true
  }

  const activeCount   = workspaceUsers.filter(u => u.activo).length
  const inactiveCount = workspaceUsers.length - activeCount

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

  // ── Renderizado de fila de usuario ───────────────────────
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
              {/* Badge de workspace (solo owner ve todos los grupos) */}
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
              {/* Owner y Admin pueden quitar usuarios de su workspace */}
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

      {/* Banner de workspace — visible para no-owners */}
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

      {/* Estadísticas */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {/* Total */}
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

        {/* Por rol (owner oculto para no-owners) */}
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

      {/* Panel de conexiones — solo visible para Owner */}
      {isOwner && (
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
                  const rolDef = getRoleDef(u.rol)
                  return (
                    <TableRow key={u.id} className="border-border hover:bg-secondary/50">
                      <TableCell className="pl-4">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 font-semibold text-xs ${getAvatarCls(u.rol)}`}>
                            {u.nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                            {u.nombre}
                            {u.id === currentUser?.id && (
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
      )}

      {/* Info contraseña genérica */}
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

      {/* Header con botón */}
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

      {/* Tabla principal de usuarios del workspace */}
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

      {/* ── Sección: Usuarios sin workspace (solo visible para Admin) ── */}
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

      {/* Dialog — Asignar a workspace */}
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

      {/* Dialog — Quitar del workspace */}
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

                {/* Resumen de asignaciones activas */}
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

      {/* Modales */}
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
