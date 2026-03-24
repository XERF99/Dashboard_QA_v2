// ═══════════════════════════════════════════════════════════
//  CONFIG SERVICE — lógica de negocio para configuración
//  Una fila de config por grupo (upsert por grupoId).
//  Para retrocompatibilidad, si grupoId no se proporciona
//  se usa 'grupo-default' (el grupo creado en la migración).
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

const DEFAULT_GRUPO_ID = "grupo-default"

export async function getConfig(grupoId: string = DEFAULT_GRUPO_ID) {
  return (
    await prisma.config.findUnique({ where: { grupoId } }) ??
    await prisma.config.create({ data: { grupoId } })
  )
}

export async function updateConfig(
  grupoId: string = DEFAULT_GRUPO_ID,
  data: {
    etapas?:          object
    resultados?:      unknown[]
    tiposAplicacion?: unknown[]
    ambientes?:       unknown[]
    tiposPrueba?:     unknown[]
    aplicaciones?:    string[]
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.config.upsert({
    where:  { grupoId },
    update: data as any,
    create: { grupoId, ...(data as any) },
  })
}
