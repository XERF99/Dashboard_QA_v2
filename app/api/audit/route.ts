// ── GET /api/audit — consultar audit log (solo owner)
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { checkRateLimit, getClientIp, rlKey } from "@/lib/backend/middleware/rate-limit"
import { prisma } from "@/lib/backend/prisma"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  if (payload.rol !== "owner") {
    return NextResponse.json({ error: "Solo el Owner puede consultar el audit log" }, { status: 403 })
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
    ...(grupoId  ? { grupoId }  : {}),
    ...(resource ? { resource } : {}),
    ...(action   ? { action }   : {}),
    ...(userId   ? { userId }   : {}),
  }

  try {
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
  } catch (e) {
    return NextResponse.json({ error: "Error al consultar audit log" }, { status: 500 })
  }
}
