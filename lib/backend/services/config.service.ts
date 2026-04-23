// ═══════════════════════════════════════════════════════════
//  CONFIG SERVICE — lógica de negocio para configuración
//  Una fila de config por grupo (upsert por grupoId).
//  Para retrocompatibilidad, si grupoId no se proporciona
//  se usa 'grupo-default' (el grupo creado en la migración).
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"
import type { Prisma } from "@prisma/client"

const DEFAULT_GRUPO_ID = "grupo-default"

export async function getConfig(grupoId: string = DEFAULT_GRUPO_ID) {
  return (
    await prisma.config.findUnique({ where: { grupoId } }) ??
    await prisma.config.create({ data: { grupoId } })
  )
}

export interface ConfigUpdateData {
  etapas?:          Prisma.InputJsonValue
  resultados?:      Prisma.InputJsonValue
  tiposAplicacion?: Prisma.InputJsonValue
  ambientes?:       Prisma.InputJsonValue
  tiposPrueba?:     Prisma.InputJsonValue
  aplicaciones?:    Prisma.InputJsonValue
}

export async function updateConfig(
  grupoId: string = DEFAULT_GRUPO_ID,
  data: ConfigUpdateData
) {
  return prisma.config.upsert({
    where:  { grupoId },
    update: data,
    create: { grupoId, ...data },
  })
}

// ── Interface (v2.78) ─────────────────────────────────────────
export interface ConfigService {
  get:    typeof getConfig
  update: typeof updateConfig
}

export const configService: ConfigService = {
  get:    getConfig,
  update: updateConfig,
}
