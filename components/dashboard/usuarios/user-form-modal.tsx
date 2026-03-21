"use client"

import { useState, useEffect } from "react"
import { useAuth, PASSWORD_GENERICA, type User } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  Users, Shield, Eye, FlaskConical, Crown, Star, BarChart2, UserCheck,
} from "lucide-react"

interface UserFormModalProps {
  open: boolean
  userToEdit: User | null
  onClose: () => void
}

function getRoleIcon(rolId: string) {
  switch (rolId) {
    case "owner":   return <Star className="h-3.5 w-3.5" />
    case "admin":   return <Shield className="h-3.5 w-3.5" />
    case "qa_lead": return <Crown className="h-3.5 w-3.5" />
    case "qa":      return <FlaskConical className="h-3.5 w-3.5" />
    case "viewer":  return <Eye className="h-3.5 w-3.5" />
    default:        return <Users className="h-3.5 w-3.5" />
  }
}

export function UserFormModal({ open, userToEdit, onClose }: UserFormModalProps) {
  const { users, roles, isOwner, addUser, updateUser } = useAuth()
  const [nombre, setNombre] = useState("")
  const [email, setEmail]   = useState("")
  const [rol, setRol]       = useState("viewer")
  const [equipoIds, setEquipoIds] = useState<string[]>([])

  const getRoleDef = (rolId: string) => roles.find(r => r.id === rolId)

  const esRolLider = (rolId: string) => {
    const def = getRoleDef(rolId)
    if (!def) return false
    return def.permisos.includes("canCreateHU") &&
           def.permisos.includes("canApproveCases") &&
           !def.permisos.includes("canManageUsers")
  }

  const esRolConEquipo = (rolId: string) => {
    const def = getRoleDef(rolId)
    if (!def) return false
    if (def.permisos.includes("isSuperAdmin")) return false
    return def.permisos.includes("canManageUsers") ||
           (def.permisos.includes("canCreateHU") && def.permisos.includes("canApproveCases"))
  }

  const ownerYaExiste = users.some(u =>
    roles.find(r => r.id === u.rol)?.permisos.includes("isSuperAdmin") && u.id !== userToEdit?.id
  )

  // Sync form state when the target user or open state changes
  useEffect(() => {
    if (userToEdit) {
      setNombre(userToEdit.nombre)
      setEmail(userToEdit.email)
      setRol(userToEdit.rol)
      setEquipoIds(userToEdit.equipoIds ?? [])
    } else {
      setNombre("")
      setEmail("")
      setRol("viewer")
      setEquipoIds([])
    }
  }, [userToEdit, open])

  const toggleEquipoMember = (id: string) =>
    setEquipoIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault()
    if (userToEdit) {
      updateUser({ ...userToEdit, nombre, email, rol, equipoIds: esRolConEquipo(rol) ? equipoIds : [] })
    } else {
      addUser({ nombre, email, rol })
    }
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {userToEdit ? "Editar Usuario" : "Nuevo Usuario"}
          </DialogTitle>
          <DialogDescription>
            {userToEdit
              ? "Modifica los datos del usuario"
              : `Se creará con la contraseña genérica: ${PASSWORD_GENERICA}`}
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
                    .filter(r => {
                      if (!isOwner && (r.permisos.includes("canManageUsers") || r.permisos.includes("isSuperAdmin"))) return false
                      if (r.permisos.includes("isSuperAdmin") && ownerYaExiste) return false
                      return true
                    })
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
              {(() => {
                const def = getRoleDef(rol)
                if (!def) return null
                const isOwnerRole = def.permisos.includes("isSuperAdmin")
                const isAdminRole = def.permisos.includes("canManageUsers") && !isOwnerRole
                const isLeadRole  = esRolLider(rol)
                const isQARole    = def.permisos.includes("verSoloPropios")
                const msg = isOwnerRole
                  ? "Ve la carga de todos los usuarios"
                  : isAdminRole
                  ? "Ve su propia carga y la de su equipo asignado (solo la propia si no tiene equipo)"
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

            {userToEdit && esRolConEquipo(rol) && (
              <Field>
                <FieldLabel>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <UserCheck size={13} style={{ color: "var(--primary)" }} />
                    Miembros del equipo
                    {equipoIds.length > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: "color-mix(in oklch,var(--primary) 14%,transparent)",
                        color: "var(--primary)", borderRadius: 8, padding: "1px 6px",
                      }}>
                        {equipoIds.length}
                      </span>
                    )}
                  </span>
                </FieldLabel>
                <div style={{
                  display: "flex", flexDirection: "column", gap: 2,
                  maxHeight: 180, overflowY: "auto", padding: "6px 8px",
                  borderRadius: 8, border: "1px solid var(--border)", background: "var(--secondary)",
                }}>
                  {users.filter(u => u.activo && u.id !== userToEdit.id).length === 0 ? (
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", textAlign: "center", padding: 8 }}>
                      No hay otros usuarios activos
                    </p>
                  ) : users.filter(u => u.activo && u.id !== userToEdit.id).map(u => (
                    <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "5px 6px", borderRadius: 6 }} className="hover:bg-card">
                      <input
                        type="checkbox"
                        checked={equipoIds.includes(u.id)}
                        onChange={() => toggleEquipoMember(u.id)}
                        style={{ width: 14, height: 14, accentColor: "var(--primary)", cursor: "pointer", flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 12, color: "var(--foreground)", flex: 1 }}>{u.nombre}</span>
                      <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                        {getRoleDef(u.rol)?.label ?? u.rol}
                      </span>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
                  Este usuario solo verá HUs y métricas de los usuarios seleccionados.
                </p>
              </Field>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90">
              {userToEdit ? "Guardar Cambios" : "Crear Usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
