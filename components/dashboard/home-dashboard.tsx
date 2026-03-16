"use client"

import { useMemo, useState } from "react"
import { Progress } from "@/components/ui/progress"
import {
  Activity, AlertTriangle, ArrowRight, BarChart2,
  CalendarDays, CheckCircle, Clock, Flag, ShieldAlert, User2,
  XCircle, Zap, ClipboardList,
} from "lucide-react"
import {
  PRIORIDAD_CFG,
  type HistoriaUsuario, type CasoPrueba, type Tarea,
} from "@/lib/types"
import { PanelRiesgos } from "./panel-riesgos"

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  tareas: Tarea[]
  onVerHU: (hu: HistoriaUsuario) => void
  onIrATab: (tab: string) => void
}

// ── Helpers ──────────────────────────────────────────────
function formatRelativa(fecha: Date): string {
  const dif = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (dif < 1)  return "ahora"
  if (dif < 60) return `${dif}m`
  const h = Math.floor(dif / 60)
  if (h < 24)   return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function eventoIcon(tipo: string) {
  if (tipo.includes("completada") || tipo.includes("aprobado")) return <CheckCircle size={12} style={{ color: "var(--chart-2)", flexShrink: 0 }} />
  if (tipo.includes("cancelada") || tipo.includes("fallida") || tipo.includes("rechazado")) return <XCircle size={12} style={{ color: "var(--chart-4)", flexShrink: 0 }} />
  if (tipo.includes("bloqueo")) return <AlertTriangle size={12} style={{ color: "var(--chart-3)", flexShrink: 0 }} />
  if (tipo.includes("iniciada") || tipo.includes("avanzada")) return <Zap size={12} style={{ color: "var(--chart-1)", flexShrink: 0 }} />
  return <Activity size={12} style={{ color: "var(--primary)", flexShrink: 0 }} />
}

// ── Mini Calendario de entregas ───────────────────────────
const MESES_CAL = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DIAS_CAL  = ["Lu","Ma","Mi","Ju","Vi","Sá","Do"]

function MiniCalendario({ historias, onVerHU }: { historias: HistoriaUsuario[]; onVerHU: (hu: HistoriaUsuario) => void }) {
  const hoyRef = useMemo(() => new Date(), [])
  const [mes, setMes]         = useState({ year: hoyRef.getFullYear(), month: hoyRef.getMonth() })
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

  const offsetLunes  = (new Date(mes.year, mes.month, 1).getDay() + 6) % 7
  const diasEnMes    = new Date(mes.year, mes.month + 1, 0).getDate()
  const esMesActual  = mes.year === hoyRef.getFullYear() && mes.month === hoyRef.getMonth()
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
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
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
          <span style={{ fontSize:12, fontWeight:700, minWidth:140, textAlign:"center", color:"var(--foreground)" }}>
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

// ── Componente principal ──────────────────────────────────
export function HomeDashboard({ historias, casos, tareas, onVerHU, onIrATab }: Props) {

  // ── KPIs base ──
  const kpi = useMemo(() => {
    const total      = historias.length
    const sinIniciar = historias.filter(h => h.estado === "sin_iniciar").length
    const enProgreso = historias.filter(h => h.estado === "en_progreso").length
    const exitosas   = historias.filter(h => h.estado === "exitosa").length
    const fallidas   = historias.filter(h => h.estado === "fallida").length
    const canceladas = historias.filter(h => h.estado === "cancelada").length
    const progresoPct = total > 0 ? Math.round((exitosas / total) * 100) : 0

    const totalCasos      = casos.length
    const casosPendientes = casos.filter(c => c.estadoAprobacion === "pendiente_aprobacion").length

    const totalBloqueos =
      historias.reduce((n, h) => n + h.bloqueos.filter(b => !b.resuelto).length, 0) +
      casos.reduce((n, c) => n + c.bloqueos.filter(b => !b.resuelto).length, 0) +
      tareas.reduce((n, t) => n + t.bloqueos.filter(b => !b.resuelto).length, 0)

    return { total, sinIniciar, enProgreso, exitosas, fallidas, canceladas, progresoPct,
             totalCasos, casosPendientes, totalBloqueos }
  }, [historias, casos, tareas])

  // ── HUs urgentes (en_progreso + vence en ≤7 días) ──
  const husUrgentes = useMemo(() => {
    const now = Date.now()
    return historias
      .filter(h => h.estado === "en_progreso" && h.fechaFinEstimada)
      .map(h => ({ hu: h, dias: Math.ceil((h.fechaFinEstimada!.getTime() - now) / 86400000) }))
      .filter(({ dias }) => dias <= 7)
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 4)
  }, [historias])

  // ── Actividad reciente (últimos 7 eventos globales) ──
  const actividadReciente = useMemo(() =>
    historias
      .flatMap(h => h.historial.map(ev => ({ ev, hu: h })))
      .sort((a, b) => b.ev.fecha.getTime() - a.ev.fecha.getTime())
      .slice(0, 7)
  , [historias])

  // ── Por prioridad ──
  const byPrioridad = useMemo(() => {
    const counts: Record<string, number> = { critica: 0, alta: 0, media: 0, baja: 0 }
    historias.forEach(h => { counts[h.prioridad] = (counts[h.prioridad] ?? 0) + 1 })
    const max = Math.max(...Object.values(counts), 1)
    return { counts, max }
  }, [historias])

  // ── Top responsables ──
  const topResponsables = useMemo(() => {
    const map = new Map<string, { total: number; activas: number }>()
    historias.forEach(h => {
      const cur = map.get(h.responsable) ?? { total: 0, activas: 0 }
      cur.total++
      if (h.estado === "en_progreso" || h.estado === "sin_iniciar") cur.activas++
      map.set(h.responsable, cur)
    })
    return [...map.entries()]
      .map(([nombre, d]) => ({ nombre, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
  }, [historias])

  // ── HUs con vencimiento este mes (calendario) ──
  const husVencimientoMesActual = useMemo(() => {
    const ahora = new Date()
    return historias
      .filter(h => h.fechaFinEstimada && h.estado !== "cancelada" && h.estado !== "exitosa")
      .filter(h => {
        const f = h.fechaFinEstimada!
        return f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth()
      })
      .sort((a, b) => a.fechaFinEstimada!.getTime() - b.fechaFinEstimada!.getTime())
  }, [historias])

  // ── Distribución por estado ──
  const estadosDist = [
    { label: "En Progreso", color: "var(--chart-1)",          count: kpi.enProgreso },
    { label: "Exitosas",    color: "var(--chart-2)",          count: kpi.exitosas },
    { label: "Sin Iniciar", color: "var(--muted-foreground)", count: kpi.sinIniciar },
    { label: "Fallidas",    color: "var(--chart-4)",          count: kpi.fallidas },
    { label: "Canceladas",  color: "var(--chart-4)",          count: kpi.canceladas },
  ]

  // ── Estilos base reutilizables ──
  const CARD: React.CSSProperties = {
    background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
  }
  const SECTION_TITLE: React.CSSProperties = {
    fontSize: 13, fontWeight: 700, color: "var(--foreground)",
  }
  const LABEL_UPPER: React.CSSProperties = {
    fontSize: 10, textTransform: "uppercase" as const,
    letterSpacing: "0.08em", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6,
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Fila 1: KPI Strip (6 tarjetas) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">

        <div style={{ ...CARD, padding: "14px 16px" }}>
          <p style={LABEL_UPPER}>HUs Total</p>
          <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: "var(--foreground)" }}>{kpi.total}</p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>historias registradas</p>
        </div>

        <div style={{ ...CARD, padding: "14px 16px", borderLeft: "3px solid var(--chart-1)" }}>
          <p style={LABEL_UPPER}>En Progreso</p>
          <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: "var(--chart-1)" }}>{kpi.enProgreso}</p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
            {kpi.total > 0 ? Math.round((kpi.enProgreso / kpi.total) * 100) : 0}% del total
          </p>
        </div>

        <div style={{ ...CARD, padding: "14px 16px", borderLeft: "3px solid var(--chart-2)" }}>
          <p style={LABEL_UPPER}>Exitosas</p>
          <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: "var(--chart-2)" }}>{kpi.exitosas}</p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>{kpi.progresoPct}% completado</p>
        </div>

        <div style={{ ...CARD, padding: "14px 16px" }}>
          <p style={LABEL_UPPER}>Casos de Prueba</p>
          <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: "var(--foreground)" }}>{kpi.totalCasos}</p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>casos registrados</p>
        </div>

        <div style={{ ...CARD, padding: "14px 16px", ...(kpi.casosPendientes > 0 ? { borderLeft: "3px solid var(--chart-3)" } : {}) }}>
          <p style={LABEL_UPPER}>Pend. Aprobación</p>
          <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: kpi.casosPendientes > 0 ? "var(--chart-3)" : "var(--muted-foreground)" }}>
            {kpi.casosPendientes}
          </p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>casos por revisar</p>
        </div>

        <div style={{ ...CARD, padding: "14px 16px", ...(kpi.totalBloqueos > 0 ? { borderLeft: "3px solid var(--chart-4)" } : {}) }}>
          <p style={LABEL_UPPER}>Bloqueos Activos</p>
          <p style={{ fontSize: 28, fontWeight: 800, lineHeight: 1, color: kpi.totalBloqueos > 0 ? "var(--chart-4)" : "var(--muted-foreground)" }}>
            {kpi.totalBloqueos}
          </p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>sin resolver</p>
        </div>
      </div>

      {/* ── Panel de Riesgos ── */}
      <PanelRiesgos historias={historias} casos={casos} onVerHU={onVerHU} onIrATab={onIrATab} />

      {/* ── Fila 2: Distribución + Alertas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3.5">

        {/* Distribución por estado */}
        <div style={{ ...CARD, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <BarChart2 size={14} style={{ color: "var(--primary)" }} />
              <span style={SECTION_TITLE}>Distribución de Historias</span>
            </div>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              Progreso global: <strong style={{ color: "var(--primary)" }}>{kpi.progresoPct}%</strong>
            </span>
          </div>
          <Progress value={kpi.progresoPct} className="h-2 mb-5" />
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {estadosDist.map(({ label, color, count }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{count}</span>
                    <span style={{ fontSize: 10, color: "var(--muted-foreground)", minWidth: 30, textAlign: "right" }}>
                      {kpi.total > 0 ? Math.round((count / kpi.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "var(--secondary)", overflow: "hidden" }}>
                  <div style={{ width: `${kpi.total > 0 ? Math.round((count / kpi.total) * 100) : 0}%`, height: "100%", background: color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onIrATab("historias")}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 16, fontSize: 12, fontWeight: 600, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Ver todas las historias <ArrowRight size={12} />
          </button>
        </div>

        {/* Alertas: urgentes + bloqueos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* HUs próximas a vencer */}
          <div style={{ ...CARD, padding: "16px 18px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <Clock size={13} style={{ color: "var(--chart-3)" }} />
              <span style={SECTION_TITLE}>Próximas a Vencer</span>
              {husUrgentes.length > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: "color-mix(in oklch, var(--chart-3) 15%, transparent)", color: "var(--chart-3)", borderRadius: 8, padding: "2px 7px" }}>
                  {husUrgentes.length}
                </span>
              )}
            </div>
            {husUrgentes.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>Sin HUs urgentes</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {husUrgentes.map(({ hu, dias }) => {
                  const vencida = dias <= 0
                  const color = dias <= 3 ? "var(--chart-4)" : "var(--chart-3)"
                  return (
                    <div key={hu.id}
                      onClick={() => onVerHU(hu)}
                      className="hover:bg-secondary/60"
                      style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 7, border: "1px solid var(--border)" }}
                    >
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--primary)", fontWeight: 700, flexShrink: 0, minWidth: 54 }}>{hu.codigo}</span>
                      <span style={{ fontSize: 11, color: "var(--foreground)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hu.titulo}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0, background: `color-mix(in oklch, ${color} 10%, transparent)`, padding: "2px 6px", borderRadius: 5 }}>
                        {vencida ? "Vencida" : dias === 1 ? "Mañana" : `${dias}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bloqueos activos */}
          <div style={{ ...CARD, padding: "16px 18px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <ShieldAlert size={13} style={{ color: kpi.totalBloqueos > 0 ? "var(--chart-4)" : "var(--muted-foreground)" }} />
              <span style={SECTION_TITLE}>Bloqueos Activos</span>
              {kpi.totalBloqueos > 0 && (
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: "color-mix(in oklch, var(--chart-4) 15%, transparent)", color: "var(--chart-4)", borderRadius: 8, padding: "2px 7px" }}>
                  {kpi.totalBloqueos}
                </span>
              )}
            </div>
            {kpi.totalBloqueos === 0 ? (
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>Sin bloqueos activos</p>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {historias
                    .filter(h => h.bloqueos.some(b => !b.resuelto))
                    .slice(0, 3)
                    .map(hu => (
                      <div key={hu.id}
                        onClick={() => onVerHU(hu)}
                        className="hover:bg-secondary/60"
                        style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 8px", borderRadius: 7, border: "1px solid color-mix(in oklch, var(--chart-4) 30%, var(--border))" }}
                      >
                        <AlertTriangle size={10} style={{ color: "var(--chart-4)", flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontFamily: "monospace", color: "var(--primary)", fontWeight: 700, flexShrink: 0 }}>{hu.codigo}</span>
                        <span style={{ fontSize: 11, color: "var(--foreground)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hu.titulo}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--chart-4)", flexShrink: 0 }}>
                          {hu.bloqueos.filter(b => !b.resuelto).length}
                        </span>
                      </div>
                    ))
                  }
                </div>
                <button
                  onClick={() => onIrATab("bloqueos")}
                  style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 10, fontSize: 12, fontWeight: 600, color: "var(--chart-4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                >
                  Ver todos los bloqueos <ArrowRight size={12} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Fila 3: Actividad reciente + Prioridad + Responsables ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3.5">

        {/* Actividad reciente */}
        <div style={{ ...CARD, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <Activity size={14} style={{ color: "var(--primary)" }} />
            <span style={SECTION_TITLE}>Actividad Reciente</span>
          </div>
          {actividadReciente.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>Sin actividad registrada</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {actividadReciente.map(({ ev, hu }, i) => (
                <div key={ev.id}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < actividadReciente.length - 1 ? "1px solid var(--border)" : "none" }}
                >
                  <div style={{ paddingTop: 1, flexShrink: 0 }}>{eventoIcon(ev.tipo)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.descripcion}
                    </p>
                    <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                      <button
                        onClick={() => onVerHU(hu)}
                        style={{ fontSize: 10, fontFamily: "monospace", color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0, fontWeight: 700 }}
                      >
                        {hu.codigo}
                      </button>
                      <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>· {ev.usuario}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 10, color: "var(--muted-foreground)", flexShrink: 0 }}>{formatRelativa(ev.fecha)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prioridad + Responsables */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Por prioridad */}
          <div style={{ ...CARD, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <Flag size={13} style={{ color: "var(--primary)" }} />
              <span style={SECTION_TITLE}>HUs por Prioridad</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {(["critica", "alta", "media", "baja"] as const).map(p => {
                const cfg   = PRIORIDAD_CFG[p]
                const count = byPrioridad.counts[p] ?? 0
                const pct   = byPrioridad.max > 0 ? Math.round((count / byPrioridad.max) * 100) : 0
                const opacity = p === "critica" ? 1 : p === "alta" ? 0.75 : p === "media" ? 0.5 : 0.3
                return (
                  <div key={p}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: "var(--foreground)" }}>{cfg.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }}>{count}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 3, background: "var(--secondary)", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--primary)", opacity, borderRadius: 3 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top responsables */}
          <div style={{ ...CARD, padding: "16px 18px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <User2 size={13} style={{ color: "var(--primary)" }} />
                <span style={SECTION_TITLE}>Responsables</span>
              </div>
              <button
                onClick={() => onIrATab("carga")}
                style={{ fontSize: 11, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, padding: 0 }}
              >
                Carga <ArrowRight size={11} />
              </button>
            </div>
            {topResponsables.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>Sin datos</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {topResponsables.map(({ nombre, total, activas }) => (
                  <div key={nombre} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "color-mix(in oklch, var(--primary) 15%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)" }}>
                        {nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nombre}</p>
                      <p style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                        {activas} activa{activas !== 1 ? "s" : ""} · {total} total
                      </p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", flexShrink: 0 }}>{total}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fila 4: Calendario + Entregas del mes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3.5">

        <MiniCalendario historias={historias} onVerHU={onVerHU} />

        {/* Panel entregas del mes actual */}
        <div style={{ ...CARD, padding:"18px 20px", display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:14 }}>
            <Clock size={13} style={{ color:"var(--primary)" }}/>
            <span style={SECTION_TITLE}>Entregas Este Mes</span>
            {husVencimientoMesActual.length > 0 && (
              <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, background:"color-mix(in oklch, var(--primary) 14%, transparent)", color:"var(--primary)", borderRadius:8, padding:"2px 7px" }}>
                {husVencimientoMesActual.length}
              </span>
            )}
          </div>
          {husVencimientoMesActual.length === 0 ? (
            <p style={{ fontSize:12, color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin HUs con fecha de entrega este mes</p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:7, overflowY:"auto", maxHeight:320 }}>
              {husVencimientoMesActual.map(hu => {
                const dias  = Math.ceil((hu.fechaFinEstimada!.getTime() - Date.now()) / 86400000)
                const bc    = dias <= 0 ? "var(--chart-4)" : dias <= 3 ? "var(--chart-4)" : dias <= 7 ? "var(--chart-3)" : "var(--primary)"
                const fecha = hu.fechaFinEstimada!
                const dia   = String(fecha.getDate()).padStart(2,"0")
                const mesN  = String(fecha.getMonth()+1).padStart(2,"0")
                return (
                  <div key={hu.id} onClick={() => onVerHU(hu)} className="hover:bg-secondary/60"
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:8, border:"1px solid var(--border)", cursor:"pointer" }}>
                    {/* Fecha */}
                    <div style={{ flexShrink:0, textAlign:"center", minWidth:32 }}>
                      <div style={{ fontSize:15, fontWeight:800, lineHeight:1, color:bc }}>{dia}</div>
                      <div style={{ fontSize:9, color:"var(--muted-foreground)", fontWeight:600 }}>/{mesN}</div>
                    </div>
                    <div style={{ width:1, height:28, background:"var(--border)", flexShrink:0 }}/>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:"var(--primary)", fontFamily:"monospace" }}>{hu.codigo}</p>
                      <p style={{ fontSize:12, color:"var(--foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{hu.titulo}</p>
                    </div>
                    {/* Badge días */}
                    <span style={{ fontSize:10, fontWeight:700, color:bc, flexShrink:0, background:`color-mix(in oklch, ${bc} 10%, transparent)`, padding:"2px 6px", borderRadius:5, border:`1px solid color-mix(in oklch, ${bc} 25%, transparent)` }}>
                      {dias <= 0 ? "Vencida" : dias === 1 ? "Mañana" : `${dias}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Accesos rápidos ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {([
          { tab: "historias", icon: <BarChart2 size={13}/>, label: "Ver Historias" },
          { tab: "casos",     icon: <ClipboardList size={13}/>, label: "Ver Casos" },
          { tab: "analytics", icon: <Activity size={13}/>, label: "Analytics" },
          { tab: "bloqueos",  icon: <ShieldAlert size={13}/>, label: "Bloqueos" },
        ] as const).map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => onIrATab(tab)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "1px solid var(--border)", background: "var(--secondary)",
              color: "var(--foreground)", cursor: "pointer",
            }}
            className="hover:bg-secondary/70 hover:border-primary/30"
          >
            {icon} {label}
          </button>
        ))}
      </div>

    </div>
  )
}
