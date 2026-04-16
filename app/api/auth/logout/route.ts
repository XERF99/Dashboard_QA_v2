// ── POST /api/auth/logout ─────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { logoutService } from "@/lib/backend/services/auth.service"
import { audit } from "@/lib/backend/services/audit.service"

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  try {
    await logoutService(payload.sub)
    void audit({ actor: payload, action: "LOGOUT", resource: "auth", resourceId: payload.sub })
    const response = NextResponse.json({ success: true })
    response.cookies.delete("tcs_token")
    response.cookies.delete({ name: "tcs_refresh", path: "/api/auth/refresh" })
    return response
  } catch (error) {
    return NextResponse.json({ error: "Error al cerrar sesión" }, { status: 500 })
  }
}
