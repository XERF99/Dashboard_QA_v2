// ── GET  /api/casos — listar todos
// ── POST /api/casos — crear nuevo
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { createCasoSchema } from "@/lib/backend/validators/caso.validator"
import { getAllCasos, createCaso, getCasosByHU } from "@/lib/backend/services/caso.service"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"
import { audit } from "@/lib/backend/services/audit.service"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { searchParams } = new URL(request.url)
  const huId  = searchParams.get("huId")
  const page  = Math.max(1, parseInt(searchParams.get("page")  ?? "1")   || 1)
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "100") || 100))

  if (huId) {
    // Validar que la HU pertenezca al workspace del usuario (owner ve todo)
    if (payload.grupoId) {
      const hu = await prisma.historiaUsuario.findUnique({ where: { id: huId }, select: { grupoId: true } })
      if (!hu || hu.grupoId !== payload.grupoId) {
        return NextResponse.json({ casos: [] })
      }
    }
    try {
      const result = await getCasosByHU(huId, page, limit)
      return NextResponse.json(result)
    } catch (e) {
      logger.error("GET /api/casos", "Error al obtener casos por HU", e)
      const msg = e instanceof Error ? e.message : "Error al obtener casos"
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  try {
    const result = await getAllCasos(payload.grupoId, page, limit)
    return NextResponse.json(result)
  } catch (e) {
    logger.error("GET /api/casos", "Error al obtener casos", e)
    const msg = e instanceof Error ? e.message : "Error al obtener casos"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { error, value } = createCasoSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  // Verificar que la HU existe y pertenece al workspace
  const hu = await prisma.historiaUsuario.findUnique({
    where: { id: value.huId },
    select: { grupoId: true },
  })
  if (!hu) {
    return NextResponse.json({ error: "La Historia de Usuario no existe" }, { status: 422 })
  }
  if (payload.grupoId && hu.grupoId !== payload.grupoId) {
    return NextResponse.json({ error: "La Historia de Usuario no pertenece a tu workspace" }, { status: 422 })
  }

  try {
    const caso = await createCaso(value)
    invalidateMetricasCache(payload.grupoId)
    void audit({ actor: payload, action: "CREATE", resource: "casos", resourceId: caso.id, meta: { titulo: caso.titulo, huId: caso.huId } })
    return NextResponse.json({ caso }, { status: 201 })
  } catch (e) {
    logger.error("POST /api/casos", "Error al crear caso", e)
    const msg = e instanceof Error ? e.message : "Error al crear caso"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
