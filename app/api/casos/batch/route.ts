// ── PATCH /api/casos/batch — aprobar o rechazar múltiples casos
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { prisma } from "@/lib/backend/prisma"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { audit } from "@/lib/backend/services/audit.service"

const BatchSchema = z.object({
  ids:    z.array(z.string()).min(1, "Se requiere al menos un ID").max(1000, "No se pueden procesar más de 1000 casos a la vez"),
  accion: z.enum(["aprobar", "rechazar"]),
  motivo: z.string().optional(),
})

export const PATCH = withAuthAdmin(async (request, payload) => {
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "POST /api/casos/batch"), 20, 60_000)
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

  const body = await request.json().catch(() => null)
  const parsed = BatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido", details: parsed.error.flatten() }, { status: 400 })
  }
  const { ids, accion, motivo } = parsed.data

  // Workspace isolation: only process casos that belong to the admin's workspace
  const whereWorkspace = payload.grupoId
    ? { id: { in: ids }, hu: { grupoId: payload.grupoId } }
    : { id: { in: ids } }

  const estadoAprobacion = accion === "aprobar" ? "aprobado" : "rechazado"
  const extra = accion === "aprobar"
    ? { aprobadoPor: payload.nombre, fechaAprobacion: new Date() }
    : { motivoRechazo: motivo ?? "" }

  const result = await prisma.casoPrueba.updateMany({
    where: { ...whereWorkspace, estadoAprobacion: "pendiente_aprobacion" },
    data:  { estadoAprobacion, ...extra },
  })
  invalidateMetricasCache(payload.grupoId)
  const auditAction = accion === "aprobar" ? "APPROVE" : "REJECT"
  void audit({ actor: payload, action: auditAction, resource: "casos", meta: { ids, motivo: motivo ?? null, count: result.count } })
  return NextResponse.json({ success: true, count: result.count })
})
