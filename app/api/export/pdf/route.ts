// ── GET /api/export/pdf — exporta historias o casos a PDF (server-side)
//
//  Query params:
//    tipo    = "historias" | "casos"   (requerido)
//    sprint  = <nombre>                (filtro opcional, solo historias)
//    estado  = <valor>                 (filtro opcional)

import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { ValidationError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"
import { jsPDF } from "jspdf"

// ── Helpers ──────────────────────────────────────────────

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
function fmtDate(d?: Date | null): string {
  if (!d) return ""
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64)
}

const ESTADO_LABELS: Record<string, string> = {
  sin_iniciar: "Sin iniciar", en_progreso: "En progreso",
  exitosa: "Exitosa", fallida: "Fallida", cancelada: "Cancelada",
}
const APROBACION_LABELS: Record<string, string> = {
  borrador: "Borrador", pendiente_aprobacion: "Pendiente",
  aprobado: "Aprobado", rechazado: "Rechazado",
}

// ── Handler ──────────────────────────────────────────────

export const GET = withAuth(async (request, payload) => {
  await requireRateLimit(request, "GET /api/export/pdf", 10, 60_000)

  const { searchParams } = request.nextUrl
  const tipo = searchParams.get("tipo")
  const sprint = searchParams.get("sprint") ?? undefined
  const estado = searchParams.get("estado") ?? undefined
  const exportLimit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "500") || 500))

  if (tipo !== "historias" && tipo !== "casos") {
    throw new ValidationError("El parámetro 'tipo' debe ser 'historias' o 'casos'")
  }

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const fecha = fmtDate(new Date())
  let filename: string

  if (tipo === "historias") {
    const where: Record<string, unknown> = { deletedAt: null }
    if (sprint) where.sprint = sprint
    if (estado) where.estado = estado
    if (payload.grupoId) where.grupoId = payload.grupoId

    const historias = await prisma.historiaUsuario.findMany({
      where, orderBy: { fechaCreacion: "desc" }, take: exportLimit,
    })

    // Title
    doc.setFontSize(16)
    doc.text("Historias de Usuario", 14, 15)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Exportado el ${fecha} — ${historias.length} historia${historias.length !== 1 ? "s" : ""}`, 14, 21)
    doc.setTextColor(0)

    // Table header
    const cols = ["Código", "Título", "Estado", "Prioridad", "Responsable", "Sprint", "Fecha Fin"]
    const colWidths = [25, 90, 25, 22, 35, 30, 25]
    let y = 28

    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    let x = 14
    cols.forEach((col, i) => {
      doc.text(col, x, y)
      x += colWidths[i]!
    })
    y += 5
    doc.setFont("helvetica", "normal")

    // Rows
    for (const h of historias) {
      if (y > 190) { doc.addPage(); y = 15 }
      x = 14
      const row = [
        h.codigo,
        h.titulo.length > 55 ? h.titulo.slice(0, 52) + "..." : h.titulo,
        ESTADO_LABELS[h.estado] ?? h.estado,
        h.prioridad,
        h.responsable.length > 20 ? h.responsable.slice(0, 17) + "..." : h.responsable,
        h.sprint ?? "",
        fmtDate(h.fechaFinEstimada),
      ]
      row.forEach((cell, i) => {
        doc.text(cell, x, y)
        x += colWidths[i]!
      })
      y += 5
    }

    filename = `historias${sprint ? `-${sanitizeFilename(sprint)}` : ""}${estado ? `-${sanitizeFilename(estado)}` : ""}.pdf`
  } else {
    const where: Record<string, unknown> = { deletedAt: null }
    if (estado) where.estadoAprobacion = estado
    if (payload.grupoId) where.hu = { grupoId: payload.grupoId }

    const casos = await prisma.casoPrueba.findMany({
      where, orderBy: { fechaCreacion: "desc" }, take: exportLimit,
    })

    doc.setFontSize(16)
    doc.text("Casos de Prueba", 14, 15)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Exportado el ${fecha} — ${casos.length} caso${casos.length !== 1 ? "s" : ""}`, 14, 21)
    doc.setTextColor(0)

    const cols = ["ID", "Título", "Aprobación", "Tipo Prueba", "Complejidad", "Horas", "Fecha"]
    const colWidths = [30, 100, 28, 28, 25, 18, 25]
    let y = 28

    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    let x = 14
    cols.forEach((col, i) => {
      doc.text(col, x, y)
      x += colWidths[i]!
    })
    y += 5
    doc.setFont("helvetica", "normal")

    for (const c of casos) {
      if (y > 190) { doc.addPage(); y = 15 }
      x = 14
      const row = [
        c.id.slice(0, 18),
        c.titulo.length > 60 ? c.titulo.slice(0, 57) + "..." : c.titulo,
        APROBACION_LABELS[c.estadoAprobacion] ?? c.estadoAprobacion,
        c.tipoPrueba,
        c.complejidad,
        String(c.horasEstimadas),
        fmtDate(c.fechaCreacion),
      ]
      row.forEach((cell, i) => {
        doc.text(cell, x, y)
        x += colWidths[i]!
      })
      y += 5
    }

    filename = `casos${estado ? `-${sanitizeFilename(estado)}` : ""}.pdf`
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`QAControl — ${fecha} — Página ${i}/${pageCount}`, pageWidth - 14, 205, { align: "right" })
  }

  const buffer = doc.output("arraybuffer")

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
})
