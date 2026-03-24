// ── GET /api/config  — obtener configuración global
// ── PUT /api/config  — actualizar configuración (admin)
import { NextRequest, NextResponse } from "next/server"
import { requireAuth, requireAdmin } from "@/lib/backend/middleware/auth.middleware"
import { updateConfigSchema } from "@/lib/backend/validators/config.validator"
import { getConfig, updateConfig } from "@/lib/backend/services/config.service"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const config = await getConfig(payload.grupoId)
  return NextResponse.json({ config })
}

export async function PUT(request: NextRequest) {
  const payload = await requireAdmin(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { error, value } = updateConfigSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const config = await updateConfig(payload.grupoId, value)
  return NextResponse.json({ config })
}
