/** Exportación CSV y PDF de Historias de Usuario y sus resultados de prueba. */

import type { HistoriaUsuario, CasoPrueba } from "../types"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG,
  getTipoAplicacionLabel, getAmbienteLabel,
  getEtapaHUCfg, etapaDefsParaTipo,
  ETAPAS_PREDETERMINADAS, type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef,
} from "../types"
import { fmtDate, downloadCSV, openAndPrint, APROBACION_LABEL } from "./utils"

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
  const getIntentos = (c: CasoPrueba, etapa: string): number =>
    c.resultadosPorEtapa.find(r => r.etapa === etapa)?.intentos?.length ?? 0

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
//  PDF — Lista de HUs
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
      sin_iniciar: "#e5e7eb:#374151", en_progreso: "#dbeafe:#1d4ed8",
      exitosa: "#dcfce7:#15803d", fallida: "#fee2e2:#dc2626", cancelada: "#e5e7eb:#6b7280",
    }
    const [bg, color] = (map[estado] ?? "#e5e7eb:#374151").split(":")
    const label = ESTADO_HU_CFG[estado as keyof typeof ESTADO_HU_CFG]?.label ?? estado
    return `<span style="background:${bg};color:${color};padding:1px 7px;border-radius:4px;font-size:10px;font-weight:700">${label}</span>`
  }

  const priBadge = (pri: string) => {
    const map: Record<string,string> = {
      critica: "#fee2e2:#dc2626", alta: "#ffedd5:#ea580c",
      media: "#fef9c3:#ca8a04", baja: "#f0fdf4:#15803d",
    }
    const [bg, color] = (map[pri] ?? "#e5e7eb:#374151").split(":")
    const label = PRIORIDAD_CFG[pri as keyof typeof PRIORIDAD_CFG]?.label ?? pri
    return `<span style="background:${bg};color:${color};padding:1px 7px;border-radius:4px;font-size:10px;font-weight:700">${label}</span>`
  }

  const rows = historias.map(hu => {
    const casosHU   = casos.filter(c => hu.casosIds.includes(c.id))
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

  openAndPrint(`<!DOCTYPE html>
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
    @media print { body { margin: 12px; } @page { margin: 1.5cm; size: A4 landscape; } }
  </style>
</head>
<body>
  <h1>Historias de Usuario</h1>
  <p class="sub">Exportado el ${fecha} &nbsp;·&nbsp; ${historias.length} histori${historias.length===1?"a":"as"}</p>
  <table>
    <thead><tr><th>Código</th><th>Título / Responsable</th><th>Estado</th><th>Prioridad</th><th>Casos</th><th>Bloqueos</th><th>Fecha Fin</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body></html>`)
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
    if (r.resultado === "exitoso") return `<span style="color:#15803d;font-weight:700">✓ Exitoso${retestLabel}</span>`
    if (r.resultado === "fallido") return `<span style="color:#dc2626;font-weight:700">✗ Fallido${retestLabel}</span>`
    if (r.estado === "en_ejecucion") return `<span style="color:#2563eb">▶ En ejec.</span>`
    return `<span style="color:#6b7280">Pendiente</span>`
  }

  const colCount = 3 + etapas.length + 2
  const rows: string[] = []
  historias.forEach(hu => {
    const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
    if (casosHU.length === 0) {
      rows.push(`<tr><td colspan="${colCount}" style="text-align:center;color:#9ca3af;font-style:italic">${hu.codigo} — ${hu.titulo} — Sin casos de prueba</td></tr>`)
    } else {
      casosHU.forEach((c, idx) => {
        const aprobCfg: Record<string,string> = {
          borrador: "#e5e7eb:#374151", pendiente_aprobacion: "#fef9c3:#854d0e",
          aprobado: "#dcfce7:#15803d", rechazado: "#fee2e2:#dc2626",
        }
        const [abg, acol] = (aprobCfg[c.estadoAprobacion] ?? "#e5e7eb:#374151").split(":")
        const aprobBadge = `<span style="background:${abg};color:${acol};padding:1px 6px;border-radius:4px;font-size:9px;font-weight:700">${APROBACION_LABEL[c.estadoAprobacion] ?? c.estadoAprobacion}</span>`
        rows.push(`<tr>
          ${idx === 0 ? `<td rowspan="${casosHU.length}" style="font-family:monospace;font-weight:700;color:#4f46e5;vertical-align:top;border-right:2px solid #e5e7eb">
            ${hu.codigo}<br/><span style="font-size:10px;font-family:sans-serif;color:#6b7280;font-weight:400">${hu.responsable}</span>
          </td>` : ""}
          <td><span style="font-size:10px;font-family:monospace;color:#6b7280">${c.id}</span><br/>${c.titulo}</td>
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

  openAndPrint(`<!DOCTYPE html>
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
    @media print { body { margin: 12px; } @page { margin: 1.5cm; size: A4 landscape; } }
  </style>
</head>
<body>
  <h1>Resultados de Prueba</h1>
  <p class="sub">Exportado el ${fecha} &nbsp;·&nbsp; ${historias.length} histori${historias.length===1?"a":"as"} &nbsp;·&nbsp; ${casos.length} casos</p>
  <table>
    <thead>
      <tr><th>HU</th><th>Caso</th><th>Aprobación</th>${etapas.map(e => `<th>${e.label}</th>`).join("")}<th>Horas</th><th>Bloq.</th></tr>
    </thead>
    <tbody>${rows.join("")}</tbody>
  </table>
</body></html>`)
}
