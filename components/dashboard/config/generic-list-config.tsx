"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, ArrowUp, ArrowDown, RotateCcw } from "lucide-react"
import { useListConfig, type IdLabelItem } from "@/lib/hooks/useListConfig"
import { DeleteConfirmButton } from "./delete-confirm-button"

interface GenericListConfigProps<T extends IdLabelItem> {
  title: string
  icon: ReactNode
  description: string
  items: T[]
  onChange: (items: T[]) => void
  defaults: T[]
  placeholder: string
  emptyMessage?: string
  showId?: boolean
}

export function GenericListConfig<T extends IdLabelItem>({
  title,
  icon,
  description,
  items,
  onChange,
  defaults,
  placeholder,
  emptyMessage = "Sin elementos — agrega al menos uno",
  showId = true,
}: GenericListConfigProps<T>) {
  const { nuevoLabel, setNuevoLabel, agregar, eliminar, mover, editarLabel, hayDiferencias, restaurar } =
    useListConfig(items, onChange, defaults)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ color: "var(--primary)", display: "flex" }}>{icon}</span>
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{title}</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>{description}</p>

      {/* Lista */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
        {items.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
            {emptyMessage}
          </p>
        )}
        {items.map((item, idx) => {
          const isDefault = defaults.some(d => d.id === item.id)
          return (
          <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}>

            {/* Botones de orden */}
            <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
              <button
                onClick={() => mover(idx, -1)}
                disabled={idx === 0}
                style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", padding: 1, opacity: idx === 0 ? 0.3 : 1 }}
              ><ArrowUp size={11} /></button>
              <button
                onClick={() => mover(idx, 1)}
                disabled={idx === items.length - 1}
                style={{ background: "none", border: "none", cursor: idx === items.length - 1 ? "default" : "pointer", padding: 1, opacity: idx === items.length - 1 ? 0.3 : 1 }}
              ><ArrowDown size={11} /></button>
            </div>

            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", minWidth: 14, textAlign: "center" }}>{idx + 1}</span>

            <Input
              value={item.label}
              readOnly={isDefault}
              onChange={isDefault ? undefined : e => editarLabel(idx, e.target.value)}
              style={{ height: 28, fontSize: 12, flex: 1, ...(isDefault ? { background: "var(--secondary)", cursor: "default", color: "var(--muted-foreground)" } : {}) }}
              placeholder="Nombre"
            />

            {showId && (
              <span style={{
                fontSize: 9, fontFamily: "monospace", color: "var(--muted-foreground)",
                background: "var(--secondary)", padding: "2px 6px", borderRadius: 4, flexShrink: 0,
              }}>
                {item.id}
              </span>
            )}

            {isDefault ? (
              <span style={{ width: 17, flexShrink: 0 }} />
            ) : (
              <DeleteConfirmButton onConfirm={() => eliminar(idx)} title="Eliminar" />
            )}
          </div>
          )
        })}
      </div>

      {/* Agregar nuevo */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <Input
          value={nuevoLabel}
          onChange={e => setNuevoLabel(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") agregar() }}
          placeholder={placeholder}
          style={{ height: 30, fontSize: 12, flex: 1 }}
        />
        <Button size="sm" style={{ height: 30, gap: 4 }} onClick={agregar} disabled={!nuevoLabel.trim()}>
          <Plus size={12} /> Agregar
        </Button>
      </div>

      {/* Restaurar predeterminados */}
      {hayDiferencias && (
        <button
          onClick={restaurar}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
          className="hover:text-foreground"
        >
          <RotateCcw size={11} /> Restaurar predeterminados
        </button>
      )}
    </div>
  )
}
