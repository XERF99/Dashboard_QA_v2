/** Exportación CSV y PDF de Analytics / KPIs. */

import type { HistoriaUsuario, CasoPrueba, Tarea } from "../types"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG,
  getTipoAplicacionLabel, getAmbienteLabel,
  type TipoAplicacionDef, type AmbienteDef,
} from "../types"
import { fmtDate, downloadCSV, openAndPrint } from "./utils"

// ══════════════════════════════════════════════════════════════
//  CSV — Analytics / KPIs
// ══════════════════════════════════════════════════════════════
export function exportarAnalyticsCSV(
  historias: HistoriaUsuario[],
  casos: CasoPrueba[],
  tareas: Tarea[],
  titulo?: string,
  tiposAplicacion?: TipoAplicacionDef[],
  ambientes?: AmbienteDef[],
) {
  const fecha = fmtDate(new Date())
  const total = historias.length

  const enProgreso  = historias.filter(h => h.estado === "en_progreso").length
  const exitosas    = historias.filter(h => h.estado === "exitosa").length
  const fallidas    = historias.filter(h => h.estado === "fallida").length
  const canceladas  = historias.filter(h => h.estado === "cancelada").length
  const sinIniciar  = historias.filter(h => h.estado === "sin_iniciar").length
  const cerradas    = exitosas + fallidas + canceladas
  const tasaExito   = cerradas > 0 ? Math.round((exitosas / cerradas) * 100) : null

  const casosAprobados  = casos.filter(c => c.estadoAprobacion === "aprobado").length
  const casosPendientes = casos.filter(c => c.estadoAprobacion === "pendiente_aprobacion").length
  const casosRechazados = casos.filter(c => c.estadoAprobacion === "rechazado").length
  const casosBorrador   = casos.filter(c => c.estadoAprobacion === "borrador").length

  const bloqueoHU    = historias.reduce((s, h) => s + h.bloqueos.filter(b => !b.resuelto).length, 0)
  const bloqueoCaso  = casos.reduce((s, c) => s + c.bloqueos.filter(b => !b.resuelto).length, 0)
  const bloqueoTarea = tareas.reduce((s, t) => s + t.bloqueos.filter(b => !b.resuelto).length, 0)

  const retesteos = casos.reduce((s, c) =>
    s + c.resultadosPorEtapa.reduce((ss, r) => ss + Math.max(0, (r.intentos?.length ?? 1) - 1), 0), 0)
  const casosConRetesteo = casos.filter(c =>
    c.resultadosPorEtapa.some(r => (r.intentos?.length ?? 1) > 1)).length

  const horasHU     = casos.reduce((s, c) => s + (c.horasEstimadas || 0), 0)
  const horasTareas = tareas.reduce((s, t) => s + (t.horasEstimadas || 0), 0)

  const puntosTotales    = historias.reduce((s, h) => s + (h.puntos || 0), 0)
  const puntosEntregados = historias.filter(h => h.estado === "exitosa").reduce((s, h) => s + (h.puntos || 0), 0)

  const rows: (string | number)[][] = []
  const bl = () => rows.push([""])

  rows.push([titulo ?? "Analytics — QAControl"])
  rows.push(["Exportado:", fecha, `${total} histori${total === 1 ? "a" : "as"}`])
  bl()

  rows.push(["=== KPIs GENERALES ==="])
  rows.push(["Métrica", "Valor", "Detalle"])
  rows.push(["Total HUs",     total,        `${sinIniciar} sin iniciar`])
  rows.push(["En Progreso",   enProgreso,   `${bloqueoHU} bloqueos en HUs`])
  rows.push(["Exitosas",      exitosas,     `de ${cerradas} cerradas`])
  rows.push(["Fallidas",      fallidas,     ""])
  rows.push(["Canceladas",    canceladas,   ""])
  rows.push(["Sin Iniciar",   sinIniciar,   ""])
  rows.push(["Tasa de Éxito", tasaExito !== null ? `${tasaExito}%` : "—", cerradas > 0 ? `${cerradas} HUs cerradas` : "Sin HUs cerradas"])
  bl()

  rows.push(["=== CASOS DE PRUEBA ==="])
  rows.push(["Métrica", "Valor"])
  rows.push(["Total Casos",           casos.length])
  rows.push(["Aprobados",             casosAprobados])
  rows.push(["Pendientes Aprobación", casosPendientes])
  rows.push(["Rechazados",            casosRechazados])
  rows.push(["Borrador",              casosBorrador])
  rows.push(["Retesteos (total)",     retesteos])
  rows.push(["Casos con retesteo",    casosConRetesteo])
  bl()

  rows.push(["=== HORAS ESTIMADAS ==="])
  rows.push(["En casos de prueba", `${horasHU}h`])
  rows.push(["En tareas",          `${horasTareas}h`])
  rows.push(["Total",              `${horasHU + horasTareas}h`])
  bl()

  rows.push(["=== BLOQUEOS ACTIVOS ==="])
  rows.push(["En HUs",    bloqueoHU])
  rows.push(["En Casos",  bloqueoCaso])
  rows.push(["En Tareas", bloqueoTarea])
  rows.push(["Total",     bloqueoHU + bloqueoCaso + bloqueoTarea])
  bl()

  rows.push(["=== DISTRIBUCIÓN POR ESTADO ==="])
  rows.push(["Estado", "Cantidad", "Porcentaje"])
  ;(["en_progreso", "sin_iniciar", "exitosa", "fallida", "cancelada"] as const).forEach(e => {
    const n = historias.filter(h => h.estado === e).length
    if (n > 0) rows.push([ESTADO_HU_CFG[e].label, n, total > 0 ? `${Math.round((n / total) * 100)}%` : "0%"])
  })
  bl()

  rows.push(["=== DISTRIBUCIÓN POR PRIORIDAD ==="])
  rows.push(["Prioridad", "Cantidad", "Porcentaje"])
  ;(["critica", "alta", "media", "baja"] as const).forEach(p => {
    const n = historias.filter(h => h.prioridad === p).length
    if (n > 0) rows.push([PRIORIDAD_CFG[p].label, n, total > 0 ? `${Math.round((n / total) * 100)}%` : "0%"])
  })
  bl()

  rows.push(["=== POR TIPO DE APLICACIÓN ==="])
  rows.push(["Tipo", "Cantidad"])
  const tiposMap = new Map<string, number>()
  historias.forEach(h => tiposMap.set(h.tipoAplicacion, (tiposMap.get(h.tipoAplicacion) ?? 0) + 1))
  tiposMap.forEach((n, t) => rows.push([getTipoAplicacionLabel(t, tiposAplicacion), n]))
  bl()

  rows.push(["=== POR AMBIENTE ==="])
  rows.push(["Ambiente", "Cantidad"])
  const ambMap = new Map<string, number>()
  historias.forEach(h => ambMap.set(h.ambiente, (ambMap.get(h.ambiente) ?? 0) + 1))
  ambMap.forEach((n, a) => rows.push([getAmbienteLabel(a, ambientes), n]))
  bl()

  const respMap = new Map<string, { total: number; exitosas: number; fallidas: number; enProgreso: number; bloqueos: number }>()
  historias.forEach(h => {
    const cur = respMap.get(h.responsable) ?? { total: 0, exitosas: 0, fallidas: 0, enProgreso: 0, bloqueos: 0 }
    cur.total++
    if (h.estado === "exitosa") cur.exitosas++
    if (h.estado === "fallida") cur.fallidas++
    if (h.estado === "en_progreso") cur.enProgreso++
    cur.bloqueos += h.bloqueos.filter(b => !b.resuelto).length
    respMap.set(h.responsable, cur)
  })
  rows.push(["=== RENDIMIENTO POR RESPONSABLE ==="])
  rows.push(["Responsable", "Total", "En Progreso", "Exitosas", "Fallidas", "Bloqueos", "Tasa Éxito"])
  respMap.forEach((d, nombre) => {
    const c = d.exitosas + d.fallidas
    rows.push([nombre, d.total, d.enProgreso, d.exitosas, d.fallidas, d.bloqueos, c > 0 ? `${Math.round((d.exitosas / c) * 100)}%` : "—"])
  })
  bl()

  rows.push(["=== STORY POINTS ==="])
  rows.push(["Total",       puntosTotales])
  rows.push(["Entregados",  puntosEntregados])
  rows.push(["Completado",  puntosTotales > 0 ? `${Math.round((puntosEntregados / puntosTotales) * 100)}%` : "0%"])

  downloadCSV(`Analytics_${new Date().toISOString().slice(0, 10)}.csv`, rows)
}

// ══════════════════════════════════════════════════════════════
//  PDF — Analytics / KPIs
// ══════════════════════════════════════════════════════════════
export function exportarAnalyticsPDF(
  historias: HistoriaUsuario[],
  casos: CasoPrueba[],
  tareas: Tarea[],
  titulo?: string,
  tiposAplicacion?: TipoAplicacionDef[],
) {
  const fecha = fmtDate(new Date())
  const total = historias.length

  const enProgreso  = historias.filter(h => h.estado === "en_progreso").length
  const exitosas    = historias.filter(h => h.estado === "exitosa").length
  const fallidas    = historias.filter(h => h.estado === "fallida").length
  const canceladas  = historias.filter(h => h.estado === "cancelada").length
  const sinIniciar  = historias.filter(h => h.estado === "sin_iniciar").length
  const cerradas    = exitosas + fallidas + canceladas
  const tasaExito   = cerradas > 0 ? Math.round((exitosas / cerradas) * 100) : null

  const casosAprobados  = casos.filter(c => c.estadoAprobacion === "aprobado").length
  const casosPendientes = casos.filter(c => c.estadoAprobacion === "pendiente_aprobacion").length
  const casosRechazados = casos.filter(c => c.estadoAprobacion === "rechazado").length

  const bloqueoHU    = historias.reduce((s, h) => s + h.bloqueos.filter(b => !b.resuelto).length, 0)
  const bloqueoCaso  = casos.reduce((s, c) => s + c.bloqueos.filter(b => !b.resuelto).length, 0)
  const bloqueoTarea = tareas.reduce((s, t) => s + t.bloqueos.filter(b => !b.resuelto).length, 0)
  const totalBloqueos = bloqueoHU + bloqueoCaso + bloqueoTarea

  const retesteos = casos.reduce((s, c) =>
    s + c.resultadosPorEtapa.reduce((ss, r) => ss + Math.max(0, (r.intentos?.length ?? 1) - 1), 0), 0)

  const horasHU     = casos.reduce((s, c) => s + (c.horasEstimadas || 0), 0)
  const horasTareas = tareas.reduce((s, t) => s + (t.horasEstimadas || 0), 0)

  const puntosTotales    = historias.reduce((s, h) => s + (h.puntos || 0), 0)
  const puntosEntregados = historias.filter(h => h.estado === "exitosa").reduce((s, h) => s + (h.puntos || 0), 0)
  const pctPuntos = puntosTotales > 0 ? Math.round((puntosEntregados / puntosTotales) * 100) : 0

  const kpiCard = (label: string, value: string | number, sub: string, color: string) =>
    `<div class="kpi"><p class="kpi-lbl">${label}</p><p class="kpi-val" style="color:${color}">${value}</p><p class="kpi-sub">${sub}</p></div>`

  const miniBar = (count: number, max: number, label: string, pct: number, color: string) =>
    `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:11px">${label}</span>
        <span style="font-size:11px;font-weight:700;color:${color}">${count} (${pct}%)</span>
      </div>
      <div style="height:6px;background:#e5e7eb;border-radius:3px;overflow:hidden">
        <div style="width:${max > 0 ? Math.round((count / max) * 100) : 0}%;height:100%;background:${color};border-radius:3px"></div>
      </div>
    </div>`

  const estadoDist = (["en_progreso", "sin_iniciar", "exitosa", "fallida", "cancelada"] as const)
    .map(e => ({ label: ESTADO_HU_CFG[e].label, count: historias.filter(h => h.estado === e).length,
      color: e === "en_progreso" ? "#2563eb" : e === "exitosa" ? "#15803d" : e === "fallida" ? "#dc2626" : e === "cancelada" ? "#6b7280" : "#374151",
    })).filter(x => x.count > 0)
  const maxEstado = Math.max(...estadoDist.map(x => x.count), 1)

  const prioDist = (["critica", "alta", "media", "baja"] as const)
    .map(p => ({ label: PRIORIDAD_CFG[p].label, count: historias.filter(h => h.prioridad === p).length,
      color: p === "critica" ? "#dc2626" : p === "alta" ? "#ea580c" : p === "media" ? "#ca8a04" : "#15803d",
    })).filter(x => x.count > 0)
  const maxPrio = Math.max(...prioDist.map(x => x.count), 1)

  const respMap = new Map<string, { total: number; exitosas: number; fallidas: number; enProgreso: number; bloqueos: number }>()
  historias.forEach(h => {
    const cur = respMap.get(h.responsable) ?? { total: 0, exitosas: 0, fallidas: 0, enProgreso: 0, bloqueos: 0 }
    cur.total++
    if (h.estado === "exitosa") cur.exitosas++
    if (h.estado === "fallida") cur.fallidas++
    if (h.estado === "en_progreso") cur.enProgreso++
    cur.bloqueos += h.bloqueos.filter(b => !b.resuelto).length
    respMap.set(h.responsable, cur)
  })
  const respRows = [...respMap.entries()].map(([nombre, d]) => {
    const c = d.exitosas + d.fallidas
    const tasa = c > 0 ? `${Math.round((d.exitosas / c) * 100)}%` : "—"
    const tasaColor = c > 0 ? (Math.round((d.exitosas / c) * 100) >= 80 ? "#15803d" : Math.round((d.exitosas / c) * 100) >= 50 ? "#ca8a04" : "#dc2626") : "#6b7280"
    return `<tr>
      <td style="font-weight:600">${nombre}</td>
      <td style="text-align:center;font-weight:700;color:#4f46e5">${d.total}</td>
      <td style="text-align:center;color:#2563eb">${d.enProgreso}</td>
      <td style="text-align:center;color:#15803d">${d.exitosas}</td>
      <td style="text-align:center;color:${d.fallidas > 0 ? "#dc2626" : "#6b7280"}">${d.fallidas}</td>
      <td style="text-align:center;color:${d.bloqueos > 0 ? "#dc2626" : "#6b7280"};font-weight:${d.bloqueos > 0 ? 700 : 400}">${d.bloqueos}</td>
      <td style="text-align:center;font-weight:700;color:${tasaColor}">${tasa}</td>
    </tr>`
  }).join("")

  const tasaColor = tasaExito !== null ? (tasaExito >= 80 ? "#15803d" : tasaExito >= 50 ? "#ca8a04" : "#dc2626") : "#6b7280"

  const html = `<!DOCTYPE html>
<html lang="es"><head>
  <meta charset="utf-8"/>
  <title>${titulo ?? "Analytics"} — ${fecha}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .sub { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
    .grid4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 16px; }
    .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .card { padding: 14px 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .card-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; font-weight: 700; margin-bottom: 10px; }
    .kpi { padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .kpi-lbl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; font-weight: 700; margin-bottom: 6px; }
    .kpi-val { font-size: 26px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
    .kpi-sub { font-size: 10px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 6px 10px; font-size: 10px;
         text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #d1d5db; color: #374151; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    tr:nth-child(even) td { background: #fafafa; }
    @media print {
      body { margin: 12px; }
      @page { margin: 1.5cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <h1>${titulo ?? "Analytics — QAControl"}</h1>
  <p class="sub">Exportado el ${fecha} &nbsp;·&nbsp; ${total} histori${total === 1 ? "a" : "as"} &nbsp;·&nbsp; ${casos.length} casos de prueba</p>

  <div class="grid4">
    ${kpiCard("Total HUs",     total,        `${sinIniciar} sin iniciar`,        "#4f46e5")}
    ${kpiCard("En Progreso",   enProgreso,   `${totalBloqueos} bloqueos activos`, "#2563eb")}
    ${kpiCard("Exitosas",      exitosas,     `de ${cerradas} cerradas`,           "#15803d")}
    ${kpiCard("Tasa de Éxito", tasaExito !== null ? `${tasaExito}%` : "—", cerradas > 0 ? `${cerradas} HUs cerradas` : "Sin HUs cerradas", tasaColor)}
  </div>

  <div class="grid4">
    ${kpiCard("Casos de Prueba",    casos.length,   `${casosAprobados} aprobados`,    "#2563eb")}
    ${kpiCard("Pend. Aprobación",   casosPendientes, `${casosRechazados} rechazados`, casosPendientes > 0 ? "#ca8a04" : "#6b7280")}
    ${kpiCard("Retesteos",          retesteos,       `${retesteos} en total`,          retesteos > 0 ? "#dc2626" : "#15803d")}
    ${kpiCard("Horas Estimadas",    `${horasHU}h`,   `${horasTareas}h en tareas`,     "#4f46e5")}
  </div>

  <div class="grid2">
    <div class="card">
      <p class="card-title">HUs por Estado</p>
      ${estadoDist.map(x => miniBar(x.count, maxEstado, x.label, total > 0 ? Math.round((x.count / total) * 100) : 0, x.color)).join("")}
    </div>
    <div class="card">
      <p class="card-title">HUs por Prioridad</p>
      ${prioDist.map(x => miniBar(x.count, maxPrio, x.label, total > 0 ? Math.round((x.count / total) * 100) : 0, x.color)).join("")}
    </div>
  </div>

  ${respMap.size > 0 ? `<div class="card" style="margin-bottom:16px">
    <p class="card-title">Rendimiento por Responsable</p>
    <table>
      <thead><tr><th>Responsable</th><th>Total</th><th>En Prog.</th><th>Exitosas</th><th>Fallidas</th><th>Bloqueos</th><th>Tasa</th></tr></thead>
      <tbody>${respRows}</tbody>
    </table>
  </div>` : ""}

  <div class="grid2">
    <div class="card">
      <p class="card-title">Story Points</p>
      <p style="font-size:26px;font-weight:700;color:#4f46e5;line-height:1;margin-bottom:4px">${puntosTotales}<span style="font-size:13px;font-weight:400;color:#6b7280"> pts totales</span></p>
      <p style="font-size:11px;color:#6b7280;margin-bottom:10px">${puntosEntregados} pts entregados · ${pctPuntos}% completado</p>
      <div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden">
        <div style="width:${pctPuntos}%;height:100%;background:#15803d;border-radius:4px"></div>
      </div>
    </div>
    <div class="card">
      <p class="card-title">Bloqueos Activos</p>
      ${totalBloqueos === 0
        ? `<p style="font-size:13px;color:#15803d;font-weight:600">✓ Sin bloqueos activos</p>`
        : `<div style="display:flex;flex-direction:column;gap:6px">
          ${bloqueoHU > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 10px;border-radius:6px;background:#fef2f2;border:1px solid #fecaca"><span>En HUs</span><span style="font-weight:700;color:#dc2626">${bloqueoHU}</span></div>` : ""}
          ${bloqueoCaso > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 10px;border-radius:6px;background:#fff7ed;border:1px solid #fed7aa"><span>En Casos</span><span style="font-weight:700;color:#ea580c">${bloqueoCaso}</span></div>` : ""}
          ${bloqueoTarea > 0 ? `<div style="display:flex;justify-content:space-between;padding:6px 10px;border-radius:6px;background:#fff7ed;border:1px solid #fed7aa"><span>En Tareas</span><span style="font-weight:700;color:#ea580c">${bloqueoTarea}</span></div>` : ""}
        </div>`
      }
    </div>
  </div>
</body></html>`

  openAndPrint(html)
}
