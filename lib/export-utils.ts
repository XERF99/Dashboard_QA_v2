import type { HistoriaUsuario, CasoPrueba, Tarea } from "./types"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG,
  getTipoAplicacionLabel, getAmbienteLabel,
  getEtapaHUCfg, etapaDefsParaTipo,
  ETAPAS_PREDETERMINADAS, type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef,
} from "./types"

// ── Helpers ───────────────────────────────────────────────────
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
function fmtDate(d?: Date): string {
  if (!d) return ""
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function csvEscape(v: string | number): string {
  const s = String(v)
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes(";")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const content = rows.map(r => r.map(csvEscape).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const APROBACION_LABEL: Record<string, string> = {
  borrador: "Borrador",
  pendiente_aprobacion: "Pendiente aprobación",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
}

// ══════════════════════════════════════════════════════════════
//  CSV — Lista de HUs
// ══════════════════════════════════════════════════════════════
export function exportarHUsCSV(
  historias: HistoriaUsuario[],
  casos: CasoPrueba[],
  configEtapas: ConfigEtapas = ETAPAS_PREDETERMINADAS,
  tiposAplicacion?: TipoAplicacionDef[],
  ambientes?: AmbienteDef[],
) {
  const header = [
    "Código", "Título", "Estado", "Etapa", "Prioridad",
    "Responsable", "Tipo Aplicación", "Ambiente", "Puntos",
    "Total Casos", "Casos Aprobados", "Bloqueos Activos",
    "Fecha Fin Estimada", "Fecha Creación",
  ]
  const rows = historias.map(hu => {
    const casosHU   = casos.filter(c => hu.casosIds.includes(c.id))
    const aprobados = casosHU.filter(c => c.estadoAprobacion === "aprobado").length
    const bloqueos  = hu.bloqueos.filter(b => !b.resuelto).length
    return [
      hu.codigo,
      hu.titulo,
      ESTADO_HU_CFG[hu.estado].label,
      getEtapaHUCfg(hu.etapa, configEtapas).label,
      PRIORIDAD_CFG[hu.prioridad].label,
      hu.responsable,
      getTipoAplicacionLabel(hu.tipoAplicacion, tiposAplicacion),
      getAmbienteLabel(hu.ambiente, ambientes),
      hu.puntos,
      casosHU.length,
      aprobados,
      bloqueos,
      fmtDate(hu.fechaFinEstimada),
      fmtDate(hu.fechaCreacion),
    ]
  })
  downloadCSV(`HUs_${new Date().toISOString().slice(0,10)}.csv`, [header, ...rows])
}

// ══════════════════════════════════════════════════════════════
//  CSV — Resultados de prueba (por caso)
// ══════════════════════════════════════════════════════════════
export function exportarResultadosCSV(
  historias: HistoriaUsuario[],
  casos: CasoPrueba[],
  configEtapas: ConfigEtapas = ETAPAS_PREDETERMINADAS,
  tiposAplicacion?: TipoAplicacionDef[],
) {
  // Etapas dinámicas: unión de todas las etapas de los tipos presentes + etapas en datos reales
  const seen = new Set<string>()
  const etapas: { id: string; label: string }[] = []
  ;[...new Set(historias.map(h => h.tipoAplicacion))].forEach(tipo => {
    etapaDefsParaTipo(tipo, configEtapas).forEach(e => {
      if (!seen.has(e.id)) { seen.add(e.id); etapas.push({ id: e.id, label: e.label }) }
    })
  })
  casos.forEach(c => c.resultadosPorEtapa.forEach(r => {
    if (!seen.has(r.etapa)) {
      seen.add(r.etapa)
      etapas.push({ id: r.etapa, label: getEtapaHUCfg(r.etapa, configEtapas).label })
    }
  }))

  const header = [
    "HU Código", "HU Título", "HU Responsable", "HU Estado",
    "Caso ID", "Caso Título", "Tipo Prueba", "Complejidad", "Entorno", "Horas",
    "Estado Aprobación",
    ...etapas.flatMap(e => [`Resultado ${e.label}`, `Intentos ${e.label}`]),
    "Bloqueos Activos", "Fecha Creación",
  ]

  const getRes = (c: CasoPrueba, etapa: string): string => {
    const r = c.resultadosPorEtapa.find(r => r.etapa === etapa)
    if (!r) return "N/A"
    if (r.resultado === "exitoso")   return "Exitoso"
    if (r.resultado === "fallido")   return "Fallido"
    if (r.estado === "en_ejecucion") return "En ejecución"
    return "Pendiente"
  }
  const getIntentos = (c: CasoPrueba, etapa: string): number => {
    const r = c.resultadosPorEtapa.find(r => r.etapa === etapa)
    return r?.intentos?.length ?? 0
  }

  const rows: (string | number)[][] = []
  historias.forEach(hu => {
    const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
    if (casosHU.length === 0) {
      rows.push([
        hu.codigo, hu.titulo, hu.responsable, ESTADO_HU_CFG[hu.estado].label,
        "—", "Sin casos de prueba", "", "", "", "", "",
        ...etapas.flatMap(() => ["", 0]),
        0, "",
      ])
    } else {
      casosHU.forEach(c => {
        rows.push([
          hu.codigo, hu.titulo, hu.responsable, ESTADO_HU_CFG[hu.estado].label,
          c.id, c.titulo,
          c.tipoPrueba === "funcional" ? "Funcional" : "No Funcional",
          c.complejidad.charAt(0).toUpperCase() + c.complejidad.slice(1),
          c.entorno === "test" ? "Test" : "Pre-Producción",
          c.horasEstimadas,
          APROBACION_LABEL[c.estadoAprobacion] ?? c.estadoAprobacion,
          ...etapas.flatMap(e => [getRes(c, e.id), getIntentos(c, e.id)]),
          c.bloqueos.filter(b => !b.resuelto).length,
          fmtDate(c.fechaCreacion),
        ])
      })
    }
  })

  downloadCSV(`Resultados_${new Date().toISOString().slice(0,10)}.csv`, [header, ...rows])
}

// ══════════════════════════════════════════════════════════════
//  PDF — Lista de HUs (abre ventana e imprime)
// ══════════════════════════════════════════════════════════════
export function exportarHUsPDF(
  historias: HistoriaUsuario[],
  casos: CasoPrueba[],
  configEtapas: ConfigEtapas = ETAPAS_PREDETERMINADAS,
  tiposAplicacion?: TipoAplicacionDef[],
) {
  const fecha = fmtDate(new Date())

  const estadoBadge = (estado: string) => {
    const map: Record<string,string> = {
      sin_iniciar: "#e5e7eb:#374151",
      en_progreso: "#dbeafe:#1d4ed8",
      exitosa:     "#dcfce7:#15803d",
      fallida:     "#fee2e2:#dc2626",
      cancelada:   "#e5e7eb:#6b7280",
    }
    const [bg, color] = (map[estado] ?? "#e5e7eb:#374151").split(":")
    const label = ESTADO_HU_CFG[estado as keyof typeof ESTADO_HU_CFG]?.label ?? estado
    return `<span style="background:${bg};color:${color};padding:1px 7px;border-radius:4px;font-size:10px;font-weight:700">${label}</span>`
  }

  const priBadge = (pri: string) => {
    const map: Record<string,string> = {
      critica: "#fee2e2:#dc2626",
      alta:    "#ffedd5:#ea580c",
      media:   "#fef9c3:#ca8a04",
      baja:    "#f0fdf4:#15803d",
    }
    const [bg, color] = (map[pri] ?? "#e5e7eb:#374151").split(":")
    const label = PRIORIDAD_CFG[pri as keyof typeof PRIORIDAD_CFG]?.label ?? pri
    return `<span style="background:${bg};color:${color};padding:1px 7px;border-radius:4px;font-size:10px;font-weight:700">${label}</span>`
  }

  const rows = historias.map(hu => {
    const casosHU  = casos.filter(c => hu.casosIds.includes(c.id))
    const aprobados = casosHU.filter(c => c.estadoAprobacion === "aprobado").length
    const bloqueos  = hu.bloqueos.filter(b => !b.resuelto).length
    return `
      <tr>
        <td style="font-family:monospace;font-weight:700;color:#4f46e5">${hu.codigo}</td>
        <td>${hu.titulo}<br/><span style="font-size:10px;color:#6b7280">${hu.responsable}</span></td>
        <td>${estadoBadge(hu.estado)}</td>
        <td>${priBadge(hu.prioridad)}</td>
        <td style="text-align:center">${casosHU.length}<br/><span style="font-size:9px;color:#6b7280">${aprobados} aprobados</span></td>
        <td style="text-align:center;${bloqueos > 0 ? "color:#dc2626;font-weight:700" : "color:#6b7280"}">${bloqueos > 0 ? bloqueos : "—"}</td>
        <td style="font-size:11px">${fmtDate(hu.fechaFinEstimada) || "—"}</td>
      </tr>`
  }).join("")

  const html = `<!DOCTYPE html>
<html lang="es"><head>
  <meta charset="utf-8"/>
  <title>Historias de Usuario — ${fecha}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; margin: 24px; }
    h1  { font-size: 18px; margin: 0 0 4px; color: #111; }
    .sub { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 7px 10px; font-size: 10px;
         text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #d1d5db; color: #374151; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    tr:nth-child(even) td { background: #fafafa; }
    @media print {
      body { margin: 12px; }
      @page { margin: 1.5cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <h1>Historias de Usuario</h1>
  <p class="sub">Exportado el ${fecha} &nbsp;·&nbsp; ${historias.length} histori${historias.length===1?"a":"as"}</p>
  <table>
    <thead>
      <tr>
        <th>Código</th><th>Título / Responsable</th><th>Estado</th>
        <th>Prioridad</th><th>Casos</th><th>Bloqueos</th><th>Fecha Fin</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`

  openAndPrint(html)
}

// ══════════════════════════════════════════════════════════════
//  PDF — Resultados de prueba por caso
// ══════════════════════════════════════════════════════════════
export function exportarResultadosPDF(
  historias: HistoriaUsuario[],
  casos: CasoPrueba[],
  configEtapas: ConfigEtapas = ETAPAS_PREDETERMINADAS,
  tiposAplicacion?: TipoAplicacionDef[],
) {
  const fecha = fmtDate(new Date())

  // Etapas dinámicas: unión de las etapas de los tipos presentes + etapas en datos reales
  const seen = new Set<string>()
  const etapas: { id: string; label: string }[] = []
  ;[...new Set(historias.map(h => h.tipoAplicacion))].forEach(tipo => {
    etapaDefsParaTipo(tipo, configEtapas).forEach(e => {
      if (!seen.has(e.id)) { seen.add(e.id); etapas.push({ id: e.id, label: e.label }) }
    })
  })
  casos.forEach(c => c.resultadosPorEtapa.forEach(r => {
    if (!seen.has(r.etapa)) {
      seen.add(r.etapa)
      etapas.push({ id: r.etapa, label: getEtapaHUCfg(r.etapa, configEtapas).label })
    }
  }))

  const resCell = (c: CasoPrueba, etapa: string): string => {
    const r = c.resultadosPorEtapa.find(r => r.etapa === etapa)
    if (!r) return `<span style="color:#9ca3af">N/A</span>`
    const intentos = r.intentos?.length ?? 0
    const retestLabel = intentos > 1 ? ` <span style="font-size:9px;color:#6b7280">(${intentos})</span>` : ""
    if (r.resultado === "exitoso")
      return `<span style="color:#15803d;font-weight:700">✓ Exitoso${retestLabel}</span>`
    if (r.resultado === "fallido")
      return `<span style="color:#dc2626;font-weight:700">✗ Fallido${retestLabel}</span>`
    if (r.estado === "en_ejecucion")
      return `<span style="color:#2563eb">▶ En ejec.</span>`
    return `<span style="color:#6b7280">Pendiente</span>`
  }

  const colCount = 3 + etapas.length + 2  // HU + Caso + Aprobación + etapas + Horas + Bloq.

  const rows: string[] = []
  historias.forEach(hu => {
    const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
    if (casosHU.length === 0) {
      rows.push(`
        <tr>
          <td colspan="${colCount}" style="text-align:center;color:#9ca3af;font-style:italic">
            ${hu.codigo} — ${hu.titulo} — Sin casos de prueba
          </td>
        </tr>`)
    } else {
      casosHU.forEach((c, idx) => {
        const aprobCfg: Record<string,string> = {
          borrador: "#e5e7eb:#374151",
          pendiente_aprobacion: "#fef9c3:#854d0e",
          aprobado: "#dcfce7:#15803d",
          rechazado: "#fee2e2:#dc2626",
        }
        const [abg, acol] = (aprobCfg[c.estadoAprobacion] ?? "#e5e7eb:#374151").split(":")
        const aprobBadge = `<span style="background:${abg};color:${acol};padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700">${APROBACION_LABEL[c.estadoAprobacion] ?? c.estadoAprobacion}</span>`
        rows.push(`
          <tr>
            ${idx === 0 ? `<td rowspan="${casosHU.length}" style="font-family:monospace;font-weight:700;color:#4f46e5;vertical-align:top;border-right:2px solid #e5e7eb">
              ${hu.codigo}<br/><span style="font-size:10px;font-family:sans-serif;color:#6b7280;font-weight:400">${hu.responsable}</span>
            </td>` : ""}
            <td>
              <span style="font-size:10px;font-family:monospace;color:#6b7280">${c.id}</span><br/>
              ${c.titulo}
            </td>
            <td style="text-align:center">${aprobBadge}</td>
            ${etapas.map(e => `<td style="text-align:center">${resCell(c, e.id)}</td>`).join("")}
            <td style="text-align:center">${c.horasEstimadas}h</td>
            <td style="text-align:center;${c.bloqueos.filter(b=>!b.resuelto).length>0?"color:#dc2626;font-weight:700":"color:#9ca3af"}">
              ${c.bloqueos.filter(b=>!b.resuelto).length > 0 ? c.bloqueos.filter(b=>!b.resuelto).length : "—"}
            </td>
          </tr>`)
      })
    }
  })

  const html = `<!DOCTYPE html>
<html lang="es"><head>
  <meta charset="utf-8"/>
  <title>Resultados de Prueba — ${fecha}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 24px; }
    h1  { font-size: 18px; margin: 0 0 4px; color: #111; }
    .sub { font-size: 11px; color: #6b7280; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f3f4f6; text-align: left; padding: 7px 10px; font-size: 10px;
         text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 2px solid #d1d5db; color: #374151; }
    td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    tr:nth-child(even) td { background: #fafafa; }
    @media print {
      body { margin: 12px; }
      @page { margin: 1.5cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <h1>Resultados de Prueba</h1>
  <p class="sub">Exportado el ${fecha} &nbsp;·&nbsp; ${historias.length} histori${historias.length===1?"a":"as"} &nbsp;·&nbsp; ${casos.length} casos</p>
  <table>
    <thead>
      <tr>
        <th>HU</th><th>Caso</th><th>Aprobación</th>
        ${etapas.map(e => `<th>${e.label}</th>`).join("")}
        <th>Horas</th><th>Bloq.</th>
      </tr>
    </thead>
    <tbody>${rows.join("")}</tbody>
  </table>
</body></html>`

  openAndPrint(html)
}

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

// ── Helper: abre nueva ventana e imprime ─────────────────────
function openAndPrint(html: string) {
  const win = window.open("", "_blank", "width=1000,height=700")
  if (!win) {
    alert("El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio.")
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  // Pequeño delay para que los estilos carguen antes de imprimir
  setTimeout(() => win.print(), 400)
}
