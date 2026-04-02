"use client"

// ═══════════════════════════════════════════════════════════
//  OWNER PANEL
//  Gestión completa de grupos (workspaces) y sus miembros.
//  Layout: sidebar de grupos + panel de detalle con métricas
//  y tabla de miembros editable.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Users, BookOpen, ClipboardList, BarChart2,
  Pencil, Trash2, Power, PowerOff, RefreshCw, Layers,
  AlertCircle, CheckCircle2, UserPlus, UserMinus,
  Shield, Crown, FlaskConical, Eye, Star, MoreHorizontal,
  UserCheck, Lock,
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Badge }    from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input }    from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

// ── Tipos ──────────────────────────────────────────────────

interface Grupo {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
  createdAt: string
}

interface MetricasGrupo {
  totalHUs: number
  totalCasos: number
  totalTareas: number
  totalUsuarios: number
  husPorEstado:    { estado: string; total: number }[]
  casosPorEstado:  { estado: string; total: number }[]
  tareasPorEstado: { estado: string; total: number }[]
}

interface GrupoConMetricas {
  grupo: Grupo
  metricas: MetricasGrupo
}

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  grupoId: string | null
  activo: boolean
  debeCambiarPassword: boolean
  bloqueado?: boolean
}

const ROLES_MIEMBRO = [
  { id: "admin",   label: "Administrador",   icon: <Shield  className="h-3.5 w-3.5" />, cls: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  { id: "qa_lead", label: "Lead",             icon: <Crown   className="h-3.5 w-3.5" />, cls: "bg-purple-500/15 text-purple-500 border-purple-500/30" },
  { id: "qa",      label: "User",             icon: <FlaskConical className="h-3.5 w-3.5" />, cls: "bg-chart-1/15 text-chart-1 border-chart-1/30" },
  { id: "viewer",  label: "Visualizador",     icon: <Eye     className="h-3.5 w-3.5" />, cls: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
]

// ── Helpers ────────────────────────────────────────────────

function getRolDef(rolId: string) {
  return ROLES_MIEMBRO.find(r => r.id === rolId)
}

function getInitials(nombre: string) {
  return nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

function getAvatarCls(rolId: string) {
  switch (rolId) {
    case "admin":   return "bg-chart-4/20 text-chart-4"
    case "qa_lead": return "bg-purple-500/20 text-purple-500"
    case "qa":      return "bg-chart-1/20 text-chart-1"
    case "viewer":  return "bg-chart-2/20 text-chart-2"
    default:        return "bg-muted text-muted-foreground"
  }
}

// ── KpiTile ───────────────────────────────────────────────

function KpiTile({ icon, label, value, colorCls }: {
  icon: React.ReactNode; label: string; value: number; colorCls: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
      <span className={cn("shrink-0", colorCls)}>{icon}</span>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

// ── GrupoFormDialog ───────────────────────────────────────

function GrupoFormDialog({ open, initial, onSave, onClose, loading }: {
  open: boolean
  initial?: Grupo
  onSave: (d: { nombre: string; descripcion: string }) => void
  onClose: () => void
  loading: boolean
}) {
  const [nombre, setNombre]           = useState(initial?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "")

  useEffect(() => {
    setNombre(initial?.nombre ?? "")
    setDescripcion(initial?.descripcion ?? "")
  }, [initial, open])

  const valid = nombre.trim().length > 0

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
          <DialogDescription>
            {initial ? "Modifica los datos del workspace." : "Crea un workspace independiente para un equipo."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre <span className="text-destructive">*</span></label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Equipo Frontend" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Descripción</label>
            <Textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción opcional..." rows={3} className="resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => valid && onSave({ nombre: nombre.trim(), descripcion: descripcion.trim() })} disabled={!valid || loading}>
            {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── MemberFormDialog ──────────────────────────────────────

function MemberFormDialog({ open, initial, grupoNombre, onSave, onClose, loading }: {
  open: boolean
  initial?: Usuario
  grupoNombre: string
  onSave: (d: { nombre: string; email: string; rol: string }) => void
  onClose: () => void
  loading: boolean
}) {
  const [nombre, setNombre] = useState(initial?.nombre ?? "")
  const [email, setEmail]   = useState(initial?.email ?? "")
  const [rol, setRol]       = useState(initial?.rol ?? "qa")

  useEffect(() => {
    setNombre(initial?.nombre ?? "")
    setEmail(initial?.email ?? "")
    setRol(initial?.rol ?? "qa")
  }, [initial, open])

  const valid = nombre.trim().length > 0 && email.trim().includes("@")

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar miembro" : "Añadir miembro"}</DialogTitle>
          <DialogDescription>
            {initial ? `Edita los datos de ${initial.nombre}.` : `Nuevo usuario en "${grupoNombre}". Se creará con la contraseña genérica.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre completo <span className="text-destructive">*</span></label>
            <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan Pérez" autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email <span className="text-destructive">*</span></label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan@empresa.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rol</label>
            <Select value={rol} onValueChange={setRol}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES_MIEMBRO.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    <div className="flex items-center gap-2">{r.icon}{r.label}</div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => valid && onSave({ nombre: nombre.trim(), email: email.trim(), rol })} disabled={!valid || loading}>
            {loading ? "Guardando..." : initial ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── AssignUserDialog ──────────────────────────────────────

function AssignUserDialog({ open, sinGrupo, grupoNombre, onAssign, onClose, loading }: {
  open: boolean
  sinGrupo: Usuario[]
  grupoNombre: string
  onAssign: (userId: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [selected, setSelected] = useState<string>("")

  useEffect(() => { if (open) setSelected("") }, [open])

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Asignar usuario existente</DialogTitle>
          <DialogDescription>Selecciona un usuario sin grupo para asignarlo a "{grupoNombre}".</DialogDescription>
        </DialogHeader>
        {sinGrupo.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No hay usuarios sin grupo disponibles.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sinGrupo.map(u => (
              <button
                key={u.id}
                onClick={() => setSelected(u.id)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left border transition-colors",
                  selected === u.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                )}
              >
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold", getAvatarCls(u.rol))}>
                  {getInitials(u.nombre)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{u.nombre}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge variant="outline" className={cn("shrink-0 text-[10px]", getRolDef(u.rol)?.cls)}>
                  {getRolDef(u.rol)?.label ?? u.rol}
                </Badge>
              </button>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => selected && onAssign(selected)} disabled={!selected || loading || sinGrupo.length === 0}>
            {loading ? "Asignando..." : "Asignar al grupo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── ConfirmDialog ─────────────────────────────────────────

function ConfirmDialog({ open, title, description, destructive, confirmLabel, onConfirm, onClose, loading }: {
  open: boolean
  title: string
  description: string
  destructive?: boolean
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", destructive && "text-destructive")}>
            {destructive && <AlertCircle className="h-5 w-5" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
            {loading ? "Procesando..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── MembersTable ──────────────────────────────────────────

function MembersTable({ miembros, sinGrupo, grupoNombre, grupoId, onRefresh, saving, setSaving, setError }: {
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
      {/* Header miembros */}
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

      {/* Tabla */}
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

      {/* Modales */}
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

// ── GrupoDetail ───────────────────────────────────────────

function GrupoDetail({ item, usuarios, onEdit, onDelete, onToggle, onRefreshUsers, saving, setSaving, setError }: {
  item: GrupoConMetricas
  usuarios: Usuario[]
  onEdit: (g: Grupo) => void
  onDelete: (id: string) => void
  onToggle: (id: string, activo: boolean) => void
  onRefreshUsers: () => void
  saving: boolean
  setSaving: (v: boolean) => void
  setError: (e: string | null) => void
}) {
  const { grupo, metricas } = item
  const exitosas = metricas.husPorEstado.find(h => h.estado === "exitosa")?.total ?? 0
  const progreso = metricas.totalHUs > 0 ? Math.round((exitosas / metricas.totalHUs) * 100) : 0
  const miembros = usuarios.filter(u => u.grupoId === grupo.id)
  const sinGrupo = usuarios.filter(u => !u.grupoId && u.rol !== "owner")

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Encabezado del grupo */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            grupo.activo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}>
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base truncate">{grupo.nombre}</h3>
              <Badge className={cn(
                "shrink-0 text-[10px] px-1.5 py-0 flex items-center gap-0.5",
                grupo.activo
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15"
                  : "bg-muted text-muted-foreground",
              )}>
                {grupo.activo ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                {grupo.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            {grupo.descripcion && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{grupo.descripcion}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon-sm" title="Editar grupo" onClick={() => onEdit(grupo)} className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon-sm"
            title={grupo.activo ? "Desactivar grupo" : "Activar grupo"}
            onClick={() => onToggle(grupo.id, !grupo.activo)}
            className={grupo.activo ? "text-muted-foreground hover:text-amber-600" : "text-muted-foreground hover:text-emerald-600"}
          >
            {grupo.activo ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-sm" title="Eliminar grupo" onClick={() => onDelete(grupo.id)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <KpiTile icon={<BookOpen    className="h-4 w-4" />} label="Historias" value={metricas.totalHUs}      colorCls="text-primary" />
        <KpiTile icon={<ClipboardList className="h-4 w-4" />} label="Casos"  value={metricas.totalCasos}    colorCls="text-violet-500" />
        <KpiTile icon={<BarChart2   className="h-4 w-4" />} label="Tareas"   value={metricas.totalTareas}   colorCls="text-amber-500" />
        <KpiTile icon={<Users       className="h-4 w-4" />} label="Miembros" value={metricas.totalUsuarios} colorCls="text-sky-500" />
      </div>

      {/* Progreso HUs */}
      {metricas.totalHUs > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso de Historias</span>
            <span className="font-semibold text-foreground">{progreso}%</span>
          </div>
          <Progress value={progreso} className="h-1.5" />
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span className="text-primary font-medium">{exitosas} exitosas</span>
            <span>{metricas.totalHUs - exitosas} restantes</span>
          </div>
        </div>
      )}

      <Separator />

      {/* Miembros */}
      <MembersTable
        miembros={miembros}
        sinGrupo={sinGrupo}
        grupoNombre={grupo.nombre}
        grupoId={grupo.id}
        onRefresh={onRefreshUsers}
        saving={saving}
        setSaving={setSaving}
        setError={setError}
      />
    </div>
  )
}

// ── OwnerPanel ────────────────────────────────────────────

export function OwnerPanel() {
  const [items, setItems]           = useState<GrupoConMetricas[]>([])
  const [usuarios, setUsuarios]     = useState<Usuario[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [grupoSel, setGrupoSel]     = useState<string | null>(null)

  // Modales de grupo
  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState<Grupo | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Totales
  const gruposActivos = items.filter(i => i.grupo.activo).length
  const totales = items.reduce(
    (acc, { metricas: m }) => ({ hus: acc.hus + m.totalHUs, casos: acc.casos + m.totalCasos, usuarios: acc.usuarios + m.totalUsuarios }),
    { hus: 0, casos: 0, usuarios: 0 }
  )

  const itemSel = items.find(i => i.grupo.id === grupoSel)

  const fetchGrupos = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/grupos")
      if (!res.ok) throw new Error("Error al cargar grupos")
      const { grupos } = await res.json() as { grupos: Grupo[] }
      const conMetricas = await Promise.all(
        grupos.map(async g => {
          const mr = await fetch(`/api/grupos/${g.id}/metricas`)
          const { metricas } = await mr.json() as { metricas: MetricasGrupo }
          return { grupo: g, metricas }
        })
      )
      setItems(conMetricas)
      // Si no hay selección o el grupo ya no existe, seleccionar el primero
      setGrupoSel(prev => {
        if (prev && conMetricas.some(i => i.grupo.id === prev)) return prev
        return conMetricas[0]?.grupo.id ?? null
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally { setLoading(false) }
  }, [])

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) return
      const { users } = await res.json() as { users: Usuario[] }
      setUsuarios(users.filter(u => u.rol !== "owner"))
    } catch { /* silencioso */ }
  }, [])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchGrupos(), fetchUsuarios()])
  }, [fetchGrupos, fetchUsuarios])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreate = async (data: { nombre: string; descripcion: string }) => {
    setSaving(true)
    try {
      const res = await fetch("/api/grupos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al crear"); return }
      setFormOpen(false); await fetchAll()
    } finally { setSaving(false) }
  }

  const handleEdit = async (data: { nombre: string; descripcion: string }) => {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/grupos/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al actualizar"); return }
      setEditTarget(null); await fetchAll()
    } finally { setSaving(false) }
  }

  const handleToggle = async (id: string, activo: boolean) => {
    await fetch(`/api/grupos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo }) })
    await fetchAll()
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/grupos/${id}`, { method: "DELETE" })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? "Error al eliminar"); return }
      setDeleteConfirm(null)
      if (grupoSel === id) setGrupoSel(null)
      await fetchAll()
    } finally { setSaving(false) }
  }

  return (
    <div className="w-full space-y-5 py-2">

      {/* ── Encabezado ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">Panel de Grupos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspaces independientes con datos, configuración y miembros propios.
          </p>
        </div>
        <Button variant="outline" size="icon-sm" onClick={fetchAll} title="Refrescar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Resumen global ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Grupos activos",   value: gruposActivos,      cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total grupos",     value: items.length,       cls: "text-foreground" },
          { label: "Historias total",  value: totales.hus,        cls: "text-primary" },
          { label: "Miembros total",   value: totales.usuarios,   cls: "text-sky-500" },
        ].map(({ label, value, cls }) => (
          <Card key={label} className="border shadow-none">
            <CardContent className="p-4">
              <div className={cn("text-2xl font-extrabold", cls)}>{value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setError(null)} className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs">✕</Button>
        </div>
      )}

      {/* ── Cuerpo principal ── */}
      {loading ? (
        <div className="animate-pulse overflow-hidden rounded-xl border border-border flex flex-col md:flex-row min-h-100 md:min-h-125">
          <div className="md:w-52 md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/40 p-3 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar">
            {[1,2,3].map(i => <div key={i} className="h-12 md:h-14 w-32 md:w-auto shrink-0 rounded-lg bg-muted" />)}
          </div>
          <div className="flex-1 p-5 space-y-4">
            <div className="h-12 rounded-lg bg-muted w-1/2" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[1,2,3,4].map(i => <div key={i} className="h-14 rounded-lg bg-muted" />)}</div>
            <div className="h-px bg-muted" />
            <div className="h-40 rounded-lg bg-muted" />
          </div>
        </div>
      ) : items.length === 0 ? (
        /* Estado vacío */
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border py-24 text-center">
          <div className="rounded-2xl bg-muted p-4"><Layers className="h-10 w-10 text-muted-foreground/40" /></div>
          <div>
            <p className="font-semibold">No hay grupos creados</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">Crea el primer workspace para que los equipos puedan trabajar.</p>
          </div>
          <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Crear primer grupo</Button>
        </div>
      ) : (
        /* Layout principal: sidebar + detalle */
        <div className="overflow-hidden rounded-xl border border-border flex flex-col md:flex-row min-h-100 md:min-h-130">

          {/* ── Sidebar de grupos ── */}
          <div className="flex flex-col md:w-60 md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/20">
            <div className="border-b border-border p-2.5">
              <Button size="sm" className="w-full" onClick={() => setFormOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Nuevo grupo
              </Button>
            </div>
            {/* Mobile: fila horizontal scrollable · Desktop: columna vertical */}
            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:flex-1 p-2 gap-1 md:gap-0.5 no-scrollbar">
              {items.map(item => {
                const isSelected = grupoSel === item.grupo.id
                const nMiembros = usuarios.filter(u => u.grupoId === item.grupo.id).length
                return (
                  <button
                    key={item.grupo.id}
                    onClick={() => setGrupoSel(item.grupo.id)}
                    className={cn(
                      "shrink-0 md:w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 md:py-2.5 text-left transition-colors whitespace-nowrap md:whitespace-normal",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground",
                    )}
                  >
                    <span className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      item.grupo.activo
                        ? (isSelected ? "bg-emerald-300" : "bg-emerald-500")
                        : (isSelected ? "bg-white/40" : "bg-muted-foreground/40"),
                    )} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[13px]">{item.grupo.nombre}</p>
                      <p className={cn("text-[11px] hidden md:block", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {nMiembros} {nMiembros === 1 ? "miembro" : "miembros"}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Panel de detalle ── */}
          <div className="flex-1 overflow-auto bg-background">
            {!itemSel ? (
              <div className="flex h-full min-h-48 items-center justify-center text-muted-foreground text-sm">
                Selecciona un grupo para ver su detalle.
              </div>
            ) : (
              <GrupoDetail
                item={itemSel}
                usuarios={usuarios}
                onEdit={g => setEditTarget(g)}
                onDelete={id => setDeleteConfirm(id)}
                onToggle={handleToggle}
                onRefreshUsers={fetchAll}
                saving={saving}
                setSaving={setSaving}
                setError={setError}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Modales de grupo ── */}
      <GrupoFormDialog
        open={formOpen || !!editTarget}
        initial={editTarget ?? undefined}
        onSave={editTarget ? handleEdit : handleCreate}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        loading={saving}
      />
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Eliminar grupo"
        description="Esta acción es irreversible. Solo puedes eliminar un grupo sin usuarios ni historias."
        destructive
        confirmLabel="Eliminar grupo"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        loading={saving}
      />
    </div>
  )
}
