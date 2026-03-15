"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Lock, ChevronDown, ChevronUp, UserCog, Info } from "lucide-react"
import {
  useAuth,
  PERMISOS_INFO,
  type RoleDef,
  type PermisoId,
} from "@/lib/auth-context"

// Paleta de colores para badges de roles (misma que etapas-config)
const BADGE_PALETA: { cls: string; sample: string }[] = [
  { cls: "bg-chart-1/20 text-chart-1 border-chart-1/30",          sample: "#2563eb" },
  { cls: "bg-chart-2/20 text-chart-2 border-chart-2/30",          sample: "#15803d" },
  { cls: "bg-chart-3/20 text-chart-3 border-chart-3/30",          sample: "#ca8a04" },
  { cls: "bg-chart-4/20 text-chart-4 border-chart-4/30",          sample: "#dc2626" },
  { cls: "bg-purple-500/20 text-purple-500 border-purple-500/30", sample: "#9333ea" },
  { cls: "bg-pink-500/20 text-pink-500 border-pink-500/30",       sample: "#ec4899" },
  { cls: "bg-cyan-600/20 text-cyan-600 border-cyan-600/30",       sample: "#0891b2" },
  { cls: "bg-orange-500/20 text-orange-500 border-orange-500/30", sample: "#f97316" },
]

const TODOS_PERMISOS: PermisoId[] = [
  "canEdit", "canCreateHU", "canApproveCases", "canManageUsers", "verSoloPropios",
]

// ── Panel de edición de un rol ────────────────────────────
function RoleEditPanel({
  role,
  onSave,
  onCancel,
}: {
  role: Partial<RoleDef> & { id?: string }
  onSave: (data: Omit<RoleDef, "id" | "esBase">) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState(role.label ?? "")
  const [description, setDescription] = useState(role.description ?? "")
  const [cls, setCls] = useState(role.cls ?? BADGE_PALETA[4].cls)
  const [permisos, setPermisos] = useState<PermisoId[]>(role.permisos ?? [])

  const togglePermiso = (p: PermisoId) => {
    // El permiso canManageUsers del rol admin no se puede quitar
    if (role.id === "admin" && p === "canManageUsers") return
    setPermisos(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  return (
    <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", background: "var(--background)", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Nombre + color */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>Nombre del rol</p>
          <Input
            value={label}
            onChange={e => setLabel(e.target.value)}
            placeholder="Ej: Auditor, QA Senior..."
            style={{ height: 32, fontSize: 12 }}
          />
        </div>
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>Color</p>
          <div style={{ display: "flex", gap: 4, paddingTop: 5 }}>
            {BADGE_PALETA.map((p, pi) => (
              <button
                key={pi}
                onClick={() => setCls(p.cls)}
                style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: cls === p.cls ? "2px solid var(--foreground)" : "2px solid transparent",
                  background: p.sample, cursor: "pointer", padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>Descripción</p>
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe brevemente el rol..."
          style={{ height: 32, fontSize: 12 }}
        />
      </div>

      {/* Vista previa del badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Vista previa:</p>
        <Badge variant="outline" className={`${cls} text-[11px]`} style={{ padding: "2px 8px" }}>
          {label || "Nombre del rol"}
        </Badge>
      </div>

      {/* Permisos */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)", marginBottom: 8 }}>Permisos</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {TODOS_PERMISOS.map(p => {
            const info = PERMISOS_INFO[p]
            const checked = permisos.includes(p)
            const locked = role.id === "admin" && p === "canManageUsers"
            return (
              <label
                key={p}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  cursor: locked ? "default" : "pointer",
                  padding: "8px 10px", borderRadius: 8,
                  background: checked
                    ? "color-mix(in oklch, var(--primary) 8%, transparent)"
                    : "var(--card)",
                  border: `1px solid ${checked
                    ? "color-mix(in oklch, var(--primary) 25%, transparent)"
                    : "var(--border)"}`,
                  opacity: locked ? 0.7 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePermiso(p)}
                  disabled={locked}
                  style={{ marginTop: 2, accentColor: "var(--primary)", cursor: locked ? "default" : "pointer" }}
                />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", lineHeight: 1.3 }}>
                    {info.label}
                    {locked && (
                      <span style={{ fontSize: 10, color: "var(--muted-foreground)", marginLeft: 6, fontWeight: 400 }}>
                        (requerido)
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
                    {info.description}
                  </p>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4 }}>
        <Button variant="outline" size="sm" onClick={onCancel} style={{ height: 32 }}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={() => onSave({ label, description, cls, permisos })}
          disabled={!label.trim()}
          style={{ height: 32 }}
        >
          Guardar
        </Button>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────
export function RolesConfig() {
  const { roles, users, addRole, updateRole, deleteRole } = useAuth()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSaveEdit = (role: RoleDef, data: Omit<RoleDef, "id" | "esBase">) => {
    const result = updateRole({ ...role, ...data })
    if (result.success) { setExpandedId(null); setError(null) }
    else setError(result.error ?? "Error desconocido")
  }

  const handleSaveNew = (data: Omit<RoleDef, "id" | "esBase">) => {
    const result = addRole(data)
    if (result.success) { setCreando(false); setError(null) }
    else setError(result.error ?? "Error desconocido")
  }

  const handleDelete = (id: string) => {
    const result = deleteRole(id)
    if (!result.success) setError(result.error ?? "Error")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <UserCog size={15} style={{ color: "var(--primary)" }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Gestión de Roles</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>
        Crea roles personalizados y configura sus permisos. Los roles base del sistema no se pueden eliminar.
      </p>

      {/* Error inline */}
      {error && (
        <div style={{
          display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", borderRadius: 8,
          background: "color-mix(in oklch, var(--destructive) 10%, transparent)",
          border: "1px solid color-mix(in oklch, var(--destructive) 25%, transparent)",
        }}>
          <Info size={13} style={{ color: "var(--destructive)", flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "var(--destructive)", flex: 1 }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", fontSize: 14, padding: 0 }}
          >✕</button>
        </div>
      )}

      {/* Lista de roles */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {roles.map(role => {
          const expanded = expandedId === role.id
          const usersCount = users.filter(u => u.rol === role.id).length

          return (
            <div key={role.id} style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
              {/* Cabecera del rol */}
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", cursor: "pointer",
                  background: expanded
                    ? "color-mix(in oklch, var(--primary) 5%, var(--card))"
                    : "var(--card)",
                }}
                onClick={() => setExpandedId(expanded ? null : role.id)}
                className="hover:bg-secondary/50"
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  {role.esBase && (
                    <Lock size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                  )}
                  <Badge variant="outline" className={`${role.cls} text-[11px] shrink-0`} style={{ padding: "2px 8px" }}>
                    {role.label}
                  </Badge>
                  <p style={{ fontSize: 12, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {role.description}
                  </p>
                  {usersCount > 0 && (
                    <span style={{
                      fontSize: 10, color: "var(--muted-foreground)", flexShrink: 0,
                      background: "var(--secondary)", padding: "1px 6px", borderRadius: 4,
                    }}>
                      {usersCount} usuario{usersCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  {!role.esBase && (
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(role.id) }}
                      title={usersCount > 0 ? "No se puede eliminar: tiene usuarios asignados" : "Eliminar rol"}
                      disabled={usersCount > 0}
                      style={{
                        background: "none", border: "none",
                        cursor: usersCount > 0 ? "not-allowed" : "pointer",
                        color: "var(--chart-4)", padding: 4,
                        opacity: usersCount > 0 ? 0.35 : 1,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  {expanded
                    ? <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} />
                    : <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />
                  }
                </div>
              </div>

              {/* Panel de edición */}
              {expanded && (
                <RoleEditPanel
                  role={role}
                  onSave={data => handleSaveEdit(role, data)}
                  onCancel={() => setExpandedId(null)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Crear nuevo rol */}
      {creando ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: "var(--card)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Nuevo Rol Personalizado</p>
          </div>
          <RoleEditPanel
            role={{}}
            onSave={handleSaveNew}
            onCancel={() => { setCreando(false); setError(null) }}
          />
        </div>
      ) : (
        <button
          onClick={() => setCreando(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12,
            color: "var(--primary)", background: "none",
            border: "1px dashed color-mix(in oklch, var(--primary) 40%, transparent)",
            borderRadius: 10, cursor: "pointer", padding: "10px 14px", width: "100%",
          }}
          className="hover:bg-primary/5"
        >
          <Plus size={14} /> Crear nuevo rol personalizado
        </button>
      )}
    </div>
  )
}
