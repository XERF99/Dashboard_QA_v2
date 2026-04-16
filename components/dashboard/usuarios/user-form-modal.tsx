"use client"

import { useState, useEffect } from "react"
import { useAuth, PASSWORD_GENERICA, type User } from "@/lib/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input }  from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import {
  Users, Shield, Eye, FlaskConical, Crown, Star, BarChart2, AlertCircle,
} from "lucide-react"

interface UserFormModalProps {
  open: boolean
  userToEdit: User | null
  onClose: () => void
}

function getRoleIcon(rolId: string) {
  switch (rolId) {
    case "owner":   return <Star        className="h-3.5 w-3.5" />
    case "admin":   return <Shield      className="h-3.5 w-3.5" />
    case "qa_lead": return <Crown       className="h-3.5 w-3.5" />
    case "qa":      return <FlaskConical className="h-3.5 w-3.5" />
    case "viewer":  return <Eye         className="h-3.5 w-3.5" />
    default:        return <Users       className="h-3.5 w-3.5" />
  }
}

export function UserFormModal({ open, userToEdit, onClose }: UserFormModalProps) {
  const { roles, isOwner, refreshUsers } = useAuth()

  const [nombre,   setNombre]   = useState("")
  const [email,    setEmail]    = useState("")
  const [rol,      setRol]      = useState("viewer")
  const [loading,  setLoading]  = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const formValid  = nombre.trim().length > 0 && email.trim().length > 0 && emailValid

  const getRoleDef = (rolId: string) => roles.find(r => r.id === rolId)

  // Sync form state when target user or open state changes
  useEffect(() => {
    if (userToEdit) {
      setNombre(userToEdit.nombre)
      setEmail(userToEdit.email)
      setRol(userToEdit.rol)
    } else {
      setNombre("")
      setEmail("")
      setRol("viewer")
    }
    setApiError(null)
    setLoading(false)
  }, [userToEdit, open])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setLoading(true)
    setApiError(null)

    try {
      if (userToEdit) {
        // ── Editar ────────────────────────────────────────────
        const res = await fetch(`/api/users/${userToEdit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: userToEdit.id, nombre, email, rol }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          setApiError((j as { error?: string }).error ?? "Error al actualizar el usuario")
          return
        }
      } else {
        // ── Crear: la API asigna grupoId automáticamente desde el JWT ──
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email, rol }),
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          setApiError((j as { error?: string }).error ?? "Error al crear el usuario")
          return
        }
      }
      await refreshUsers()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  // Roles visibles según quién está creando
  const rolesVisibles = roles.filter(r => {
    if (r.permisos.includes("isSuperAdmin")) return false  // nunca mostrar owner
    if (!isOwner && r.permisos.includes("canManageUsers")) return false  // admin solo lo crea el owner
    return true
  })

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

        <form onSubmit={handleSubmit} aria-label={userToEdit ? "Editar usuario" : "Nuevo usuario"}>
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
              {email.length > 0 && !emailValid && (
                <p className="text-xs text-destructive mt-1">Formato de email inválido</p>
              )}
            </Field>

            <Field>
              <FieldLabel>Rol</FieldLabel>
              <Select value={rol} onValueChange={setRol}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rolesVisibles.map(r => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        {getRoleIcon(r.id)}
                        {r.label}
                      </div>
                    </SelectItem>
                  ))}
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
                const isLeadRole  = def.permisos.includes("canCreateHU") && def.permisos.includes("canApproveCases") && !def.permisos.includes("canManageUsers")
                const isQARole    = def.permisos.includes("verSoloPropios")
                const msg = isOwnerRole
                  ? "Ve la carga de todos los usuarios"
                  : isAdminRole
                  ? "Ve la carga de todo el workspace"
                  : isLeadRole
                  ? "Ve su propia carga y la de todos los usuarios (qa) del workspace"
                  : isQARole
                  ? "Ve únicamente su propia carga"
                  : "Ve la carga de todos los usuarios del workspace (solo lectura)"
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

            {/* Error de la API */}
            {apiError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {apiError}
              </div>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={loading || !formValid}>
              {loading
                ? (userToEdit ? "Guardando..." : "Creando...")
                : (userToEdit ? "Guardar Cambios" : "Crear Usuario")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
