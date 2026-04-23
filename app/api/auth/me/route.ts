// ── GET /api/auth/me ──────────────────────────────────────
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { NotFoundError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"

export const GET = withAuth(async (_request, payload) => {
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, nombre: true, email: true, rol: true, grupoId: true, activo: true, debeCambiarPassword: true, fechaCreacion: true },
  })

  if (!user) throw new NotFoundError("Usuario")
  return NextResponse.json({ user })
})
