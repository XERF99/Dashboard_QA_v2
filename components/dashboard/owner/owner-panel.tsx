"use client"

// ═══════════════════════════════════════════════════════════
//  OWNER PANEL
//  Panel dedicado al Owner para gestionar grupos (workspaces).
//  Muestra tarjetas por grupo con métricas en tiempo real,
//  y permite crear, editar y eliminar grupos.
// ═══════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from "react"
import { Plus, Users, BookOpen, ClipboardList, BarChart2, Pencil, Trash2, Check, X, Power, PowerOff, RefreshCw, Layers } from "lucide-react"

// ── Tipos locales ─────────────────────────────────────────

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

// ── Sub-componentes ───────────────────────────────────────

function KpiChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: "50%",
        background: color, flexShrink: 0,
      }} />
      <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, marginLeft: "auto" }}>{value}</span>
    </div>
  )
}

function GrupoCard({
  item,
  onEdit,
  onDelete,
  onToggle,
}: {
  item: GrupoConMetricas
  onEdit:   (g: Grupo) => void
  onDelete: (id: string) => void
  onToggle: (id: string, activo: boolean) => void
}) {
  const { grupo, metricas } = item

  const exitosas  = metricas.husPorEstado.find(h => h.estado === "exitosa")?.total ?? 0
  const pendientes = metricas.husPorEstado.find(h => h.estado === "sin_iniciar")?.total ?? 0

  return (
    <div style={{
      border: "1px solid var(--border)",
      borderRadius: 12,
      background: "var(--card)",
      padding: "20px 22px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      opacity: grupo.activo ? 1 : 0.6,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: "var(--primary)", opacity: grupo.activo ? 1 : 0.4,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Layers size={20} color="white" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {grupo.nombre}
            </span>
            {!grupo.activo && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 6px",
                borderRadius: 4, background: "var(--muted)", color: "var(--muted-foreground)",
              }}>
                INACTIVO
              </span>
            )}
          </div>
          {grupo.descripcion && (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {grupo.descripcion}
            </p>
          )}
        </div>
        {/* Acciones */}
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => onEdit(grupo)}
            title="Editar grupo"
            style={actionBtnStyle}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onToggle(grupo.id, !grupo.activo)}
            title={grupo.activo ? "Desactivar" : "Activar"}
            style={actionBtnStyle}
          >
            {grupo.activo ? <PowerOff size={14} /> : <Power size={14} />}
          </button>
          <button
            onClick={() => onDelete(grupo.id)}
            title="Eliminar grupo"
            style={{ ...actionBtnStyle, color: "var(--destructive)" }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* KPIs principales */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
        gap: 8,
      }}>
        <KpiBlock icon={<BookOpen size={14} />}    label="Historias"  value={metricas.totalHUs}       color="var(--primary)" />
        <KpiBlock icon={<ClipboardList size={14} />} label="Casos"    value={metricas.totalCasos}     color="var(--chart-5)" />
        <KpiBlock icon={<BarChart2 size={14} />}   label="Tareas"     value={metricas.totalTareas}    color="var(--chart-3)" />
        <KpiBlock icon={<Users size={14} />}       label="Miembros"   value={metricas.totalUsuarios}  color="var(--chart-4)" />
      </div>

      {/* Barra de progreso de HUs */}
      {metricas.totalHUs > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "var(--muted-foreground)" }}>
            <span>Progreso HUs</span>
            <span>{Math.round((exitosas / metricas.totalHUs) * 100)}% completadas</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "var(--muted)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.round((exitosas / metricas.totalHUs) * 100)}%`,
              background: "var(--primary)",
              borderRadius: 3,
              transition: "width 0.4s",
            }} />
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 11, color: "var(--muted-foreground)" }}>
            <span style={{ color: "var(--primary)" }}>{exitosas} exitosas</span>
            <span>{pendientes} sin iniciar</span>
          </div>
        </div>
      )}
    </div>
  )
}

function KpiBlock({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{
      background: "var(--muted)",
      borderRadius: 8,
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <span style={{ color, opacity: 0.9 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

const actionBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "5px 7px",
  cursor: "pointer",
  color: "var(--foreground)",
  display: "flex",
  alignItems: "center",
}

// ── Formulario modal ──────────────────────────────────────

function GrupoFormModal({
  initial,
  onSave,
  onClose,
  loading,
}: {
  initial?: Grupo
  onSave: (data: { nombre: string; descripcion: string }) => void
  onClose: () => void
  loading: boolean
}) {
  const [nombre, setNombre]           = useState(initial?.nombre ?? "")
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? "")

  const valid = nombre.trim().length > 0

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "0 16px",
    }}>
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "28px 26px",
        width: "100%",
        maxWidth: 420,
      }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
          {initial ? "Editar grupo" : "Nuevo grupo"}
        </h3>

        <label style={labelStyle}>Nombre del grupo *</label>
        <input
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Ej: Equipo Frontend"
          autoFocus
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: 14 }}>Descripción</label>
        <textarea
          value={descripcion}
          onChange={e => setDescripcion(e.target.value)}
          placeholder="Descripción opcional..."
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={cancelBtnStyle}>Cancelar</button>
          <button
            onClick={() => valid && onSave({ nombre: nombre.trim(), descripcion: descripcion.trim() })}
            disabled={!valid || loading}
            style={{
              ...saveBtnStyle,
              opacity: !valid || loading ? 0.5 : 1,
              cursor: !valid || loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Guardando..." : (initial ? "Guardar cambios" : "Crear grupo")}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 12, fontWeight: 600,
  marginBottom: 6, color: "var(--foreground)",
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 7,
  border: "1px solid var(--border)", background: "var(--background)",
  color: "var(--foreground)", fontSize: 14, boxSizing: "border-box",
}
const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border)",
  background: "var(--secondary)", color: "var(--foreground)", cursor: "pointer", fontSize: 13,
}
const saveBtnStyle: React.CSSProperties = {
  padding: "8px 18px", borderRadius: 8, border: "none",
  background: "var(--primary)", color: "white", fontWeight: 600, fontSize: 13,
}

// ── Componente principal ──────────────────────────────────

export function OwnerPanel() {
  const [items, setItems]           = useState<GrupoConMetricas[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [formOpen, setFormOpen]     = useState(false)
  const [editTarget, setEditTarget] = useState<Grupo | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Totales globales
  const totales = items.reduce(
    (acc, { metricas: m }) => ({
      hus:      acc.hus      + m.totalHUs,
      casos:    acc.casos    + m.totalCasos,
      tareas:   acc.tareas   + m.totalTareas,
      usuarios: acc.usuarios + m.totalUsuarios,
    }),
    { hus: 0, casos: 0, tareas: 0, usuarios: 0 }
  )

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/grupos")
      if (!res.ok) throw new Error("Error al cargar grupos")
      const { grupos } = await res.json() as { grupos: Grupo[] }

      const conMetricas = await Promise.all(
        grupos.map(async (g) => {
          const mr = await fetch(`/api/grupos/${g.id}/metricas`)
          const { metricas } = await mr.json() as { metricas: MetricasGrupo }
          return { grupo: g, metricas }
        })
      )
      setItems(conMetricas)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreate = async (data: { nombre: string; descripcion: string }) => {
    setSaving(true)
    try {
      const res = await fetch("/api/grupos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? "Error al crear grupo")
        return
      }
      setFormOpen(false)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data: { nombre: string; descripcion: string }) => {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/grupos/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? "Error al actualizar grupo")
        return
      }
      setEditTarget(null)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string, activo: boolean) => {
    await fetch(`/api/grupos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo }),
    })
    await fetchAll()
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/grupos/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? "Error al eliminar grupo")
        return
      }
      setDeleteConfirm(null)
      await fetchAll()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>

      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 22, margin: 0 }}>Panel de Grupos</h2>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", margin: "4px 0 0" }}>
            Cada grupo es un workspace independiente con sus propios datos y configuración.
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={fetchAll} title="Refrescar" style={actionBtnStyle}>
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setFormOpen(true)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 9, border: "none",
              background: "var(--primary)", color: "white",
              fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            <Plus size={15} /> Nuevo grupo
          </button>
        </div>
      </div>

      {/* Resumen global */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: 10, marginBottom: 24,
      }}>
        {[
          { label: "Grupos activos",   value: items.filter(i => i.grupo.activo).length, color: "var(--chart-4)" },
          { label: "Historias total",  value: totales.hus,       color: "var(--primary)" },
          { label: "Casos total",      value: totales.casos,     color: "var(--chart-5)" },
          { label: "Miembros total",   value: totales.usuarios,  color: "var(--chart-3)" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "14px 16px",
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "var(--destructive)", color: "white",
          borderRadius: 8, padding: "10px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, fontSize: 13,
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Estado de carga */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "var(--muted-foreground)" }}>
          Cargando grupos...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "64px 0",
          border: "2px dashed var(--border)", borderRadius: 14,
          color: "var(--muted-foreground)",
        }}>
          <Layers size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>No hay grupos creados</p>
          <p style={{ fontSize: 13 }}>Crea un grupo para que los administradores puedan trabajar de forma independiente.</p>
          <button
            onClick={() => setFormOpen(true)}
            style={{ ...saveBtnStyle, marginTop: 16 }}
          >
            <Plus size={14} style={{ display: "inline", marginRight: 6 }} />
            Crear primer grupo
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
        }}>
          {items.map(item => (
            <GrupoCard
              key={item.grupo.id}
              item={item}
              onEdit={g => setEditTarget(g)}
              onDelete={id => setDeleteConfirm(id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Leyenda de KPIs */}
      {!loading && items.length > 0 && (
        <div style={{
          marginTop: 20, padding: "12px 16px",
          background: "var(--muted)", borderRadius: 8,
          display: "flex", gap: 20, flexWrap: "wrap",
        }}>
          {[
            { label: "Historias",  color: "var(--primary)" },
            { label: "Casos",      color: "var(--chart-5)" },
            { label: "Tareas",     color: "var(--chart-3)" },
            { label: "Miembros",   color: "var(--chart-4)" },
          ].map(({ label, color }) => (
            <KpiChip key={label} label={label} value={0} color={color} />
          ))}
          <span style={{ fontSize: 11, color: "var(--muted-foreground)", marginLeft: "auto", alignSelf: "center" }}>
            Los datos de cada grupo son completamente independientes.
          </span>
        </div>
      )}

      {/* Modal: crear/editar */}
      {(formOpen || editTarget) && (
        <GrupoFormModal
          initial={editTarget ?? undefined}
          onSave={editTarget ? handleEdit : handleCreate}
          onClose={() => { setFormOpen(false); setEditTarget(null) }}
          loading={saving}
        />
      )}

      {/* Modal: confirmar eliminación */}
      {deleteConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 50,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 16px",
        }}>
          <div style={{
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 14, padding: "28px 26px",
            width: "100%", maxWidth: 380,
          }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Eliminar grupo</h3>
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 20 }}>
              Esta acción es irreversible. Solo se puede eliminar un grupo si no tiene usuarios ni historias asignadas.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteConfirm(null)} style={cancelBtnStyle}>Cancelar</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={saving}
                style={{ ...saveBtnStyle, background: "var(--destructive)", opacity: saving ? 0.5 : 1 }}
              >
                <Trash2 size={13} style={{ display: "inline", marginRight: 5 }} />
                {saving ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
