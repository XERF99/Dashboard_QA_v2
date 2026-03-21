// ── GET  /api/casos — listar todos
// ── POST /api/casos — crear nuevo
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/backend/middleware/auth.middleware"
import { createCasoSchema } from "@/lib/backend/validators/caso.validator"
import { getAllCasos, createCaso } from "@/lib/backend/services/caso.service"

export async function GET(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const { searchParams } = new URL(request.url)
  const huId = searchParams.get("huId")

  if (huId) {
    const { getCasosByHU } = await import("@/lib/backend/services/caso.service")
    const casos = await getCasosByHU(huId)
    return NextResponse.json({ casos })
  }

  const casos = await getAllCasos()
  return NextResponse.json({ casos })
}

export async function POST(request: NextRequest) {
  const payload = await requireAuth(request)
  if (payload instanceof NextResponse) return payload

  const body = await request.json()
  const { error, value } = createCasoSchema.validate(body, { abortEarly: false })
  if (error) {
    return NextResponse.json({ error: error.details.map(d => d.message).join(", ") }, { status: 400 })
  }

  const caso = await createCaso(value)
  return NextResponse.json({ caso }, { status: 201 })
}
