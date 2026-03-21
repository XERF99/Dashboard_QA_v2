// ── POST /api/auth/logout ─────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { logoutService } from "@/lib/backend/services/auth.service"

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  await logoutService(payload.sub)

  const response = NextResponse.json({ success: true })
  response.cookies.delete("tcs_token")
  return response
}
