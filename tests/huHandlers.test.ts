import { describe, it, expect, vi } from "vitest"
import { createHUHandlers } from "@/lib/hooks/domain/huHandlers"
import type { DomainCtx } from "@/lib/hooks/domain/types"
import type { HistoriaUsuario, CasoPrueba, Bloqueo } from "@/lib/types"

// ── Fixtures ─────────────────────────────────────────────────

// "aplicacion" tiene 3 etapas en ETAPAS_PREDETERMINADAS (despliegue, rollback, redespliegue).
// "base_de_datos" tiene 1 (despliegue) — útil para probar cierre exitoso.
const CONFIG_ETAPAS = {}   // usa los predeterminados por tipo

function makeHU(overrides: Partial<HistoriaUsuario> = {}): HistoriaUsuario {
  return {
    id: "hu-1",
    codigo: "HU-001",
    titulo: "Historia de prueba",
    descripcion: "",
    criteriosAceptacion: "",
    responsable: "QA",
    prioridad: "media",
    estado: "sin_iniciar",
    puntos: 3,
    aplicacion: "App",
    tipoAplicacion: "aplicacion",
    requiriente: "Admin",
    areaSolicitante: "TI",
    fechaCreacion: new Date(),
    etapa: "sin_iniciar",
    ambiente: "test",
    tipoPrueba: "funcional",
    casosIds: [],
    bloqueos: [],
    historial: [],
    creadoPor: "admin",
    delegadoPor: "",
    permitirCasosAdicionales: false,
    comentarios: [],
    ...overrides,
  }
}

function makeCaso(overrides: Partial<CasoPrueba> = {}): CasoPrueba {
  return {
    id: "caso-1",
    huId: "hu-1",
    titulo: "Caso de prueba",
    descripcion: "",
    entorno: "test",
    tipoPrueba: "funcional",
    horasEstimadas: 1,
    archivosAnalizados: [],
    complejidad: "media",
    estadoAprobacion: "aprobado",
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

function makeBloqueoActivo(): Bloqueo {
  return {
    id: "bl-1",
    descripcion: "Bloqueo activo",
    reportadoPor: "QA",
    fecha: new Date(),
    resuelto: false,
  }
}

// ── Context helper ────────────────────────────────────────────

function makeCtx(
  initialHistorias: HistoriaUsuario[] = [],
  initialCasos: CasoPrueba[] = [],
) {
  let historiasState = [...initialHistorias]
  let casosState     = [...initialCasos]

  const ctx: DomainCtx = {
    historias:    initialHistorias,
    casos:        initialCasos,
    tareas:       [],
    setHistorias: vi.fn((upd: (prev: HistoriaUsuario[]) => HistoriaUsuario[]) => {
      historiasState = upd(historiasState)
    }),
    setCasos: vi.fn((upd: (prev: CasoPrueba[]) => CasoPrueba[]) => {
      casosState = upd(casosState)
    }),
    setTareas: vi.fn(),
    user: {
      id: "usr-1",
      nombre: "QA User",
      email: "qa@test.com",
      rol: "qa",
      activo: true,
      fechaCreacion: new Date(),
      debeCambiarPassword: false,
    },
    configEtapas:    CONFIG_ETAPAS,
    configResultados: [],
    addToast:         vi.fn(),
    addNotificacion:  vi.fn(),
  }

  return {
    ctx,
    getHistorias: () => historiasState,
    getCasos:     () => casosState,
  }
}

// ════════════════════════════════════════════════════════════
// handleIniciarHU
// ════════════════════════════════════════════════════════════

describe("handleIniciarHU", () => {
  it("cambia estado a en_progreso y etapa a la primera del tipo", () => {
    const hu = makeHU({ id: "hu-1", estado: "sin_iniciar", tipoAplicacion: "aplicacion" })
    const { ctx, getHistorias } = makeCtx([hu])

    createHUHandlers(ctx).handleIniciarHU("hu-1")

    const h = getHistorias()[0]!
    expect(h.estado).toBe("en_progreso")
    expect(h.etapa).toBe("despliegue")
  })

  it("registra evento hu_iniciada en el historial", () => {
    const hu = makeHU({ id: "hu-1", estado: "sin_iniciar" })
    const { ctx, getHistorias } = makeCtx([hu])

    createHUHandlers(ctx).handleIniciarHU("hu-1")

    expect(getHistorias()[0]!.historial).toHaveLength(1)
    expect(getHistorias()[0]!.historial[0]!.tipo).toBe("hu_iniciada")
  })

  it("no cambia estado si la HU ya está en_progreso", () => {
    const hu = makeHU({ id: "hu-1", estado: "en_progreso", etapa: "despliegue" })
    const { ctx, getHistorias } = makeCtx([hu])

    createHUHandlers(ctx).handleIniciarHU("hu-1")

    expect(getHistorias()[0]!.estado).toBe("en_progreso")
    expect(getHistorias()[0]!.etapa).toBe("despliegue")
    expect(getHistorias()[0]!.historial).toHaveLength(0)
  })

  it("emite toast de info", () => {
    const hu = makeHU({ id: "hu-1", estado: "sin_iniciar" })
    const { ctx } = makeCtx([hu])

    createHUHandlers(ctx).handleIniciarHU("hu-1")

    expect(ctx.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "info", title: "HU iniciada" })
    )
  })
})

// ════════════════════════════════════════════════════════════
// handleCancelarHU
// ════════════════════════════════════════════════════════════

describe("handleCancelarHU", () => {
  it("cambia estado a cancelada con motivo, etapa y fechaCierre", () => {
    const hu = makeHU({ id: "hu-1", estado: "en_progreso" })
    const { ctx, getHistorias } = makeCtx([hu])

    createHUHandlers(ctx).handleCancelarHU("hu-1", "Motivo de cancelación")

    const h = getHistorias()[0]!
    expect(h.estado).toBe("cancelada")
    expect(h.etapa).toBe("cambio_cancelado")
    expect(h.motivoCancelacion).toBe("Motivo de cancelación")
    expect(h.fechaCierre).toBeInstanceOf(Date)
  })

  it("registra evento hu_cancelada en el historial", () => {
    const hu = makeHU({ id: "hu-1" })
    const { ctx, getHistorias } = makeCtx([hu])

    createHUHandlers(ctx).handleCancelarHU("hu-1", "Motivo")

    expect(getHistorias()[0]!.historial).toHaveLength(1)
    expect(getHistorias()[0]!.historial[0]!.tipo).toBe("hu_cancelada")
  })

  it("emite toast de error", () => {
    const hu = makeHU({ id: "hu-1" })
    const { ctx } = makeCtx([hu])

    createHUHandlers(ctx).handleCancelarHU("hu-1", "Motivo")

    expect(ctx.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error" })
    )
  })
})

// ════════════════════════════════════════════════════════════
// handleFallarHU
// ════════════════════════════════════════════════════════════

describe("handleFallarHU", () => {
  it("cambia estado a fallida con motivo, etapa y fechaCierre", () => {
    const hu = makeHU({ id: "hu-1", estado: "en_progreso" })
    const { ctx, getHistorias } = makeCtx([hu])

    createHUHandlers(ctx).handleFallarHU("hu-1", "Bug crítico no resuelto")

    const h = getHistorias()[0]!
    expect(h.estado).toBe("fallida")
    expect(h.etapa).toBe("cambio_cancelado")
    expect(h.motivoCancelacion).toBe("Bug crítico no resuelto")
    expect(h.fechaCierre).toBeInstanceOf(Date)
  })

  it("registra evento hu_fallida en el historial", () => {
    const hu = makeHU({ id: "hu-1" })
    const { ctx, getHistorias } = makeCtx([hu])

    createHUHandlers(ctx).handleFallarHU("hu-1", "Motivo")

    expect(getHistorias()[0]!.historial).toHaveLength(1)
    expect(getHistorias()[0]!.historial[0]!.tipo).toBe("hu_fallida")
  })

  it("no afecta otras HUs", () => {
    const h1 = makeHU({ id: "hu-1", estado: "en_progreso" })
    const h2 = makeHU({ id: "hu-2", estado: "en_progreso" })
    const { ctx, getHistorias } = makeCtx([h1, h2])

    createHUHandlers(ctx).handleFallarHU("hu-1", "Motivo")

    expect(getHistorias()[1]!.estado).toBe("en_progreso")
  })
})

// ════════════════════════════════════════════════════════════
// handleBulkCambiarEstado
// ════════════════════════════════════════════════════════════

describe("handleBulkCambiarEstado", () => {
  it("cambia estado solo en las HUs seleccionadas", () => {
    const h1 = makeHU({ id: "hu-1", estado: "sin_iniciar" })
    const h2 = makeHU({ id: "hu-2", estado: "sin_iniciar" })
    const h3 = makeHU({ id: "hu-3", estado: "sin_iniciar" })
    const { ctx, getHistorias } = makeCtx([h1, h2, h3])

    createHUHandlers(ctx).handleBulkCambiarEstado(["hu-1", "hu-3"], "en_progreso")

    expect(getHistorias()[0]!.estado).toBe("en_progreso")
    expect(getHistorias()[1]!.estado).toBe("sin_iniciar")
    expect(getHistorias()[2]!.estado).toBe("en_progreso")
  })

  it("emite toast de success con el conteo correcto", () => {
    const h1 = makeHU({ id: "hu-1" })
    const h2 = makeHU({ id: "hu-2" })
    const { ctx } = makeCtx([h1, h2])

    createHUHandlers(ctx).handleBulkCambiarEstado(["hu-1", "hu-2"], "cancelada")

    expect(ctx.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success" })
    )
  })
})

// ════════════════════════════════════════════════════════════
// handleBulkCambiarResponsable
// ════════════════════════════════════════════════════════════

describe("handleBulkCambiarResponsable", () => {
  it("actualiza responsable solo en las HUs seleccionadas", () => {
    const h1 = makeHU({ id: "hu-1", responsable: "QA1" })
    const h2 = makeHU({ id: "hu-2", responsable: "QA1" })
    const { ctx, getHistorias } = makeCtx([h1, h2])

    createHUHandlers(ctx).handleBulkCambiarResponsable(["hu-1"], "QA2")

    expect(getHistorias()[0]!.responsable).toBe("QA2")
    expect(getHistorias()[1]!.responsable).toBe("QA1")
  })
})

// ════════════════════════════════════════════════════════════
// handleImportarHUs
// ════════════════════════════════════════════════════════════

describe("handleImportarHUs", () => {
  it("añade HUs cuyo código no existe aún", () => {
    const existing = makeHU({ id: "hu-1", codigo: "HU-001" })
    const nueva    = makeHU({ id: "hu-2", codigo: "HU-002" })
    const { ctx, getHistorias } = makeCtx([existing])

    createHUHandlers(ctx).handleImportarHUs([nueva])

    expect(getHistorias()).toHaveLength(2)
    expect(getHistorias()[1]!.id).toBe("hu-2")
  })

  it("descarta HUs con código ya existente (deduplicación)", () => {
    const existing  = makeHU({ id: "hu-1", codigo: "HU-001" })
    const duplicada = makeHU({ id: "hu-99", codigo: "HU-001" })
    const { ctx, getHistorias } = makeCtx([existing])

    createHUHandlers(ctx).handleImportarHUs([duplicada])

    expect(getHistorias()).toHaveLength(1)
    expect(getHistorias()[0]!.id).toBe("hu-1")
  })

  it("añade solo las no duplicadas de un lote mixto", () => {
    const existing = makeHU({ id: "hu-1", codigo: "HU-001" })
    const nueva    = makeHU({ id: "hu-2", codigo: "HU-002" })
    const dup      = makeHU({ id: "hu-3", codigo: "HU-001" })
    const { ctx, getHistorias } = makeCtx([existing])

    createHUHandlers(ctx).handleImportarHUs([nueva, dup])

    expect(getHistorias()).toHaveLength(2)
  })
})

// ════════════════════════════════════════════════════════════
// handleAvanzarEtapa
// ════════════════════════════════════════════════════════════

describe("handleAvanzarEtapa", () => {
  it("no avanza si hay casos con bloqueos activos", () => {
    const hu   = makeHU({ id: "hu-1", etapa: "despliegue", estado: "en_progreso" })
    const caso = makeCaso({ id: "c1", huId: "hu-1", estadoAprobacion: "aprobado", bloqueos: [makeBloqueoActivo()] })
    const { ctx, getHistorias } = makeCtx([hu], [caso])

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    expect(getHistorias()[0]!.etapa).toBe("despliegue")
    expect(ctx.addToast).toHaveBeenCalledWith(expect.objectContaining({ type: "error" }))
  })

  it("no avanza si la etapa no está completada", () => {
    // caso aprobado pero sin resultados para "despliegue" → etapaCompletada = false
    const hu   = makeHU({ id: "hu-1", etapa: "despliegue", estado: "en_progreso" })
    const caso = makeCaso({ id: "c1", huId: "hu-1", estadoAprobacion: "aprobado", resultadosPorEtapa: [] })
    const { ctx, getHistorias } = makeCtx([hu], [caso])

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    expect(getHistorias()[0]!.etapa).toBe("despliegue")
  })

  it("avanza a la siguiente etapa cuando todos los casos están completados exitosamente", () => {
    // "aplicacion": despliegue → rollback → redespliegue
    const hu   = makeHU({ id: "hu-1", etapa: "despliegue", estado: "en_progreso", tipoAplicacion: "aplicacion" })
    const caso = makeCaso({
      id: "c1", huId: "hu-1", estadoAprobacion: "aprobado",
      resultadosPorEtapa: [{ etapa: "despliegue", estado: "completado", resultado: "exitoso", intentos: [] }],
    })
    const { ctx, getHistorias } = makeCtx([hu], [caso])

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    const h = getHistorias()[0]!
    expect(h.etapa).toBe("rollback")
    expect(h.historial).toHaveLength(1)
    expect(h.historial[0]!.tipo).toBe("hu_etapa_avanzada")
  })

  it("marca la HU como exitosa al completar la última etapa", () => {
    // "base_de_datos" tiene solo una etapa: despliegue → null
    const hu   = makeHU({ id: "hu-1", etapa: "despliegue", estado: "en_progreso", tipoAplicacion: "base_de_datos" })
    const caso = makeCaso({
      id: "c1", huId: "hu-1", estadoAprobacion: "aprobado",
      resultadosPorEtapa: [{ etapa: "despliegue", estado: "completado", resultado: "exitoso", intentos: [] }],
    })
    const { ctx, getHistorias } = makeCtx([hu], [caso])

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    const h = getHistorias()[0]!
    expect(h.estado).toBe("exitosa")
    expect(h.etapa).toBe("completada")
    expect(h.fechaCierre).toBeInstanceOf(Date)
    expect(h.historial[0]!.tipo).toBe("hu_completada")
  })

  it("no hace nada si la HU ya está completada", () => {
    const hu = makeHU({ id: "hu-1", etapa: "completada", estado: "exitosa" })
    const { ctx } = makeCtx([hu])

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    expect(ctx.setHistorias).not.toHaveBeenCalled()
  })
})
