// ── PUT /api/auth/password ────────────────────────────────
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit, requireBody } from "@/lib/backend/middleware/guards"
import { cambiarPasswordSchema } from "@/lib/backend/validators/auth.validator"
import { cambiarPasswordService } from "@/lib/backend/services/auth.service"
import { ValidationError } from "@/lib/backend/errors"

export const PUT = withAuth(async (request, payload) => {
  await requireRateLimit(request, "PUT /api/auth/password", 10, 15 * 60 * 1000, payload.sub)

  const value = await requireBody(request, cambiarPasswordSchema)
  const result = await cambiarPasswordService(payload.sub, value.actual, value.nueva)
  if (!result.success) throw new ValidationError(result.error)
  return NextResponse.json({ success: true })
})
