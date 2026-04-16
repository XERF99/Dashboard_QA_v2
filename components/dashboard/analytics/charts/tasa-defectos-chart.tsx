import React from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users, TrendingUp, CheckCircle, AlertTriangle,
} from "lucide-react"
import { SectionTitle } from "../kpi-card"
import type { HistoriaUsuario, CasoPrueba, Tarea } from "@/lib/types"

export interface ResponsableRow {
  nombre: string
  total: number
  exitosas: number
  fallidas: number
  enProgreso: number
  bloqueos: number
  tasaExito: number | null
}

interface TasaDefectosChartProps {
  isPersonalView: boolean
  byResponsable: ResponsableRow[]
  kpiBloqueos: number
  kpiPuntosTotales: number
  kpiPuntosEntregados: number
  husFiltradas: HistoriaUsuario[]
  casosFiltrados: CasoPrueba[]
  tareasFiltradas: Tarea[]
}

export function TasaDefectosChart({
  isPersonalView,
  byResponsable,
  kpiBloqueos,
  kpiPuntosTotales,
  kpiPuntosEntregados,
  husFiltradas,
  casosFiltrados,
  tareasFiltradas,
}: TasaDefectosChartProps) {
  if (isPersonalView) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
          <SectionTitle icon={<AlertTriangle size={14} />} title="Bloqueos activos" />
          {kpiBloqueos === 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--chart-2)" }}>
              <CheckCircle size={16} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>Sin bloqueos activos</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { label: "En HUs",    val: husFiltradas.reduce((s, h) => s + h.bloqueos.filter(b => !b.resuelto).length, 0), color: "var(--chart-4)" },
                { label: "En Casos",  val: casosFiltrados.reduce((s, c) => s + c.bloqueos.filter(b => !b.resuelto).length, 0), color: "var(--chart-3)" },
                { label: "En Tareas", val: tareasFiltradas.reduce((s, t) => s + t.bloqueos.filter(b => !b.resuelto).length, 0), color: "var(--chart-3)" },
              ].filter(x => x.val > 0).map(({ label, val, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: 8, background: "color-mix(in oklch, var(--chart-4) 8%, transparent)", border: "1px solid color-mix(in oklch, var(--chart-4) 20%, transparent)" }}>
                  <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color }}>{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
          <SectionTitle icon={<TrendingUp size={14} />} title="Story Points asignados" />
          <p style={{ fontSize: 32, fontWeight: 700, color: "var(--primary)", lineHeight: 1 }}>{kpiPuntosTotales}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--muted-foreground)" }}> pts</span></p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4, marginBottom: 12 }}>{kpiPuntosEntregados} pts entregados</p>
          <Progress
            value={kpiPuntosTotales > 0 ? Math.round((kpiPuntosEntregados / kpiPuntosTotales) * 100) : 0}
            className="h-2"
            style={{ background: "var(--secondary)" }}
          />
        </div>
      </div>
    )
  }

  // Team view: responsables table + story points
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
      {/* Tabla responsables */}
      <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
        <SectionTitle icon={<Users size={14} />} title="Rendimiento por Responsable" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Responsable", "Total", "En prog.", "Exitosas", "Fallidas", "Bloqueos", "Tasa"].map(h => (
                  <th key={h} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted-foreground)", fontWeight: 700, textAlign: h === "Responsable" ? "left" : "center", padding: "0 6px 8px", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byResponsable.map(({ nombre, total, enProgreso, exitosas, fallidas, bloqueos, tasaExito }) => (
                <tr key={nombre} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 6px", fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{nombre}</td>
                  <td style={{ padding: "8px 6px", fontSize: 13, fontWeight: 700, color: "var(--primary)", textAlign: "center" }}>{total}</td>
                  <td style={{ padding: "8px 6px", fontSize: 12, color: "var(--chart-1)", textAlign: "center" }}>{enProgreso}</td>
                  <td style={{ padding: "8px 6px", fontSize: 12, color: "var(--chart-2)", textAlign: "center" }}>{exitosas}</td>
                  <td style={{ padding: "8px 6px", fontSize: 12, color: fallidas > 0 ? "var(--chart-4)" : "var(--muted-foreground)", textAlign: "center" }}>{fallidas}</td>
                  <td style={{ padding: "8px 6px", fontSize: 12, color: bloqueos > 0 ? "var(--chart-4)" : "var(--muted-foreground)", textAlign: "center", fontWeight: bloqueos > 0 ? 700 : 400 }}>{bloqueos}</td>
                  <td style={{ padding: "8px 6px", textAlign: "center" }}>
                    {tasaExito !== null ? (
                      <span style={{ fontSize: 12, fontWeight: 700, color: tasaExito >= 80 ? "var(--chart-2)" : tasaExito >= 50 ? "var(--chart-3)" : "var(--chart-4)" }}>
                        {tasaExito}%
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Story points */}
      <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", display: "flex", flexDirection: "column", gap: 16 }}>
        <SectionTitle icon={<TrendingUp size={14} />} title="Story Points" />
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Entregados</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--chart-2)" }}>{kpiPuntosEntregados} / {kpiPuntosTotales}</span>
          </div>
          <Progress
            value={kpiPuntosTotales > 0 ? Math.round((kpiPuntosEntregados / kpiPuntosTotales) * 100) : 0}
            className="h-2.5"
            style={{ background: "var(--secondary)" }}
          />
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 6 }}>
            {kpiPuntosTotales > 0 ? Math.round((kpiPuntosEntregados / kpiPuntosTotales) * 100) : 0}% completado
          </p>
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "Sin iniciar", pts: husFiltradas.filter(h => h.estado === "sin_iniciar").reduce((s, h) => s + h.puntos, 0), color: "var(--muted-foreground)" },
            { label: "En progreso", pts: husFiltradas.filter(h => h.estado === "en_progreso").reduce((s, h) => s + h.puntos, 0), color: "var(--chart-1)" },
            { label: "Fallidas",    pts: husFiltradas.filter(h => h.estado === "fallida").reduce((s, h) => s + h.puntos, 0),    color: "var(--chart-4)" },
          ].map(({ label, pts, color }) => pts > 0 && (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{label}</span>
              <Badge variant="outline" style={{ fontSize: 11, padding: "1px 8px", color, borderColor: color, background: `color-mix(in oklch, ${color} 12%, transparent)` }}>
                {pts} pts
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
