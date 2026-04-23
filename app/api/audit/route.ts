// ── GET /api/audit — consultar audit log (owner ve todo, admin ve su workspace)
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { requireRateLimit } from "@/lib/backend/middleware/guards"
import { ForbiddenError } from "@/lib/backend/errors"
import { prisma } from "@/lib/backend/prisma"

export const GET = withAuth(async (request, payload) => {
  if (!["owner", "admin"].includes(payload.rol)) {
    throw new ForbiddenError("Solo Owner o Admin pueden consultar el audit log")
  }
  await requireRateLimit(request, "GET /api/audit", 30, 60_000)

  const { searchParams } = new URL(request.url)
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit    = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))
  const grupoId  = searchParams.get("grupoId")  ?? undefined
  const resource = searchParams.get("resource") ?? undefined
  const action   = searchParams.get("action")   ?? undefined
  const userId   = searchParams.get("userId")   ?? undefined
  const skip     = (page - 1) * limit

  const where = {
    ...(payload.grupoId ? { grupoId: payload.grupoId } : grupoId ? { grupoId } : {}),
    ...(resource ? { resource } : {}),
    ...(action   ? { action }   : {}),
    ...(userId   ? { userId }   : {}),
  }

  const [entries, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      skip,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ])
  return NextResponse.json({ entries, total, page, limit, pages: Math.ceil(total / limit) })
})
