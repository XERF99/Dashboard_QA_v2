"use client"

import { Progress } from "@/components/ui/progress"
import type { HistoriaUsuario } from "@/lib/types"

interface HUStatsCardsProps {
  historias: HistoriaUsuario[]
}

export function HUStatsCards({ historias }: HUStatsCardsProps) {
  const total      = historias.length
  const enProgreso = historias.filter(h => h.estado === "en_progreso").length
  const bloqueadas = historias.filter(h => h.estado === "bloqueado").length
  const exitosas   = historias.filter(h => h.estado === "exitoso").length
  const fallidas   = historias.filter(h => h.estado === "fallido").length
  const standBy    = historias.filter(h => h.estado === "stand_by").length

  const porcentaje = total > 0 ? Math.round((exitosas / total) * 100) : 0

  const cardBase: React.CSSProperties = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "14px 18px",
    flex: 1,
    minWidth: 0,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "var(--muted-foreground)",
    marginBottom: 6,
  }

  const valueStyle = (color: string): React.CSSProperties => ({
    fontSize: 28,
    fontWeight: 800,
    lineHeight: 1,
    color,
    marginBottom: 4,
  })

  const subStyle: React.CSSProperties = {
    fontSize: 11,
    color: "var(--muted-foreground)",
    marginTop: 2,
  }

  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      {/* PROGRESO */}
      <div style={{ ...cardBase, minWidth: 160 }}>
        <p style={labelStyle}>Progreso</p>
        <p style={valueStyle("var(--primary)")}>{porcentaje}%</p>
        <Progress value={porcentaje} className="h-1.5 my-2" />
        <p style={subStyle}>{exitosas}/{total} {total === 1 ? "historia" : "historias"}</p>
      </div>

      {/* EN PROGRESO */}
      <div style={cardBase}>
        <p style={labelStyle}>En Progreso</p>
        <p style={valueStyle("var(--chart-1)")}>{enProgreso}</p>
        <p style={subStyle}>tareas activas</p>
      </div>

      {/* BLOQUEADAS */}
      <div style={cardBase}>
        <p style={labelStyle}>Bloqueadas</p>
        <p style={valueStyle(bloqueadas > 0 ? "var(--chart-4)" : "var(--muted-foreground)")}>{bloqueadas}</p>
        <p style={subStyle}>con impedimento</p>
      </div>

      {/* EXITOSAS */}
      <div style={cardBase}>
        <p style={labelStyle}>Exitosas</p>
        <p style={valueStyle(exitosas > 0 ? "var(--chart-2)" : "var(--muted-foreground)")}>{exitosas}</p>
        <p style={subStyle}>completadas OK</p>
      </div>

      {/* FALLIDAS */}
      <div style={cardBase}>
        <p style={labelStyle}>Fallidas</p>
        <p style={valueStyle(fallidas > 0 ? "var(--chart-4)" : "var(--muted-foreground)")}>{fallidas}</p>
        <p style={subStyle}>con fallo</p>
      </div>

      {/* STAND BY */}
      <div style={cardBase}>
        <p style={labelStyle}>Stand By</p>
        <p style={valueStyle(standBy > 0 ? "var(--chart-5)" : "var(--muted-foreground)")}>{standBy}</p>
        <p style={subStyle}>en espera</p>
      </div>
    </div>
  )
}
