"use client"

import type { ToastItem } from "@/lib/hooks/useToast"
import { CheckCircle, AlertTriangle, Trash2, X, LogOut } from "lucide-react"

type ToastType = "success" | "warning" | "error" | "info"

const cfg: Record<ToastType, { border: string; icon: React.ReactNode }> = {
  success: { border: "var(--chart-2)", icon: <CheckCircle size={15} style={{ color: "var(--chart-2)", flexShrink: 0 }} /> },
  warning: { border: "var(--chart-3)", icon: <AlertTriangle size={15} style={{ color: "var(--chart-3)", flexShrink: 0 }} /> },
  error:   { border: "var(--chart-4)", icon: <Trash2 size={15} style={{ color: "var(--chart-4)", flexShrink: 0 }} /> },
  info:    { border: "var(--primary)",  icon: <LogOut size={15} style={{ color: "var(--primary)", flexShrink: 0 }} /> },
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 200, display: "flex", flexDirection: "column", gap: 10, maxWidth: 340 }}>
      {toasts.map(t => {
        const c = cfg[t.type]
        return (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 15px",
            background: "var(--card)", border: "1px solid var(--border)",
            borderLeft: `4px solid ${c.border}`, borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          }}>
            {c.icon}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{t.title}</p>
              {t.desc && <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{t.desc}</p>}
            </div>
            <button onClick={() => onDismiss(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: 2 }}>
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
