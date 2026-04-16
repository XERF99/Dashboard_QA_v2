// ── GET /api/export — exporta historias o casos a CSV
//
//  Query params:
//    tipo    = "historias" | "casos"   (requerido)
//    sprint  = <nombre>                (filtro opcional, solo historias)
//    estado  = <valor>                 (filtro opcional)
//
//  Ejemplo: GET /api/export?tipo=historias&sprint=Sprint+3

import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
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

/** Sanitiza un valor para uso seguro en Content-Disposition filename */
function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64)
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const head = headers.map(escapeCsv).join(",")
  const body = rows.map(row => row.map(escapeCsv).join(",")).join("\n")
  return `${head}\n${body}`
}

// ── Handler ───────────────────────────────────────────────

export const GET = withAuth(async (request, payload) => {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/export"), 20, 60_000) // 20 exports per minute
  if (!rl.allowed) {
    const retryAfterSecs = Math.ceil((rl.resetAt - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Demasiadas peticiones. Intenta en un momento." },
      {
        status: 429,
        headers: {
          "Retry-After":           String(retryAfterSecs),
          "X-RateLimit-Limit":     "20",
          "X-RateLimit-Remaining": "0",
        },
      }
    )
  }

  const { searchParams } = request.nextUrl
  const tipo       = searchParams.get("tipo")
  const sprint     = searchParams.get("sprint") ?? undefined
  const estado     = searchParams.get("estado") ?? undefined
  const exportLimit = Math.min(5000, Math.max(1, parseInt(searchParams.get("limit") ?? "5000") || 5000))

  if (tipo !== "historias" && tipo !== "casos") {
    return NextResponse.json(
      { error: "El parámetro 'tipo' debe ser 'historias' o 'casos'" },
      { status: 400 }
    )
  }

  let csv: string
  let filename: string

  if (tipo === "historias") {
    const where: Record<string, unknown> = { deletedAt: null }
    if (sprint) where.sprint = sprint
    if (estado) where.estado = estado
    if (payload.grupoId) where.grupoId = payload.grupoId

    const historias = await prisma.historiaUsuario.findMany({
      where,
      orderBy: { fechaCreacion: "desc" },
      take: exportLimit,
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
    filename = `historias${sprint ? `-${sanitizeFilename(sprint)}` : ""}${estado ? `-${sanitizeFilename(estado)}` : ""}.csv`
  } else {
    const where: Record<string, unknown> = { deletedAt: null }
    if (estado) where.estadoAprobacion = estado
    if (payload.grupoId) where.hu = { grupoId: payload.grupoId }

    const casos = await prisma.casoPrueba.findMany({
      where,
      orderBy: { fechaCreacion: "desc" },
      take: exportLimit,
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
    filename = `casos${estado ? `-${sanitizeFilename(estado)}` : ""}.csv`
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type":        "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
})
