"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, Layers } from "lucide-react"
import { TIPOS_APLICACION_PREDETERMINADOS, type TipoAplicacionDef } from "@/lib/types"

interface TiposAplicacionConfigProps {
  tipos: TipoAplicacionDef[]
  onChange: (tipos: TipoAplicacionDef[]) => void
}

export function TiposAplicacionConfig({ tipos, onChange }: TiposAplicacionConfigProps) {
  const [nuevoLabel, setNuevoLabel] = useState("")

  function agregar() {
    const label = nuevoLabel.trim()
    if (!label) return
    const id = label
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
    if (!id || tipos.some(t => t.id === id)) return
    onChange([...tipos, { id, label }])
    setNuevoLabel("")
  }

  function eliminar(idx: number) {
    onChange(tipos.filter((_, i) => i !== idx))
  }

  function mover(idx: number, dir: -1 | 1) {
    const swap = idx + dir
    if (swap < 0 || swap >= tipos.length) return
    const next = [...tipos]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  function editarLabel(idx: number, label: string) {
    const next = [...tipos]
    next[idx] = { ...next[idx], label }
    onChange(next)
  }

  const hayDiferencias =
    tipos.length !== TIPOS_APLICACION_PREDETERMINADOS.length ||
    tipos.some((t, i) =>
      t.id !== TIPOS_APLICACION_PREDETERMINADOS[i]?.id ||
      t.label !== TIPOS_APLICACION_PREDETERMINADOS[i]?.label
    )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Layers size={15} style={{ color: "var(--primary)" }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Tipos de Aplicación</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>
        Define los tipos de cambio disponibles. Cada tipo determina qué etapas de ejecución aplican a sus HUs.
      </p>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {tipos.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
            Sin tipos — agrega al menos uno
          </p>
        )}
        {tipos.map((tipo, idx) => (
          <div key={tipo.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}>
            {/* Orden */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
              <button
                onClick={() => mover(idx, -1)}
                disabled={idx === 0}
                style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", padding: 1, opacity: idx === 0 ? 0.3 : 1 }}
              ><ArrowUp size={11} /></button>
              <button
                onClick={() => mover(idx, 1)}
                disabled={idx === tipos.length - 1}
                style={{ background: "none", border: "none", cursor: idx === tipos.length - 1 ? "default" : "pointer", padding: 1, opacity: idx === tipos.length - 1 ? 0.3 : 1 }}
              ><ArrowDown size={11} /></button>
            </div>

            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", minWidth: 14, textAlign: "center" }}>{idx + 1}</span>

            <Input
              value={tipo.label}
              onChange={e => editarLabel(idx, e.target.value)}
              style={{ height: 28, fontSize: 12, flex: 1 }}
              placeholder="Nombre del tipo"
            />

            {/* ID inmutable (referencia interna) */}
            <span style={{
              fontSize: 9, fontFamily: "monospace", color: "var(--muted-foreground)",
              background: "var(--secondary)", padding: "2px 6px", borderRadius: 4, flexShrink: 0,
            }}>
              {tipo.id}
            </span>

            <button
              onClick={() => eliminar(idx)}
              title="Eliminar"
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--chart-4)", padding: 2, flexShrink: 0 }}
            ><Trash2 size={13} /></button>
          </div>
        ))}
      </div>

      {/* Agregar nuevo */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <Input
          value={nuevoLabel}
          onChange={e => setNuevoLabel(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") agregar() }}
          placeholder="Nuevo tipo (ej: Microservicio, ETL, Monolito...)"
          style={{ height: 30, fontSize: 12, flex: 1 }}
        />
        <Button size="sm" style={{ height: 30, gap: 4 }} onClick={agregar} disabled={!nuevoLabel.trim()}>
          <Plus size={12} /> Agregar
        </Button>
      </div>

      {/* Restaurar */}
      {hayDiferencias && (
        <button
          onClick={() => onChange([...TIPOS_APLICACION_PREDETERMINADOS])}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
          className="hover:text-foreground"
        >
          <RotateCcw size={11} /> Restaurar predeterminados
        </button>
      )}
    </div>
  )
}
