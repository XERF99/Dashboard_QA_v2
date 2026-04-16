// ═══════════════════════════════════════════════════════════
//  TIPOS DE DOMINIO — Dashboard QA
//  Interfaces, type aliases y constantes tipadas.
// ═══════════════════════════════════════════════════════════

// ── Branded types for nominal type safety ───────────────────
// Branded types prevent accidentally passing a raw string where
// a domain-specific identifier is expected. They are still strings
// at runtime but enforced at compile time.
declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

export type EntityId<T extends string = string> = Brand<string, T>
export type HUId = EntityId<"HU">
export type CasoId = EntityId<"Caso">
export type TareaId = EntityId<"Tarea">

// ── Etapas ──────────────────────────────────────────────────
export type EtapaEjecucion = string

export interface EtapaDefinicion {
  id: string
  label: string
  cls: string
}

export type ConfigEtapas = Record<string, EtapaDefinicion[]>

export type EtapaHU =
  | "sin_iniciar"
  | EtapaEjecucion
  | "completada"
  | "cambio_cancelado"

// ── HU ──────────────────────────────────────────────────────
export type EstadoHU =
  | "sin_iniciar"
  | "en_progreso"
  | "exitosa"
  | "fallida"
  | "cancelada"

export type PrioridadHU = "critica" | "alta" | "media" | "baja"

// ── Tipo de aplicación ───────────────────────────────────────
export type TipoAplicacion = string

export interface TipoAplicacionDef {
  id: string
  label: string
}

// ── Ambiente ─────────────────────────────────────────────────
export type AmbientePrueba = string

export interface AmbienteDef {
  id: string
  label: string
}

// ── Tipo de prueba ────────────────────────────────────────────
export type TipoPrueba = string
export type ComplejidadCaso = "alta" | "media" | "baja"
export type EntornoCaso = "test" | "preproduccion"

export interface TipoPruebaDef {
  id: string
  label: string
}

// ── Aprobación de caso ────────────────────────────────────────
export type EstadoAprobacion =
  | "borrador"
  | "pendiente_aprobacion"
  | "aprobado"
  | "rechazado"

// ── Resultados de ejecución configurables ─────────────────────
export interface ResultadoDef {
  id: string          // e.g. "exitoso", "fallido", "bloqueado"
  label: string       // display name
  esAceptado: boolean // true → cuenta como válido para avanzar etapa
  esBase: boolean     // true → no se puede eliminar
  cls: string         // badge CSS classes
  icono?: string      // carácter/emoji para badge (ej: "✓", "✗", "⚠", "🔒")
  maxRetesteos?: number // solo aplica a resultados !esAceptado; undefined = ilimitado
}

// ── Ejecución por etapa ───────────────────────────────────────
export type EstadoEjecucion = "pendiente" | "en_ejecucion" | "completado"
export type ResultadoEjecucion = string   // ID de ResultadoDef o "pendiente"

export interface IntentoEjecucion {
  numero: number
  resultado: string   // ID de ResultadoDef
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

// ── Tarea ─────────────────────────────────────────────────────
export type EstadoTarea = "pendiente" | "en_progreso" | "completada" | "bloqueada"
export type ResultadoTarea = "pendiente" | "exitoso" | "fallido"
export type TipoTarea = "ejecucion" | "verificacion" | "documentacion" | "configuracion" | "analisis"
export type PrioridadTarea = "alta" | "media" | "baja"

// ── Eventos de historial ──────────────────────────────────────
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

// ── Sprint ────────────────────────────────────────────────────
export interface Sprint {
  id: string
  nombre: string
  fechaInicio: Date
  fechaFin: Date
  objetivo?: string
}

// ── Notificaciones ────────────────────────────────────────────
export type TipoNotificacion =
  | "aprobacion_enviada"
  | "modificacion_solicitada"
  | "caso_aprobado"
  | "caso_rechazado"
  | "modificacion_habilitada"
  | "cuenta_bloqueada"
  | "bloqueo_reportado"
  | "bloqueo_resuelto"

export type RolDestinatario = "admin" | "qa"

export interface Notificacion {
  id: string
  tipo: TipoNotificacion
  titulo: string
  descripcion: string
  fecha: Date
  leida: boolean
  destinatario: RolDestinatario
  grupoId?: string
  casoId?: string
  huId?: string
  huTitulo?: string
  casoTitulo?: string
}

// ── Comentario y Bloqueo ──────────────────────────────────────
export interface Comentario {
  id: string
  texto: string
  autor: string
  fecha: Date
}

// ── Bloqueo (discriminated union) ─────────────────────────────
interface BloqueoBase {
  id: string
  descripcion: string
  reportadoPor: string
  fecha: Date
}

export interface BloqueoActivo extends BloqueoBase {
  resuelto: false
}

export interface BloqueoResuelto extends BloqueoBase {
  resuelto: true
  fechaResolucion: Date
  resueltoPor: string
  notaResolucion?: string
}

export type Bloqueo = BloqueoActivo | BloqueoResuelto

// ── Entidades de dominio ──────────────────────────────────────
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

// ── Entidades de API (respuestas del servidor) ────────────────
export interface User {
  id: string
  nombre: string
  email: string
  rol: string
  grupoId: string | null
  activo: boolean
  debeCambiarPassword: boolean
  bloqueado: boolean
  fechaCreacion: Date
  historialConexiones: unknown[]
}

export interface Grupo {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
  createdAt: Date
}

export interface Config {
  id: string
  grupoId: string
  etapas: ConfigEtapas
  resultados: ResultadoDef[]
  tiposAplicacion: TipoAplicacionDef[]
  ambientes: AmbienteDef[]
  tiposPrueba: TipoPruebaDef[]
  aplicaciones: string[]
}

export interface PaginatedResult<T> {
  total: number
  page: number
  limit: number
  pages: number
  data?: T[]
}

// ── API Routes (type-safe constants) ─────────────────────────
export const API_ROUTES = {
  HISTORIAS:      "/api/historias",
  CASOS:          "/api/casos",
  TAREAS:         "/api/tareas",
  CONFIG:         "/api/config",
  METRICAS:       "/api/metricas",
  HEALTH:         "/api/health",
  EXPORT:         "/api/export",
  EXPORT_PDF:     "/api/export/pdf",
  AUTH_LOGIN:     "/api/auth/login",
  AUTH_LOGOUT:    "/api/auth/logout",
  AUTH_ME:        "/api/auth/me",
  AUTH_PASSWORD:  "/api/auth/password",
  USERS:          "/api/users",
  GRUPOS:         "/api/grupos",
  SPRINTS:        "/api/sprints",
  NOTIFICACIONES: "/api/notificaciones",
  AUDIT:          "/api/audit",
} as const
export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES]
