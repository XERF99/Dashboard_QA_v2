// ═══════════════════════════════════════════════════════════
//  BARREL DE RE-EXPORTS — Compatibilidad hacia atrás
//
//  @deprecated — Importar directamente desde el origen:
//    import type { HistoriaUsuario } from "@/lib/types/index"
//    import { PRIORIDAD_CFG }        from "@/lib/constants"
//    import { crearEvento }          from "@/lib/utils/domain"
//    import { historiasEjemplo }     from "@/lib/data/seed"
//
//  Este archivo se mantiene solo para no romper imports legacy.
//  NO agregar nuevos exports aquí.
// ═══════════════════════════════════════════════════════════

/** @deprecated Use `@/lib/types/index` directly */
export * from "@/lib/types/index"
/** @deprecated Use `@/lib/constants` directly */
export * from "@/lib/constants/index"
/** @deprecated Use `@/lib/utils/domain` directly */
export * from "@/lib/utils/domain"
/** @deprecated Use `@/lib/data/seed` directly */
export { tareasEjemplo, casosPruebaEjemplo, historiasEjemplo } from "@/lib/data/seed"
