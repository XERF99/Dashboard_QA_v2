import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/backend/middleware/auth.middleware"
import { prisma } from "@/lib/backend/prisma"

/**
 * GET /api/users/:id/asignaciones
 * Devuelve el número de HUs y tareas asignadas al usuario en su workspace actual.
 * Usado para advertir antes de quitarle el workspace.
 * Solo accesible por admins y owner.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await requireAdmin(request)
  if (payload instanceof NextResponse) return payload

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: { nombre: true, grupoId: true },
  })

  if (!user || !user.grupoId) {
    return NextResponse.json({ historias: 0, tareas: 0 })
  }

  // Contar HUs donde este usuario es responsable en su workspace
  const historias = await prisma.historiaUsuario.count({
    where: { responsable: user.nombre, grupoId: user.grupoId },
  })

  // Obtener los IDs de todas las HUs del workspace para filtrar tareas
  // (Tarea.huId no tiene relación Prisma directa con HistoriaUsuario)
  const huIds = await prisma.historiaUsuario.findMany({
    where: { grupoId: user.grupoId },
    select: { id: true },
  })

  const tareas = await prisma.tarea.count({
    where: {
      asignado: user.nombre,
      huId: { in: huIds.map(h => h.id) },
    },
  })

  return NextResponse.json({ historias, tareas })
}
