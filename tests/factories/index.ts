// ═══════════════════════════════════════════════════════════
//  Shared test factories for domain entities
//
//  These factories return fully-typed objects that satisfy the
//  domain type contracts (including discriminated unions like
//  Bloqueo). Centralized here to avoid local factory drift.
// ═══════════════════════════════════════════════════════════

import type {
  Bloqueo,
  BloqueoActivo,
  BloqueoResuelto,
  Tarea,
  HistoriaUsuario,
  CasoPrueba,
} from "@/lib/types/index"

let _idCounter = 0
const nextId = (prefix: string) => `${prefix}-${++_idCounter}`

// ── Bloqueo ──────────────────────────────────────────────────
export function makeBloqueoActivo(overrides: Partial<BloqueoActivo> = {}): BloqueoActivo {
  return {
    id: nextId("bl"),
    descripcion: "Bloqueo de prueba",
    reportadoPor: "QA",
    fecha: new Date(),
    resuelto: false,
    ...overrides,
  }
}

export function makeBloqueoResuelto(overrides: Partial<BloqueoResuelto> = {}): BloqueoResuelto {
  return {
    id: nextId("bl"),
    descripcion: "Bloqueo resuelto",
    reportadoPor: "QA",
    fecha: new Date(),
    resuelto: true,
    fechaResolucion: new Date(),
    resueltoPor: "Admin",
    ...overrides,
  }
}

export function makeBloqueo(resuelto = false): Bloqueo {
  return resuelto ? makeBloqueoResuelto() : makeBloqueoActivo()
}

// ── Tarea ────────────────────────────────────────────────────
export function makeTarea(overrides: Partial<Tarea> = {}): Tarea {
  return {
    id: nextId("tarea"),
    casoPruebaId: "caso-1",
    huId: "hu-1",
    titulo: "Tarea de prueba",
    descripcion: "",
    asignado: "QA",
    estado: "en_progreso",
    resultado: "pendiente",
    tipo: "ejecucion",
    prioridad: "media",
    horasEstimadas: 2,
    horasReales: 0,
    fechaCreacion: new Date(),
    bloqueos: [],
    evidencias: "",
    creadoPor: "qa",
    ...overrides,
  }
}

// ── HistoriaUsuario ──────────────────────────────────────────
export function makeHU(overrides: Partial<HistoriaUsuario> = {}): HistoriaUsuario {
  return {
    id: "hu-1",
    codigo: "HU-001",
    titulo: "Historia de prueba",
    descripcion: "",
    criteriosAceptacion: "",
    responsable: "QA",
    prioridad: "media",
    estado: "en_progreso",
    puntos: 3,
    aplicacion: "",
    tipoAplicacion: "web",
    requiriente: "",
    areaSolicitante: "",
    fechaCreacion: new Date(),
    etapa: "pruebas",
    ambiente: "qa",
    tipoPrueba: "funcional",
    casosIds: [],
    bloqueos: [],
    historial: [],
    creadoPor: "qa",
    delegadoPor: "",
    permitirCasosAdicionales: false,
    comentarios: [],
    ...overrides,
  }
}

// ── CasoPrueba ───────────────────────────────────────────────
export function makeCaso(overrides: Partial<CasoPrueba> = {}): CasoPrueba {
  return {
    id: nextId("caso"),
    huId: "hu-1",
    titulo: "Caso de prueba",
    descripcion: "",
    entorno: "test",
    tipoPrueba: "funcional",
    horasEstimadas: 1,
    archivosAnalizados: [],
    complejidad: "media",
    estadoAprobacion: "borrador",
    resultadosPorEtapa: [],
    fechaCreacion: new Date(),
    tareasIds: [],
    bloqueos: [],
    creadoPor: "qa",
    modificacionHabilitada: false,
    comentarios: [],
    ...overrides,
  }
}
