import React from "react"

/* ── MiniBar ── */
export function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--secondary)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 22, textAlign: "right" }}>{value}</span>
    </div>
  )
}

/* ── KpiCard ── */
export function KpiCard({ label, value, sub, color, icon, big }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode; big?: boolean
}) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", fontWeight: 700, lineHeight: 1.3 }}>{label}</p>
        <div style={{ color, opacity: 0.65 }}>{icon}</div>
      </div>
      <p style={{ fontSize: big ? 34 : 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.3 }}>{sub}</p>}
    </div>
  )
}

/* ── SectionTitle ── */
export function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
      <div style={{ color: "var(--primary)", opacity: 0.8 }}>{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{title}</p>
    </div>
  )
}

/* ── Colores semánticos compartidos ── */
export const COLOR: Record<string, string> = {
  sin_iniciar: "var(--muted-foreground)",
  en_progreso: "var(--chart-1)",
  exitosa:     "var(--chart-2)",
  fallida:     "var(--chart-4)",
  cancelada:   "#9ca3af",
  critica:     "#dc2626",
  alta:        "var(--chart-4)",
  media:       "var(--chart-3)",
  baja:        "var(--chart-2)",
  aprobado:    "var(--chart-2)",
  rechazado:   "var(--chart-4)",
  pendiente_aprobacion: "var(--chart-3)",
  borrador:    "var(--muted-foreground)",
}
