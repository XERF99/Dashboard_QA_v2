// ═══════════════════════════════════════════════════════════
//  SINGLETON PRISMA CLIENT
//  Evita múltiples instancias en desarrollo con hot-reload.
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client"
import { assertRequiredEnv } from "@/lib/backend/startup-check"

assertRequiredEnv()

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// Cierra la conexión limpiamente al apagar el servidor (evita conexiones huérfanas
// en despliegues tradicionales y tests de integración).
// Cierra la conexión limpiamente (SIGTERM en producción, SIGINT en dev con Ctrl-C)
const shutdownHandler = async () => {
  await prisma.$disconnect()
  process.exit(0)
}
process.on("SIGTERM", shutdownHandler)
process.on("SIGINT", shutdownHandler)
