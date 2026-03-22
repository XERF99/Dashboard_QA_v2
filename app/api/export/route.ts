// ── GET /api/export — exporta historias o casos a CSV
//
//  Query params:
//    tipo    = "historias" | "casos"   (requerido)
//    sprint  = <nombre>                (filtro opcional, solo historias)
//    estado  = <valor>                 (filtro opcional)
//
//  Ejemplo: GET /api/export?tipo=historias&sprint=Sprint+3

import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"

// ── Utilidades CSV ────────────────────────────────────────

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const head = headers.map(escapeCsv).join(",")
  const body = rows.map(row => row.map(escapeCsv).join(",")).join("\n")
  return `${head}\n${body}`
}

// ── Handler ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { searchParams } = request.nextUrl
  const tipo   = searchParams.get("tipo")
  const sprint = searchParams.get("sprint") ?? undefined
  const estado = searchParams.get("estado") ?? undefined

  if (tipo !== "historias" && tipo !== "casos") {
    return NextResponse.json(
      { error: "El parámetro 'tipo' debe ser 'historias' o 'casos'" },
      { status: 400 }
    )
  }

  let csv: string
  let filename: string

  if (tipo === "historias") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}
    if (sprint) where.sprint = sprint
    if (estado) where.estado = estado

    const historias = await prisma.historiaUsuario.findMany({
      where,
      orderBy: { fechaCreacion: "desc" },
    })

    const headers = [
      "id", "codigo", "titulo", "estado", "prioridad", "sprint",
      "responsable", "puntos", "etapa", "ambiente", "tipoPrueba",
      "aplicacion", "requiriente", "areaSolicitante",
      "fechaCreacion", "fechaFinEstimada", "fechaCierre",
    ]
    const rows = historias.map(h => [
      h.id, h.codigo, h.titulo, h.estado, h.prioridad, h.sprint ?? "",
      h.responsable, h.puntos, h.etapa, h.ambiente, h.tipoPrueba,
      h.aplicacion, h.requiriente, h.areaSolicitante,
      h.fechaCreacion?.toISOString() ?? "",
      h.fechaFinEstimada?.toISOString() ?? "",
      h.fechaCierre?.toISOString() ?? "",
    ])

    csv = toCsv(headers, rows)
    filename = `historias${sprint ? `-${sprint.replace(/\s+/g, "_")}` : ""}${estado ? `-${estado}` : ""}.csv`
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {}
    if (estado) where.estadoAprobacion = estado

    const casos = await prisma.casoPrueba.findMany({
      where,
      orderBy: { fechaCreacion: "desc" },
    })

    const headers = [
      "id", "huId", "titulo", "estadoAprobacion", "tipoPrueba",
      "entorno", "complejidad", "horasEstimadas",
      "aprobadoPor", "fechaAprobacion", "creadoPor", "fechaCreacion",
    ]
    const rows = casos.map(c => [
      c.id, c.huId, c.titulo, c.estadoAprobacion, c.tipoPrueba,
      c.entorno, c.complejidad, c.horasEstimadas,
      c.aprobadoPor ?? "", c.fechaAprobacion?.toISOString() ?? "",
      c.creadoPor, c.fechaCreacion?.toISOString() ?? "",
    ])

    csv = toCsv(headers, rows)
    filename = `casos${estado ? `-${estado}` : ""}.csv`
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
