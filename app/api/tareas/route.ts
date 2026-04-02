// ── GET  /api/tareas — listar todas
// ── POST /api/tareas — crear nueva
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { createTareaSchema } from "@/lib/backend/validators/tarea.validator"
import { getAllTareas, createTarea, getTareasByCaso, getTareasByHU } from "@/lib/backend/services/tarea.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { searchParams } = new URL(request.url)
  const casoPruebaId = searchParams.get("casoPruebaId")
  const huId         = searchParams.get("huId")
  const page         = Math.max(1, parseInt(searchParams.get("page")  ?? "1")   || 1)
  const limit        = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "200") || 200))

  if (casoPruebaId) {
    // Validar que el caso pertenezca al workspace (owner ve todo)
    if (payload.grupoId) {
      const caso = await prisma.casoPrueba.findUnique({
        where: { id: casoPruebaId },
        select: { hu: { select: { grupoId: true } } },
      })
      if (!caso || caso.hu?.grupoId !== payload.grupoId) {
        return NextResponse.json({ tareas: [] })
      }
    }
    try {
      const result = await getTareasByCaso(casoPruebaId, page, limit)
      return NextResponse.json(result)
    } catch (e) {
      logger.error("GET /api/tareas", "Error al obtener tareas por caso", e)
      const msg = e instanceof Error ? e.message : "Error al obtener tareas"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }
  if (huId) {
    // Validar que la HU pertenezca al workspace (owner ve todo)
    if (payload.grupoId) {
      const hu = await prisma.historiaUsuario.findUnique({ where: { id: huId }, select: { grupoId: true } })
      if (!hu || hu.grupoId !== payload.grupoId) {
        return NextResponse.json({ tareas: [] })
      }
    }
    try {
      const result = await getTareasByHU(huId, page, limit)
      return NextResponse.json(result)
    } catch (e) {
      logger.error("GET /api/tareas", "Error al obtener tareas por HU", e)
      const msg = e instanceof Error ? e.message : "Error al obtener tareas"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }
  const asignado = searchParams.get("asignado") ?? undefined

  try {
    const result = await getAllTareas(payload.grupoId, asignado, page, limit)
    return NextResponse.json(result)
  } catch (e) {
    logger.error("GET /api/tareas", "Error al obtener tareas", e)
    const msg = e instanceof Error ? e.message : "Error al obtener tareas"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { error, value } = createTareaSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  // Verificar que el caso existe y pertenece al workspace
  const caso = await prisma.casoPrueba.findUnique({
    where: { id: value.casoPruebaId },
    select: { huId: true, hu: { select: { grupoId: true } } },
  })
  if (!caso) {
    return NextResponse.json({ error: "El Caso de Prueba no existe" }, { status: 422 })
  }
  if (payload.grupoId && caso.hu?.grupoId !== payload.grupoId) {
    return NextResponse.json({ error: "El Caso de Prueba no pertenece a tu workspace" }, { status: 422 })
  }
  // Verificar coherencia de huId
  if (value.huId && caso.huId !== value.huId) {
    return NextResponse.json({ error: "El huId no corresponde al caso indicado" }, { status: 422 })
  }

  try {
    const tarea = await createTarea(value)
    invalidateMetricasCache(payload.grupoId)
    return NextResponse.json({ tarea }, { status: 201 })
  } catch (e) {
    logger.error("POST /api/tareas", "Error al crear tarea", e)
    const msg = e instanceof Error ? e.message : "Error al crear tarea"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
