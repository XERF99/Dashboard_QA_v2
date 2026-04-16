// ── GET /api/audit — consultar audit log (owner ve todo, admin ve su workspace)
import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { prisma } from "@/lib/backend/prisma"

export const GET = withAuth(async (request, payload) => {
  if (!["owner", "admin"].includes(payload.rol)) {
    return NextResponse.json({ error: "Solo Owner o Admin pueden consultar el audit log" }, { status: 403 })
  }

  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(rlKey(ip, "GET /api/audit"), 30, 60_000)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Demasiadas peticiones. Intenta en un momento." }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const page     = Math.max(1, parseInt(searchParams.get("page")  ?? "1")  || 1)
  const limit    = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50") || 50))
  const grupoId  = searchParams.get("grupoId")  ?? undefined
  const resource = searchParams.get("resource") ?? undefined
  const action   = searchParams.get("action")   ?? undefined
  const userId   = searchParams.get("userId")   ?? undefined
  const skip     = (page - 1) * limit

  const where = {
    // Admin can only see their own workspace; owner can filter or see all
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
