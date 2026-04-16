"use client"

import { useMemo, useState } from "react"
import {
  TrendingUp, CheckCircle, XCircle, Clock, AlertTriangle,
  BarChart2, RefreshCw, Layers, Target, Users, Zap,
  FileSpreadsheet, ChevronDown, User2, FlaskConical,
} from "lucide-react"
import { exportarAnalyticsCSV, exportarAnalyticsPDF } from "@/lib/export-utils"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG,
  ETAPAS_PREDETERMINADAS, getTipoAplicacionLabel, getAmbienteLabel, getTipoPruebaLabel,
  type HistoriaUsuario, type CasoPrueba, type Tarea,
  type EstadoHU, type PrioridadHU,
  type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef, type TipoPruebaDef,
} from "@/lib/types"
import { KpiCard, COLOR } from "./kpi-card"
import { EstadoHUChart } from "./charts/estado-hu-chart"
import { VelocidadSprintChart } from "./charts/velocidad-sprint-chart"
import { TasaDefectosChart } from "./charts/tasa-defectos-chart"

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
  tiposPrueba?: TipoPruebaDef[]
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
export function AnalyticsKPIs({ historias, casos, tareas, isQA, currentUserName, filtroNombres, configEtapas = ETAPAS_PREDETERMINADAS, tiposAplicacion, ambientes, tiposPrueba }: AnalyticsKPIsProps) {

  const [exportOpen, setExportOpen] = useState(false)
  const [personaSeleccionada, setPersonaSeleccionada] = useState<string | null>(null)

  // ── Lógica de visibilidad por rol ──
  const isMulti  = filtroNombres !== undefined && filtroNombres.length > 1
  const isSingle = filtroNombres?.length === 1

  const nombreEfectivo = personaSeleccionada ?? (isSingle ? filtroNombres![0] : null)
  const isPersonalView = !!nombreEfectivo
  const nombreVista = nombreEfectivo ?? (isMulti ? "Equipo" : null)

  const husFiltradas = useMemo(() => {
    if (nombreEfectivo) {
      return historias.filter(h => h.responsable.toLowerCase() === nombreEfectivo.toLowerCase())
    }
    if (filtroNombres) {
      return historias.filter(h => filtroNombres.some(n => h.responsable.toLowerCase() === n.toLowerCase()))
    }
    if (isQA && currentUserName) {
      return historias.filter(h => h.responsable.toLowerCase() === currentUserName.toLowerCase())
    }
    return historias
  }, [historias, nombreEfectivo, filtroNombres, isQA, currentUserName])

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

    const bloqueoHU    = husFiltradas.reduce((s, h) => s + h.bloqueos.filter(b => !b.resuelto).length, 0)
    const bloqueoCaso  = casosFiltrados.reduce((s, c) => s + c.bloqueos.filter(b => !b.resuelto).length, 0)
    const bloqueoTarea = tareasFiltradas.reduce((s, t) => s + t.bloqueos.filter(b => !b.resuelto).length, 0)
    const bloqueos     = bloqueoHU + bloqueoCaso + bloqueoTarea

    const retesteos = casosFiltrados.reduce((s, c) =>
      s + c.resultadosPorEtapa.reduce((ss, r) => ss + Math.max(0, (r.intentos?.length ?? 1) - 1), 0), 0)

    const horasHU     = casosFiltrados.reduce((s, c) => s + (c.horasEstimadas || 0), 0)
    const horasTareas = tareasFiltradas.reduce((s, t) => s + (t.horasEstimadas || 0), 0)

    const puntosTotales = husFiltradas.reduce((s, h) => s + (h.puntos || 0), 0)
    const puntosEntregados = husFiltradas.filter(h => h.estado === "exitosa").reduce((s, h) => s + (h.puntos || 0), 0)

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
      color: COLOR[e] ?? "#888",
    })).filter(x => x.count > 0)
  }, [husFiltradas])

  const byPrioridad = useMemo(() => {
    const prios: PrioridadHU[] = ["critica", "alta", "media", "baja"]
    return prios.map(p => ({
      key: p,
      label: PRIORIDAD_CFG[p].label,
      count: husFiltradas.filter(h => h.prioridad === p).length,
      color: COLOR[p] ?? "#888",
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

  const byTipoPrueba = useMemo(() => {
    const ids = [...new Set(husFiltradas.map(h => h.tipoPrueba))]
    return ids.map(id => ({
      key: id,
      label: getTipoPruebaLabel(id, tiposPrueba),
      count: husFiltradas.filter(h => h.tipoPrueba === id).length,
    })).sort((a, b) => b.count - a.count)
  }, [husFiltradas, tiposPrueba])

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total HUs" value={kpi.total} sub={`${kpi.sinIniciar} sin iniciar`} color="var(--primary)" icon={<Layers size={16} />} />
        <KpiCard label="En Progreso" value={kpi.enProgreso} sub={`${kpi.bloqueos > 0 ? kpi.bloqueos + " bloqueo" + (kpi.bloqueos !== 1 ? "s" : "") : "sin bloqueos"}`} color="var(--chart-1)" icon={<Clock size={16} />} />
        <KpiCard label="Exitosas" value={kpi.exitosas} sub={`de ${kpi.cerradas} cerradas`} color="var(--chart-2)" icon={<CheckCircle size={16} />} />
        <KpiCard label="Tasa de Éxito" value={kpi.tasaExito !== null ? `${kpi.tasaExito}%` : "—"} sub={kpi.cerradas > 0 ? `${kpi.cerradas} HUs cerradas` : "Sin HUs cerradas aún"} color={kpi.tasaExito !== null ? (kpi.tasaExito >= 80 ? "var(--chart-2)" : kpi.tasaExito >= 50 ? "var(--chart-3)" : "var(--chart-4)") : "var(--muted-foreground)"} icon={<TrendingUp size={16} />} big />
      </div>

      {/* ── Fila 2: Casos + horas + retesteos ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Casos de Prueba" value={kpi.totalCasos} sub={`${kpi.casosAprobados} aprobados`} color="var(--chart-1)" icon={<Target size={16} />} />
        <KpiCard label="Pend. Aprobación" value={kpi.casosPendientes} sub={`${kpi.casosRechazados} rechazados`} color={kpi.casosPendientes > 0 ? "var(--chart-3)" : "var(--muted-foreground)"} icon={<Zap size={16} />} />
        <KpiCard label="Retesteos" value={kpi.retesteos} sub={`${kpi.casosConRetesteo} caso${kpi.casosConRetesteo !== 1 ? "s" : ""} retrabaajado${kpi.casosConRetesteo !== 1 ? "s" : ""}`} color={kpi.retesteos > 0 ? "var(--chart-4)" : "var(--chart-2)"} icon={<RefreshCw size={16} />} />
        <KpiCard label="Horas Estimadas" value={`${kpi.horasHU}h`} sub={`${kpi.horasTareas}h en tareas`} color="var(--primary)" icon={<BarChart2 size={16} />} />
      </div>

      {/* ── Fila 3: Distribuciones por estado y prioridad ── */}
      <EstadoHUChart
        byEstado={byEstado}
        byPrioridad={byPrioridad}
        totalHUs={kpi.total}
        maxEstado={maxEstado}
        maxPrio={maxPrio}
      />

      {/* ── Fila 4: Casos + tipo/ambiente/tipoPrueba ── */}
      <VelocidadSprintChart
        casosByAprobacion={casosByAprobacion}
        byTipo={byTipo}
        byAmbiente={byAmbiente}
        byTipoPrueba={byTipoPrueba}
        totalCasos={kpi.totalCasos}
        totalHUs={kpi.total}
      />

      {/* ── Fila 5: Responsables / Personal view ── */}
      <TasaDefectosChart
        isPersonalView={isPersonalView}
        byResponsable={byResponsable}
        kpiBloqueos={kpi.bloqueos}
        kpiPuntosTotales={kpi.puntosTotales}
        kpiPuntosEntregados={kpi.puntosEntregados}
        husFiltradas={husFiltradas}
        casosFiltrados={casosFiltrados}
        tareasFiltradas={tareasFiltradas}
      />

    </div>
  )
}
