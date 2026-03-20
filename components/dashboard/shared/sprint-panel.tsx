"use client"

import { CalendarDays } from "lucide-react"
import type { HistoriaUsuario } from "@/lib/types"

interface SprintPanelProps {
  historias: HistoriaUsuario[]
  sprints: string[]
  filtroSprint: string
  onChangeSprint: (sprint: string) => void
}

export function SprintPanel({ historias, sprints, filtroSprint, onChangeSprint }: SprintPanelProps) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Tabs de sprint */}
      <div className="overflow-x-auto -mx-1 px-1 pb-0.5 no-scrollbar">
        <div style={{ display:"flex", gap:5 }}>
          <button
            onClick={() => onChangeSprint("todos")}
            style={{
              display:"inline-flex", alignItems:"center", gap:5,
              padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
              border:`1px solid ${filtroSprint==="todos" ? "var(--primary)" : "var(--border)"}`,
              background: filtroSprint==="todos" ? "var(--primary)" : "var(--secondary)",
              color: filtroSprint==="todos" ? "var(--primary-foreground)" : "var(--muted-foreground)",
              whiteSpace:"nowrap",
            }}
          >
            <CalendarDays size={11}/> Todos
          </button>
          {sprints.map(sp => {
            const activo = filtroSprint === sp
            const husEnSprint = historias.filter(h => h.sprint === sp)
            const completadas = husEnSprint.filter(h => h.estado === "exitosa").length
            return (
              <button
                key={sp}
                onClick={() => onChangeSprint(activo ? "todos" : sp)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:5,
                  padding:"5px 12px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
                  border:`1px solid ${activo ? "var(--primary)" : "var(--border)"}`,
                  background: activo ? "var(--primary)" : "var(--secondary)",
                  color: activo ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  whiteSpace:"nowrap",
                }}
              >
                {sp}
                <span style={{
                  fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:5,
                  background: activo ? "rgba(255,255,255,0.25)" : "color-mix(in oklch, var(--primary) 15%, transparent)",
                  color: activo ? "var(--primary-foreground)" : "var(--primary)",
                }}>
                  {completadas}/{husEnSprint.length}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Card de resumen del sprint activo */}
      {filtroSprint !== "todos" && filtroSprint !== "__sin_sprint__" && (() => {
        const husEnSprint = historias.filter(h => h.sprint === filtroSprint)
        const sinIniciar  = husEnSprint.filter(h => h.estado === "sin_iniciar").length
        const enProgreso  = husEnSprint.filter(h => h.estado === "en_progreso").length
        const exitosas    = husEnSprint.filter(h => h.estado === "exitosa").length
        const fallidas    = husEnSprint.filter(h => h.estado === "fallida" || h.estado === "cancelada").length
        const pct         = husEnSprint.length > 0 ? Math.round((exitosas / husEnSprint.length) * 100) : 0
        const puntosTotales    = husEnSprint.reduce((s,h) => s + h.puntos, 0)
        const puntosEjecutados = husEnSprint.filter(h => h.estado === "exitosa").reduce((s,h) => s + h.puntos, 0)

        return (
          <div style={{ padding:"14px 16px", borderRadius:10, border:"1px solid var(--border)", background:"var(--card)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <p style={{ fontSize:12, fontWeight:700, color:"var(--foreground)" }}>{filtroSprint}</p>
              <span style={{ fontSize:11, color:"var(--muted-foreground)" }}>
                Progreso: <strong style={{ color:"var(--primary)" }}>{pct}%</strong>
                {" · "}{puntosTotales} pts ({puntosEjecutados} completados)
              </span>
            </div>
            {/* Barra de progreso */}
            <div style={{ height:5, borderRadius:4, background:"var(--secondary)", overflow:"hidden", marginBottom:12 }}>
              <div style={{ width:`${pct}%`, height:"100%", background:"var(--chart-2)", borderRadius:4 }}/>
            </div>
            {/* Distribución de estados */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label:"Sin iniciar",   value:sinIniciar, color:"var(--muted-foreground)" },
                { label:"En progreso",   value:enProgreso, color:"var(--chart-1)" },
                { label:"Exitosas",      value:exitosas,   color:"var(--chart-2)" },
                { label:"Fallidas/Canc", value:fallidas,   color:"var(--chart-4)" },
              ].map(s => (
                <div key={s.label} style={{ textAlign:"center", padding:"8px 4px", borderRadius:7, background:"var(--background)" }}>
                  <p style={{ fontSize:20, fontWeight:800, color:s.value > 0 ? s.color : "var(--muted-foreground)", lineHeight:1 }}>{s.value}</p>
                  <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--muted-foreground)", marginTop:3 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
