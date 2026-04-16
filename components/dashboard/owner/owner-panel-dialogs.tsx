"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Grupo, type Usuario, ROLES_MIEMBRO, getRolDef, getInitials, getAvatarCls } from "./owner-panel-shared"

export function GrupoFormDialog({ open, initial, onSave, onClose, loading }: {
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

export function MemberFormDialog({ open, initial, grupoNombre, onSave, onClose, loading }: {
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

export function AssignUserDialog({ open, sinGrupo, grupoNombre, onAssign, onClose, loading }: {
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
          <DialogDescription>Selecciona un usuario sin grupo para asignarlo a &quot;{grupoNombre}&quot;.</DialogDescription>
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

export function ConfirmDialog({ open, title, description, destructive, confirmLabel, onConfirm, onClose, loading }: {
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
