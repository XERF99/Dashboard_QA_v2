// ── PUT /api/auth/password ────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { cambiarPasswordSchema } from "@/lib/backend/validators/auth.validator"
import { cambiarPasswordService } from "@/lib/backend/services/auth.service"

export async function PUT(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { error, value } = cambiarPasswordSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json(
      { error: error.details.map(d => d.message).join(", ") },
      { status: 400 }
    )
  }

  const result = await cambiarPasswordService(payload.sub, value.actual, value.nueva)
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ success: true })
}
