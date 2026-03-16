// ═══════════════════════════════════════════════════════════
//  CONSTANTES DE CONFIGURACIÓN — Dashboard QA
//  Mapas de UI, colores, labels y valores predeterminados.
// ═══════════════════════════════════════════════════════════

import type {
  EstadoHU, PrioridadHU, EstadoAprobacion, ComplejidadCaso,
  TipoTarea, TipoPrueba, ConfigEtapas, TipoAplicacionDef,
  AmbienteDef, TipoPruebaDef,
} from "@/lib/types/index"

// ── Etapas predeterminadas por tipo de aplicación ───────────
export const ETAPAS_PREDETERMINADAS: ConfigEtapas = {
  aplicacion: [
    { id: "despliegue",   label: "Despliegue",   cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
    { id: "rollback",     label: "Rollback",     cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
    { id: "redespliegue", label: "Redespliegue", cls: "bg-purple-500/20 text-purple-500 border-purple-500/30" },
  ],
  infraestructura: [
    { id: "despliegue",   label: "Despliegue",   cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
    { id: "rollback",     label: "Rollback",     cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
    { id: "redespliegue", label: "Redespliegue", cls: "bg-purple-500/20 text-purple-500 border-purple-500/30" },
  ],
  mixto: [
    { id: "despliegue",   label: "Despliegue",   cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
    { id: "rollback",     label: "Rollback",     cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
    { id: "redespliegue", label: "Redespliegue", cls: "bg-purple-500/20 text-purple-500 border-purple-500/30" },
  ],
  base_de_datos: [
    { id: "despliegue", label: "Despliegue", cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
  ],
  batch: [
    { id: "despliegue", label: "Despliegue", cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
  ],
}

// ── Tipos de aplicación predeterminados ──────────────────────
export const TIPOS_APLICACION_PREDETERMINADOS: TipoAplicacionDef[] = [
  { id: "aplicacion",      label: "Aplicación" },
  { id: "infraestructura", label: "Infraestructura" },
  { id: "mixto",           label: "Mixto" },
  { id: "base_de_datos",   label: "Base de Datos" },
  { id: "batch",           label: "Proceso Batch" },
]

// ── Ambientes predeterminados ─────────────────────────────────
export const AMBIENTES_PREDETERMINADOS: AmbienteDef[] = [
  { id: "test",          label: "Test" },
  { id: "preproduccion", label: "Pre-Producción" },
  { id: "produccion",    label: "Producción" },
]

// ── Tipos de prueba predeterminados ───────────────────────────
export const TIPOS_PRUEBA_PREDETERMINADOS: TipoPruebaDef[] = [
  { id: "funcional",    label: "Funcional" },
  { id: "no_funcional", label: "No Funcional" },
  { id: "regresion",    label: "Regresión" },
  { id: "integracion",  label: "Integración" },
  { id: "rendimiento",  label: "Rendimiento" },
  { id: "seguridad",    label: "Seguridad" },
]

// ── Mapas de UI ───────────────────────────────────────────────
export const ESTADO_HU_CFG: Record<EstadoHU, { label: string; cls: string }> = {
  sin_iniciar: { label: "Sin Iniciar", cls: "bg-muted text-muted-foreground border-border" },
  en_progreso: { label: "En Progreso", cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
  exitosa:     { label: "Exitosa",     cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  fallida:     { label: "Fallida",     cls: "bg-chart-4/30 text-chart-4 border-chart-4/50" },
  cancelada:   { label: "Cancelada",   cls: "bg-muted text-muted-foreground border-border" },
}

export const ETAPA_HU_CFG: Record<string, { label: string; cls: string }> = {
  sin_iniciar:      { label: "Sin Iniciar",    cls: "bg-muted text-muted-foreground border-border" },
  despliegue:       { label: "Despliegue",     cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
  rollback:         { label: "Rollback",        cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  redespliegue:     { label: "Redespliegue",    cls: "bg-purple-500/20 text-purple-500 border-purple-500/30" },
  completada:       { label: "Completada",      cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  cambio_cancelado: { label: "Cambio Cancelado",cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
}

export const PRIORIDAD_CFG: Record<PrioridadHU, { label: string; cls: string }> = {
  critica: { label: "Crítica", cls: "bg-red-600/20 text-red-600 border-red-600/30" },
  alta:    { label: "Alta",    cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  media:   { label: "Media",   cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  baja:    { label: "Baja",    cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
}

export const ESTADO_APROBACION_CFG: Record<EstadoAprobacion, { label: string; cls: string }> = {
  borrador:             { label: "Borrador",         cls: "bg-muted text-muted-foreground border-border" },
  pendiente_aprobacion: { label: "Pend. Aprobación", cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  aprobado:             { label: "Aprobado",         cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  rechazado:            { label: "Rechazado",        cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
}

export const COMPLEJIDAD_CFG: Record<ComplejidadCaso, { label: string; cls: string }> = {
  alta:  { label: "Alta",  cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  media: { label: "Media", cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  baja:  { label: "Baja",  cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
}

export const TIPO_APLICACION_LABEL: Record<string, string> = {
  base_de_datos:   "Base de Datos",
  aplicacion:      "Aplicación",
  infraestructura: "Infraestructura",
  batch:           "Proceso Batch",
  mixto:           "Mixto",
}

export const TIPO_PRUEBA_LABEL: Record<TipoPrueba, string> = {
  funcional:    "Funcional",
  no_funcional: "No Funcional",
}

export const TIPO_PRUEBA_COLOR: Record<TipoPrueba, string> = {
  funcional:    "bg-chart-2/20 text-chart-2 border-chart-2/30",
  no_funcional: "bg-chart-5/20 text-chart-5 border-chart-5/30",
}

export const TIPO_TAREA_LABEL: Record<TipoTarea, string> = {
  ejecucion:     "Ejecución",
  verificacion:  "Verificación",
  documentacion: "Documentación",
  configuracion: "Configuración",
  analisis:      "Análisis",
}

export const TIPO_TAREA_COLOR: Record<TipoTarea, string> = {
  ejecucion:     "bg-chart-1/20 text-chart-1 border-chart-1/30",
  verificacion:  "bg-chart-2/20 text-chart-2 border-chart-2/30",
  documentacion: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  configuracion: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  analisis:      "bg-purple-500/20 text-purple-500 border-purple-500/30",
}

export const AMBIENTE_LABEL: Record<string, string> = {
  test:          "Test",
  preproduccion: "Pre-Producción",
  produccion:    "Producción",
}
