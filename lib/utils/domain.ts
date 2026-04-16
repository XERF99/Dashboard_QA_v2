// ═══════════════════════════════════════════════════════════
//  FUNCIONES HELPER DE DOMINIO — Dashboard QA
//  Lógica de negocio pura, sin efectos secundarios.
// ═══════════════════════════════════════════════════════════

import type {
  TipoAplicacion, TipoAplicacionDef, AmbienteDef, TipoPruebaDef,
  ConfigEtapas, EtapaEjecucion, EtapaDefinicion,
  CasoPrueba, ResultadoEtapa, ResultadoDef, HistoriaUsuario, PrioridadHU,
  TipoEvento, EventoHistorial,
} from "@/lib/types/index"

import {
  ETAPAS_PREDETERMINADAS, ETAPA_HU_CFG,
  TIPO_APLICACION_LABEL, TIPO_PRUEBA_LABEL, TIPO_PRUEBA_COLOR,
} from "@/lib/constants/index"

// ── Labels dinámicos ─────────────────────────────────────────
export function getTipoAplicacionLabel(id: string, tipos?: TipoAplicacionDef[]): string {
  if (tipos) {
    const found = tipos.find(t => t.id === id)
    if (found) return found.label
  }
  return TIPO_APLICACION_LABEL[id] ?? id
}

export function getAmbienteLabel(id: string, ambientes?: AmbienteDef[]): string {
  if (ambientes) {
    const found = ambientes.find(a => a.id === id)
    if (found) return found.label
  }
  const AMBIENTE_LABEL: Record<string, string> = {
    test: "Test", preproduccion: "Pre-Producción", produccion: "Producción",
  }
  return AMBIENTE_LABEL[id] ?? id
}

export function getTipoPruebaLabel(id: string, tipos?: TipoPruebaDef[]): string {
  if (tipos) {
    const found = tipos.find(t => t.id === id)
    if (found) return found.label
  }
  return TIPO_PRUEBA_LABEL[id] ?? id
}

export function getTipoPruebaColor(id: string): string {
  return TIPO_PRUEBA_COLOR[id] ?? "bg-muted text-muted-foreground border-border"
}

// ── Etapas ────────────────────────────────────────────────────
export function getEtapaHUCfg(
  etapaId: string,
  config: ConfigEtapas = ETAPAS_PREDETERMINADAS,
): { label: string; cls: string } {
  if (ETAPA_HU_CFG[etapaId]) return ETAPA_HU_CFG[etapaId]
  for (const defs of Object.values(config)) {
    const found = defs.find(e => e.id === etapaId)
    if (found) return { label: found.label, cls: found.cls }
  }
  return { label: etapaId, cls: "bg-muted text-muted-foreground border-border" }
}

export function etapasParaTipo(
  tipo: TipoAplicacion,
  config: ConfigEtapas = ETAPAS_PREDETERMINADAS,
): EtapaEjecucion[] {
  return (config[tipo] ?? ETAPAS_PREDETERMINADAS[tipo] ?? []).map(e => e.id)
}

export function etapaDefsParaTipo(
  tipo: TipoAplicacion,
  config: ConfigEtapas = ETAPAS_PREDETERMINADAS,
): EtapaDefinicion[] {
  return config[tipo] ?? ETAPAS_PREDETERMINADAS[tipo] ?? []
}

export function siguienteEtapa(
  etapaActual: EtapaEjecucion,
  tipo: TipoAplicacion,
  config: ConfigEtapas = ETAPAS_PREDETERMINADAS,
): EtapaEjecucion | null {
  const etapas = etapasParaTipo(tipo, config)
  const idx = etapas.indexOf(etapaActual)
  return idx >= 0 && idx < etapas.length - 1 ? etapas[idx + 1] ?? null : null
}

export function etapaCompletada(
  casos: CasoPrueba[],
  etapa: EtapaEjecucion,
  configResultados?: ResultadoDef[],
): { completa: boolean; exitosa: boolean; fallida: boolean } {
  const resultados = casos
    .map(c => c.resultadosPorEtapa.find(r => r.etapa === etapa))
    .filter(Boolean) as ResultadoEtapa[]

  if (resultados.length === 0 || resultados.length < casos.length) {
    return { completa: false, exitosa: false, fallida: false }
  }

  const todosCompletados = resultados.every(r => r.estado === "completado")
  if (!todosCompletados) return { completa: false, exitosa: false, fallida: false }

  const esAceptado = (resultado: string): boolean => {
    if (configResultados) {
      const def = configResultados.find(d => d.id === resultado)
      if (def) return def.esAceptado
    }
    // Fallback: hardcoded para compatibilidad sin config
    return resultado === "exitoso" || resultado === "error_preexistente" || resultado === "bloqueado"
  }

  const todosAceptados = resultados.every(r => esAceptado(r.resultado))
  const algunoNoAceptado = resultados.some(r => !esAceptado(r.resultado))
  return { completa: true, exitosa: todosAceptados, fallida: algunoNoAceptado }
}

// ── Cálculo de fechas ─────────────────────────────────────────
export function calcularFechaFinEstimada(
  hu: HistoriaUsuario,
  casos: CasoPrueba[],
): Date {
  const casosHU = casos.filter(c => c.huId === hu.id)
  const totalHoras = casosHU.reduce((s, c) => s + c.horasEstimadas, 0) || 8
  const diasBase = Math.ceil(totalHoras / 8)

  const factorPri: Record<PrioridadHU, number> = {
    critica: 0.75, alta: 0.85, media: 1.0, baja: 1.15,
  }
  const numEtapas = etapasParaTipo(hu.tipoAplicacion).length
  const factorEtapas = numEtapas >= 3 ? 1.5 : numEtapas >= 2 ? 1.2 : 1.0

  const diasEstimados =
    Math.ceil(diasBase * (factorPri[hu.prioridad] ?? 1) * factorEtapas) || 1

  const fecha = new Date(hu.fechaCreacion)
  let diasAgregados = 0
  while (diasAgregados < diasEstimados) {
    fecha.setDate(fecha.getDate() + 1)
    const dow = fecha.getDay()
    if (dow !== 0 && dow !== 6) diasAgregados++
  }
  return fecha
}

// ── Formato de fechas ─────────────────────────────────────────
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

export function fmtCorto(d: Date): string {
  return `${d.getDate().toString().padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtHora(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

// ── Creación de eventos ───────────────────────────────────────
export function crearEvento(
  tipo: TipoEvento,
  descripcion: string,
  usuario: string,
  detalles?: Record<string, string>,
): EventoHistorial {
  return {
    id: `ev-${crypto.randomUUID()}`,
    tipo,
    descripcion,
    fecha: new Date(),
    usuario,
    detalles,
  }
}
