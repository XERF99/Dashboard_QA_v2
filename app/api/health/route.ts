// ── GET /api/health ───────────────────────────────────────
// Endpoint de salud para load balancers, uptime monitors y
// despliegues en Vercel / contenedores.
// No requiere autenticación — debe responder aunque la DB falle.
import { NextResponse } from "next/server"
import { prisma } from "@/lib/backend/prisma"

function memoryMB() {
  const mem = process.memoryUsage()
  return {
    rss_mb:        Math.round(mem.rss / 1024 / 1024),
    heapUsed_mb:   Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal_mb:  Math.round(mem.heapTotal / 1024 / 1024),
    external_mb:   Math.round(mem.external / 1024 / 1024),
  }
}

export async function GET() {
  const start = Date.now()
  const checks: Record<string, "ok" | "error"> = {}

  // ── Deep DB check: connectivity + basic query ─────────────
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db = "ok"
  } catch {
    checks.db = "error"
  }

  // ── DB table accessibility check ──────────────────────────
  try {
    await prisma.user.count({ take: 1 })
    checks.db_tables = "ok"
  } catch {
    checks.db_tables = "error"
  }

  // ── Environment check ─────────────────────────────────────
  checks.jwt_secret = process.env.JWT_SECRET ? "ok" : "error"
  checks.database_url = process.env.DATABASE_URL ? "ok" : "error"

  const allOk = Object.values(checks).every(v => v === "ok")
  const status = allOk ? "ok" : "degraded"
  const httpStatus = allOk ? 200 : 503

  return NextResponse.json({
    status,
    checks,
    uptime: process.uptime(),
    latency_ms: Date.now() - start,
    memory: memoryMB(),
    version: process.env.npm_package_version ?? "unknown",
    node: process.version,
  }, {
    status: httpStatus,
    headers: { "Cache-Control": "no-store" },
  })
}
