import React from "react"
import { CheckCircle, Layers, Zap, FlaskConical } from "lucide-react"
import { MiniBar, SectionTitle } from "../kpi-card"

export interface SimpleDistItem {
  key: string
  label: string
  count: number
}

export interface AprobacionItem {
  key: string
  label: string
  count: number
  color: string
}

interface VelocidadSprintChartProps {
  casosByAprobacion: AprobacionItem[]
  byTipo: SimpleDistItem[]
  byAmbiente: SimpleDistItem[]
  byTipoPrueba: SimpleDistItem[]
  totalCasos: number
  totalHUs: number
}

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"]

export function VelocidadSprintChart({ casosByAprobacion, byTipo, byAmbiente, byTipoPrueba, totalCasos, totalHUs }: VelocidadSprintChartProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Casos por estado de aprobacion */}
      <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
        <SectionTitle icon={<CheckCircle size={14} />} title="Casos por Aprobacion" />
        {totalCasos === 0 ? (
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>Sin casos creados</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {casosByAprobacion.map(({ key, label, count, color }) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round((count / totalCasos) * 100)}%</span>
                </div>
                <MiniBar value={count} max={totalCasos} color={color} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Por tipo de aplicacion */}
      <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
        <SectionTitle icon={<Layers size={14} />} title="HUs por Tipo" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {byTipo.map(({ key, label, count }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 60, height: 5, borderRadius: 3, background: "var(--secondary)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((count / totalHUs) * 100)}%`, height: "100%", background: "var(--primary)", borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", minWidth: 16, textAlign: "right" }}>{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Por ambiente */}
      <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
        <SectionTitle icon={<Zap size={14} />} title="HUs por Ambiente" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {byAmbiente.map(({ key, label, count }) => {
            const amb_color = key === "produccion" ? "var(--chart-4)" : key === "preproduccion" ? "var(--chart-3)" : "var(--chart-2)"
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: amb_color }}>{count}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "var(--secondary)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((count / totalHUs) * 100)}%`, height: "100%", background: amb_color, borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Por tipo de prueba */}
      <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
        <SectionTitle icon={<FlaskConical size={14} />} title="HUs por Tipo de Prueba" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {byTipoPrueba.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>Sin datos</p>
          ) : byTipoPrueba.map(({ key, label, count }, i) => {
            const color = CHART_COLORS[i % CHART_COLORS.length]
            return (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{count}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "var(--secondary)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.round((count / totalHUs) * 100)}%`, height: "100%", background: color, borderRadius: 3 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
