"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function ConfirmDeleteModal({ open, titulo, subtitulo, onConfirm, onCancel }: {
  open: boolean; titulo: string; subtitulo?: string; onConfirm: () => void; onCancel: () => void
}) {
  if (!open) return null
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, maxWidth: 400, width: "calc(100% - 32px)", boxShadow: "0 20px 60px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ height: 4, background: "var(--chart-4)" }} />
        <div style={{ padding: "20px 22px 18px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "color-mix(in oklch, var(--chart-4) 12%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={16} style={{ color: "var(--chart-4)" }} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{titulo}</p>
              {subtitulo && <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{subtitulo}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 size={13} className="mr-1.5" /> Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
