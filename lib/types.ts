// ═══════════════════════════════════════════════════════════
//  TIPOS PRINCIPALES — Dashboard QA
//
//  HU (Historia de Usuario) = el CAMBIO en sí
//    └── Tarea = prueba específica dentro del cambio
//          └── Cada tarea tiene tipo, fase actual y tracking de fases
// ═══════════════════════════════════════════════════════════

// ── Estados de la HU (el cambio completo) ──────────────────
export type EstadoHU =
  | "pendiente"       // aún no iniciada
  | "en_progreso"     // trabajándose activamente
  | "bloqueado"       // impedimento externo
  | "stand_by"        // en espera / pausada
  | "exitoso"         // finalizado con éxito
  | "fallido"         // finalizado con fallo en pruebas

// ── Tipo de tarea (prueba) — extensible ────────────────────
export type TipoTarea =
  | "infraestructura"       // cambios de servidor, red, BD, config
  | "aplicacion"            // cambios de código / módulos
  | "batch"                 // procesos batch / jobs programados
  | "programa"              // instalación / actualización de programas
  | "rendimiento"           // pruebas de performance / stress
  | "inyeccion_carga"       // pruebas de carga / JMeter / k6
  | "funcional"             // prueba funcional de negocio
  | "regresion"             // prueba de regresión
  | "seguridad"             // prueba de seguridad / pentest

// ── Fases de una tarea ─────────────────────────────────────
// Infraestructura y batch: solo "despliegue"
// Resto: ciclo completo
export type FaseTarea =
  | "despliegue"
  | "rollback"
  | "redespliegue"
  | "validacion"

// ── Resultado final de una tarea ───────────────────────────
export type ResultadoTarea = "pendiente" | "exitoso" | "fallido" | "omitido"

// ── Estado operativo de una tarea ──────────────────────────
export type EstadoTarea =
  | "pendiente"
  | "en_progreso"
  | "completada"
  | "bloqueada"

// ── Entorno de ejecución ────────────────────────────────────
export type EntornoPruebas = "desarrollo" | "qa" | "staging" | "produccion"

// ── Prioridad / Criticidad / Esfuerzo ──────────────────────
export type Criticidad = "alta" | "media" | "baja"
export type Esfuerzo   = "alto" | "medio" | "bajo"
export type NivelRiesgo = "critico" | "alto" | "moderado" | "bajo"

// ── Qué fases tiene disponibles cada tipo de tarea ─────────
export function fasesParaTipo(tipo: TipoTarea): FaseTarea[] {
  // Tipos que solo despliegan (sin ciclo de rollback)
  if (["infraestructura", "batch", "programa"].includes(tipo)) {
    return ["despliegue"]
  }
  return ["despliegue", "rollback", "redespliegue", "validacion"]
}

// ── Etiqueta visual por tipo ────────────────────────────────
export const TIPO_TAREA_LABEL: Record<TipoTarea, string> = {
  infraestructura:  "Infraestructura",
  aplicacion:       "Aplicación",
  batch:            "Proceso Batch",
  programa:         "Programa",
  rendimiento:      "Rendimiento",
  inyeccion_carga:  "Inyección de Carga",
  funcional:        "Funcional",
  regresion:        "Regresión",
  seguridad:        "Seguridad",
}

export const TIPO_TAREA_COLOR: Record<TipoTarea, string> = {
  infraestructura:  "bg-chart-3/20 text-chart-3 border-chart-3/30",
  aplicacion:       "bg-chart-1/20 text-chart-1 border-chart-1/30",
  batch:            "bg-chart-5/20 text-chart-5 border-chart-5/30",
  programa:         "bg-purple-500/20 text-purple-500 border-purple-500/30",
  rendimiento:      "bg-chart-4/20 text-chart-4 border-chart-4/30",
  inyeccion_carga:  "bg-orange-500/20 text-orange-500 border-orange-500/30",
  funcional:        "bg-chart-2/20 text-chart-2 border-chart-2/30",
  regresion:        "bg-cyan-500/20 text-cyan-500 border-cyan-500/30",
  seguridad:        "bg-red-600/20 text-red-600 border-red-600/30",
}

// ── Evento de cambio de fase (tracking inmutable) ───────────
export interface EventoFase {
  id: string
  tareaId: string
  tareaTitulo: string
  faseAnterior: FaseTarea | null
  faseNueva: FaseTarea
  estadoAnterior?: EstadoTarea
  estadoNuevo?: EstadoTarea
  resultadoNuevo?: ResultadoTarea
  fecha: Date
  usuario: string
  nota?: string
}

// ── Evento de bloqueo para el timeline ──────────────────────
export type TipoEventoBloqueo = "reportado" | "resuelto"
export interface EventoBloqueo {
  id: string
  tipo: TipoEventoBloqueo
  descripcion: string
  fecha: Date
  usuario: string
}

// ── Tipo de prueba (funcional / no funcional) ────────────────
export type TipoPrueba = "funcional" | "no_funcional"
export const TIPO_PRUEBA_LABEL: Record<TipoPrueba, string> = {
  funcional:    "Funcional",
  no_funcional: "No Funcional",
}
export const TIPO_PRUEBA_COLOR: Record<TipoPrueba, string> = {
  funcional:    "bg-chart-2/20 text-chart-2 border-chart-2/30",
  no_funcional: "bg-chart-5/20 text-chart-5 border-chart-5/30",
}

// ── Bloqueo (registrado a nivel de HU) ─────────────────────
export interface Bloqueo {
  id: string
  descripcion: string
  fecha: Date
  resuelto: boolean
  fechaResolucion?: Date
  reportadoPor: string
}

// ── TAREA — prueba específica dentro de la HU ───────────────
export interface Tarea {
  id: string
  huId: string                   // FK a la HU que la contiene
  titulo: string
  descripcion: string
  tipo: TipoTarea
  tipoPrueba: TipoPrueba         // funcional | no_funcional
  asignado: string
  entorno: EntornoPruebas
  faseActual: FaseTarea
  estado: EstadoTarea
  resultado: ResultadoTarea
  fechaInicio: Date
  fechaFin: Date | null
  // Métricas para calcular criticidad/esfuerzo
  impactoUsuarios: number        // 1-10
  complejidadTecnica: number     // 1-10
  urgencia: number               // 1-10
  horasEstimadas: number
  cantidadArchivos: number
  historialFases: EventoFase[]   // tracking de cambios de fase
  eventosBloqueo: EventoBloqueo[] // bloqueos en timeline
}

// ── HU — Historia de Usuario (el cambio en sí) ─────────────
export interface HistoriaUsuario {
  id: string
  codigo: string                 // ej: "HU-001"
  titulo: string
  descripcion: string
  criteriosAceptacion: string
  asignado: string               // responsable principal
  estado: EstadoHU
  prioridad: "alta" | "media" | "baja"
  puntos: number                 // story points
  fechaCreacion: Date
  fechaCierre: Date | null
  bloqueos: Bloqueo[]
  tareas: string[]               // IDs de tareas (antes "cambios")
}

// ═══════════════════════════════════════════════════════════
//  FUNCIONES DE CÁLCULO (operan sobre Tarea)
// ═══════════════════════════════════════════════════════════

export function calcularCriticidad(t: Tarea): Criticidad {
  const p = (t.impactoUsuarios * 0.4) + (t.complejidadTecnica * 0.3) + (t.urgencia * 0.3)
  if (p >= 7) return "alta"
  if (p >= 4) return "media"
  return "baja"
}

export function calcularEsfuerzo(t: Tarea): Esfuerzo {
  let p = 0
  if (t.horasEstimadas > 40) p += 4
  else if (t.horasEstimadas > 16) p += 2.5
  else p += 1
  if (t.cantidadArchivos > 10) p += 3
  else if (t.cantidadArchivos > 5) p += 2
  else p += 1
  if (p >= 7) return "alto"
  if (p >= 4) return "medio"
  return "bajo"
}

export function calcularTiempo(fechaInicio: Date, fechaFin: Date | null): string {
  const fin  = fechaFin || new Date()
  const diff = fin.getTime() - fechaInicio.getTime()
  const dias  = Math.floor(diff / 86400000)
  const horas = Math.floor((diff % 86400000) / 3600000)
  return dias > 0 ? `${dias}d ${horas}h` : `${horas}h`
}

export function calcularRiesgoHU(hu: HistoriaUsuario, tareas: Tarea[]): NivelRiesgo {
  const tareasHU = tareas.filter(t => hu.tareas.includes(t.id))
  if (!tareasHU.length) return "bajo"
  // HU con bloqueos activos → critico
  if (hu.bloqueos.some(b => !b.resuelto)) return "critico"
  // HU fallida o en producción con rollback → alto
  if (hu.estado === "fallido") return "alto"
  // Promedio de criticidad de tareas
  const suma = tareasHU.reduce((acc, t) => {
    const c = calcularCriticidad(t)
    return acc + (c === "alta" ? 3 : c === "media" ? 2 : 1)
  }, 0)
  const prom = suma / tareasHU.length
  if (prom >= 2.5) return "alto"
  if (prom >= 1.8) return "moderado"
  return "bajo"
}

// Inferir estado de la HU a partir de sus tareas (helper)
export function inferirEstadoHU(tareas: Tarea[]): EstadoHU {
  if (!tareas.length) return "pendiente"
  if (tareas.every(t => t.resultado === "exitoso")) return "exitoso"
  if (tareas.some(t => t.resultado === "fallido"))  return "fallido"
  if (tareas.some(t => t.estado === "bloqueada"))   return "bloqueado"
  if (tareas.some(t => t.estado === "en_progreso")) return "en_progreso"
  return "pendiente"
}

// ═══════════════════════════════════════════════════════════
//  DATOS DE EJEMPLO
// ═══════════════════════════════════════════════════════════

export const tareasEjemplo: Tarea[] = [
  {
    id: "T-001", huId: "hu-1",
    titulo: "Migrar endpoints de auth a OAuth 2.0",
    descripcion: "Actualizar los controladores de login para usar el nuevo provider OAuth",
    tipo: "aplicacion", tipoPrueba: "funcional", asignado: "Maria Garcia",
    entorno: "staging", faseActual: "despliegue",
    estado: "en_progreso", resultado: "pendiente",
    fechaInicio: new Date("2026-03-01"), fechaFin: null,
    impactoUsuarios: 9, complejidadTecnica: 8, urgencia: 7,
    horasEstimadas: 24, cantidadArchivos: 8,
    historialFases: [
      { id: "ef-001", tareaId: "T-001", tareaTitulo: "Migrar endpoints de auth a OAuth 2.0",
        faseAnterior: null, faseNueva: "despliegue", estadoNuevo: "en_progreso", resultadoNuevo: "pendiente",
        fecha: new Date("2026-03-01T09:00:00"), usuario: "Maria Garcia", nota: "Inicio de despliegue en staging" },
    ],
    eventosBloqueo: [],
  },
  {
    id: "T-002", huId: "hu-1",
    titulo: "Configurar servidor de identidad",
    descripcion: "Setup del identity provider y certificados TLS",
    tipo: "infraestructura", tipoPrueba: "no_funcional", asignado: "Maria Garcia",
    entorno: "staging", faseActual: "despliegue",
    estado: "completada", resultado: "exitoso",
    fechaInicio: new Date("2026-02-28"), fechaFin: new Date("2026-03-01"),
    impactoUsuarios: 7, complejidadTecnica: 9, urgencia: 7,
    horasEstimadas: 16, cantidadArchivos: 4,
    historialFases: [
      { id: "ef-002", tareaId: "T-002", tareaTitulo: "Configurar servidor de identidad",
        faseAnterior: null, faseNueva: "despliegue", estadoNuevo: "completada", resultadoNuevo: "exitoso",
        fecha: new Date("2026-02-28T08:00:00"), usuario: "Maria Garcia" },
    ],
    eventosBloqueo: [],
  },
  {
    id: "T-003", huId: "hu-2",
    titulo: "Fix bug email en formulario de contacto",
    descripcion: "El método send() falla silenciosamente en prod",
    tipo: "aplicacion", tipoPrueba: "funcional", asignado: "Carlos Lopez",
    entorno: "produccion", faseActual: "validacion",
    estado: "completada", resultado: "exitoso",
    fechaInicio: new Date("2026-03-05"), fechaFin: new Date("2026-03-07"),
    impactoUsuarios: 5, complejidadTecnica: 3, urgencia: 8,
    horasEstimadas: 8, cantidadArchivos: 2,
    historialFases: [
      { id: "ef-003", tareaId: "T-003", tareaTitulo: "Fix bug email",
        faseAnterior: null, faseNueva: "despliegue", estadoNuevo: "en_progreso", resultadoNuevo: "pendiente",
        fecha: new Date("2026-03-05T08:00:00"), usuario: "Carlos Lopez" },
      { id: "ef-004", tareaId: "T-003", tareaTitulo: "Fix bug email",
        faseAnterior: "despliegue", faseNueva: "validacion", estadoNuevo: "completada", resultadoNuevo: "exitoso",
        fecha: new Date("2026-03-06T14:30:00"), usuario: "Carlos Lopez", nota: "Pruebas OK en staging, pasando a validación" },
    ],
    eventosBloqueo: [],
  },
  {
    id: "T-004", huId: "hu-3",
    titulo: "Prueba de carga login concurrente",
    descripcion: "Simular 5000 usuarios simultáneos con JMeter",
    tipo: "inyeccion_carga", tipoPrueba: "no_funcional", asignado: "Ana Martinez",
    entorno: "staging", faseActual: "despliegue",
    estado: "en_progreso", resultado: "pendiente",
    fechaInicio: new Date("2026-03-03"), fechaFin: null,
    impactoUsuarios: 8, complejidadTecnica: 7, urgencia: 5,
    horasEstimadas: 20, cantidadArchivos: 5,
    historialFases: [
      { id: "ef-005", tareaId: "T-004", tareaTitulo: "Prueba de carga",
        faseAnterior: null, faseNueva: "despliegue", estadoNuevo: "en_progreso", resultadoNuevo: "pendiente",
        fecha: new Date("2026-03-03T10:00:00"), usuario: "Ana Martinez" },
    ],
    eventosBloqueo: [],
  },
  {
    id: "T-005", huId: "hu-3",
    titulo: "Benchmark tiempo respuesta APIs críticas",
    descripcion: "Medir P95 y P99 de endpoints con k6",
    tipo: "rendimiento", tipoPrueba: "no_funcional", asignado: "Ana Martinez",
    entorno: "staging", faseActual: "despliegue",
    estado: "pendiente", resultado: "pendiente",
    fechaInicio: new Date("2026-03-06"), fechaFin: null,
    impactoUsuarios: 6, complejidadTecnica: 6, urgencia: 4,
    horasEstimadas: 12, cantidadArchivos: 3,
    historialFases: [],
    eventosBloqueo: [],
  },
  {
    id: "T-006", huId: "hu-4",
    titulo: "Job noche — recálculo de métricas financieras",
    descripcion: "Proceso batch que recalcula KPIs durante la noche",
    tipo: "batch", tipoPrueba: "no_funcional", asignado: "Pedro Sanchez",
    entorno: "produccion", faseActual: "despliegue",
    estado: "bloqueada", resultado: "pendiente",
    fechaInicio: new Date("2026-03-06"), fechaFin: null,
    impactoUsuarios: 8, complejidadTecnica: 9, urgencia: 8,
    horasEstimadas: 32, cantidadArchivos: 6,
    historialFases: [
      { id: "ef-006", tareaId: "T-006", tareaTitulo: "Job noche",
        faseAnterior: null, faseNueva: "despliegue", estadoNuevo: "bloqueada", resultadoNuevo: "pendiente",
        fecha: new Date("2026-03-06T07:00:00"), usuario: "Pedro Sanchez", nota: "Inicio en producción" },
    ],
    eventosBloqueo: [
      { id: "eb-001", tipo: "reportado", descripcion: "Acceso a producción restringido por ventana de cambios",
        fecha: new Date("2026-03-07T16:00:00"), usuario: "Pedro Sanchez" },
    ],
  },
  {
    id: "T-007", huId: "hu-4",
    titulo: "Actualizar dependencias del scheduler",
    descripcion: "Upgrade de Quartz 2.x a 3.x con prueba de regresión",
    tipo: "regresion", tipoPrueba: "no_funcional", asignado: "Pedro Sanchez",
    entorno: "qa", faseActual: "rollback",
    estado: "en_progreso", resultado: "pendiente",
    fechaInicio: new Date("2026-03-07"), fechaFin: null,
    impactoUsuarios: 6, complejidadTecnica: 8, urgencia: 7,
    horasEstimadas: 16, cantidadArchivos: 12,
    historialFases: [
      { id: "ef-007", tareaId: "T-007", tareaTitulo: "Actualizar dependencias scheduler",
        faseAnterior: null, faseNueva: "despliegue", estadoNuevo: "en_progreso", resultadoNuevo: "pendiente",
        fecha: new Date("2026-03-07T09:00:00"), usuario: "Pedro Sanchez" },
      { id: "ef-008", tareaId: "T-007", tareaTitulo: "Actualizar dependencias scheduler",
        faseAnterior: "despliegue", faseNueva: "rollback", estadoNuevo: "en_progreso", resultadoNuevo: "fallido",
        fecha: new Date("2026-03-08T11:30:00"), usuario: "Pedro Sanchez", nota: "Fallo en pruebas de integración, se inicia rollback" },
    ],
    eventosBloqueo: [],
  },
]

export const historiasEjemplo: HistoriaUsuario[] = [
  {
    id: "hu-1", codigo: "HU-001",
    titulo: "Sistema de autenticación OAuth 2.0",
    descripcion: "Migrar el sistema de login actual a OAuth 2.0 para mayor seguridad y compatibilidad",
    criteriosAceptacion: "- Login con Google y GitHub operativo\n- Token JWT con expiración de 1h\n- Refresh token automático sin interrupción\n- Pruebas de regresión al 100%",
    asignado: "Maria Garcia",
    estado: "en_progreso", prioridad: "alta", puntos: 13,
    fechaCreacion: new Date("2026-02-20"), fechaCierre: null,
    bloqueos: [
      { id: "bl-1", descripcion: "Credenciales de OAuth pendientes de aprobación por el equipo de seguridad corporativa", fecha: new Date("2026-03-02T10:00:00"), resuelto: false, reportadoPor: "Maria Garcia" }
    ],
    tareas: ["T-001", "T-002"],
  },
  {
    id: "hu-2", codigo: "HU-002",
    titulo: "Formulario de contacto funcional",
    descripcion: "Corregir el envío de emails del formulario de contacto en producción",
    criteriosAceptacion: "- Envío de email confirmado en prod\n- Notificación al admin en < 30s\n- Log de errores habilitado",
    asignado: "Carlos Lopez",
    estado: "exitoso", prioridad: "media", puntos: 3,
    fechaCreacion: new Date("2026-03-01"), fechaCierre: new Date("2026-03-07"),
    bloqueos: [],
    tareas: ["T-003"],
  },
  {
    id: "hu-3", codigo: "HU-003",
    titulo: "Validación de rendimiento — módulo de auth",
    descripcion: "Garantizar que el nuevo sistema de auth soporta la carga esperada en producción",
    criteriosAceptacion: "- P95 < 200ms con 5000 usuarios concurrentes\n- P99 < 500ms\n- Sin degradación en endpoints críticos",
    asignado: "Ana Martinez",
    estado: "en_progreso", prioridad: "alta", puntos: 8,
    fechaCreacion: new Date("2026-03-02"), fechaCierre: null,
    bloqueos: [],
    tareas: ["T-004", "T-005"],
  },
  {
    id: "hu-4", codigo: "HU-004",
    titulo: "Actualización del sistema de métricas batch",
    descripcion: "Modernizar el scheduler de jobs nocturnos y sus dependencias",
    criteriosAceptacion: "- Jobs ejecutan sin error en producción\n- Tiempo de ejecución <= actual\n- Alertas configuradas",
    asignado: "Pedro Sanchez",
    estado: "bloqueado", prioridad: "alta", puntos: 13,
    fechaCreacion: new Date("2026-03-05"), fechaCierre: null,
    bloqueos: [
      { id: "bl-2", descripcion: "Acceso a producción restringido por ventana de cambios — esperar ventana del martes", fecha: new Date("2026-03-07T16:00:00"), resuelto: false, reportadoPor: "Pedro Sanchez" }
    ],
    tareas: ["T-006", "T-007"],
  },
]

// ═══════════════════════════════════════════════════════════
//  OBSERVACIÓN — evento que puede extender la fecha fin
// ═══════════════════════════════════════════════════════════
export interface Observacion {
  id: string
  tareaId: string
  texto: string
  fecha: Date
  usuario: string
  diasExtra: number   // cuántos días adicionales agrega a la fecha fin (puede ser 0)
}

// ── Función: calcular fecha fin estimada ────────────────────
// Base: horasEstimadas / 8h por día laboral
// Factor criticidad: alta ×1.3 | media ×1.0 | baja ×0.85
// Factor esfuerzo:   alto ×1.5 | medio ×1.0 | bajo ×0.8
// + días extra acumulados de observaciones
export function calcularFechaFinEstimada(
  tarea: Tarea,
  observaciones: Observacion[] = []
): Date {
  const diasBase    = tarea.horasEstimadas / 8
  const factorCrit  = { alta:1.3, media:1.0, baja:0.85 }[calcularCriticidad(tarea)] ?? 1.0
  const factorEsf   = { alto:1.5, medio:1.0, bajo:0.8 }[calcularEsfuerzo(tarea)]    ?? 1.0
  const diasExtra   = observaciones
    .filter(o => o.tareaId === tarea.id)
    .reduce((sum, o) => sum + o.diasExtra, 0)

  const diasTotales = Math.ceil(diasBase * factorCrit * factorEsf) + diasExtra

  const fecha = new Date(tarea.fechaInicio)
  // Saltar fines de semana
  let diasAgregados = 0
  while (diasAgregados < diasTotales) {
    fecha.setDate(fecha.getDate() + 1)
    const dow = fecha.getDay()
    if (dow !== 0 && dow !== 6) diasAgregados++
  }
  return fecha
}
