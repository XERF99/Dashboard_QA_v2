import { describe, it, expect, vi, beforeEach } from "vitest"
import { createCasoHandlers } from "@/lib/hooks/domain/casoHandlers"
import type { DomainCtx } from "@/lib/hooks/domain/types"
import type { CasoPrueba, HistoriaUsuario } from "@/lib/types"

// ── Factories ────────────────────────────────────────────────

let _id = 0
beforeEach(() => { _id = 0 })

function makeCaso(overrides: Partial<CasoPrueba> = {}): CasoPrueba {
  _id++
  return {
    id: `caso-${_id}`,
    huId: "hu-1",
    titulo: `Caso ${_id}`,
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

function makeHU(overrides: Partial<HistoriaUsuario> = {}): HistoriaUsuario {
  return {
    id: "hu-1",
    codigo: "HU-001",
    titulo: "Historia de prueba",
    descripcion: "",
    criteriosAceptacion: "",
    responsable: "QA User",
    prioridad: "media",
    estado: "en_progreso",
    puntos: 3,
    aplicacion: "App",
    tipoAplicacion: "web",
    requiriente: "Admin",
    areaSolicitante: "TI",
    fechaCreacion: new Date(),
    etapa: "development",
    ambiente: "qa",
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

// ── Context helper ───────────────────────────────────────────

function makeCtx(
  initialCasos: CasoPrueba[],
  initialHistorias: HistoriaUsuario[],
  overrides: Partial<DomainCtx> = {},
) {
  let casosState = [...initialCasos]
  let historiasState = [...initialHistorias]

  const ctx: DomainCtx = {
    historias: initialHistorias,
    casos: initialCasos,
    setCasos: vi.fn((updater: (prev: CasoPrueba[]) => CasoPrueba[]) => {
      casosState = updater(casosState)
    }),
    setHistorias: vi.fn((updater: (prev: HistoriaUsuario[]) => HistoriaUsuario[]) => {
      historiasState = updater(historiasState)
    }),
    setTareas: vi.fn(),
    user: {
      id: "usr-admin",
      nombre: "Admin",
      email: "admin@test.com",
      rol: "admin",
      activo: true,
      fechaCreacion: new Date(),
      debeCambiarPassword: false,
    },
    configEtapas: {},
    configResultados: [],
    addToast: vi.fn(),
    addNotificacion: vi.fn(),
    ...overrides,
  }

  return {
    ctx,
    getCasos: () => casosState,
    getHistorias: () => historiasState,
  }
}

// ── Tests: flujo de aprobación ───────────────────────────────

describe("handleEnviarAprobacion", () => {
  it("cambia borrador y rechazado → pendiente_aprobacion", () => {
    const casos = [
      makeCaso({ id: "c1", estadoAprobacion: "borrador" }),
      makeCaso({ id: "c2", estadoAprobacion: "rechazado" }),
    ]
    const { ctx, getCasos } = makeCtx(casos, [makeHU()])
    createCasoHandlers(ctx).handleEnviarAprobacion("hu-1")

    expect(getCasos()[0].estadoAprobacion).toBe("pendiente_aprobacion")
    expect(getCasos()[1].estadoAprobacion).toBe("pendiente_aprobacion")
  })

  it("no cambia casos ya aprobados", () => {
    const casos = [
      makeCaso({ id: "c1", estadoAprobacion: "aprobado" }),
      makeCaso({ id: "c2", estadoAprobacion: "pendiente_aprobacion" }),
    ]
    const { ctx, getCasos } = makeCtx(casos, [makeHU()])
    createCasoHandlers(ctx).handleEnviarAprobacion("hu-1")

    expect(getCasos()[0].estadoAprobacion).toBe("aprobado")
    expect(getCasos()[1].estadoAprobacion).toBe("pendiente_aprobacion")
  })

  it("no afecta casos de otras HUs", () => {
    const casos = [
      makeCaso({ id: "c1", huId: "hu-1", estadoAprobacion: "borrador" }),
      makeCaso({ id: "c2", huId: "hu-2", estadoAprobacion: "borrador" }),
    ]
    const historias = [makeHU({ id: "hu-1" }), makeHU({ id: "hu-2" })]
    const { ctx, getCasos } = makeCtx(casos, historias)
    createCasoHandlers(ctx).handleEnviarAprobacion("hu-1")

    expect(getCasos()[0].estadoAprobacion).toBe("pendiente_aprobacion")
    expect(getCasos()[1].estadoAprobacion).toBe("borrador")
  })

  it("emite notificación de tipo admin", () => {
    const { ctx } = makeCtx([makeCaso()], [makeHU()])
    createCasoHandlers(ctx).handleEnviarAprobacion("hu-1")

    expect(ctx.addNotificacion).toHaveBeenCalledWith(
      "aprobacion_enviada",
      expect.any(String),
      expect.any(String),
      "admin",
      expect.any(Object),
    )
  })
})

describe("handleAprobarCasos", () => {
  it("cambia pendiente_aprobacion → aprobado con metadatos", () => {
    const casos = [
      makeCaso({ id: "c1", estadoAprobacion: "pendiente_aprobacion" }),
      makeCaso({ id: "c2", estadoAprobacion: "borrador" }),
    ]
    const { ctx, getCasos } = makeCtx(casos, [makeHU()])
    createCasoHandlers(ctx).handleAprobarCasos("hu-1")

    const aprobado = getCasos()[0]
    expect(aprobado.estadoAprobacion).toBe("aprobado")
    expect(aprobado.aprobadoPor).toBe("Admin")
    expect(aprobado.fechaAprobacion).toBeInstanceOf(Date)

    // El borrador no se toca
    expect(getCasos()[1].estadoAprobacion).toBe("borrador")
  })

  it("emite notificación de tipo qa", () => {
    const casos = [makeCaso({ estadoAprobacion: "pendiente_aprobacion" })]
    const { ctx } = makeCtx(casos, [makeHU()])
    createCasoHandlers(ctx).handleAprobarCasos("hu-1")

    expect(ctx.addNotificacion).toHaveBeenCalledWith(
      "caso_aprobado",
      expect.any(String),
      expect.any(String),
      "qa",
      expect.any(Object),
    )
  })
})

describe("handleRechazarCasos", () => {
  it("cambia pendiente_aprobacion → rechazado con motivo", () => {
    const casos = [
      makeCaso({ id: "c1", estadoAprobacion: "pendiente_aprobacion" }),
      makeCaso({ id: "c2", estadoAprobacion: "aprobado" }),
    ]
    const { ctx, getCasos } = makeCtx(casos, [makeHU()])
    createCasoHandlers(ctx).handleRechazarCasos("hu-1", "Faltan pasos de reproducción")

    const rechazado = getCasos()[0]
    expect(rechazado.estadoAprobacion).toBe("rechazado")
    expect(rechazado.motivoRechazo).toBe("Faltan pasos de reproducción")

    // El aprobado no se toca
    expect(getCasos()[1].estadoAprobacion).toBe("aprobado")
  })

  it("emite notificación de tipo qa", () => {
    const { ctx } = makeCtx(
      [makeCaso({ estadoAprobacion: "pendiente_aprobacion" })],
      [makeHU()],
    )
    createCasoHandlers(ctx).handleRechazarCasos("hu-1", "Motivo")

    expect(ctx.addNotificacion).toHaveBeenCalledWith(
      "caso_rechazado",
      expect.any(String),
      expect.any(String),
      "qa",
      expect.any(Object),
    )
  })
})

describe("handleSolicitarModificacionCaso", () => {
  it("marca modificacionSolicitada en el caso correcto", () => {
    const casos = [
      makeCaso({ id: "c1", estadoAprobacion: "aprobado", modificacionSolicitada: false }),
      makeCaso({ id: "c2", estadoAprobacion: "aprobado", modificacionSolicitada: false }),
    ]
    const { ctx, getCasos } = makeCtx(casos, [makeHU()])
    createCasoHandlers(ctx).handleSolicitarModificacionCaso("c1", "hu-1")

    expect(getCasos()[0].modificacionSolicitada).toBe(true)
    expect(getCasos()[1].modificacionSolicitada).toBe(false) // no afectado
  })
})

describe("handleHabilitarModificacionCaso", () => {
  it("pone modificacionHabilitada=true, solicitud=false y estadoAprobacion=borrador", () => {
    const casos = [
      makeCaso({ id: "c1", estadoAprobacion: "aprobado", modificacionSolicitada: true }),
    ]
    const { ctx, getCasos } = makeCtx(casos, [makeHU()])
    createCasoHandlers(ctx).handleHabilitarModificacionCaso("c1", "hu-1")

    const caso = getCasos()[0]
    expect(caso.modificacionHabilitada).toBe(true)
    expect(caso.modificacionSolicitada).toBe(false)
    expect(caso.estadoAprobacion).toBe("borrador")
  })

  it("emite notificación de tipo qa", () => {
    const { ctx } = makeCtx(
      [makeCaso({ id: "c1", estadoAprobacion: "aprobado" })],
      [makeHU()],
    )
    createCasoHandlers(ctx).handleHabilitarModificacionCaso("c1", "hu-1")

    expect(ctx.addNotificacion).toHaveBeenCalledWith(
      "modificacion_habilitada",
      expect.any(String),
      expect.any(String),
      "qa",
      expect.any(Object),
    )
  })
})

describe("handleEliminarCaso", () => {
  it("elimina el caso de la lista", () => {
    const casos = [
      makeCaso({ id: "c1" }),
      makeCaso({ id: "c2" }),
    ]
    const hu = makeHU({ casosIds: ["c1", "c2"] })
    const { ctx, getCasos } = makeCtx(casos, [hu])
    createCasoHandlers(ctx).handleEliminarCaso("c1", "hu-1")

    expect(getCasos()).toHaveLength(1)
    expect(getCasos()[0].id).toBe("c2")
  })

  it("elimina el id del caso en historias.casosIds", () => {
    const hu = makeHU({ casosIds: ["c1", "c2"] })
    const { ctx, getHistorias } = makeCtx(
      [makeCaso({ id: "c1" }), makeCaso({ id: "c2" })],
      [hu],
    )
    createCasoHandlers(ctx).handleEliminarCaso("c1", "hu-1")

    expect(getHistorias()[0].casosIds).toEqual(["c2"])
  })
})

describe("handleAddCaso", () => {
  it("añade el caso a la lista y al historial de la HU", () => {
    const hu = makeHU({ casosIds: [] })
    const { ctx, getCasos, getHistorias } = makeCtx([], [hu])
    const nuevoCaso = makeCaso({ id: "c-nuevo" })

    createCasoHandlers(ctx).handleAddCaso(nuevoCaso)

    expect(getCasos()).toHaveLength(1)
    expect(getCasos()[0].id).toBe("c-nuevo")
    expect(getHistorias()[0].casosIds).toContain("c-nuevo")
    expect(getHistorias()[0].historial).toHaveLength(1)
  })
})

describe("handleRetestearCaso", () => {
  it("cambia estado del resultado de fallido → en_ejecucion con comentario de corrección", () => {
    const caso = makeCaso({
      id: "c1",
      resultadosPorEtapa: [{
        etapa: "dev",
        estado: "completado",
        resultado: "fallido",
        intentos: [{ numero: 1, resultado: "fallido", fecha: new Date(), ejecutadoPor: "QA" }],
      }],
    })
    const { ctx, getCasos } = makeCtx([caso], [makeHU()])
    createCasoHandlers(ctx).handleRetestearCaso("c1", "dev", "Se corrigió el bug #123")

    const etapa = getCasos()[0].resultadosPorEtapa[0]
    expect(etapa.estado).toBe("en_ejecucion")
    expect(etapa.resultado).toBe("pendiente")
    expect(etapa.intentos[0].comentarioCorreccion).toBe("Se corrigió el bug #123")
  })
})
