import { describe, it, expect, vi } from "vitest"
import { createComentarioHandlers } from "@/lib/hooks/domain/comentarioHandlers"
import type { DomainCtx } from "@/lib/hooks/domain/types"
import type { HistoriaUsuario, CasoPrueba } from "@/lib/types"

// ── Factories ────────────────────────────────────────────────

function makeHU(id = "hu-1"): HistoriaUsuario {
  return {
    id,
    codigo: "HU-001",
    titulo: "Historia de prueba",
    descripcion: "",
    criteriosAceptacion: "",
    responsable: "QA",
    prioridad: "media",
    estado: "en_progreso",
    puntos: 3,
    aplicacion: "App",
    tipoAplicacion: "aplicacion",
    requiriente: "Admin",
    areaSolicitante: "TI",
    fechaCreacion: new Date(),
    etapa: "despliegue",
    ambiente: "test",
    tipoPrueba: "funcional",
    casosIds: [],
    bloqueos: [],
    historial: [],
    creadoPor: "admin",
    delegadoPor: "",
    permitirCasosAdicionales: false,
    comentarios: [],
  }
}

function makeCaso(id = "caso-1"): CasoPrueba {
  return {
    id,
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
    configEtapas:    {},
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
// handleAddComentarioHU
// ════════════════════════════════════════════════════════════

describe("handleAddComentarioHU", () => {
  it("añade el comentario a la HU correcta", () => {
    const { ctx, getHistorias } = makeCtx([makeHU("hu-1"), makeHU("hu-2")])

    createComentarioHandlers(ctx).handleAddComentarioHU("hu-1", "Primer comentario")

    expect(getHistorias()[0]!.comentarios).toHaveLength(1)
    expect(getHistorias()[0]!.comentarios[0]!.texto).toBe("Primer comentario")
  })

  it("no afecta a otras HUs", () => {
    const { ctx, getHistorias } = makeCtx([makeHU("hu-1"), makeHU("hu-2")])

    createComentarioHandlers(ctx).handleAddComentarioHU("hu-1", "Comentario")

    expect(getHistorias()[1]!.comentarios).toHaveLength(0)
  })

  it("el comentario tiene el autor del usuario activo y una fecha", () => {
    const { ctx, getHistorias } = makeCtx([makeHU()])

    createComentarioHandlers(ctx).handleAddComentarioHU("hu-1", "Texto")

    const c = getHistorias()[0]!.comentarios[0]!
    expect(c.autor).toBe("QA User")
    expect(c.fecha).toBeInstanceOf(Date)
  })

  it("los IDs son únicos en llamadas sucesivas", () => {
    const { ctx, getHistorias } = makeCtx([makeHU()])
    const h = createComentarioHandlers(ctx)

    h.handleAddComentarioHU("hu-1", "Comentario 1")
    h.handleAddComentarioHU("hu-1", "Comentario 2")
    h.handleAddComentarioHU("hu-1", "Comentario 3")

    const ids = getHistorias()[0]!.comentarios.map(c => c.id)
    expect(new Set(ids).size).toBe(3)
  })
})

// ════════════════════════════════════════════════════════════
// handleAddComentarioCaso
// ════════════════════════════════════════════════════════════

describe("handleAddComentarioCaso", () => {
  it("añade el comentario al caso correcto", () => {
    const { ctx, getCasos } = makeCtx([], [makeCaso("c1"), makeCaso("c2")])

    createComentarioHandlers(ctx).handleAddComentarioCaso("c1", "Comentario de caso")

    expect(getCasos()[0]!.comentarios).toHaveLength(1)
    expect(getCasos()[0]!.comentarios[0]!.texto).toBe("Comentario de caso")
  })

  it("no afecta a otros casos", () => {
    const { ctx, getCasos } = makeCtx([], [makeCaso("c1"), makeCaso("c2")])

    createComentarioHandlers(ctx).handleAddComentarioCaso("c1", "Comentario")

    expect(getCasos()[1]!.comentarios).toHaveLength(0)
  })

  it("el comentario tiene el autor del usuario activo", () => {
    const { ctx, getCasos } = makeCtx([], [makeCaso()])

    createComentarioHandlers(ctx).handleAddComentarioCaso("caso-1", "Texto")

    expect(getCasos()[0]!.comentarios[0]!.autor).toBe("QA User")
  })
})
