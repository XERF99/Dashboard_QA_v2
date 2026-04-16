// ── GET  /api/tareas — listar todas
// ── POST /api/tareas — crear nueva
import { NextRequest, NextResponse } from "next/server"
import { withAuth, checkCasoAccess, checkHUAccess } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { createTareaSchema } from "@/lib/backend/validators/tarea.validator"
import { getAllTareas, createTarea, getTareasByCaso, getTareasByHU } from "@/lib/backend/services/tarea.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"

export const GET = withAuth(async (request, payload) => {
  const { searchParams } = new URL(request.url)
  const casoPruebaId = searchParams.get("casoPruebaId")
  const huId         = searchParams.get("huId")
  const page         = Math.max(1, parseInt(searchParams.get("page")  ?? "1")   || 1)
  const limit        = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "200") || 200))

  if (casoPruebaId) {
    // Validar que el caso pertenezca al workspace (owner ve todo)
    if (payload.grupoId) {
      const caso = await checkCasoAccess(casoPruebaId, payload.grupoId)
      if (!caso) return NextResponse.json({ tareas: [] })
    }
    const result = await getTareasByCaso(casoPruebaId, page, limit)
    return NextResponse.json(result)
  }
  if (huId) {
    // Validar que la HU pertenezca al workspace (owner ve todo)
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
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "POST /api/tareas"), 120, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const body = await request.json()
  const { error, value } = createTareaSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  // Verificar que el caso existe y pertenece al workspace
  const caso = await checkCasoAccess(value.casoPruebaId, payload.grupoId)
  if (!caso) {
    return NextResponse.json({ error: "El Caso de Prueba no existe o no pertenece a tu workspace" }, { status: 422 })
  }
  // Verificar coherencia de huId (checkCasoAccess already includes huId)
  if (value.huId && caso.huId !== value.huId) {
    return NextResponse.json({ error: "El huId no corresponde al caso indicado" }, { status: 422 })
  }

  const tarea = await createTarea(value)
  invalidateMetricasCache(payload.grupoId)
  return NextResponse.json({ tarea }, { status: 201 })
})
