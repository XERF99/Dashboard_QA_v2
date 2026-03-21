"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarDays, Plus, Trash2, Edit, Check, X } from "lucide-react"
import type { Sprint } from "@/lib/types"

interface SprintsConfigProps {
  sprints: Sprint[]
  onAdd: (data: Omit<Sprint, "id">) => { success: boolean; error?: string }
  onUpdate: (s: Sprint) => { success: boolean; error?: string }
  onDelete: (id: string) => { success: boolean; error?: string }
}

const FMT: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }
function fmtDate(d: Date) { return new Date(d).toLocaleDateString("es", FMT) }

const EMPTY = { nombre: "", fechaInicio: "", fechaFin: "", objetivo: "" }

export function SprintsConfig({ sprints, onAdd, onUpdate, onDelete }: SprintsConfigProps) {
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState("")
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState(EMPTY)

  function handleAdd() {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio"); return }
    if (!form.fechaInicio || !form.fechaFin) { setError("Las fechas son obligatorias"); return }
    if (new Date(form.fechaFin) < new Date(form.fechaInicio)) { setError("La fecha fin debe ser posterior al inicio"); return }
    const res = onAdd({
      nombre: form.nombre.trim(),
      fechaInicio: new Date(form.fechaInicio),
      fechaFin: new Date(form.fechaFin),
      objetivo: form.objetivo.trim() || undefined,
    })
    if (!res.success) { setError(res.error ?? "Error al crear sprint"); return }
    setForm(EMPTY)
    setError("")
  }

  function startEdit(s: Sprint) {
    setEditId(s.id)
    setEditData({
      nombre: s.nombre,
      fechaInicio: s.fechaInicio.toISOString().slice(0, 10),
      fechaFin: s.fechaFin.toISOString().slice(0, 10),
      objetivo: s.objetivo ?? "",
    })
  }

  function commitEdit(s: Sprint) {
    if (!editData.nombre.trim() || !editData.fechaInicio || !editData.fechaFin) return
    onUpdate({
      ...s,
      nombre: editData.nombre.trim(),
      fechaInicio: new Date(editData.fechaInicio),
      fechaFin: new Date(editData.fechaFin),
      objetivo: editData.objetivo.trim() || undefined,
    })
    setEditId(null)
  }

  const hoy = new Date()

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <CalendarDays size={15} style={{ color: "var(--primary)" }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Sprints</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>
        Define los sprints del proyecto con sus fechas. Las Historias de Usuario podrán asignarse a un sprint específico.
      </p>

      {/* Lista de sprints existentes */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
        {sprints.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
            Sin sprints — crea el primero abajo
          </p>
        )}
        {sprints.map(s => {
          const dias = Math.ceil((s.fechaFin.getTime() - hoy.getTime()) / 86400000)
          const activo = hoy >= s.fechaInicio && hoy <= s.fechaFin
          const finalizado = hoy > s.fechaFin

          if (editId === s.id) {
            return (
              <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--primary)", background: "var(--card)" }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input value={editData.nombre} onChange={e => setEditData(p => ({ ...p, nombre: e.target.value }))}
                    placeholder="Nombre" style={{ height: 30, fontSize: 12 }} />
                  <Input type="date" value={editData.fechaInicio} onChange={e => setEditData(p => ({ ...p, fechaInicio: e.target.value }))}
                    style={{ height: 30, fontSize: 12 }} />
                  <Input type="date" value={editData.fechaFin} onChange={e => setEditData(p => ({ ...p, fechaFin: e.target.value }))}
                    style={{ height: 30, fontSize: 12 }} />
                </div>
                <Input value={editData.objetivo} onChange={e => setEditData(p => ({ ...p, objetivo: e.target.value }))}
                  placeholder="Objetivo (opcional)" style={{ height: 28, fontSize: 11 }} />
                <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                  <button onClick={() => setEditId(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                    <X size={12} /> Cancelar
                  </button>
                  <button onClick={() => commitEdit(s)}
                    style={{ background: "var(--primary)", border: "none", cursor: "pointer", color: "var(--primary-foreground)", borderRadius: 6, padding: "3px 10px", display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600 }}>
                    <Check size={12} /> Guardar
                  </button>
                </div>
              </div>
            )
          }

          return (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}>
              {/* Estado badge */}
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, flexShrink: 0,
                background: activo ? "color-mix(in oklch, var(--chart-2) 12%, transparent)" : finalizado ? "color-mix(in oklch, var(--muted-foreground) 10%, transparent)" : "color-mix(in oklch, var(--primary) 10%, transparent)",
                color: activo ? "var(--chart-2)" : finalizado ? "var(--muted-foreground)" : "var(--primary)",
                textTransform: "uppercase", letterSpacing: "0.05em",
              }}>
                {activo ? "Activo" : finalizado ? "Finalizado" : "Próximo"}
              </span>

              {/* Nombre + fechas */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>{s.nombre}</p>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: 0 }}>
                  {fmtDate(s.fechaInicio)} → {fmtDate(s.fechaFin)}
                  {activo && <span style={{ color: "var(--chart-2)", fontWeight: 600 }}> · {dias} días restantes</span>}
                  {!activo && !finalizado && <span style={{ color: "var(--primary)" }}> · comienza en {Math.ceil((s.fechaInicio.getTime() - hoy.getTime()) / 86400000)} días</span>}
                </p>
                {s.objetivo && <p style={{ fontSize: 10, color: "var(--muted-foreground)", margin: 0, fontStyle: "italic" }}>{s.objetivo}</p>}
              </div>

              {/* Acciones */}
              <button onClick={() => startEdit(s)} title="Editar"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2, flexShrink: 0 }}>
                <Edit size={13} />
              </button>
              <button onClick={() => onDelete(s.id)} title="Eliminar"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--chart-4)", padding: 2, flexShrink: 0 }}>
                <Trash2 size={13} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Formulario para agregar nuevo sprint */}
      <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px dashed var(--border)", background: "var(--background)", display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Nuevo sprint</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Input value={form.nombre} onChange={e => { setForm(p => ({ ...p, nombre: e.target.value })); setError("") }}
            placeholder="Nombre (ej. Sprint 5)" style={{ height: 30, fontSize: 12 }} />
          <Input type="date" value={form.fechaInicio} onChange={e => { setForm(p => ({ ...p, fechaInicio: e.target.value })); setError("") }}
            style={{ height: 30, fontSize: 12 }} />
          <Input type="date" value={form.fechaFin} onChange={e => { setForm(p => ({ ...p, fechaFin: e.target.value })); setError("") }}
            style={{ height: 30, fontSize: 12 }} />
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Input value={form.objetivo} onChange={e => setForm(p => ({ ...p, objetivo: e.target.value }))}
            placeholder="Objetivo del sprint (opcional)" style={{ height: 28, fontSize: 11, flex: 1 }} />
          <Button size="sm" style={{ height: 30, gap: 4, flexShrink: 0 }} onClick={handleAdd} disabled={!form.nombre.trim()}>
            <Plus size={12} /> Agregar
          </Button>
        </div>
        {error && <p style={{ fontSize: 11, color: "var(--chart-4)", margin: 0 }}>{error}</p>}
      </div>
    </div>
  )
}
