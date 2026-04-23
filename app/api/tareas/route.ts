// ── GET  /api/tareas — listar todas
// ── POST /api/tareas — crear nueva
import { NextResponse } from "next/server"
import { withAuth, checkCasoAccess, checkHUAccess } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody, requireCaso } from "@/lib/backend/middleware/guards"
import { createTareaSchema } from "@/lib/backend/validators/tarea.validator"
import { getAllTareas, createTarea, getTareasByCaso, getTareasByHU } from "@/lib/backend/services/tarea.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { UnprocessableEntityError } from "@/lib/backend/errors"

export const GET = withAuth(async (request, payload) => {
  const { searchParams } = new URL(request.url)
  const casoPruebaId = searchParams.get("casoPruebaId")
  const huId         = searchParams.get("huId")
  const page         = Math.max(1, parseInt(searchParams.get("page")  ?? "1")   || 1)
  const limit        = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "200") || 200))

  if (casoPruebaId) {
    if (payload.grupoId) {
      const caso = await checkCasoAccess(casoPruebaId, payload.grupoId)
      if (!caso) return NextResponse.json({ tareas: [] })
    }
    const result = await getTareasByCaso(casoPruebaId, page, limit)
    return NextResponse.json(result)
  }
  if (huId) {
    if (payload.grupoId) {
      const hu = await checkHUAccess(huId, payload.grupoId)
      if (!hu) return NextResponse.json({ tareas: [] })
    }
    const result = await getTareasByHU(huId, page, limit)
    return NextResponse.json(result)
  }
  const asignado = searchParams.get("asignado") ?? undefined

  const result = await getAllTareas(payload.grupoId, asignado, page, limit)
  return NextResponse.json(result)
})

export const POST = withAuth(async (request, payload) => {
  await requireRateLimit(request, "POST /api/tareas", 120, 60_000)

  const value = await requireBody(request, createTareaSchema)

  const caso = await requireCaso(value.casoPruebaId, payload.grupoId, { asUnprocessable: true })
  if (value.huId && caso.huId !== value.huId) {
    throw new UnprocessableEntityError("El huId no corresponde al caso indicado")
  }

  const tarea = await createTarea(value)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ tarea }, { status: 201 })
})
