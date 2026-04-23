import type { Bloqueo } from "./common"

// ── Tarea ────────────────────────────────────────────────────
export type EstadoTarea = "pendiente" | "en_progreso" | "completada" | "bloqueada"
export type ResultadoTarea = "pendiente" | "exitoso" | "fallido"
export type TipoTarea = "ejecucion" | "verificacion" | "documentacion" | "configuracion" | "analisis"
export type PrioridadTarea = "alta" | "media" | "baja"

export interface Tarea {
  id: string
  casoPruebaId: string
  huId: string
  titulo: string
  descripcion: string
  asignado: string
  estado: EstadoTarea
  resultado: ResultadoTarea
  tipo: TipoTarea
  prioridad: PrioridadTarea
  horasEstimadas: number
  horasReales: number
  fechaCreacion: Date
  fechaInicio?: Date
  fechaFin?: Date
  bloqueos: Bloqueo[]
  evidencias: string
  creadoPor: string
}
