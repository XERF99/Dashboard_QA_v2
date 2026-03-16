// ═══════════════════════════════════════════════════════════
//  CONTRATOS DE SERVICIOS — Dashboard QA
//
//  Define la interfaz que CUALQUIER implementación debe cumplir.
//  Hoy: localStorage. Mañana: REST API, GraphQL, etc.
//  Los componentes solo conocen estas interfaces, nunca el
//  mecanismo de persistencia subyacente.
// ═══════════════════════════════════════════════════════════

import type {
  HistoriaUsuario, CasoPrueba, Tarea,
  ConfigEtapas, TipoAplicacionDef, AmbienteDef, TipoPruebaDef,
  Notificacion,
} from "@/lib/types/index"

export interface IHistoriaService {
  getAll(): HistoriaUsuario[]
  saveAll(historias: HistoriaUsuario[]): void
}

export interface ICasoService {
  getAll(): CasoPrueba[]
  saveAll(casos: CasoPrueba[]): void
}

export interface ITareaService {
  getAll(): Tarea[]
  saveAll(tareas: Tarea[]): void
}

export interface IConfigService {
  getEtapas(): ConfigEtapas
  saveEtapas(config: ConfigEtapas): void

  getTiposAplicacion(): TipoAplicacionDef[]
  saveTiposAplicacion(tipos: TipoAplicacionDef[]): void

  getAmbientes(): AmbienteDef[]
  saveAmbientes(ambientes: AmbienteDef[]): void

  getTiposPrueba(): TipoPruebaDef[]
  saveTiposPrueba(tipos: TipoPruebaDef[]): void

  getAplicaciones(): string[]
  saveAplicaciones(apps: string[]): void
}

export interface INotificacionService {
  getAll(): Notificacion[]
  saveAll(notificaciones: Notificacion[]): void
}
