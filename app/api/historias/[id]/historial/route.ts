// ── GET /api/historias/[id]/historial
//    Devuelve el log de auditoría de una HU de forma paginada.
//    Query params: page (default 1), limit (default 20, máx 100)
//    Orden: más reciente primero.
import { NextRequest, NextResponse } from "next/server"
import { withAuth, checkHUAccess } from "@/lib/backend/middleware/with-auth"
import { getHistoriaById } from "@/lib/backend/services/historia.service"

interface EventoHistorial {
  id:          string
  tipo:        string
  descripcion: string
  fecha:       string | Date
  usuario:     string
  detalles?:   Record<string, string>
}

export const GET = withAuth(async (request, payload, ctx) => {
  const { id } = await ctx!.params

  // Verificar aislamiento de workspace
  if (payload.grupoId) {
    const access = await checkHUAccess(id, payload.grupoId)
    if (!access) {
      return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 })
    }
  }

  const historia = await getHistoriaById(id)
  if (!historia) {
    return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 })
  }

  const raw     = (historia.historial as unknown as EventoHistorial[]) ?? []
  const sorted  = [...raw].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )

  const url   = new URL(request.url)
  const page  = Math.max(1, parseInt(url.searchParams.get("page")  ?? "1",  10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10) || 20))
  const offset = (page - 1) * limit
  const total  = sorted.length
  const pages  = total === 0 ? 1 : Math.ceil(total / limit)

  return NextResponse.json({
    historial: sorted.slice(offset, offset + limit),
    total,
    page,
    limit,
    pages,
  })
})
