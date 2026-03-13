"use client"

import { Progress } from "@/components/ui/progress"
import type { HistoriaUsuario } from "@/lib/types"

interface HUStatsCardsProps {
  historias: HistoriaUsuario[]
}

export function HUStatsCards({ historias }: HUStatsCardsProps) {
  const total       = historias.length
  const sinIniciar  = historias.filter(h => h.estado === "sin_iniciar").length
  const enProgreso  = historias.filter(h => h.estado === "en_progreso").length
  const exitosas    = historias.filter(h => h.estado === "exitosa").length
  const fallidas    = historias.filter(h => h.estado === "fallida").length
  const canceladas  = historias.filter(h => h.estado === "cancelada").length

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

      {/* SIN INICIAR */}
      <div style={cardBase}>
        <p style={labelStyle}>Sin Iniciar</p>
        <p style={valueStyle(sinIniciar > 0 ? "var(--muted-foreground)" : "var(--muted-foreground)")}>{sinIniciar}</p>
        <p style={subStyle}>pendientes</p>
      </div>

      {/* EN PROGRESO */}
      <div style={cardBase}>
        <p style={labelStyle}>En Progreso</p>
        <p style={valueStyle("var(--chart-1)")}>{enProgreso}</p>
        <p style={subStyle}>en ejecución</p>
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

      {/* CANCELADAS */}
      <div style={cardBase}>
        <p style={labelStyle}>Canceladas</p>
        <p style={valueStyle(canceladas > 0 ? "var(--chart-4)" : "var(--muted-foreground)")}>{canceladas}</p>
        <p style={subStyle}>cambio cancelado</p>
      </div>
    </div>
  )
}
