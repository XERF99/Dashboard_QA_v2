"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, ArrowUp, ArrowDown, RotateCcw, Monitor } from "lucide-react"
import { DeleteConfirmButton } from "./delete-confirm-button"

export const APLICACIONES_PREDETERMINADAS: string[] = [
  "Portal Web Principal",
  "Sistema de Reportes",
  "API de Pagos",
  "App Mobile",
  "Sistema CRM",
]

interface AplicacionesConfigProps {
  aplicaciones: string[]
  onChange: (aplicaciones: string[]) => void
}

export function AplicacionesConfig({ aplicaciones, onChange }: AplicacionesConfigProps) {
  const [nueva, setNueva] = useState("")

  function agregar() {
    const val = nueva.trim()
    if (!val || aplicaciones.some(a => a.toLowerCase() === val.toLowerCase())) return
    onChange([...aplicaciones, val])
    setNueva("")
  }

  function eliminar(idx: number) {
    onChange(aplicaciones.filter((_, i) => i !== idx))
  }

  function mover(idx: number, dir: -1 | 1) {
    const swap = idx + dir
    if (swap < 0 || swap >= aplicaciones.length) return
    const next = [...aplicaciones]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    onChange(next)
  }

  function editar(idx: number, val: string) {
    const next = [...aplicaciones]
    next[idx] = val
    onChange(next)
  }

  const hayDiferencias =
    aplicaciones.length !== APLICACIONES_PREDETERMINADAS.length ||
    aplicaciones.some((a, i) => a !== APLICACIONES_PREDETERMINADAS[i])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Monitor size={15} style={{ color: "var(--primary)" }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Aplicaciones / Sistemas</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>
        Lista de aplicaciones disponibles al crear o editar una Historia de Usuario.
      </p>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {aplicaciones.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
            Sin aplicaciones — agrega al menos una
          </p>
        )}
        {aplicaciones.map((app, idx) => {
          const isDefault = APLICACIONES_PREDETERMINADAS.includes(app)
          return (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}>
            {/* Orden */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
              <button
                onClick={() => mover(idx, -1)}
                disabled={idx === 0}
                style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", padding: 1, opacity: idx === 0 ? 0.3 : 1 }}
              ><ArrowUp size={11} /></button>
              <button
                onClick={() => mover(idx, 1)}
                disabled={idx === aplicaciones.length - 1}
                style={{ background: "none", border: "none", cursor: idx === aplicaciones.length - 1 ? "default" : "pointer", padding: 1, opacity: idx === aplicaciones.length - 1 ? 0.3 : 1 }}
              ><ArrowDown size={11} /></button>
            </div>

            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", minWidth: 14, textAlign: "center" }}>{idx + 1}</span>

            <Input
              value={app}
              readOnly={isDefault}
              onChange={isDefault ? undefined : e => editar(idx, e.target.value)}
              style={{ height: 28, fontSize: 12, flex: 1, ...(isDefault ? { background: "var(--secondary)", cursor: "default", color: "var(--muted-foreground)" } : {}) }}
              placeholder="Nombre de la aplicación"
            />

            {isDefault ? (
              <span style={{ width: 17, flexShrink: 0 }} />
            ) : (
              <DeleteConfirmButton onConfirm={() => eliminar(idx)} title="Eliminar" />
            )}
          </div>
          )
        })}
      </div>

      {/* Agregar nueva */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <Input
          value={nueva}
          onChange={e => setNueva(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") agregar() }}
          placeholder="Nueva aplicación (ej: Sistema ERP)"
          style={{ height: 30, fontSize: 12, flex: 1 }}
        />
        <Button size="sm" style={{ height: 30, gap: 4 }} onClick={agregar} disabled={!nueva.trim()}>
          <Plus size={12} /> Agregar
        </Button>
      </div>

      {/* Restaurar */}
      {hayDiferencias && (
        <button
          onClick={() => onChange([...APLICACIONES_PREDETERMINADAS])}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
          className="hover:text-foreground"
        >
          <RotateCcw size={11} /> Restaurar predeterminadas
        </button>
      )}
    </div>
  )
}
