// ── POST /api/auth/logout ─────────────────────────────────
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { logoutService } from "@/lib/backend/services/auth.service"
import { audit } from "@/lib/backend/services/audit.service"

export const POST = withAuth(async (_request, payload) => {
  await logoutService(payload.sub)
  void audit({ actor: payload, action: "LOGOUT", resource: "auth", resourceId: payload.sub })
  const response = NextResponse.json({ success: true })
  response.cookies.delete("tcs_token")
  response.cookies.delete({ name: "tcs_refresh", path: "/api/auth/refresh" })
  return response
})
