"use client"

import { TrendingUp } from "lucide-react"
import type { HistoriaUsuario } from "@/lib/types"
import { fmtCorto, fmtHora } from "@/lib/types"
import { PNL } from "./hu-detail-shared"

interface HUHistorialPanelProps {
  historial: HistoriaUsuario["historial"]
}

export function HUHistorialPanel({ historial }: HUHistorialPanelProps) {
  return (
    <div style={PNL}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
        <TrendingUp size={13} className="text-chart-1"/>
        <p style={{ fontSize:12, fontWeight:700, color:"var(--foreground)" }}>Historial</p>
      </div>
      {historial.length===0
        ? <p style={{ fontSize:12, color:"var(--muted-foreground)", textAlign:"center", padding:"12px 0" }}>Sin eventos</p>
        : (
          <div style={{ display:"flex", flexDirection:"column", maxHeight:520, overflowY:"auto" }} className="no-scrollbar">
            {[...historial].reverse().map((ev,i)=>{
              const isLast = i===historial.length-1
              const dotColor =
                ev.tipo.includes("bloqueo") ? (ev.tipo === "bloqueo_resuelto" ? "var(--chart-2)" : "var(--chart-4)") :
                ev.tipo.includes("rechazado") || ev.tipo.includes("cancelada") || ev.tipo.includes("fallida") ? "var(--chart-4)" :
                ev.tipo.includes("aprobado") || ev.tipo.includes("completada") || ev.tipo.includes("exitosa") ? "var(--chart-2)" :
                "var(--chart-1)"
              return (
                <div key={ev.id} style={{ display:"flex", gap:8 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", marginTop:4, flexShrink:0,
                      background:dotColor, boxShadow:`0 0 0 2px ${dotColor}` }}/>
                    {!isLast && <div style={{ width:2, flex:1, minHeight:14, margin:"2px 0", background:"var(--border)" }}/>}
                  </div>
                  <div style={{ paddingBottom:isLast?0:14, flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, color:"var(--foreground)", lineHeight:1.4, marginBottom:2 }}>{ev.descripcion}</p>
                    <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{fmtCorto(ev.fecha)} · <span style={{ fontFamily:"monospace" }}>{fmtHora(ev.fecha)}</span></p>
                    <p style={{ fontSize:10, fontWeight:600, color:"var(--foreground)" }}>{ev.usuario}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
