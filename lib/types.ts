// ═══════════════════════════════════════════════════════════
//  TIPOS PRINCIPALES — Dashboard QA v2
//
//  HU (Historia de Usuario) = el CAMBIO en sí
//    └── CasoPrueba = caso de prueba dentro de la HU
//          └── Tarea = actividad dentro del caso de prueba
// ═══════════════════════════════════════════════════════════

// ── Etapas de ejecución (Despliegue → Rollback → Redespliegue) ──
export type EtapaEjecucion = "despliegue" | "rollback" | "redespliegue"

// ── Etapa de la HU (incluye sin_iniciar y estados finales) ──
export type EtapaHU =
  | "sin_iniciar"
  | EtapaEjecucion
  | "completada"
  | "cambio_cancelado"

// ── Estado de la HU ──────────────────────────────────────
export type EstadoHU =
  | "sin_iniciar"
  | "en_progreso"
  | "exitosa"
  | "fallida"
  | "cancelada"

// ── Prioridad de la HU ──────────────────────────────────
export type PrioridadHU = "critica" | "alta" | "media" | "baja"

// ── Tipo de aplicación (determina qué etapas aplican) ────
export type TipoAplicacion =
  | "base_de_datos"     // solo despliegue
  | "aplicacion"        // despliegue → rollback → redespliegue
  | "infraestructura"   // despliegue → rollback → redespliegue
  | "batch"             // solo despliegue
  | "mixto"             // todas las etapas

// ── Ambiente de pruebas ──────────────────────────────────
export type AmbientePrueba = "test" | "preproduccion" | "produccion"

// ── Tipo y complejidad de prueba ─────────────────────────
export type TipoPrueba = "funcional" | "no_funcional"
export type ComplejidadCaso = "alta" | "media" | "baja"
export type EntornoCaso = "test" | "preproduccion"

// ── Aprobación de caso de prueba ─────────────────────────
export type EstadoAprobacion =
  | "borrador"
  | "pendiente_aprobacion"
  | "aprobado"
  | "rechazado"

// ── Estado de ejecución por etapa ────────────────────────
export type EstadoEjecucion = "pendiente" | "en_ejecucion" | "completado"
export type ResultadoEjecucion = "pendiente" | "exitoso" | "fallido"

// ── Intento de ejecución (historial de retesteos) ───────
export interface IntentoEjecucion {
  numero: number
  resultado: "exitoso" | "fallido"
  comentarioFallo?: string          // qué falló
  comentarioCorreccion?: string     // qué se corrigió antes de retestear
  fecha: Date
  ejecutadoPor: string
}

// ── Tarea: estados ───────────────────────────────────────
export type EstadoTarea = "pendiente" | "en_progreso" | "completada" | "bloqueada"
export type ResultadoTarea = "pendiente" | "exitoso" | "fallido"
export type TipoTarea = "ejecucion" | "verificacion" | "documentacion" | "configuracion" | "analisis"
export type PrioridadTarea = "alta" | "media" | "baja"

// ── Evento de historial (trazabilidad) ───────────────────
export type TipoEvento =
  | "hu_creada" | "hu_editada" | "hu_iniciada" | "hu_etapa_avanzada"
  | "hu_completada" | "hu_cancelada" | "hu_fallida"
  | "caso_creado" | "caso_enviado_aprobacion" | "caso_aprobado" | "caso_rechazado"
  | "caso_ejecucion_iniciada" | "caso_completado"
  | "caso_retesteo_solicitado" | "caso_retesteo_ejecutado"
  | "casos_adicionales_habilitados"
  | "tarea_creada" | "tarea_completada" | "tarea_bloqueada" | "tarea_desbloqueada"
  | "bloqueo_reportado" | "bloqueo_resuelto"

export interface EventoHistorial {
  id: string
  tipo: TipoEvento
  descripcion: string
  fecha: Date
  usuario: string
  detalles?: Record<string, string>
}

// ── Bloqueo (aplica a HU, caso de prueba o tarea) ───────
export interface Bloqueo {
  id: string
  descripcion: string
  reportadoPor: string
  fecha: Date
  resuelto: boolean
  fechaResolucion?: Date
  resueltoPor?: string
  notaResolucion?: string
}

// ── Resultado de ejecución por etapa ─────────────────────
export interface ResultadoEtapa {
  etapa: EtapaEjecucion
  estado: EstadoEjecucion
  resultado: ResultadoEjecucion
  fechaInicio?: Date
  fechaFin?: Date
  intentos: IntentoEjecucion[]      // historial de intentos (retesteos)
}

// ═══════════════════════════════════════════════════════════
//  TAREA — actividad dentro de un caso de prueba
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
//  CASO DE PRUEBA — pertenece a una HU
// ═══════════════════════════════════════════════════════════
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

  // ── Flujo de aprobación ──
  estadoAprobacion: EstadoAprobacion
  aprobadoPor?: string
  fechaAprobacion?: Date
  motivoRechazo?: string

  // ── Resultados por etapa (una entrada por cada etapa ejecutada) ──
  resultadosPorEtapa: ResultadoEtapa[]

  fechaCreacion: Date
  tareasIds: string[]
  bloqueos: Bloqueo[]
  creadoPor: string

  // ── Excepción: admin habilita modificación post-despliegue ──
  modificacionHabilitada: boolean
  motivoModificacion?: string
}

// ═══════════════════════════════════════════════════════════
//  HISTORIA DE USUARIO — el cambio en sí
// ═══════════════════════════════════════════════════════════
export interface HistoriaUsuario {
  id: string
  codigo: string
  titulo: string
  descripcion: string
  criteriosAceptacion: string
  responsable: string              // QA asignado
  prioridad: PrioridadHU
  estado: EstadoHU
  puntos: number                   // story points
  aplicacion: string               // app/sistema sobre el que aplica el cambio
  tipoAplicacion: TipoAplicacion   // determina qué etapas aplican
  requiriente: string              // quién solicitó el cambio
  areaSolicitante: string          // área que solicita
  fechaCreacion: Date
  fechaFinEstimada?: Date
  fechaCierre?: Date
  etapa: EtapaHU
  motivoCancelacion?: string
  ambiente: AmbientePrueba
  casosIds: string[]
  bloqueos: Bloqueo[]
  historial: EventoHistorial[]
  creadoPor: string
  delegadoPor: string              // admin que delegó

  // ── Excepción: admin permite agregar más casos post-despliegue ──
  permitirCasosAdicionales: boolean
  motivoCasosAdicionales?: string
}

// ═══════════════════════════════════════════════════════════
//  ETIQUETAS Y COLORES PARA UI
// ═══════════════════════════════════════════════════════════

export const ESTADO_HU_CFG: Record<EstadoHU, { label: string; cls: string }> = {
  sin_iniciar: { label: "Sin Iniciar",  cls: "bg-muted text-muted-foreground border-border" },
  en_progreso: { label: "En Progreso",  cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
  exitosa:     { label: "Exitosa",      cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  fallida:     { label: "Fallida",      cls: "bg-chart-4/30 text-chart-4 border-chart-4/50" },
  cancelada:   { label: "Cancelada",    cls: "bg-muted text-muted-foreground border-border" },
}

export const ETAPA_HU_CFG: Record<EtapaHU, { label: string; cls: string }> = {
  sin_iniciar:      { label: "Sin Iniciar",       cls: "bg-muted text-muted-foreground border-border" },
  despliegue:       { label: "Despliegue",         cls: "bg-chart-1/20 text-chart-1 border-chart-1/30" },
  rollback:         { label: "Rollback",            cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  redespliegue:     { label: "Redespliegue",        cls: "bg-purple-500/20 text-purple-500 border-purple-500/30" },
  completada:       { label: "Completada",          cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  cambio_cancelado: { label: "Cambio Cancelado",    cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
}

export const PRIORIDAD_CFG: Record<PrioridadHU, { label: string; cls: string }> = {
  critica: { label: "Crítica", cls: "bg-red-600/20 text-red-600 border-red-600/30" },
  alta:    { label: "Alta",    cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  media:   { label: "Media",   cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  baja:    { label: "Baja",    cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
}

export const TIPO_APLICACION_LABEL: Record<TipoAplicacion, string> = {
  base_de_datos:  "Base de Datos",
  aplicacion:     "Aplicación",
  infraestructura:"Infraestructura",
  batch:          "Proceso Batch",
  mixto:          "Mixto",
}

export const TIPO_PRUEBA_LABEL: Record<TipoPrueba, string> = {
  funcional:    "Funcional",
  no_funcional: "No Funcional",
}
export const TIPO_PRUEBA_COLOR: Record<TipoPrueba, string> = {
  funcional:    "bg-chart-2/20 text-chart-2 border-chart-2/30",
  no_funcional: "bg-chart-5/20 text-chart-5 border-chart-5/30",
}

export const COMPLEJIDAD_CFG: Record<ComplejidadCaso, { label: string; cls: string }> = {
  alta:  { label: "Alta",  cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
  media: { label: "Media", cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  baja:  { label: "Baja",  cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
}

export const TIPO_TAREA_LABEL: Record<TipoTarea, string> = {
  ejecucion:      "Ejecución",
  verificacion:   "Verificación",
  documentacion:  "Documentación",
  configuracion:  "Configuración",
  analisis:       "Análisis",
}
export const TIPO_TAREA_COLOR: Record<TipoTarea, string> = {
  ejecucion:     "bg-chart-1/20 text-chart-1 border-chart-1/30",
  verificacion:  "bg-chart-2/20 text-chart-2 border-chart-2/30",
  documentacion: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  configuracion: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  analisis:      "bg-purple-500/20 text-purple-500 border-purple-500/30",
}

export const ESTADO_APROBACION_CFG: Record<EstadoAprobacion, { label: string; cls: string }> = {
  borrador:               { label: "Borrador",              cls: "bg-muted text-muted-foreground border-border" },
  pendiente_aprobacion:   { label: "Pend. Aprobación",      cls: "bg-chart-3/20 text-chart-3 border-chart-3/30" },
  aprobado:               { label: "Aprobado",              cls: "bg-chart-2/20 text-chart-2 border-chart-2/30" },
  rechazado:              { label: "Rechazado",             cls: "bg-chart-4/20 text-chart-4 border-chart-4/30" },
}

export const AMBIENTE_LABEL: Record<AmbientePrueba, string> = {
  test:           "Test",
  preproduccion:  "Pre-Producción",
  produccion:     "Producción",
}

// ═══════════════════════════════════════════════════════════
//  FUNCIONES HELPER
// ═══════════════════════════════════════════════════════════

/** Etapas de ejecución según el tipo de aplicación */
export function etapasParaTipo(tipo: TipoAplicacion): EtapaEjecucion[] {
  if (tipo === "base_de_datos" || tipo === "batch") return ["despliegue"]
  return ["despliegue", "rollback", "redespliegue"]
}

/** Siguiente etapa de ejecución (null si ya terminó) */
export function siguienteEtapa(
  etapaActual: EtapaEjecucion,
  tipo: TipoAplicacion
): EtapaEjecucion | null {
  const etapas = etapasParaTipo(tipo)
  const idx = etapas.indexOf(etapaActual)
  return idx >= 0 && idx < etapas.length - 1 ? etapas[idx + 1] : null
}

/** Verifica si todos los casos de una etapa están completados */
export function etapaCompletada(
  casos: CasoPrueba[],
  etapa: EtapaEjecucion
): { completa: boolean; exitosa: boolean; fallida: boolean } {
  const resultados = casos
    .map(c => c.resultadosPorEtapa.find(r => r.etapa === etapa))
    .filter(Boolean) as ResultadoEtapa[]

  if (resultados.length === 0 || resultados.length < casos.length) {
    return { completa: false, exitosa: false, fallida: false }
  }

  const todosCompletados = resultados.every(r => r.estado === "completado")
  if (!todosCompletados) return { completa: false, exitosa: false, fallida: false }

  const todosExitosos = resultados.every(r => r.resultado === "exitoso")
  const algunoFallido = resultados.some(r => r.resultado === "fallido")

  return { completa: true, exitosa: todosExitosos, fallida: algunoFallido }
}

/** Calcula fecha fin estimada de una HU */
export function calcularFechaFinEstimada(
  hu: HistoriaUsuario,
  casos: CasoPrueba[]
): Date {
  const casosHU = casos.filter(c => c.huId === hu.id)
  const totalHoras = casosHU.reduce((s, c) => s + c.horasEstimadas, 0) || 8
  const diasBase = Math.ceil(totalHoras / 8)

  const factorPri: Record<PrioridadHU, number> = {
    critica: 0.75, alta: 0.85, media: 1.0, baja: 1.15,
  }
  const numEtapas = etapasParaTipo(hu.tipoAplicacion).length
  const factorEtapas = numEtapas >= 3 ? 1.5 : numEtapas >= 2 ? 1.2 : 1.0

  const diasEstimados = Math.ceil(diasBase * (factorPri[hu.prioridad] ?? 1) * factorEtapas) || 1

  const fecha = new Date(hu.fechaCreacion)
  let diasAgregados = 0
  while (diasAgregados < diasEstimados) {
    fecha.setDate(fecha.getDate() + 1)
    const dow = fecha.getDay()
    if (dow !== 0 && dow !== 6) diasAgregados++
  }
  return fecha
}

/** Formato corto de fecha */
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
export function fmtCorto(d: Date): string {
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
export function fmtHora(d: Date): string {
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`
}

/** Crea un evento de historial */
export function crearEvento(
  tipo: TipoEvento,
  descripcion: string,
  usuario: string,
  detalles?: Record<string, string>
): EventoHistorial {
  return {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
    tipo, descripcion, fecha: new Date(), usuario, detalles,
  }
}

// ═══════════════════════════════════════════════════════════
//  DATOS DE EJEMPLO
// ═══════════════════════════════════════════════════════════

export const tareasEjemplo: Tarea[] = [
  {
    id: "T-001", casoPruebaId: "CP-001", huId: "hu-1",
    titulo: "Ejecutar flujo login con Google",
    descripcion: "Verificar que el login con Google redirige correctamente y crea sesión",
    asignado: "Maria Garcia", estado: "completada", resultado: "exitoso",
    tipo: "ejecucion", prioridad: "alta", horasEstimadas: 4, horasReales: 3,
    fechaCreacion: new Date("2026-03-02"), fechaInicio: new Date("2026-03-05"), fechaFin: new Date("2026-03-05"),
    bloqueos: [], evidencias: "Screenshots de flujo OK", creadoPor: "Maria Garcia",
  },
  {
    id: "T-002", casoPruebaId: "CP-001", huId: "hu-1",
    titulo: "Verificar token JWT generado",
    descripcion: "Validar que el token contiene claims correctos y expira en 1h",
    asignado: "Maria Garcia", estado: "en_progreso", resultado: "pendiente",
    tipo: "verificacion", prioridad: "alta", horasEstimadas: 3, horasReales: 0,
    fechaCreacion: new Date("2026-03-02"), fechaInicio: new Date("2026-03-06"),
    bloqueos: [], evidencias: "", creadoPor: "Maria Garcia",
  },
  {
    id: "T-003", casoPruebaId: "CP-002", huId: "hu-1",
    titulo: "Configurar certificados TLS en identity provider",
    descripcion: "Instalar y verificar certificados SSL para el servidor de identidad",
    asignado: "Maria Garcia", estado: "completada", resultado: "exitoso",
    tipo: "configuracion", prioridad: "alta", horasEstimadas: 6, horasReales: 5,
    fechaCreacion: new Date("2026-03-01"), fechaInicio: new Date("2026-03-03"), fechaFin: new Date("2026-03-04"),
    bloqueos: [], evidencias: "Cert válido hasta 2027", creadoPor: "Maria Garcia",
  },
  {
    id: "T-004", casoPruebaId: "CP-002", huId: "hu-1",
    titulo: "Documentar configuración del IdP",
    descripcion: "Crear documentación técnica del setup del identity provider",
    asignado: "Maria Garcia", estado: "en_progreso", resultado: "pendiente",
    tipo: "documentacion", prioridad: "media", horasEstimadas: 2, horasReales: 0,
    fechaCreacion: new Date("2026-03-04"), fechaInicio: new Date("2026-03-06"),
    bloqueos: [], evidencias: "", creadoPor: "Maria Garcia",
  },
  {
    id: "T-005", casoPruebaId: "CP-003", huId: "hu-2",
    titulo: "Verificar envío de email en producción",
    descripcion: "Confirmar que el método send() envía correctamente",
    asignado: "Maria Garcia", estado: "completada", resultado: "exitoso",
    tipo: "ejecucion", prioridad: "alta", horasEstimadas: 4, horasReales: 3,
    fechaCreacion: new Date("2026-03-01"), fechaInicio: new Date("2026-03-03"), fechaFin: new Date("2026-03-04"),
    bloqueos: [], evidencias: "Email recibido en buzón de prueba", creadoPor: "Maria Garcia",
  },
  {
    id: "T-006", casoPruebaId: "CP-003", huId: "hu-2",
    titulo: "Verificar log de errores habilitado",
    descripcion: "Confirmar que los errores de envío se registran en el log",
    asignado: "Maria Garcia", estado: "completada", resultado: "exitoso",
    tipo: "verificacion", prioridad: "media", horasEstimadas: 2, horasReales: 2,
    fechaCreacion: new Date("2026-03-01"), fechaInicio: new Date("2026-03-04"), fechaFin: new Date("2026-03-04"),
    bloqueos: [], evidencias: "Logs confirmados en CloudWatch", creadoPor: "Maria Garcia",
  },
  {
    id: "T-007", casoPruebaId: "CP-004", huId: "hu-3",
    titulo: "Ejecutar prueba de carga con JMeter",
    descripcion: "Simular 5000 usuarios concurrentes en endpoint de login",
    asignado: "Ana Martinez", estado: "en_progreso", resultado: "pendiente",
    tipo: "ejecucion", prioridad: "alta", horasEstimadas: 8, horasReales: 0,
    fechaCreacion: new Date("2026-03-04"), fechaInicio: new Date("2026-03-06"),
    bloqueos: [], evidencias: "", creadoPor: "Ana Martinez",
  },
  {
    id: "T-008", casoPruebaId: "CP-004", huId: "hu-3",
    titulo: "Analizar métricas P95 y P99",
    descripcion: "Revisar tiempos de respuesta y generar reporte",
    asignado: "Ana Martinez", estado: "pendiente", resultado: "pendiente",
    tipo: "analisis", prioridad: "alta", horasEstimadas: 4, horasReales: 0,
    fechaCreacion: new Date("2026-03-04"),
    bloqueos: [], evidencias: "", creadoPor: "Ana Martinez",
  },
  {
    id: "T-009", casoPruebaId: "CP-005", huId: "hu-3",
    titulo: "Medir throughput de APIs críticas con k6",
    descripcion: "Ejecutar script k6 contra endpoints de auth y dashboard",
    asignado: "Ana Martinez", estado: "bloqueada", resultado: "pendiente",
    tipo: "ejecucion", prioridad: "media", horasEstimadas: 6, horasReales: 0,
    fechaCreacion: new Date("2026-03-05"), fechaInicio: new Date("2026-03-07"),
    bloqueos: [{
      id: "bl-t-001", descripcion: "Servidor de staging caído por mantenimiento",
      reportadoPor: "Ana Martinez", fecha: new Date("2026-03-08T10:00:00"),
      resuelto: false,
    }],
    evidencias: "", creadoPor: "Ana Martinez",
  },
]

export const casosPruebaEjemplo: CasoPrueba[] = [
  {
    id: "CP-001", huId: "hu-1",
    titulo: "Validar login con Google OAuth",
    descripcion: "Verificar el flujo completo de autenticación con Google como proveedor OAuth 2.0",
    entorno: "test", tipoPrueba: "funcional", horasEstimadas: 8,
    archivosAnalizados: ["auth-controller.ts", "oauth-provider.ts", "login-page.tsx"],
    complejidad: "alta",
    estadoAprobacion: "aprobado", aprobadoPor: "Admin Principal", fechaAprobacion: new Date("2026-03-04"),
    resultadosPorEtapa: [
      { etapa: "despliegue", estado: "en_ejecucion", resultado: "pendiente", fechaInicio: new Date("2026-03-05"), intentos: [] },
    ],
    fechaCreacion: new Date("2026-03-02"),
    tareasIds: ["T-001", "T-002"],
    bloqueos: [], creadoPor: "Maria Garcia",
    modificacionHabilitada: false,
  },
  {
    id: "CP-002", huId: "hu-1",
    titulo: "Configuración servidor de identidad",
    descripcion: "Verificar setup completo del identity provider con certificados TLS",
    entorno: "test", tipoPrueba: "no_funcional", horasEstimadas: 10,
    archivosAnalizados: ["idp-config.yaml", "tls-certs/", "docker-compose.yml"],
    complejidad: "alta",
    estadoAprobacion: "aprobado", aprobadoPor: "Admin Principal", fechaAprobacion: new Date("2026-03-04"),
    resultadosPorEtapa: [
      { etapa: "despliegue", estado: "en_ejecucion", resultado: "pendiente", fechaInicio: new Date("2026-03-05"), intentos: [] },
    ],
    fechaCreacion: new Date("2026-03-01"),
    tareasIds: ["T-003", "T-004"],
    bloqueos: [], creadoPor: "Maria Garcia",
    modificacionHabilitada: false,
  },
  {
    id: "CP-003", huId: "hu-2",
    titulo: "Validar envío de emails desde formulario",
    descripcion: "Verificar que el formulario de contacto envía emails correctamente en producción",
    entorno: "preproduccion", tipoPrueba: "funcional", horasEstimadas: 6,
    archivosAnalizados: ["contact-form.tsx", "email-service.ts"],
    complejidad: "baja",
    estadoAprobacion: "aprobado", aprobadoPor: "Admin Principal", fechaAprobacion: new Date("2026-03-02"),
    resultadosPorEtapa: [
      { etapa: "despliegue", estado: "completado", resultado: "exitoso", fechaInicio: new Date("2026-03-03"), fechaFin: new Date("2026-03-04"), intentos: [] },
      { etapa: "rollback", estado: "completado", resultado: "exitoso", fechaInicio: new Date("2026-03-05"), fechaFin: new Date("2026-03-05"), intentos: [] },
      { etapa: "redespliegue", estado: "completado", resultado: "exitoso", fechaInicio: new Date("2026-03-06"), fechaFin: new Date("2026-03-07"), intentos: [] },
    ],
    fechaCreacion: new Date("2026-03-01"),
    tareasIds: ["T-005", "T-006"],
    bloqueos: [], creadoPor: "Maria Garcia",
    modificacionHabilitada: false,
  },
  {
    id: "CP-004", huId: "hu-3",
    titulo: "Prueba de carga login concurrente",
    descripcion: "Simular 5000 usuarios simultáneos con JMeter en endpoint de login",
    entorno: "test", tipoPrueba: "no_funcional", horasEstimadas: 12,
    archivosAnalizados: ["login-endpoint.ts", "session-manager.ts", "db-pool-config.ts"],
    complejidad: "alta",
    estadoAprobacion: "aprobado", aprobadoPor: "Admin Principal", fechaAprobacion: new Date("2026-03-05"),
    resultadosPorEtapa: [
      { etapa: "despliegue", estado: "en_ejecucion", resultado: "pendiente", fechaInicio: new Date("2026-03-06"), intentos: [] },
    ],
    fechaCreacion: new Date("2026-03-04"),
    tareasIds: ["T-007", "T-008"],
    bloqueos: [], creadoPor: "Ana Martinez",
    modificacionHabilitada: false,
  },
  {
    id: "CP-005", huId: "hu-3",
    titulo: "Benchmark APIs críticas con k6",
    descripcion: "Medir P95 y P99 de endpoints de auth y dashboard principal",
    entorno: "test", tipoPrueba: "no_funcional", horasEstimadas: 8,
    archivosAnalizados: ["api-routes.ts", "middleware.ts"],
    complejidad: "media",
    estadoAprobacion: "aprobado", aprobadoPor: "Admin Principal", fechaAprobacion: new Date("2026-03-05"),
    resultadosPorEtapa: [
      { etapa: "despliegue", estado: "en_ejecucion", resultado: "pendiente", fechaInicio: new Date("2026-03-07"), intentos: [] },
    ],
    fechaCreacion: new Date("2026-03-05"),
    tareasIds: ["T-009"],
    bloqueos: [{
      id: "bl-cp-001", descripcion: "Servidor de staging en mantenimiento programado",
      reportadoPor: "Ana Martinez", fecha: new Date("2026-03-08T10:00:00"),
      resuelto: false,
    }],
    creadoPor: "Ana Martinez",
    modificacionHabilitada: false,
  },
]

export const historiasEjemplo: HistoriaUsuario[] = [
  {
    id: "hu-1", codigo: "HU-001",
    titulo: "Migración API OAuth 2.0",
    descripcion: "Migrar el sistema de login actual a OAuth 2.0 para mayor seguridad y compatibilidad con proveedores externos",
    criteriosAceptacion: "- Login con Google y GitHub operativo\n- Token JWT con expiración de 1h\n- Refresh token automático\n- Pruebas de regresión al 100%",
    responsable: "Maria Garcia",
    prioridad: "alta", estado: "en_progreso", puntos: 13,
    aplicacion: "Portal Web Principal", tipoAplicacion: "aplicacion",
    requiriente: "Jefe de Seguridad IT", areaSolicitante: "Seguridad Informática",
    fechaCreacion: new Date("2026-02-20"), fechaFinEstimada: new Date("2026-03-20"),
    etapa: "despliegue", ambiente: "test",
    casosIds: ["CP-001", "CP-002"],
    bloqueos: [{
      id: "bl-hu-001", descripcion: "Credenciales OAuth pendientes de aprobación por equipo de seguridad corporativa",
      reportadoPor: "Maria Garcia", fecha: new Date("2026-03-02T10:00:00"), resuelto: false,
    }],
    historial: [
      { id: "ev-001", tipo: "hu_creada", descripcion: "Historia de usuario creada", fecha: new Date("2026-02-20T09:00:00"), usuario: "Admin Principal" },
      { id: "ev-002", tipo: "hu_iniciada", descripcion: "QA inició la historia — etapa: Despliegue", fecha: new Date("2026-03-01T08:00:00"), usuario: "Maria Garcia" },
      { id: "ev-003", tipo: "caso_creado", descripcion: "Caso creado: Validar login con Google OAuth", fecha: new Date("2026-03-02T09:00:00"), usuario: "Maria Garcia" },
      { id: "ev-004", tipo: "caso_creado", descripcion: "Caso creado: Configuración servidor de identidad", fecha: new Date("2026-03-02T09:30:00"), usuario: "Maria Garcia" },
      { id: "ev-005", tipo: "caso_enviado_aprobacion", descripcion: "Casos enviados para aprobación", fecha: new Date("2026-03-03T10:00:00"), usuario: "Maria Garcia" },
      { id: "ev-006", tipo: "caso_aprobado", descripcion: "Casos aprobados por Admin Principal", fecha: new Date("2026-03-04T11:00:00"), usuario: "Admin Principal" },
      { id: "ev-007", tipo: "caso_ejecucion_iniciada", descripcion: "Ejecución iniciada para etapa Despliegue", fecha: new Date("2026-03-05T08:00:00"), usuario: "Maria Garcia" },
      { id: "ev-008", tipo: "bloqueo_reportado", descripcion: "Bloqueo: Credenciales OAuth pendientes", fecha: new Date("2026-03-02T10:00:00"), usuario: "Maria Garcia" },
    ],
    creadoPor: "Admin Principal", delegadoPor: "Admin Principal",
    permitirCasosAdicionales: false,
  },
  {
    id: "hu-2", codigo: "HU-002",
    titulo: "Corrección formulario de contacto",
    descripcion: "Corregir el envío de emails del formulario de contacto que falla silenciosamente en producción",
    criteriosAceptacion: "- Envío de email confirmado en prod\n- Notificación al admin en < 30s\n- Log de errores habilitado",
    responsable: "Maria Garcia",
    prioridad: "media", estado: "exitosa", puntos: 3,
    aplicacion: "Portal Web Principal", tipoAplicacion: "aplicacion",
    requiriente: "Soporte Técnico", areaSolicitante: "Atención al Cliente",
    fechaCreacion: new Date("2026-03-01"), fechaFinEstimada: new Date("2026-03-08"),
    fechaCierre: new Date("2026-03-07"),
    etapa: "completada", ambiente: "preproduccion",
    casosIds: ["CP-003"],
    bloqueos: [],
    historial: [
      { id: "ev-010", tipo: "hu_creada", descripcion: "Historia de usuario creada", fecha: new Date("2026-03-01T09:00:00"), usuario: "Admin Principal" },
      { id: "ev-011", tipo: "hu_iniciada", descripcion: "QA inició la historia — etapa: Despliegue", fecha: new Date("2026-03-01T10:00:00"), usuario: "Maria Garcia" },
      { id: "ev-012", tipo: "caso_aprobado", descripcion: "Caso aprobado: Validar envío de emails", fecha: new Date("2026-03-02T11:00:00"), usuario: "Admin Principal" },
      { id: "ev-013", tipo: "hu_etapa_avanzada", descripcion: "Etapa avanzó a Rollback — despliegue exitoso", fecha: new Date("2026-03-04T15:00:00"), usuario: "Sistema" },
      { id: "ev-014", tipo: "hu_etapa_avanzada", descripcion: "Etapa avanzó a Redespliegue — rollback exitoso", fecha: new Date("2026-03-05T16:00:00"), usuario: "Sistema" },
      { id: "ev-015", tipo: "hu_completada", descripcion: "Todas las etapas completadas exitosamente", fecha: new Date("2026-03-07T14:00:00"), usuario: "Sistema" },
    ],
    creadoPor: "Admin Principal", delegadoPor: "Admin Principal",
    permitirCasosAdicionales: false,
  },
  {
    id: "hu-3", codigo: "HU-003",
    titulo: "Validación rendimiento — módulo auth",
    descripcion: "Garantizar que el nuevo sistema de auth soporta la carga esperada en producción",
    criteriosAceptacion: "- P95 < 200ms con 5000 usuarios concurrentes\n- P99 < 500ms\n- Sin degradación en endpoints críticos",
    responsable: "Ana Martinez",
    prioridad: "alta", estado: "en_progreso", puntos: 8,
    aplicacion: "Portal Web Principal", tipoAplicacion: "aplicacion",
    requiriente: "Arquitectura", areaSolicitante: "Ingeniería",
    fechaCreacion: new Date("2026-03-02"), fechaFinEstimada: new Date("2026-03-18"),
    etapa: "despliegue", ambiente: "test",
    casosIds: ["CP-004", "CP-005"],
    bloqueos: [],
    historial: [
      { id: "ev-020", tipo: "hu_creada", descripcion: "Historia de usuario creada", fecha: new Date("2026-03-02T09:00:00"), usuario: "Admin Principal" },
      { id: "ev-021", tipo: "hu_iniciada", descripcion: "QA inició la historia — etapa: Despliegue", fecha: new Date("2026-03-03T08:00:00"), usuario: "Ana Martinez" },
      { id: "ev-022", tipo: "caso_aprobado", descripcion: "Casos de prueba aprobados", fecha: new Date("2026-03-05T10:00:00"), usuario: "Admin Principal" },
      { id: "ev-023", tipo: "bloqueo_reportado", descripcion: "Bloqueo en CP-005: Servidor staging en mantenimiento", fecha: new Date("2026-03-08T10:00:00"), usuario: "Ana Martinez" },
    ],
    creadoPor: "Admin Principal", delegadoPor: "Admin Principal",
    permitirCasosAdicionales: false,
  },
  {
    id: "hu-4", codigo: "HU-004",
    titulo: "Actualización sistema de métricas batch",
    descripcion: "Modernizar el scheduler de jobs nocturnos para recálculo de KPIs financieros",
    criteriosAceptacion: "- Jobs ejecutan sin error en producción\n- Tiempo de ejecución <= actual\n- Alertas configuradas",
    responsable: "Ana Martinez",
    prioridad: "critica", estado: "sin_iniciar", puntos: 13,
    aplicacion: "Sistema de Reportes", tipoAplicacion: "base_de_datos",
    requiriente: "Gerente Financiero", areaSolicitante: "Finanzas",
    fechaCreacion: new Date("2026-03-10"), fechaFinEstimada: new Date("2026-03-16"),
    etapa: "sin_iniciar", ambiente: "produccion",
    casosIds: [],
    bloqueos: [],
    historial: [
      { id: "ev-030", tipo: "hu_creada", descripcion: "Historia de usuario creada", fecha: new Date("2026-03-10T09:00:00"), usuario: "Admin Principal" },
    ],
    creadoPor: "Admin Principal", delegadoPor: "Admin Principal",
    permitirCasosAdicionales: false,
  },
]
