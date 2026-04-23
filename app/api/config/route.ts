// ── GET /api/config  — obtener configuración global
// ── PUT /api/config  — actualizar configuración (admin)
import { NextResponse } from "next/server"
import { withAuth, withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody } from "@/lib/backend/middleware/guards"
import { updateConfigSchema } from "@/lib/backend/validators/config.validator"
import { getConfig, updateConfig } from "@/lib/backend/services/config.service"

export const GET = withAuth(async (_request, payload) => {
  const config = await getConfig(payload.grupoId)
  return NextResponse.json({ config }, { headers: { "Cache-Control": "private, max-age=60" } })
})

export const PUT = withAuthAdmin(async (request, payload) => {
  await requireRateLimit(request, "PUT /api/config", 30, 60_000)

  const value = await requireBody(request, updateConfigSchema)
  const config = await updateConfig(payload.grupoId, value)
  return NextResponse.json({ config })
})
