import type {
  EntornoCaso,
  TipoPrueba,
  ComplejidadCaso,
  EtapaEjecucion,
} from "./config"
import type { Comentario, Bloqueo } from "./common"

// ── Aprobación ──────────────────────────────────────────────
export type EstadoAprobacion =
  | "borrador"
  | "pendiente_aprobacion"
  | "aprobado"
  | "rechazado"

// ── Ejecución por etapa ─────────────────────────────────────
export type EstadoEjecucion = "pendiente" | "en_ejecucion" | "completado"
export type ResultadoEjecucion = string // ID de ResultadoDef o "pendiente"

export interface IntentoEjecucion {
  numero: number
  resultado: string
  comentarioFallo?: string
  comentarioCorreccion?: string
  fecha: Date
  ejecutadoPor: string
}

export interface ResultadoEtapa {
  etapa: EtapaEjecucion
  estado: EstadoEjecucion
  resultado: ResultadoEjecucion
  fechaInicio?: Date
  fechaFin?: Date
  intentos: IntentoEjecucion[]
}

// ── Caso de Prueba ──────────────────────────────────────────
export interface CasoPrueba {
  id: string
  huId: string
  titulo: string
  descripcion: string
  entorno: EntornoCaso
  tipoPrueba: TipoPrueba
  horasEstimadas: number
  archivosAnalizados: string[]
  complejidad: ComplejidadCaso
  estadoAprobacion: EstadoAprobacion
  aprobadoPor?: string
  fechaAprobacion?: Date
  motivoRechazo?: string
  resultadosPorEtapa: ResultadoEtapa[]
  fechaCreacion: Date
  tareasIds: string[]
  bloqueos: Bloqueo[]
  creadoPor: string
  modificacionHabilitada: boolean
  motivoModificacion?: string
  modificacionSolicitada?: boolean
  comentarios: Comentario[]
}
