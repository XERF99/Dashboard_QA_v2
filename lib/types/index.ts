// ═══════════════════════════════════════════════════════════
//  TIPOS DE DOMINIO — Dashboard QA (barrel file)
//
//  Cada dominio vive en su propio archivo. Este index sólo
//  re-exporta para mantener compatibilidad con imports existentes.
//  Para nuevos módulos, prefiere importar directamente:
//      import type { HistoriaUsuario } from "@/lib/types/historia"
// ═══════════════════════════════════════════════════════════

export * from "./brand"
export * from "./common"
export * from "./config"
export * from "./historia"
export * from "./caso"
export * from "./tarea"
export * from "./sprint"
export * from "./user"
export * from "./notificacion"
export * from "./api"
