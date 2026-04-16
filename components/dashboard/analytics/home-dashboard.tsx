"use client"

import { useMemo } from "react"
import { Progress } from "@/components/ui/progress"
import {
  Activity, AlertTriangle, ArrowRight, BarChart2,
  CheckCircle, Clock, Flag, ShieldAlert, User2,
  XCircle, Zap, ClipboardList,
} from "lucide-react"
import {
  PRIORIDAD_CFG,
  type HistoriaUsuario, type CasoPrueba, type Tarea,
} from "@/lib/types"
import { PanelRiesgos } from "../shared/panel-riesgos"
import { MiniCalendario } from "./mini-calendario"

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  tareas: Tarea[]
  onVerHU: (hu: HistoriaUsuario) => void
  onIrATab: (tab: string) => void
}

function formatRelativa(fecha: Date): string {
  const dif = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (dif < 1)  return "ahora"
  if (dif < 60) return `${dif}m`
  const h = Math.floor(dif / 60)
  if (h < 24)   return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function eventoIcon(tipo: string) {
  if (tipo.includes("completada") || tipo.includes("aprobado")) return <CheckCircle size={12} className="text-chart-2 shrink-0" />
  if (tipo.includes("cancelada") || tipo.includes("fallida") || tipo.includes("rechazado")) return <XCircle size={12} className="text-chart-4 shrink-0" />
  if (tipo.includes("bloqueo")) return <AlertTriangle size={12} className="text-chart-3 shrink-0" />
  if (tipo.includes("iniciada") || tipo.includes("avanzada")) return <Zap size={12} className="text-chart-1 shrink-0" />
  return <Activity size={12} className="text-primary shrink-0" />
}

const CARD_CLS = "bg-card border border-border rounded-xl"
const SECTION_TITLE_CLS = "text-[13px] font-bold text-foreground"
const LABEL_UPPER_CLS = "text-[10px] uppercase tracking-[0.08em] font-bold text-muted-foreground mb-1.5"

export function HomeDashboard({ historias, casos, tareas, onVerHU, onIrATab }: Props) {

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

  const husUrgentes = useMemo(() => {
    const now = Date.now()
    return historias
      .filter(h => h.estado === "en_progreso" && h.fechaFinEstimada)
      .map(h => ({ hu: h, dias: Math.ceil((h.fechaFinEstimada!.getTime() - now) / 86400000) }))
      .filter(({ dias }) => dias <= 7)
      .sort((a, b) => a.dias - b.dias)
      .slice(0, 4)
  }, [historias])

  const actividadReciente = useMemo(() =>
    historias
      .flatMap(h => h.historial.map(ev => ({ ev, hu: h })))
      .sort((a, b) => b.ev.fecha.getTime() - a.ev.fecha.getTime())
      .slice(0, 7)
  , [historias])

  const byPrioridad = useMemo(() => {
    const counts: Record<string, number> = { critica: 0, alta: 0, media: 0, baja: 0 }
    historias.forEach(h => { counts[h.prioridad] = (counts[h.prioridad] ?? 0) + 1 })
    const max = Math.max(...Object.values(counts), 1)
    return { counts, max }
  }, [historias])

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

  const estadosDist = [
    { label: "En Progreso", color: "var(--chart-1)",          count: kpi.enProgreso },
    { label: "Exitosas",    color: "var(--chart-2)",          count: kpi.exitosas },
    { label: "Sin Iniciar", color: "var(--muted-foreground)", count: kpi.sinIniciar },
    { label: "Fallidas",    color: "var(--chart-4)",          count: kpi.fallidas },
    { label: "Canceladas",  color: "var(--chart-4)",          count: kpi.canceladas },
  ]

  return (
    <div className="flex flex-col gap-4">

      {/* ── Fila 1: KPI Strip (6 tarjetas) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">

        <div className={`${CARD_CLS} px-4 py-3.5`}>
          <p className={LABEL_UPPER_CLS}>HUs Total</p>
          <p className="text-[28px] font-extrabold leading-none text-foreground">{kpi.total}</p>
          <p className="text-[11px] text-muted-foreground mt-1">historias registradas</p>
        </div>

        <div className={`${CARD_CLS} px-4 py-3.5 border-l-[3px] border-l-chart-1`}>
          <p className={LABEL_UPPER_CLS}>En Progreso</p>
          <p className="text-[28px] font-extrabold leading-none text-chart-1">{kpi.enProgreso}</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {kpi.total > 0 ? Math.round((kpi.enProgreso / kpi.total) * 100) : 0}% del total
          </p>
        </div>

        <div className={`${CARD_CLS} px-4 py-3.5 border-l-[3px] border-l-chart-2`}>
          <p className={LABEL_UPPER_CLS}>Exitosas</p>
          <p className="text-[28px] font-extrabold leading-none text-chart-2">{kpi.exitosas}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{kpi.progresoPct}% completado</p>
        </div>

        <div className={`${CARD_CLS} px-4 py-3.5`}>
          <p className={LABEL_UPPER_CLS}>Casos de Prueba</p>
          <p className="text-[28px] font-extrabold leading-none text-foreground">{kpi.totalCasos}</p>
          <p className="text-[11px] text-muted-foreground mt-1">casos registrados</p>
        </div>

        <div className={`${CARD_CLS} px-4 py-3.5 ${kpi.casosPendientes > 0 ? "border-l-[3px] border-l-chart-3" : ""}`}>
          <p className={LABEL_UPPER_CLS}>Pend. Aprobación</p>
          <p className={`text-[28px] font-extrabold leading-none ${kpi.casosPendientes > 0 ? "text-chart-3" : "text-muted-foreground"}`}>
            {kpi.casosPendientes}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">casos por revisar</p>
        </div>

        <div className={`${CARD_CLS} px-4 py-3.5 ${kpi.totalBloqueos > 0 ? "border-l-[3px] border-l-chart-4" : ""}`}>
          <p className={LABEL_UPPER_CLS}>Bloqueos Activos</p>
          <p className={`text-[28px] font-extrabold leading-none ${kpi.totalBloqueos > 0 ? "text-chart-4" : "text-muted-foreground"}`}>
            {kpi.totalBloqueos}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">sin resolver</p>
        </div>
      </div>

      <PanelRiesgos historias={historias} casos={casos} onVerHU={onVerHU} onIrATab={onIrATab} />

      {/* ── Fila 2: Distribución + Alertas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3.5">

        <div className={`${CARD_CLS} px-5 py-4.5`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1.75">
              <BarChart2 size={14} className="text-primary" />
              <span className={SECTION_TITLE_CLS}>Distribución de Historias</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Progreso global: <strong className="text-primary">{kpi.progresoPct}%</strong>
            </span>
          </div>
          <Progress value={kpi.progresoPct} className="h-2 mb-5" />
          <div className="flex flex-col gap-2.75">
            {estadosDist.map(({ label, color, count }) => (
              <div key={label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold" style={{ color }}>{count}</span>
                    <span className="text-[10px] text-muted-foreground min-w-7.5 text-right">
                      {kpi.total > 0 ? Math.round((count / kpi.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="h-1.25 rounded-[3px] bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-[3px]"
                    style={{ width: `${kpi.total > 0 ? Math.round((count / kpi.total) * 100) : 0}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onIrATab("historias")}
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-primary bg-transparent border-none cursor-pointer p-0"
          >
            Ver todas las historias <ArrowRight size={12} />
          </button>
        </div>

        {/* Alertas: urgentes + bloqueos */}
        <div className="flex flex-col gap-3">

          <div className={`${CARD_CLS} px-4.5 py-4 flex-1`}>
            <div className="flex items-center gap-1.75 mb-3">
              <Clock size={13} className="text-chart-3" />
              <span className={SECTION_TITLE_CLS}>Próximas a Vencer</span>
              {husUrgentes.length > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-chart-3/15 text-chart-3 rounded-lg px-1.75 py-px">
                  {husUrgentes.length}
                </span>
              )}
            </div>
            {husUrgentes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin HUs urgentes</p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {husUrgentes.map(({ hu, dias }) => {
                  const vencida = dias <= 0
                  const color = dias <= 3 ? "var(--chart-4)" : "var(--chart-3)"
                  return (
                    <div key={hu.id}
                      onClick={() => onVerHU(hu)}
                      className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-[7px] border border-border hover:bg-secondary/60"
                    >
                      <span className="text-[10px] font-mono text-primary font-bold shrink-0 min-w-13.5">{hu.codigo}</span>
                      <span className="text-[11px] text-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{hu.titulo}</span>
                      <span
                        className="text-[10px] font-bold shrink-0 px-1.5 py-px rounded-[5px]"
                        style={{ color, background: `color-mix(in oklch, ${color} 10%, transparent)` }}
                      >
                        {vencida ? "Vencida" : dias === 1 ? "Mañana" : `${dias}d`}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={`${CARD_CLS} px-4.5 py-4 flex-1`}>
            <div className="flex items-center gap-1.75 mb-3">
              <ShieldAlert size={13} className={kpi.totalBloqueos > 0 ? "text-chart-4" : "text-muted-foreground"} />
              <span className={SECTION_TITLE_CLS}>Bloqueos Activos</span>
              {kpi.totalBloqueos > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-chart-4/15 text-chart-4 rounded-lg px-1.75 py-px">
                  {kpi.totalBloqueos}
                </span>
              )}
            </div>
            {kpi.totalBloqueos === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin bloqueos activos</p>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  {historias
                    .filter(h => h.bloqueos.some(b => !b.resuelto))
                    .slice(0, 3)
                    .map(hu => (
                      <div key={hu.id}
                        onClick={() => onVerHU(hu)}
                        className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-[7px] hover:bg-secondary/60"
                        style={{ border: "1px solid color-mix(in oklch, var(--chart-4) 30%, var(--border))" }}
                      >
                        <AlertTriangle size={10} className="text-chart-4 shrink-0" />
                        <span className="text-[10px] font-mono text-primary font-bold shrink-0">{hu.codigo}</span>
                        <span className="text-[11px] text-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{hu.titulo}</span>
                        <span className="text-[10px] font-bold text-chart-4 shrink-0">
                          {hu.bloqueos.filter(b => !b.resuelto).length}
                        </span>
                      </div>
                    ))
                  }
                </div>
                <button
                  onClick={() => onIrATab("bloqueos")}
                  className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold text-chart-4 bg-transparent border-none cursor-pointer p-0"
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

        <div className={`${CARD_CLS} px-5 py-4.5`}>
          <div className="flex items-center gap-1.75 mb-3.5">
            <Activity size={14} className="text-primary" />
            <span className={SECTION_TITLE_CLS}>Actividad Reciente</span>
          </div>
          {actividadReciente.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin actividad registrada</p>
          ) : (
            <div className="flex flex-col">
              {actividadReciente.map(({ ev, hu }, i) => (
                <div key={ev.id}
                  className={`flex items-start gap-2.5 py-2 ${i < actividadReciente.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="pt-px shrink-0">{eventoIcon(ev.tipo)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                      {ev.descripcion}
                    </p>
                    <div className="flex gap-1.5 mt-0.5">
                      <button
                        onClick={() => onVerHU(hu)}
                        className="text-[10px] font-mono text-primary bg-transparent border-none cursor-pointer p-0 font-bold"
                      >
                        {hu.codigo}
                      </button>
                      <span className="text-[10px] text-muted-foreground">· {ev.usuario}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatRelativa(ev.fecha)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">

          <div className={`${CARD_CLS} px-4.5 py-4`}>
            <div className="flex items-center gap-1.75 mb-3">
              <Flag size={13} className="text-primary" />
              <span className={SECTION_TITLE_CLS}>HUs por Prioridad</span>
            </div>
            <div className="flex flex-col gap-2.25">
              {(["critica", "alta", "media", "baja"] as const).map(p => {
                const cfg   = PRIORIDAD_CFG[p]
                const count = byPrioridad.counts[p] ?? 0
                const pct   = byPrioridad.max > 0 ? Math.round((count / byPrioridad.max) * 100) : 0
                const opacity = p === "critica" ? 1 : p === "alta" ? 0.75 : p === "media" ? 0.5 : 0.3
                return (
                  <div key={p}>
                    <div className="flex justify-between mb-0.75">
                      <span className="text-xs text-foreground">{cfg.label}</span>
                      <span className="text-[11px] font-bold text-foreground">{count}</span>
                    </div>
                    <div className="h-1 rounded-[3px] bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-[3px]" style={{ width: `${pct}%`, opacity }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={`${CARD_CLS} px-4.5 py-4 flex-1`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.75">
                <User2 size={13} className="text-primary" />
                <span className={SECTION_TITLE_CLS}>Responsables</span>
              </div>
              <button
                onClick={() => onIrATab("carga")}
                className="text-[11px] text-primary bg-transparent border-none cursor-pointer inline-flex items-center gap-1 font-semibold p-0"
              >
                Carga <ArrowRight size={11} />
              </button>
            </div>
            {topResponsables.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Sin datos</p>
            ) : (
              <div className="flex flex-col gap-2.25">
                {topResponsables.map(({ nombre, total, activas }) => (
                  <div key={nombre} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-primary">
                        {nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{nombre}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {activas} activa{activas !== 1 ? "s" : ""} · {total} total
                      </p>
                    </div>
                    <span className="text-[13px] font-bold text-foreground shrink-0">{total}</span>
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

        <div className={`${CARD_CLS} px-5 py-4.5 flex flex-col`}>
          <div className="flex items-center gap-1.75 mb-3.5">
            <Clock size={13} className="text-primary"/>
            <span className={SECTION_TITLE_CLS}>Entregas Este Mes</span>
            {husVencimientoMesActual.length > 0 && (
              <span className="ml-auto text-[10px] font-bold bg-primary/14 text-primary rounded-lg px-1.75 py-px">
                {husVencimientoMesActual.length}
              </span>
            )}
          </div>
          {husVencimientoMesActual.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Sin HUs con fecha de entrega este mes</p>
          ) : (
            <div className="flex flex-col gap-1.75 overflow-y-auto max-h-80">
              {husVencimientoMesActual.map(hu => {
                const dias  = Math.ceil((hu.fechaFinEstimada!.getTime() - Date.now()) / 86400000)
                const bc    = dias <= 0 ? "var(--chart-4)" : dias <= 3 ? "var(--chart-4)" : dias <= 7 ? "var(--chart-3)" : "var(--primary)"
                const fecha = hu.fechaFinEstimada!
                const dia   = String(fecha.getDate()).padStart(2,"0")
                const mesN  = String(fecha.getMonth()+1).padStart(2,"0")
                return (
                  <div key={hu.id} onClick={() => onVerHU(hu)}
                    className="flex items-center gap-2 px-2.5 py-1.75 rounded-lg border border-border cursor-pointer hover:bg-secondary/60"
                  >
                    <div className="shrink-0 text-center min-w-8">
                      <div className="text-[15px] font-extrabold leading-none" style={{ color: bc }}>{dia}</div>
                      <div className="text-[9px] text-muted-foreground font-semibold">/{mesN}</div>
                    </div>
                    <div className="w-px h-7 bg-border shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-primary font-mono">{hu.codigo}</p>
                      <p className="text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{hu.titulo}</p>
                    </div>
                    <span
                      className="text-[10px] font-bold shrink-0 px-1.5 py-px rounded-[5px]"
                      style={{
                        color: bc,
                        background: `color-mix(in oklch, ${bc} 10%, transparent)`,
                        border: `1px solid color-mix(in oklch, ${bc} 25%, transparent)`,
                      }}
                    >
                      {dias <= 0 ? "Vencida" : dias === 1 ? "Mañana" : `${dias}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2.5 flex-wrap">
        {([
          { tab: "historias", icon: <BarChart2 size={13}/>, label: "Ver Historias" },
          { tab: "casos",     icon: <ClipboardList size={13}/>, label: "Ver Casos" },
          { tab: "analytics", icon: <Activity size={13}/>, label: "Analytics" },
          { tab: "bloqueos",  icon: <ShieldAlert size={13}/>, label: "Bloqueos" },
        ] as const).map(({ tab, icon, label }) => (
          <button
            key={tab}
            onClick={() => onIrATab(tab)}
            className="inline-flex items-center gap-1.75 px-3.5 py-1.75 rounded-lg text-xs font-semibold border border-border bg-secondary text-foreground cursor-pointer hover:bg-secondary/70 hover:border-primary/30"
          >
            {icon} {label}
          </button>
        ))}
      </div>

    </div>
  )
}
