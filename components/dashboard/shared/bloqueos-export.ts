import { fmtCorto } from "@/lib/types"
import { NIVEL_CFG, type BloqueoEnriquecido } from "./bloqueos-row"

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

// Funciones de exportación extraídas de bloqueos-panel.tsx (v2.75).
export function exportarBloqueosPDF(filtrados: BloqueoEnriquecido[]): void {
  const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
  const filas = filtrados.map(item => `
    <tr>
      <td><span class="badge nivel-${item.nivel}">${esc(NIVEL_CFG[item.nivel].label)}</span></td>
      <td><strong>${esc(item.huCodigo)}</strong><br/><span class="sub">${esc(item.huTitulo)}</span></td>
      <td>${esc(item.descripcion)}</td>
      <td>${esc(item.reportadoPor)}<br/><span class="sub">${fmtCorto(item.fecha)}</span></td>
      <td>${esc(item.casoTitulo ?? "")}${item.tareaTitulo ? `<br/><span class="sub">${esc(item.tareaTitulo)}</span>` : ""}</td>
      <td><span class="estado ${item.resuelto ? "resuelto" : "activo"}">${item.resuelto ? "Resuelto" : "Activo"}</span>
        ${item.notaResolucion ? `<br/><span class="sub">${esc(item.notaResolucion)}</span>` : ""}</td>
    </tr>`).join("")
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
    <title>Bloqueos ${fecha}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px}
      h1{font-size:16px;margin-bottom:4px}
      .meta{font-size:11px;color:#666;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}
      th{background:#1e293b;color:#fff;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
      td{padding:6px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}
      tr:nth-child(even) td{background:#f8fafc}
      .badge{display:inline-block;font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px}
      .nivel-hu{background:#dbeafe;color:#1d4ed8}
      .nivel-caso{background:#dcfce7;color:#15803d}
      .nivel-tarea{background:#fef9c3;color:#a16207}
      .estado.activo{color:#dc2626;font-weight:700}
      .estado.resuelto{color:#16a34a;font-weight:700}
      .sub{font-size:10px;color:#64748b}
      @media print{body{padding:0}@page{margin:12mm;size:landscape}}
    </style></head><body>
    <h1>Registro de Bloqueos</h1>
    <p class="meta">Generado el ${fecha} · ${filtrados.length} bloqueo${filtrados.length !== 1 ? "s" : ""}</p>
    <table>
      <thead><tr><th>Nivel</th><th>Historia</th><th>Descripción</th><th>Reportado</th><th>Caso / Tarea</th><th>Estado</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
    <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script>
    </body></html>`
  const w = window.open("", "_blank", "width=1000,height=700")
  if (w) { w.document.write(html); w.document.close() }
}

export function exportarBloqueosCSV(filtrados: BloqueoEnriquecido[]): void {
  const headers = [
    "Nivel", "HU Código", "HU Título", "Responsable HU", "Prioridad HU",
    "Caso de Prueba", "Tarea", "Descripción del bloqueo", "Reportado Por",
    "Fecha reporte", "Estado", "Resuelto Por", "Fecha resolución", "Nota resolución",
  ]
  const rows = filtrados.map(item => [
    NIVEL_CFG[item.nivel].label,
    item.huCodigo,
    item.huTitulo,
    item.huResponsable,
    item.huPrioridad,
    item.casoTitulo ?? "",
    item.tareaTitulo ?? "",
    item.descripcion,
    item.reportadoPor,
    fmtCorto(item.fecha),
    item.resuelto ? "Resuelto" : "Activo",
    item.resueltoPor ?? "",
    item.fechaResolucion ? fmtCorto(item.fechaResolucion) : "",
    item.notaResolucion ?? "",
  ])
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = [headers, ...rows].map(r => r.map(escape).join(","))
  const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `bloqueos_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
