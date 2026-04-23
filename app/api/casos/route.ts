// ── GET  /api/casos — listar todos
// ── POST /api/casos — crear nuevo
import { NextResponse } from "next/server"
import { withAuth, checkHUAccess } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody, requireHU } from "@/lib/backend/middleware/guards"
import { createCasoSchema } from "@/lib/backend/validators/caso.validator"
import { getAllCasos, createCaso, getCasosByHU } from "@/lib/backend/services/caso.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { audit } from "@/lib/backend/services/audit.service"

export const GET = withAuth(async (request, payload) => {
  const { searchParams } = new URL(request.url)
  const huId  = searchParams.get("huId")
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")   || 1)
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "100") || 100))

  if (huId) {
    // Owner (grupoId undefined) ve todo; workspaces filtran por grupo
    if (payload.grupoId) {
      const hu = await checkHUAccess(huId, payload.grupoId)
      if (!hu) return NextResponse.json({ casos: [] })
    }
    const result = await getCasosByHU(huId, page, limit)
    return NextResponse.json(result)
  }

  const result = await getAllCasos(payload.grupoId, page, limit)
  return NextResponse.json(result)
})

export const POST = withAuth(async (request, payload) => {
  await requireRateLimit(request, "POST /api/casos", 120, 60_000)

  const value = await requireBody(request, createCasoSchema)
  await requireHU(value.huId, payload.grupoId, { asUnprocessable: true })

  const caso = await createCaso(value)
  invalidateMetricasCache(payload.grupoId)
  void audit({ actor: payload, action: "CREATE", resource: "casos", resourceId: caso.id, meta: { titulo: caso.titulo, huId: caso.huId } })
  return NextResponse.json({ caso }, { status: 201 })
})
