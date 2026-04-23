import { describe, it, expect, vi } from "vitest"
import { runCommand, defineCommand, type CommandResult } from "@/lib/hooks/domain/pipeline"
import type { DomainCtx } from "@/lib/hooks/domain/types"
import type { HistoriaUsuario, CasoPrueba, Tarea } from "@/lib/types"

function makeHU(overrides: Partial<HistoriaUsuario> = {}): HistoriaUsuario {
  return {
    id: "hu-1",
    codigo: "HU-001",
    titulo: "HU",
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

function makeCtx() {
  let historias: HistoriaUsuario[] = [makeHU()]
  let casos:     CasoPrueba[]      = []
  let tareas:    Tarea[]            = []

  const ctx: DomainCtx = {
    historias, casos, tareas,
    setHistorias: vi.fn((u: (p: HistoriaUsuario[]) => HistoriaUsuario[]) => { historias = u(historias) }),
    setCasos:     vi.fn((u: (p: CasoPrueba[])      => CasoPrueba[])      => { casos     = u(casos) }),
    setTareas:    vi.fn((u: (p: Tarea[])           => Tarea[])           => { tareas    = u(tareas) }),
    user: {
      id: "u-1", nombre: "Ana", email: "a@t.com", rol: "admin",
      activo: true, fechaCreacion: new Date(), debeCambiarPassword: false,
    },
    configEtapas: {},
    configResultados: [],
    addToast: vi.fn(),
    addNotificacion: vi.fn(),
  }

  return {
    ctx,
    getHistorias: () => historias,
    getCasos:     () => casos,
    getTareas:    () => tareas,
  }
}

describe("runCommand", () => {
  it("no llama a setters cuando el result es null", () => {
    const { ctx } = makeCtx()
    runCommand(ctx, null)
    expect(ctx.setHistorias).not.toHaveBeenCalled()
    expect(ctx.setCasos).not.toHaveBeenCalled()
    expect(ctx.setTareas).not.toHaveBeenCalled()
    expect(ctx.addToast).not.toHaveBeenCalled()
    expect(ctx.addNotificacion).not.toHaveBeenCalled()
  })

  it("aplica mutaciones en historias, casos y tareas", () => {
    const { ctx, getHistorias, getCasos, getTareas } = makeCtx()
    const caso = { id: "c1", huId: "hu-1" } as CasoPrueba
    const tarea = { id: "t1", huId: "hu-1" } as Tarea

    runCommand(ctx, {
      casos:  prev => [...prev, caso],
      tareas: prev => [...prev, tarea],
      historias: prev => prev.map(h => ({ ...h, titulo: "renombrada" })),
    })

    expect(getCasos()).toHaveLength(1)
    expect(getTareas()).toHaveLength(1)
    expect(getHistorias()[0]!.titulo).toBe("renombrada")
  })

  it("combina mutate de historias con events en un solo setHistorias", () => {
    const { ctx, getHistorias } = makeCtx()

    runCommand(ctx, {
      historias: prev => prev.map(h => ({ ...h, titulo: "X" })),
      events:    [{ huId: "hu-1", tipo: "caso_creado", texto: "test" }],
    })

    expect(ctx.setHistorias).toHaveBeenCalledTimes(1)
    expect(getHistorias()[0]!.titulo).toBe("X")
    expect(getHistorias()[0]!.historial).toHaveLength(1)
    expect(getHistorias()[0]!.historial[0]!.tipo).toBe("caso_creado")
    expect(getHistorias()[0]!.historial[0]!.descripcion).toBe("test")
    expect(getHistorias()[0]!.historial[0]!.usuario).toBe("Ana")
  })

  it("usa 'Sistema' como autor cuando no hay user", () => {
    const { ctx, getHistorias } = makeCtx()
    ctx.user = null

    runCommand(ctx, { events: [{ huId: "hu-1", tipo: "caso_creado", texto: "x" }] })

    expect(getHistorias()[0]!.historial[0]!.usuario).toBe("Sistema")
  })

  it("ignora events con huId inexistente (no crashea)", () => {
    const { ctx, getHistorias } = makeCtx()
    runCommand(ctx, { events: [{ huId: "hu-inexistente", tipo: "caso_creado", texto: "x" }] })
    expect(getHistorias()[0]!.historial).toHaveLength(0)
  })

  it("emite toast y notify con la forma correcta", () => {
    const { ctx } = makeCtx()
    runCommand(ctx, {
      toast:  { type: "success", title: "T", desc: "D" },
      notify: {
        tipo: "caso_aprobado", titulo: "N", descripcion: "desc",
        destinatario: "qa", extra: { huId: "hu-1" },
      },
    })
    expect(ctx.addToast).toHaveBeenCalledWith({ type: "success", title: "T", desc: "D" })
    expect(ctx.addNotificacion).toHaveBeenCalledWith("caso_aprobado", "N", "desc", "qa", { huId: "hu-1" })
  })

  it("dispara api.call y loguea con clientWarn si rechaza", async () => {
    const { ctx } = makeCtx()
    const err = new Error("boom")
    const call = vi.fn().mockRejectedValue(err)

    runCommand(ctx, {
      api: { call, context: "Test", message: "mensaje" },
    })

    expect(call).toHaveBeenCalledTimes(1)
    // Esperamos a que el .catch se procese
    await new Promise(r => setTimeout(r, 0))
    // No rompe; el warn ya está testeado en client-logger
  })
})

describe("defineCommand", () => {
  it("envuelve un builder en un handler que corre runCommand", () => {
    const { ctx, getCasos } = makeCtx()
    const caso = { id: "c1", huId: "hu-1" } as CasoPrueba

    const handler = defineCommand(ctx, (c: CasoPrueba): CommandResult => ({
      casos: prev => [...prev, c],
    }))

    handler(caso)
    expect(getCasos()).toHaveLength(1)
  })

  it("abort con null no llama a ningún setter", () => {
    const { ctx } = makeCtx()
    const handler = defineCommand(ctx, (_id: string) => null)
    handler("x")
    expect(ctx.setCasos).not.toHaveBeenCalled()
    expect(ctx.setHistorias).not.toHaveBeenCalled()
    expect(ctx.addToast).not.toHaveBeenCalled()
  })

  it("preserva los args del builder", () => {
    const { ctx, getCasos } = makeCtx()
    const handler = defineCommand(ctx, (id: string, titulo: string): CommandResult => ({
      casos: prev => [...prev, { id, titulo } as CasoPrueba],
    }))

    handler("c1", "Hola")
    expect(getCasos()[0]!.id).toBe("c1")
    expect(getCasos()[0]!.titulo).toBe("Hola")
  })
})
