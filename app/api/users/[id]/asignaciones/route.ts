import { NextRequest, NextResponse } from "next/server"
import { withAuthAdmin } from "@/lib/backend/middleware/with-auth"
import { prisma } from "@/lib/backend/prisma"

/**
 * GET /api/users/:id/asignaciones
 * Devuelve el número de HUs y tareas asignadas al usuario en su workspace actual.
 * Usado para advertir antes de quitarle el workspace.
 * Solo accesible por admins y owner.
 */
export const GET = withAuthAdmin(async (request, payload, ctx) => {
  const { id } = await ctx!.params

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
})
