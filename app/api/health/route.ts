// ── GET /api/health ───────────────────────────────────────
// Endpoint de salud para load balancers, uptime monitors y
// despliegues en Vercel / contenedores.
// No requiere autenticación — debe responder aunque la DB falle.
import { NextResponse } from "next/server"
import { prisma } from "@/lib/backend/prisma"

export async function GET() {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({
      status: "ok",
      db:     "ok",
      uptime: process.uptime(),
      latency_ms: Date.now() - start,
    })
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "error", uptime: process.uptime() },
      { status: 503 },
    )
  }
}
