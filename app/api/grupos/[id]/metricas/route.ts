// ── GET /api/grupos/[id]/metricas — métricas de un grupo (owner)
import { NextResponse } from "next/server"
import { withAuth } from "@/lib/backend/middleware/with-auth"
import { ForbiddenError } from "@/lib/backend/errors"
import { getMetricasGrupo } from "@/lib/backend/services/grupo.service"

export const GET = withAuth(async (_request, payload, ctx) => {
  if (payload.rol !== "owner") {
    throw new ForbiddenError("Solo el Owner puede consultar métricas de grupos")
  }

  const { id } = await ctx!.params
  const metricas = await getMetricasGrupo(id)
  return NextResponse.json({ metricas })
})
