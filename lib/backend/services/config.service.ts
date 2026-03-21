// ═══════════════════════════════════════════════════════════
//  CONFIG SERVICE — lógica de negocio para configuración
//  Mantiene una única fila en la tabla config (upsert).
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"

const CONFIG_ID = "singleton"

export async function getConfig() {
  return prisma.config.upsert({
    where:  { id: CONFIG_ID },
    update: {},
    create: { id: CONFIG_ID },
  })
}

export async function updateConfig(data: {
  etapas?:          object
  resultados?:      unknown[]
  tiposAplicacion?: unknown[]
  ambientes?:       unknown[]
  tiposPrueba?:     unknown[]
  aplicaciones?:    string[]
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return prisma.config.upsert({
    where:  { id: CONFIG_ID },
    update: data as any,
    create: { id: CONFIG_ID, ...(data as any) },
  })
}
