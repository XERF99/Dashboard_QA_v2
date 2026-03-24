// ── GET /api/auth/me ──────────────────────────────────────
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, nombre: true, email: true, rol: true, grupoId: true, activo: true, debeCambiarPassword: true, fechaCreacion: true },
  })

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  return NextResponse.json({ user })
}
