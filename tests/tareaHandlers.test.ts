import { describe, it, expect, vi, beforeEach } from "vitest"
import { createTareaHandlers } from "@/lib/hooks/domain/tareaHandlers"
import type { DomainCtx }      from "@/lib/hooks/domain/types"
import type { Tarea, HistoriaUsuario, Bloqueo } from "@/lib/types"

// ── Factories ────────────────────────────────────────────────

function makeBloqueo(resuelto = false): Bloqueo {
  return {
    id: `bl-${Math.random().toString(36).slice(2)}`,
    descripcion: "Bloqueo de prueba",
    reportadoPor: "QA",
    fecha: new Date(),
    resuelto,
  }
}

function makeTarea(overrides: Partial<Tarea> = {}): Tarea {
  return {
    id: "tarea-1",
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

function makeHU(overrides: Partial<HistoriaUsuario> = {}): HistoriaUsuario {
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

// ── Context helper ────────────────────────────────────────────

function makeCtx(
  initialTareas: Tarea[],
  initialHistorias: HistoriaUsuario[] = [makeHU()],
) {
  let tareasState    = [...initialTareas]
  let historiasState = [...initialHistorias]

  const ctx: DomainCtx = {
    historias: initialHistorias,
    casos:     [],
    tareas:    initialTareas,
    setCasos:     vi.fn(),
    setHistorias: vi.fn((upd: (prev: HistoriaUsuario[]) => HistoriaUsuario[]) => {
      historiasState = upd(historiasState)
    }),
    setTareas: vi.fn((upd: (prev: Tarea[]) => Tarea[]) => {
      tareasState = upd(tareasState)
    }),
    user: {
      id: "usr-qa",
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
    getTareas:    () => tareasState,
    getHistorias: () => historiasState,
  }
}

// ════════════════════════════════════════════════════════════
// handleBloquearTarea
// ════════════════════════════════════════════════════════════

describe("handleBloquearTarea", () => {
  it("cambia estado de la tarea a bloqueada y añade el bloqueo", () => {
    const tarea = makeTarea({ id: "t1", estado: "en_progreso", bloqueos: [] })
    const { ctx, getTareas } = makeCtx([tarea])
    const bloqueo = makeBloqueo()

    createTareaHandlers(ctx).handleBloquearTarea("t1", bloqueo)

    const t = getTareas()[0]
    expect(t.estado).toBe("bloqueada")
    expect(t.bloqueos).toHaveLength(1)
    expect(t.bloqueos[0].id).toBe(bloqueo.id)
  })

  it("registra evento en el historial de la HU correspondiente (sin setTimeout)", () => {
    const tarea = makeTarea({ id: "t1", huId: "hu-1" })
    const { ctx, getHistorias } = makeCtx([tarea])
    const bloqueo = makeBloqueo()

    // Sin setTimeout: el historial debe actualizarse en la misma llamada síncrona
    createTareaHandlers(ctx).handleBloquearTarea("t1", bloqueo)

    expect(getHistorias()[0].historial).toHaveLength(1)
    expect(getHistorias()[0].historial[0].tipo).toBe("tarea_bloqueada")
  })

  it("no hace nada si la tarea no existe", () => {
    const tarea = makeTarea({ id: "t1" })
    const { ctx } = makeCtx([tarea])

    createTareaHandlers(ctx).handleBloquearTarea("id-inexistente", makeBloqueo())

    expect(ctx.setTareas).not.toHaveBeenCalled()
    expect(ctx.setHistorias).not.toHaveBeenCalled()
  })

  it("emite toast de warning", () => {
    const tarea = makeTarea({ id: "t1" })
    const { ctx } = makeCtx([tarea])

    createTareaHandlers(ctx).handleBloquearTarea("t1", makeBloqueo())

    expect(ctx.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "warning", title: "Tarea bloqueada" })
    )
  })

  it("no afecta otras tareas", () => {
    const t1 = makeTarea({ id: "t1", estado: "en_progreso" })
    const t2 = makeTarea({ id: "t2", estado: "en_progreso" })
    const { ctx, getTareas } = makeCtx([t1, t2])

    createTareaHandlers(ctx).handleBloquearTarea("t1", makeBloqueo())

    expect(getTareas()[1].estado).toBe("en_progreso")
  })
})

// ════════════════════════════════════════════════════════════
// handleDesbloquearTarea
// ════════════════════════════════════════════════════════════

describe("handleDesbloquearTarea", () => {
  it("marca el bloqueo como resuelto", () => {
    const bloqueo = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", estado: "bloqueada", bloqueos: [bloqueo] })
    const { ctx, getTareas } = makeCtx([tarea])

    createTareaHandlers(ctx).handleDesbloquearTarea("t1", bloqueo.id)

    const t = getTareas()[0]
    expect(t.bloqueos[0].resuelto).toBe(true)
    expect(t.bloqueos[0].fechaResolucion).toBeInstanceOf(Date)
  })

  it("cambia estado a en_progreso cuando no quedan bloqueos activos", () => {
    const bl = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", estado: "bloqueada", bloqueos: [bl] })
    const { ctx, getTareas } = makeCtx([tarea])

    createTareaHandlers(ctx).handleDesbloquearTarea("t1", bl.id)

    expect(getTareas()[0].estado).toBe("en_progreso")
  })

  it("mantiene estado bloqueada si aún quedan bloqueos activos", () => {
    const bl1 = makeBloqueo(false)
    const bl2 = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", estado: "bloqueada", bloqueos: [bl1, bl2] })
    const { ctx, getTareas } = makeCtx([tarea])

    createTareaHandlers(ctx).handleDesbloquearTarea("t1", bl1.id)

    expect(getTareas()[0].estado).toBe("bloqueada")
  })

  it("registra evento en historial de la HU (sin setTimeout)", () => {
    const bl = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", huId: "hu-1", estado: "bloqueada", bloqueos: [bl] })
    const { ctx, getHistorias } = makeCtx([tarea])

    // Sin setTimeout: el historial se actualiza síncronamente
    createTareaHandlers(ctx).handleDesbloquearTarea("t1", bl.id)

    expect(getHistorias()[0].historial).toHaveLength(1)
    expect(getHistorias()[0].historial[0].tipo).toBe("tarea_desbloqueada")
  })

  it("no hace nada si la tarea no existe", () => {
    const { ctx } = makeCtx([makeTarea({ id: "t1" })])

    createTareaHandlers(ctx).handleDesbloquearTarea("id-inexistente", "bl-x")

    expect(ctx.setTareas).not.toHaveBeenCalled()
    expect(ctx.setHistorias).not.toHaveBeenCalled()
  })

  it("emite toast de success", () => {
    const bl = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", estado: "bloqueada", bloqueos: [bl] })
    const { ctx } = makeCtx([tarea])

    createTareaHandlers(ctx).handleDesbloquearTarea("t1", bl.id)

    expect(ctx.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "Bloqueo resuelto" })
    )
  })
})
