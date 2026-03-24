"use client"

import { useState } from "react"
import { Trash2, Check, X } from "lucide-react"

interface DeleteConfirmButtonProps {
  onConfirm: () => void
  title?: string
  disabled?: boolean
  stopPropagation?: boolean
}

export function DeleteConfirmButton({
  onConfirm,
  title = "Eliminar",
  disabled = false,
  stopPropagation = false,
}: DeleteConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false)

  const stop = (e: React.MouseEvent) => { if (stopPropagation) e.stopPropagation() }

  if (confirming) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <span style={{ fontSize: 10, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>¿Eliminar?</span>
        <button
          onClick={e => { e.stopPropagation(); onConfirm(); setConfirming(false) }}
          title="Confirmar eliminación"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--chart-4)", padding: 2 }}
        ><Check size={13} /></button>
        <button
          onClick={e => { e.stopPropagation(); setConfirming(false) }}
          title="Cancelar"
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}
        ><X size={13} /></button>
      </div>
    )
  }

  return (
    <button
      onClick={e => { stop(e); setConfirming(true) }}
      title={disabled ? title : title}
      disabled={disabled}
      style={{
        background: "none", border: "none", cursor: disabled ? "default" : "pointer",
        color: "var(--chart-4)", padding: 2, flexShrink: 0,
        opacity: disabled ? 0.35 : 1,
      }}
    ><Trash2 size={13} /></button>
  )
}
