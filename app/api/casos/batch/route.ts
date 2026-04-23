// ── PATCH /api/casos/batch — aprobar o rechazar múltiples casos
import { NextResponse } from "next/server"
import { z } from "zod"
import { withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { ValidationError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"
import { invalidateMetricasCache } from "@/lib/backend/metricas-cache"
import { audit } from "@/lib/backend/services/audit.service"

const BatchSchema = z.object({
  ids:    z.array(z.string()).min(1, "Se requiere al menos un ID").max(1000, "No se pueden procesar más de 1000 casos a la vez"),
  accion: z.enum(["aprobar", "rechazar"]),
  motivo: z.string().optional(),
})

export const PATCH = withAuthAdmin(async (request, payload) => {
  await requireRateLimit(request, "POST /api/casos/batch", 20, 60_000)

  const parsed = BatchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    throw new ValidationError("Payload inválido", parsed.error.issues.map(i => i.message))
  }
  const { ids, accion, motivo } = parsed.data

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
