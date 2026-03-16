"use client"

import { useState } from "react"
import { useAuth, PASSWORD_GENERICA, type User } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  Shield,
  Eye,
  FlaskConical,
  UserPlus,
  KeyRound,
  Info,
  Crown,
  CheckCircle2,
  XCircle,
  BarChart2,
  UserCheck,
  Star,
  History,
} from "lucide-react"

// ── Helpers de formato para conexiones ───────────────────
function formatFechaConexion(d: Date): string {
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
  const { users, roles, user: currentUser, isOwner, addUser, updateUser, deleteUser, resetPassword } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToReset, setUserToReset] = useState<User | null>(null)

  // Form state
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [rol, setRol] = useState("viewer")
  const [equipoIds, setEquipoIds] = useState<string[]>([])

  const getRoleDef = (rolId: string) => roles.find(r => r.id === rolId)

  // Determina si un rol tiene permisos equivalentes a QA Lead (no admin, no owner)
  const esRolLider = (rolId: string) => {
    const def = getRoleDef(rolId)
    if (!def) return false
    return def.permisos.includes("canCreateHU") &&
           def.permisos.includes("canApproveCases") &&
           !def.permisos.includes("canManageUsers")
  }

  // Determina si un rol necesita equipo asignado: admin o lead, pero no owner
  const esRolConEquipo = (rolId: string) => {
    const def = getRoleDef(rolId)
    if (!def) return false
    if (def.permisos.includes("isSuperAdmin")) return false
    return def.permisos.includes("canManageUsers") ||
           (def.permisos.includes("canCreateHU") && def.permisos.includes("canApproveCases"))
  }

  const resetForm = () => {
    setNombre("")
    setEmail("")
    setRol("viewer")
    setEquipoIds([])
    setUserToEdit(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setFormOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setUserToEdit(user)
    setNombre(user.nombre)
    setEmail(user.email)
    setRol(user.rol)
    setEquipoIds(user.equipoIds ?? [])
    setFormOpen(true)
  }

  const toggleEquipoMember = (id: string) =>
    setEquipoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (userToEdit) {
      updateUser({ ...userToEdit, nombre, email, rol, equipoIds: esRolConEquipo(rol) ? equipoIds : [] })
    } else {
      addUser({ nombre, email, rol })
    }
    setFormOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const confirmDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const confirmResetPassword = (user: User) => {
    setUserToReset(user)
    setResetDialogOpen(true)
  }

  const handleResetPassword = () => {
    if (userToReset) {
      resetPassword(userToReset.id)
      setResetDialogOpen(false)
      setUserToReset(null)
    }
  }

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

  const activeCount   = users.filter(u => u.activo).length
  const inactiveCount = users.length - activeCount

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

  // Determina si el usuario actual puede eliminar a un target
  const canDeleteTarget = (target: User) => {
    if (target.id === currentUser?.id) return false
    const targetRolDef = getRoleDef(target.rol)
    const targetIsOwner = targetRolDef?.permisos.includes("isSuperAdmin") ?? false
    if (targetIsOwner && !isOwner) return false
    return true
  }

  return (
    <div className="space-y-6">

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
                  <span style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: "var(--foreground)" }}>{users.length}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</span>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 3, alignItems: "center" }}>
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
              <span style={{
                fontSize: 10, fontWeight: 700, color: "var(--chart-2)", flexShrink: 0,
                background: "color-mix(in oklch, var(--chart-2) 10%, transparent)",
                padding: "1px 6px", borderRadius: 999,
              }}>{users.length > 0 ? Math.round((activeCount / users.length) * 100) : 0}%</span>
            </div>
            <div style={{ marginTop: 8, height: 2, background: "var(--border)", borderRadius: 999 }}>
              <div style={{
                height: "100%", borderRadius: 999, transition: "width 0.4s",
                width: `${users.length > 0 ? (activeCount / users.length) * 100 : 0}%`,
                background: "var(--chart-2)",
              }} />
            </div>
          </CardHeader>
        </Card>

        {/* Por rol */}
        {roles.map(r => {
          const count  = users.filter(u => u.rol === r.id).length
          const pct    = users.length > 0 ? (count / users.length) * 100 : 0
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
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: accent, flexShrink: 0,
                    background: `color-mix(in oklch, ${accent} 10%, transparent)`,
                    padding: "1px 6px", borderRadius: 999,
                  }}>{Math.round(pct)}%</span>
                </div>
                <div style={{ marginTop: 8, height: 2, background: "var(--border)", borderRadius: 999 }}>
                  <div style={{
                    height: "100%", borderRadius: 999, transition: "width 0.4s",
                    width: `${pct}%`, background: accent,
                  }} />
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
            <Table className="min-w-105">
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
                {users.map(u => {
                  const hist = u.historialConexiones ?? []
                  const last = hist[hist.length - 1]
                  const ultimoAcceso = last?.entrada ? formatFechaConexion(last.entrada) : "—"
                  const duracion = last
                    ? last.salida
                      ? formatDuracion(last.salida.getTime() - last.entrada.getTime())
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
                      <TableCell style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                        {ultimoAcceso}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell" style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                        {duracion}
                      </TableCell>
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
      <div style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 14px",
        borderRadius:8, background:"color-mix(in oklch, var(--primary) 8%, transparent)",
        border:"1px solid color-mix(in oklch, var(--primary) 22%, transparent)" }}>
        <Info size={14} style={{ color:"var(--primary)", flexShrink:0 }} />
        <p style={{ fontSize:12, color:"var(--muted-foreground)" }}>
          Los nuevos usuarios se crean con la contraseña genérica{" "}
          <strong style={{ color:"var(--foreground)" }}>{PASSWORD_GENERICA}</strong>.
          Deben cambiarla en su primer inicio de sesión.
        </p>
      </div>

      {/* Header con botón */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Gestión de Usuarios</h2>
          <span className="text-sm text-muted-foreground">({users.length})</span>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Tabla de usuarios */}
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
              {users.map(u => {
                const rolDef = getRoleDef(u.rol)
                return (
                  <TableRow key={u.id} className="border-border hover:bg-secondary/50">
                    {/* Nombre + avatar */}
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

                    {/* Email (columna separada, oculta en mobile) */}
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                      {u.email}
                    </TableCell>

                    {/* Rol + descripción + equipo */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                          <Badge variant="outline" className={`${rolDef?.cls ?? "bg-muted text-muted-foreground border-border"} flex items-center gap-1 w-fit text-[11px] px-2 py-0.5`}>
                            {getRoleIcon(u.rol)}
                            {rolDef?.label ?? u.rol}
                          </Badge>
                          {esRolConEquipo(u.rol) && (
                            <span style={{
                              display:"inline-flex", alignItems:"center", gap:3,
                              fontSize:10, fontWeight:600,
                              color: (u.equipoIds?.length ?? 0) > 0 ? "var(--primary)" : "var(--muted-foreground)",
                              background: (u.equipoIds?.length ?? 0) > 0
                                ? "color-mix(in oklch,var(--primary) 10%,transparent)"
                                : "var(--secondary)",
                              padding:"1px 6px", borderRadius:6,
                              border:`1px solid ${(u.equipoIds?.length ?? 0) > 0 ? "color-mix(in oklch,var(--primary) 25%,transparent)" : "var(--border)"}`,
                            }}>
                              <UserCheck size={9}/>
                              {(u.equipoIds?.length ?? 0) > 0
                                ? `${u.equipoIds!.length} miembro${u.equipoIds!.length !== 1 ? "s" : ""}`
                                : "Sin equipo"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2 hidden sm:block" title={rolDef?.description ?? ""}>
                          {rolDef?.description ?? ""}
                        </p>
                      </div>
                    </TableCell>

                    {/* Estado activo/inactivo */}
                    <TableCell className="hidden sm:table-cell">
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
                    </TableCell>

                    {/* Contraseña */}
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

                    {/* Acciones */}
                    <TableCell className="pr-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleOpenEdit(u)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {u.id !== currentUser?.id && (
                            <DropdownMenuItem onClick={() => confirmResetPassword(u)}>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Resetear contraseña
                            </DropdownMenuItem>
                          )}
                          {canDeleteTarget(u) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => confirmDelete(u)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal crear/editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {userToEdit ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {userToEdit
                ? "Modifica los datos del usuario"
                : `Se creará con la contraseña genérica: ${PASSWORD_GENERICA}`
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel>Nombre completo</FieldLabel>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Pérez"
                  className="bg-secondary border-border"
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@empresa.com"
                  className="bg-secondary border-border"
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Rol</FieldLabel>
                <Select value={rol} onValueChange={setRol}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      .filter(r => isOwner || (!r.permisos.includes("canManageUsers") && !r.permisos.includes("isSuperAdmin")))
                      .map(r => (
                        <SelectItem key={r.id} value={r.id}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(r.id)}
                            {r.label}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {getRoleDef(rol)?.description ?? ""}
                </p>
                {/* Nota de visibilidad en Carga Ocupacional */}
                {(() => {
                  const def = getRoleDef(rol)
                  if (!def) return null
                  const isOwnerRole  = def.permisos.includes("isSuperAdmin")
                  const isAdminRole  = def.permisos.includes("canManageUsers") && !isOwnerRole
                  const isLeadRole   = esRolLider(rol)
                  const isQARole     = def.permisos.includes("verSoloPropios")
                  const msg = isOwnerRole
                    ? "Ve la carga de todos los usuarios"
                    : isAdminRole
                    ? "Ve su propia carga y la de su equipo asignado (o todos si sin equipo)"
                    : isLeadRole
                    ? "Ve su propia carga y la de su equipo asignado"
                    : isQARole
                    ? "Ve únicamente su propia carga"
                    : "Ve la carga de todos los usuarios (solo lectura)"
                  return (
                    <div style={{
                      display: "flex", alignItems: "center", gap: 6, marginTop: 6,
                      padding: "5px 8px", borderRadius: 6,
                      background: "color-mix(in oklch, var(--primary) 6%, transparent)",
                      border: "1px solid color-mix(in oklch, var(--primary) 16%, transparent)",
                    }}>
                      <BarChart2 size={11} style={{ color: "var(--primary)", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                        <strong style={{ color: "var(--foreground)" }}>Carga ocupacional:</strong> {msg}
                      </span>
                    </div>
                  )
                })()}
              </Field>

              {/* Selector de equipo — para roles admin y lead al editar */}
              {userToEdit && esRolConEquipo(rol) && (
                <Field>
                  <FieldLabel>
                    <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <UserCheck size={13} style={{ color:"var(--primary)" }}/>
                      Miembros del equipo
                      {equipoIds.length > 0 && (
                        <span style={{
                          fontSize:10, fontWeight:700, background:"color-mix(in oklch,var(--primary) 14%,transparent)",
                          color:"var(--primary)", borderRadius:8, padding:"1px 6px",
                        }}>
                          {equipoIds.length}
                        </span>
                      )}
                    </span>
                  </FieldLabel>
                  <div style={{
                    display:"flex", flexDirection:"column", gap:2,
                    maxHeight:180, overflowY:"auto", padding:"6px 8px",
                    borderRadius:8, border:"1px solid var(--border)", background:"var(--secondary)",
                  }}>
                    {users.filter(u => u.activo && u.id !== userToEdit.id).length === 0 ? (
                      <p style={{ fontSize:12, color:"var(--muted-foreground)", textAlign:"center", padding:8 }}>
                        No hay otros usuarios activos
                      </p>
                    ) : users.filter(u => u.activo && u.id !== userToEdit.id).map(u => (
                      <label key={u.id} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", padding:"5px 6px", borderRadius:6 }} className="hover:bg-card">
                        <input
                          type="checkbox"
                          checked={equipoIds.includes(u.id)}
                          onChange={() => toggleEquipoMember(u.id)}
                          style={{ width:14, height:14, accentColor:"var(--primary)", cursor:"pointer", flexShrink:0 }}
                        />
                        <span style={{ fontSize:12, color:"var(--foreground)", flex:1 }}>{u.nombre}</span>
                        <span style={{ fontSize:10, color:"var(--muted-foreground)" }}>
                          {getRoleDef(u.rol)?.label ?? u.rol}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:4 }}>
                    Este usuario solo verá HUs y métricas de los usuarios seleccionados.
                  </p>
                </Field>
              )}
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {userToEdit ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo confirmación eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar a <strong>{userToDelete?.nombre}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo confirmación reset contraseña */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Resetear Contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              La contraseña de <strong>{userToReset?.nombre}</strong> será cambiada a la
              genérica (<strong>{PASSWORD_GENERICA}</strong>). Deberá cambiarla en su próximo inicio de sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetPassword}
              className="bg-primary hover:bg-primary/90"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              Resetear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
