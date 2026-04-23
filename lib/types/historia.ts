import type { EtapaHU, TipoAplicacion, AmbientePrueba, TipoPrueba } from "./config"
import type { Comentario, Bloqueo } from "./common"

// ── Historia de Usuario ─────────────────────────────────────
export type EstadoHU =
  | "sin_iniciar"
  | "en_progreso"
  | "exitosa"
  | "fallida"
  | "cancelada"

export type PrioridadHU = "critica" | "alta" | "media" | "baja"

export interface HistoriaUsuario {
  id: string
  codigo: string
  titulo: string
  descripcion: string
  criteriosAceptacion: string
  responsable: string
  prioridad: PrioridadHU
  estado: EstadoHU
  puntos: number
  sprint?: string
  aplicacion: string
  tipoAplicacion: TipoAplicacion
  requiriente: string
  areaSolicitante: string
  fechaCreacion: Date
  fechaFinEstimada?: Date
  fechaCierre?: Date
  etapa: EtapaHU
  motivoCancelacion?: string
  ambiente: AmbientePrueba
  tipoPrueba: TipoPrueba
  casosIds: string[]
  bloqueos: Bloqueo[]
  historial: EventoHistorial[]
  creadoPor: string
  delegadoPor: string
  permitirCasosAdicionales: boolean
  motivoCasosAdicionales?: string
  comentarios: Comentario[]
  grupoId?: string | null
}

// ── Historial de eventos ─────────────────────────────────────
export type TipoEvento =
  | "hu_creada" | "hu_editada" | "hu_iniciada" | "hu_etapa_avanzada"
  | "hu_completada" | "hu_cancelada" | "hu_fallida"
  | "caso_creado" | "caso_enviado_aprobacion" | "caso_aprobado" | "caso_rechazado"
  | "caso_ejecucion_iniciada" | "caso_completado"
  | "caso_retesteo_solicitado" | "caso_retesteo_ejecutado"
  | "caso_editado" | "caso_eliminado"
  | "caso_modificacion_solicitada" | "caso_modificacion_habilitada"
  | "casos_adicionales_habilitados"
  | "tarea_creada" | "tarea_completada" | "tarea_editada" | "tarea_eliminada"
  | "tarea_bloqueada" | "tarea_desbloqueada"
  | "bloqueo_reportado" | "bloqueo_resuelto"

export interface EventoHistorial {
  id: string
  tipo: TipoEvento
  descripcion: string
  fecha: Date
  usuario: string
  detalles?: Record<string, string>
}
