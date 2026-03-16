// ═══════════════════════════════════════════════════════════
//  PUNTO DE ENTRADA — Servicios activos
//
//  Para conectar un backend, cambiar los imports de:
//    ./localStorage/historia.service  →  ./api/historia.service
//  Los componentes importan desde aquí y no necesitan cambiar.
// ═══════════════════════════════════════════════════════════

export { historiaStorageService as historiaService } from "./localStorage/historia.service"
export { casoStorageService     as casoService     } from "./localStorage/caso.service"
export { tareaStorageService    as tareaService     } from "./localStorage/tarea.service"
export { configStorageService   as configService    } from "./localStorage/config.service"

// Re-export de interfaces para que los consumidores puedan tipar correctamente
export type {
  IHistoriaService, ICasoService, ITareaService,
  IConfigService, INotificacionService,
} from "./interfaces"
