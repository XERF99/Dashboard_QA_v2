// ── Config y etapas ─────────────────────────────────────────
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

export type TipoAplicacion = string

export interface TipoAplicacionDef {
  id: string
  label: string
}

export type AmbientePrueba = string

export interface AmbienteDef {
  id: string
  label: string
}

export type TipoPrueba = string
export type ComplejidadCaso = "alta" | "media" | "baja"
export type EntornoCaso = "test" | "preproduccion"

export interface TipoPruebaDef {
  id: string
  label: string
}

export interface ResultadoDef {
  id: string
  label: string
  esAceptado: boolean
  esBase: boolean
  cls: string
  icono?: string
  maxRetesteos?: number
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
