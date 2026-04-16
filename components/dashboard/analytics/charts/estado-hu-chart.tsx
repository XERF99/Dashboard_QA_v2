import React from "react"
import { BarChart2 } from "lucide-react"
import { MiniBar, SectionTitle } from "../kpi-card"

export interface DistributionItem {
  key: string
  label: string
  count: number
  color: string
}

interface EstadoHUChartProps {
  byEstado: DistributionItem[]
  byPrioridad: DistributionItem[]
  totalHUs: number
  maxEstado: number
  maxPrio: number
}

import { AlertTriangle } from "lucide-react"

export function EstadoHUChart({ byEstado, byPrioridad, totalHUs, maxEstado, maxPrio }: EstadoHUChartProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Distribucion por estado */}
      <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
        <SectionTitle icon={<BarChart2 size={14} />} title="HUs por Estado" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {byEstado.map(({ key, label, count, color }) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round((count / totalHUs) * 100)}%</span>
              </div>
              <MiniBar value={count} max={maxEstado} color={color} />
            </div>
          ))}
        </div>
      </div>

      {/* Distribucion por prioridad */}
      <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
        <SectionTitle icon={<AlertTriangle size={14} />} title="HUs por Prioridad" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {byPrioridad.map(({ key, label, count, color }) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round((count / totalHUs) * 100)}%</span>
              </div>
              <MiniBar value={count} max={maxPrio} color={color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
