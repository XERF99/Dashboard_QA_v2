"use client"

import { useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"
import type { HistoriaUsuario } from "@/lib/types"

interface MiniCalendarioProps {
  historias: HistoriaUsuario[]
  onVerHU: (hu: HistoriaUsuario) => void
}

const MESES_CAL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DIAS_CAL  = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"]

export function MiniCalendario({ historias, onVerHU }: MiniCalendarioProps) {
  const hoyRef = useMemo(() => new Date(), [])
  const [mes, setMes]             = useState({ year: hoyRef.getFullYear(), month: hoyRef.getMonth() })
  const [diaActivo, setDiaActivo] = useState<number | null>(null)

  const husPorDia = useMemo(() => {
    const map = new Map<number, HistoriaUsuario[]>()
    historias.forEach(hu => {
      if (!hu.fechaFinEstimada || hu.estado === "cancelada" || hu.estado === "exitosa") return
      const f = hu.fechaFinEstimada
      if (f.getFullYear() === mes.year && f.getMonth() === mes.month) {
        const d = f.getDate()
        map.set(d, [...(map.get(d) ?? []), hu])
      }
    })
    return map
  }, [historias, mes])

  const offsetLunes = (new Date(mes.year, mes.month, 1).getDay() + 6) % 7
  const diasEnMes   = new Date(mes.year, mes.month + 1, 0).getDate()
  const esMesActual = mes.year === hoyRef.getFullYear() && mes.month === hoyRef.getMonth()
  const celdas: (number | null)[] = [
    ...Array(offsetLunes).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]
  while (celdas.length % 7 !== 0) celdas.push(null)

  const colorUrgencia = (day: number): string | null => {
    if (!husPorDia.has(day)) return null
    const dias = Math.ceil((new Date(mes.year, mes.month, day).getTime() - Date.now()) / 86400000)
    if (dias <= 0) return "var(--chart-4)"
    if (dias <= 3) return "var(--chart-4)"
    if (dias <= 7) return "var(--chart-3)"
    return "var(--chart-2)"
  }

  const prevMes = () => { setDiaActivo(null); setMes(m => m.month === 0 ? { year: m.year-1, month: 11 } : { year: m.year, month: m.month-1 }) }
  const nextMes = () => { setDiaActivo(null); setMes(m => m.month === 11 ? { year: m.year+1, month: 0 } : { year: m.year, month: m.month+1 }) }

  const husActivo = diaActivo ? (husPorDia.get(diaActivo) ?? []) : []
  const totalMes  = [...husPorDia.values()].reduce((n, arr) => n + arr.length, 0)

  return (
    <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:12, padding:"18px 20px", display:"flex", flexDirection:"column", gap:0 }}>

      {/* Cabecera */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <CalendarDays size={14} style={{ color:"var(--primary)" }}/>
          <span style={{ fontSize:13, fontWeight:700, color:"var(--foreground)" }}>Calendario de Entregas</span>
          {totalMes > 0 && (
            <span style={{ fontSize:10, fontWeight:700, background:"color-mix(in oklch, var(--primary) 14%, transparent)", color:"var(--primary)", borderRadius:8, padding:"2px 7px" }}>
              {totalMes} HU{totalMes!==1?"s":""}
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <button onClick={prevMes} style={{ background:"none", border:"1px solid var(--border)", borderRadius:5, cursor:"pointer", padding:"2px 9px", fontSize:14, color:"var(--foreground)", lineHeight:1.4 }}>‹</button>
          <span style={{ fontSize:12, fontWeight:700, minWidth:90, textAlign:"center", color:"var(--foreground)" }}>
            {MESES_CAL[mes.month]} {mes.year}
          </span>
          <button onClick={nextMes} style={{ background:"none", border:"1px solid var(--border)", borderRadius:5, cursor:"pointer", padding:"2px 9px", fontSize:14, color:"var(--foreground)", lineHeight:1.4 }}>›</button>
        </div>
      </div>

      {/* Grid semana + días */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:2 }}>
        {DIAS_CAL.map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--muted-foreground)", paddingBottom:6 }}>
            {d}
          </div>
        ))}
        {celdas.map((day, i) => {
          if (day === null) return <div key={`e${i}`}/>
          const hus    = husPorDia.get(day) ?? []
          const color  = colorUrgencia(day)
          const esHoy  = esMesActual && day === hoyRef.getDate()
          const activo = diaActivo === day && hus.length > 0
          return (
            <div
              key={day}
              onClick={() => hus.length > 0 && setDiaActivo(activo ? null : day)}
              className={hus.length > 0 ? "hover:bg-secondary/70" : ""}
              style={{
                position:"relative", textAlign:"center", padding:"5px 2px 9px",
                borderRadius:6, fontSize:11, cursor: hus.length > 0 ? "pointer" : "default",
                fontWeight: esHoy ? 700 : 400,
                color: esHoy ? "var(--primary)" : "var(--foreground)",
                background: activo
                  ? "color-mix(in oklch, var(--primary) 13%, transparent)"
                  : esHoy
                  ? "color-mix(in oklch, var(--primary) 7%, transparent)"
                  : "transparent",
                border: esHoy
                  ? "1px solid color-mix(in oklch, var(--primary) 28%, transparent)"
                  : "1px solid transparent",
                transition:"background 0.1s",
              }}
            >
              {day}
              {color && (
                <div style={{
                  position:"absolute", bottom:3, left:"50%", transform:"translateX(-50%)",
                  width: Math.min(hus.length * 4 + 2, 14), height:3, borderRadius:2,
                  background: color,
                }}/>
              )}
            </div>
          )
        })}
      </div>

      {/* HUs del día seleccionado */}
      {diaActivo && husActivo.length > 0 && (
        <div style={{ marginTop:12, borderTop:"1px solid var(--border)", paddingTop:10 }}>
          <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--muted-foreground)", marginBottom:7 }}>
            {diaActivo} de {MESES_CAL[mes.month]}
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            {husActivo.map(hu => {
              const dias = Math.ceil((hu.fechaFinEstimada!.getTime() - Date.now()) / 86400000)
              const bc   = dias <= 0 ? "var(--chart-4)" : dias <= 3 ? "var(--chart-4)" : dias <= 7 ? "var(--chart-3)" : "var(--chart-2)"
              return (
                <div key={hu.id} onClick={() => onVerHU(hu)} className="hover:bg-secondary/60"
                  style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 8px", borderRadius:6, border:"1px solid var(--border)", cursor:"pointer" }}>
                  <span style={{ fontSize:9, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, flexShrink:0 }}>{hu.codigo}</span>
                  <span style={{ fontSize:11, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", color:"var(--foreground)" }}>{hu.titulo}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:bc, flexShrink:0, background:`color-mix(in oklch, ${bc} 12%, transparent)`, padding:"1px 5px", borderRadius:4 }}>
                    {dias <= 0 ? "Vencida" : `${dias}d`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div style={{ display:"flex", gap:12, marginTop:14, flexWrap:"wrap" }}>
        {[
          { color:"var(--chart-4)", label:"Vencida / ≤ 3d" },
          { color:"var(--chart-3)", label:"≤ 7 días" },
          { color:"var(--chart-2)", label:"Próxima" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:8, height:3, borderRadius:2, background:color }}/>
            <span style={{ fontSize:9, color:"var(--muted-foreground)" }}>{label}</span>
          </div>
        ))}
        {totalMes === 0 && (
          <span style={{ fontSize:11, color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin entregas este mes</span>
        )}
      </div>
    </div>
  )
}
