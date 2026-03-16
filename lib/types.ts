// ═══════════════════════════════════════════════════════════
//  BARREL DE RE-EXPORTS — Compatibilidad hacia atrás
//
//  Todos los imports existentes (`from "@/lib/types"`) siguen
//  funcionando sin cambios. Los nuevos módulos deben importar
//  directamente desde su origen:
//
//    import type { HistoriaUsuario } from "@/lib/types/index"
//    import { PRIORIDAD_CFG }        from "@/lib/constants"
//    import { crearEvento }          from "@/lib/utils/domain"
//    import { historiasEjemplo }     from "@/lib/data/seed"
// ═══════════════════════════════════════════════════════════

export * from "@/lib/types/index"
export * from "@/lib/constants/index"
export * from "@/lib/utils/domain"
export { tareasEjemplo, casosPruebaEjemplo, historiasEjemplo } from "@/lib/data/seed"
