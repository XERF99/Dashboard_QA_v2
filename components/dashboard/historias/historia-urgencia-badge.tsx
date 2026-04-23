"use client"

import { Clock } from "lucide-react"

interface Props {
  fecha?: Date
  estado: string
}

export function UrgenciaBadge({ fecha, estado }: Props) {
  if (!fecha || estado === "exitosa" || estado === "cancelada") return null
  const dias = Math.ceil((fecha.getTime() - Date.now()) / 86400000)
  if (dias > 14) return null

  const vencida = dias <= 0
  const critica = dias > 0 && dias <= 3
  const alerta  = dias > 3 && dias <= 7

  const color = vencida ? "var(--chart-4)" : critica ? "var(--chart-4)" : alerta ? "var(--chart-3)" : "var(--chart-2)"
  const bg    = vencida ? "color-mix(in oklch,var(--chart-4) 12%,transparent)"
              : critica ? "color-mix(in oklch,var(--chart-4) 10%,transparent)"
              : alerta  ? "color-mix(in oklch,var(--chart-3) 10%,transparent)"
              :            "color-mix(in oklch,var(--chart-2) 10%,transparent)"
  const label = vencida ? "Vencida" : dias === 1 ? "Mañana" : `${dias}d`

  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:3,
      padding:"1px 6px", borderRadius:6, border:`1px solid ${color}`,
      background:bg, color, fontSize:9, fontWeight:700, flexShrink:0,
    }}>
      <Clock size={9} style={{ flexShrink:0 }}/>
      {label}
    </span>
  )
}
