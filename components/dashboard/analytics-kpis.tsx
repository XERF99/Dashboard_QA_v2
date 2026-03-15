"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp, CheckCircle, XCircle, Clock, AlertTriangle,
  BarChart2, RefreshCw, Layers, Target, Users, Zap,
  FileSpreadsheet, ChevronDown, User2,
} from "lucide-react"
import { exportarAnalyticsCSV, exportarAnalyticsPDF } from "@/lib/export-utils"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG,
  ETAPAS_PREDETERMINADAS, getTipoAplicacionLabel, getAmbienteLabel,
  type HistoriaUsuario, type CasoPrueba, type Tarea,
  type EstadoHU, type PrioridadHU,
  type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef,
} from "@/lib/types"

interface AnalyticsKPIsProps {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  tareas: Tarea[]
  isQA?: boolean
  currentUserName?: string
  filtroNombres?: string[]       // undefined=all | [x]=single QA | [x,y,...]=QA Lead team
  configEtapas?: ConfigEtapas
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
}

// ── Helpers visuales ──────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: "var(--secondary)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 22, textAlign: "right" }}>{value}</span>
    </div>
  )
}

function KpiCard({ label, value, sub, color, icon, big }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode; big?: boolean
}) {
  return (
    <div style={{ padding: "16px 18px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-foreground)", fontWeight: 700, lineHeight: 1.3 }}>{label}</p>
        <div style={{ color, opacity: 0.65 }}>{icon}</div>
      </div>
      <p style={{ fontSize: big ? 34 : 28, fontWeight: 700, color, lineHeight: 1, marginBottom: 4 }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.3 }}>{sub}</p>}
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
      <div style={{ color: "var(--primary)", opacity: 0.8 }}>{icon}</div>
      <p style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{title}</p>
    </div>
  )
}

// ── Colores semánticos ────────────────────────────────────
const COLOR: Record<string, string> = {
  sin_iniciar: "var(--muted-foreground)",
  en_progreso: "var(--chart-1)",
  exitosa:     "var(--chart-2)",
  fallida:     "var(--chart-4)",
  cancelada:   "#9ca3af",
  critica:     "#dc2626",
  alta:        "var(--chart-4)",
  media:       "var(--chart-3)",
  baja:        "var(--chart-2)",
  aprobado:    "var(--chart-2)",
  rechazado:   "var(--chart-4)",
  pendiente_aprobacion: "var(--chart-3)",
  borrador:    "var(--muted-foreground)",
}

// ── Pills de navegación por persona ──────────────────────
function PillsNav({ nombres, seleccionada, onChange }: {
  nombres: string[]
  seleccionada: string | null
  onChange: (v: string | null) => void
}) {
  const pill = (active: boolean) => ({
    display: "flex", alignItems: "center", gap: 5,
    padding: "5px 14px", borderRadius: 999, fontSize: 12, fontWeight: active ? 700 : 500,
    cursor: "pointer", border: "1px solid var(--border)",
    background: active ? "var(--primary)" : "var(--card)",
    color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
    transition: "all 0.15s",
  } as React.CSSProperties)
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "var(--secondary)", border: "1px solid var(--border)" }}>
      <span style={{ fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, marginRight: 4 }}>Ver:</span>
      <button style={pill(seleccionada === null)} onClick={() => onChange(null)}>
        <Users size={12} /> Equipo
      </button>
      {nombres.map(n => (
        <button key={n} style={pill(seleccionada === n)} onClick={() => onChange(n)}>
          <User2 size={12} /> {n}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
export function AnalyticsKPIs({ historias, casos, tareas, isQA, currentUserName, filtroNombres, configEtapas = ETAPAS_PREDETERMINADAS, tiposAplicacion, ambientes }: AnalyticsKPIsProps) {

  const [exportOpen, setExportOpen] = useState(false)
  const [personaSeleccionada, setPersonaSeleccionada] = useState<string | null>(null)

  // ── Lógica de visibilidad por rol ──
  // filtroNombres undefined → admin/viewer (ve todo)
  // filtroNombres [x]       → QA (solo su propia vista)
  // filtroNombres [x,y,...] → QA Lead (puede cambiar entre equipo e individuales)
  const isMulti  = filtroNombres !== undefined && filtroNombres.length > 1
  const isSingle = filtroNombres?.length === 1

  // Nombre efectivo para filtrar: persona seleccionada (pill) ó el único QA ó null
  const nombreEfectivo = personaSeleccionada ?? (isSingle ? filtroNombres![0] : null)

  // isPersonalView: vista individual (bloqueos + story points, sin tabla de responsables)
  const isPersonalView = !!nombreEfectivo
  // Para el banner/etiqueta del título
  const nombreVista = nombreEfectivo ?? (isMulti ? "Equipo" : null)

  const husFiltradas = useMemo(() => {
    if (nombreEfectivo) {
      return historias.filter(h => h.responsable.toLowerCase() === nombreEfectivo.toLowerCase())
    }
    if (filtroNombres) {
      return historias.filter(h => filtroNombres.some(n => h.responsable.toLowerCase() === n.toLowerCase()))
    }
    // fallback legacy: isQA + currentUserName
    if (isQA && currentUserName) {
      return historias.filter(h => h.responsable.toLowerCase() === currentUserName.toLowerCase())
    }
    return historias
  }, [historias, nombreEfectivo, filtroNombres, isQA, currentUserName])

  // Casos y tareas de las HUs filtradas
  const casosIds = useMemo(() => new Set(husFiltradas.flatMap(h => h.casosIds)), [husFiltradas])
  const casosFiltrados = useMemo(() => casos.filter(c => casosIds.has(c.id)), [casos, casosIds])
  const tareasFiltradas = useMemo(() => tareas.filter(t => husFiltradas.some(h => h.id === t.huId)), [tareas, husFiltradas])

  // ── KPIs HUs ──
  const kpi = useMemo(() => {
    const total       = husFiltradas.length
    const enProgreso  = husFiltradas.filter(h => h.estado === "en_progreso").length
    const exitosas    = husFiltradas.filter(h => h.estado === "exitosa").length
    const fallidas    = husFiltradas.filter(h => h.estado === "fallida").length
    const canceladas  = husFiltradas.filter(h => h.estado === "cancelada").length
    const sinIniciar  = husFiltradas.filter(h => h.estado === "sin_iniciar").length
    const cerradas    = exitosas + fallidas + canceladas
    const tasaExito   = cerradas > 0 ? Math.round((exitosas / cerradas) * 100) : null

    const totalCasos        = casosFiltrados.length
    const casosAprobados    = casosFiltrados.filter(c => c.estadoAprobacion === "aprobado").length
    const casosPendientes   = casosFiltrados.filter(c => c.estadoAprobacion === "pendiente_aprobacion").length
    const casosRechazados   = casosFiltrados.filter(c => c.estadoAprobacion === "rechazado").length
    const casosBorrador     = casosFiltrados.filter(c => c.estadoAprobacion === "borrador").length

    // Bloqueos activos (HU + casos + tareas)
    const bloqueoHU    = husFiltradas.reduce((s, h) => s + h.bloqueos.filter(b => !b.resuelto).length, 0)
    const bloqueoCaso  = casosFiltrados.reduce((s, c) => s + c.bloqueos.filter(b => !b.resuelto).length, 0)
    const bloqueoTarea = tareasFiltradas.reduce((s, t) => s + t.bloqueos.filter(b => !b.resuelto).length, 0)
    const bloqueos     = bloqueoHU + bloqueoCaso + bloqueoTarea

    // Retesteos (intentos > 1 en alguna etapa)
    const retesteos = casosFiltrados.reduce((s, c) =>
      s + c.resultadosPorEtapa.reduce((ss, r) => ss + Math.max(0, (r.intentos?.length ?? 1) - 1), 0), 0)

    // Horas estimadas
    const horasHU     = casosFiltrados.reduce((s, c) => s + (c.horasEstimadas || 0), 0)
    const horasTareas = tareasFiltradas.reduce((s, t) => s + (t.horasEstimadas || 0), 0)

    // Puntos story
    const puntosTotales = husFiltradas.reduce((s, h) => s + (h.puntos || 0), 0)
    const puntosEntregados = husFiltradas.filter(h => h.estado === "exitosa").reduce((s, h) => s + (h.puntos || 0), 0)

    // Casos con retesteo
    const casosConRetesteo = casosFiltrados.filter(c =>
      c.resultadosPorEtapa.some(r => (r.intentos?.length ?? 1) > 1)
    ).length

    return {
      total, enProgreso, exitosas, fallidas, canceladas, sinIniciar, cerradas, tasaExito,
      totalCasos, casosAprobados, casosPendientes, casosRechazados, casosBorrador,
      bloqueos, retesteos, casosConRetesteo, horasHU, horasTareas, puntosTotales, puntosEntregados,
    }
  }, [husFiltradas, casosFiltrados, tareasFiltradas])

  // ── Distribuciones ──
  const byEstado = useMemo(() => {
    const estados: EstadoHU[] = ["en_progreso", "sin_iniciar", "exitosa", "fallida", "cancelada"]
    return estados.map(e => ({
      key: e,
      label: ESTADO_HU_CFG[e].label,
      count: husFiltradas.filter(h => h.estado === e).length,
      color: COLOR[e],
    })).filter(x => x.count > 0)
  }, [husFiltradas])

  const byPrioridad = useMemo(() => {
    const prios: PrioridadHU[] = ["critica", "alta", "media", "baja"]
    return prios.map(p => ({
      key: p,
      label: PRIORIDAD_CFG[p].label,
      count: husFiltradas.filter(h => h.prioridad === p).length,
      color: COLOR[p],
    })).filter(x => x.count > 0)
  }, [husFiltradas])

  const byTipo = useMemo(() => {
    const tipos = [...new Set(husFiltradas.map(h => h.tipoAplicacion))]
    return tipos.map(t => ({
      key: t,
      label: getTipoAplicacionLabel(t, tiposAplicacion),
      count: husFiltradas.filter(h => h.tipoAplicacion === t).length,
    })).sort((a, b) => b.count - a.count)
  }, [husFiltradas])

  const byAmbiente = useMemo(() => {
    const ambienteIds = [...new Set(husFiltradas.map(h => h.ambiente))]
    return ambienteIds.map(a => ({
      key: a,
      label: getAmbienteLabel(a, ambientes),
      count: husFiltradas.filter(h => h.ambiente === a).length,
    })).sort((a, b) => b.count - a.count)
  }, [husFiltradas, ambientes])

  const byResponsable = useMemo(() => {
    const mapa = new Map<string, { total: number; exitosas: number; fallidas: number; enProgreso: number; bloqueos: number }>()
    husFiltradas.forEach(h => {
      const cur = mapa.get(h.responsable) ?? { total: 0, exitosas: 0, fallidas: 0, enProgreso: 0, bloqueos: 0 }
      cur.total++
      if (h.estado === "exitosa") cur.exitosas++
      if (h.estado === "fallida") cur.fallidas++
      if (h.estado === "en_progreso") cur.enProgreso++
      cur.bloqueos += h.bloqueos.filter(b => !b.resuelto).length
      mapa.set(h.responsable, cur)
    })
    return [...mapa.entries()]
      .map(([nombre, d]) => {
        const cerradas = d.exitosas + d.fallidas
        return { nombre, ...d, tasaExito: cerradas > 0 ? Math.round((d.exitosas / cerradas) * 100) : null }
      })
      .sort((a, b) => b.total - a.total)
  }, [husFiltradas])

  const casosByAprobacion = useMemo(() => [
    { key: "aprobado",            label: "Aprobados",          count: kpi.casosAprobados,  color: "var(--chart-2)" },
    { key: "pendiente_aprobacion",label: "Pend. Aprobación",   count: kpi.casosPendientes, color: "var(--chart-3)" },
    { key: "rechazado",           label: "Rechazados",         count: kpi.casosRechazados, color: "var(--chart-4)" },
    { key: "borrador",            label: "Borrador",           count: kpi.casosBorrador,   color: "var(--muted-foreground)" },
  ].filter(x => x.count > 0), [kpi])

  // ── Estado vacío ──
  if (husFiltradas.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isMulti && (
          <PillsNav nombres={filtroNombres!} seleccionada={personaSeleccionada} onChange={setPersonaSeleccionada} />
        )}
        <div style={{ textAlign: "center", padding: 48, color: "var(--muted-foreground)" }}>
          <BarChart2 size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p>{nombreEfectivo ? `Sin HUs asignadas a ${nombreEfectivo}` : "Sin datos para mostrar métricas"}</p>
        </div>
      </div>
    )
  }

  const maxEstado = Math.max(...byEstado.map(x => x.count), 1)
  const maxPrio   = Math.max(...byPrioridad.map(x => x.count), 1)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Pills de navegación (QA Lead) ── */}
      {isMulti && (
        <PillsNav nombres={filtroNombres!} seleccionada={personaSeleccionada} onChange={setPersonaSeleccionada} />
      )}

      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: (isPersonalView || isMulti) ? "space-between" : "flex-end" }}>
        {isPersonalView && (
          <div style={{ padding: "10px 16px", borderRadius: 10, background: "color-mix(in oklch, var(--primary) 8%, transparent)", border: "1px solid color-mix(in oklch, var(--primary) 20%, transparent)", display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <Target size={14} style={{ color: "var(--primary)" }} />
            <p style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 600 }}>Métricas personales de <span style={{ color: "var(--primary)" }}>{nombreEfectivo}</span></p>
          </div>
        )}
        {!isPersonalView && isMulti && (
          <div style={{ padding: "10px 16px", borderRadius: 10, background: "color-mix(in oklch, var(--chart-2) 8%, transparent)", border: "1px solid color-mix(in oklch, var(--chart-2) 20%, transparent)", display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
            <Users size={14} style={{ color: "var(--chart-2)" }} />
            <p style={{ fontSize: 13, color: "var(--foreground)", fontWeight: 600 }}>Vista de equipo · <span style={{ color: "var(--chart-2)" }}>{husFiltradas.length} HU{husFiltradas.length !== 1 ? "s" : ""}</span></p>
          </div>
        )}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button
            onClick={() => setExportOpen(v => !v)}
            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid var(--border)", background: "var(--secondary)", color: "var(--foreground)" }}
          >
            <FileSpreadsheet size={13} /> Exportar <ChevronDown size={11} />
          </button>
          {exportOpen && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setExportOpen(false)} />
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50, background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.12)", padding: "6px", minWidth: 180, display: "flex", flexDirection: "column", gap: 2 }}>
                <button
                  onClick={() => { exportarAnalyticsCSV(husFiltradas, casosFiltrados, tareasFiltradas, nombreVista ? `Métricas de ${nombreVista}` : undefined, tiposAplicacion, ambientes); setExportOpen(false) }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: "none", color: "var(--foreground)", fontSize: 12, textAlign: "left", width: "100%" }}
                  className="hover:bg-secondary">
                  <FileSpreadsheet size={13} style={{ color: "var(--chart-2)" }} /> Descargar CSV
                </button>
                <button
                  onClick={() => { exportarAnalyticsPDF(husFiltradas, casosFiltrados, tareasFiltradas, nombreVista ? `Métricas de ${nombreVista}` : undefined, tiposAplicacion); setExportOpen(false) }}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: "none", color: "var(--foreground)", fontSize: 12, textAlign: "left", width: "100%" }}
                  className="hover:bg-secondary">
                  <FileSpreadsheet size={13} style={{ color: "var(--chart-4)" }} /> Exportar PDF
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Fila 1: KPIs principales ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Total HUs" value={kpi.total} sub={`${kpi.sinIniciar} sin iniciar`} color="var(--primary)" icon={<Layers size={16} />} />
        <KpiCard label="En Progreso" value={kpi.enProgreso} sub={`${kpi.bloqueos > 0 ? kpi.bloqueos + " bloqueo" + (kpi.bloqueos !== 1 ? "s" : "") : "sin bloqueos"}`} color="var(--chart-1)" icon={<Clock size={16} />} />
        <KpiCard label="Exitosas" value={kpi.exitosas} sub={`de ${kpi.cerradas} cerradas`} color="var(--chart-2)" icon={<CheckCircle size={16} />} />
        <KpiCard label="Tasa de Éxito" value={kpi.tasaExito !== null ? `${kpi.tasaExito}%` : "—"} sub={kpi.cerradas > 0 ? `${kpi.cerradas} HUs cerradas` : "Sin HUs cerradas aún"} color={kpi.tasaExito !== null ? (kpi.tasaExito >= 80 ? "var(--chart-2)" : kpi.tasaExito >= 50 ? "var(--chart-3)" : "var(--chart-4)") : "var(--muted-foreground)"} icon={<TrendingUp size={16} />} big />
      </div>

      {/* ── Fila 2: Casos + horas + retesteos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <KpiCard label="Casos de Prueba" value={kpi.totalCasos} sub={`${kpi.casosAprobados} aprobados`} color="var(--chart-1)" icon={<Target size={16} />} />
        <KpiCard label="Pend. Aprobación" value={kpi.casosPendientes} sub={`${kpi.casosRechazados} rechazados`} color={kpi.casosPendientes > 0 ? "var(--chart-3)" : "var(--muted-foreground)"} icon={<Zap size={16} />} />
        <KpiCard label="Retesteos" value={kpi.retesteos} sub={`${kpi.casosConRetesteo} caso${kpi.casosConRetesteo !== 1 ? "s" : ""} retrabaajado${kpi.casosConRetesteo !== 1 ? "s" : ""}`} color={kpi.retesteos > 0 ? "var(--chart-4)" : "var(--chart-2)"} icon={<RefreshCw size={16} />} />
        <KpiCard label="Horas Estimadas" value={`${kpi.horasHU}h`} sub={`${kpi.horasTareas}h en tareas`} color="var(--primary)" icon={<BarChart2 size={16} />} />
      </div>

      {/* ── Fila 3: Distribuciones ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Distribución por estado */}
        <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
          <SectionTitle icon={<BarChart2 size={14} />} title="HUs por Estado" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {byEstado.map(({ key, label, count, color }) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round((count / kpi.total) * 100)}%</span>
                </div>
                <MiniBar value={count} max={maxEstado} color={color} />
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por prioridad */}
        <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
          <SectionTitle icon={<AlertTriangle size={14} />} title="HUs por Prioridad" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {byPrioridad.map(({ key, label, count, color }) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round((count / kpi.total) * 100)}%</span>
                </div>
                <MiniBar value={count} max={maxPrio} color={color} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Fila 4: Casos + tipo/ambiente ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

        {/* Casos por estado de aprobación */}
        <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
          <SectionTitle icon={<CheckCircle size={14} />} title="Casos por Aprobación" />
          {kpi.totalCasos === 0 ? (
            <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic" }}>Sin casos creados</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {casosByAprobacion.map(({ key, label, count, color }) => (
                <div key={key}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color }}>{Math.round((count / kpi.totalCasos) * 100)}%</span>
                  </div>
                  <MiniBar value={count} max={kpi.totalCasos} color={color} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Por tipo de aplicación */}
        <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
          <SectionTitle icon={<Layers size={14} />} title="HUs por Tipo" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {byTipo.map(({ key, label, count }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--foreground)" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 60, height: 5, borderRadius: 3, background: "var(--secondary)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.round((count / kpi.total) * 100)}%`, height: "100%", background: "var(--primary)", borderRadius: 3 }} />
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
                    <div style={{ width: `${Math.round((count / kpi.total) * 100)}%`, height: "100%", background: amb_color, borderRadius: 3 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Fila 5: Responsables (solo vista equipo/admin) + Story Points ── */}
      {!isPersonalView && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>

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
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--chart-2)" }}>{kpi.puntosEntregados} / {kpi.puntosTotales}</span>
              </div>
              <Progress
                value={kpi.puntosTotales > 0 ? Math.round((kpi.puntosEntregados / kpi.puntosTotales) * 100) : 0}
                className="h-2.5"
                style={{ background: "var(--secondary)" }}
              />
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 6 }}>
                {kpi.puntosTotales > 0 ? Math.round((kpi.puntosEntregados / kpi.puntosTotales) * 100) : 0}% completado
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
      )}

      {/* ── Vista personal: bloqueos + story points compactos ── */}
      {isPersonalView && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ padding: "18px 20px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
            <SectionTitle icon={<AlertTriangle size={14} />} title="Bloqueos activos" />
            {kpi.bloqueos === 0 ? (
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
            <p style={{ fontSize: 32, fontWeight: 700, color: "var(--primary)", lineHeight: 1 }}>{kpi.puntosTotales}<span style={{ fontSize: 14, fontWeight: 400, color: "var(--muted-foreground)" }}> pts</span></p>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4, marginBottom: 12 }}>{kpi.puntosEntregados} pts entregados</p>
            <Progress
              value={kpi.puntosTotales > 0 ? Math.round((kpi.puntosEntregados / kpi.puntosTotales) * 100) : 0}
              className="h-2"
              style={{ background: "var(--secondary)" }}
            />
          </div>
        </div>
      )}

    </div>
  )
}
