import { describe, it, expect, vi } from "vitest"
import { createBloqueoHandlers } from "@/lib/hooks/domain/bloqueoHandlers"
import type { DomainCtx }        from "@/lib/hooks/domain/types"
import type { Tarea, HistoriaUsuario, Bloqueo } from "@/lib/types"

// ── Factories ────────────────────────────────────────────────

function makeBloqueo(resuelto = false): Bloqueo {
  return {
    id: `bl-${Math.random().toString(36).slice(2)}`,
    descripcion: "Descripción del bloqueo",
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
    estado: "bloqueada",
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
  initialTareas: Tarea[]      = [],
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
      id: "usr-admin",
      nombre: "Admin User",
      email: "admin@test.com",
      rol: "admin",
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
// handleResolverBloqueoTarea
// ════════════════════════════════════════════════════════════

describe("handleResolverBloqueoTarea", () => {
  it("marca el bloqueo como resuelto con nota y fechaResolucion", () => {
    const bl = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", bloqueos: [bl] })
    const { ctx, getTareas } = makeCtx([tarea])

    createBloqueoHandlers(ctx).handleResolverBloqueoTarea("t1", bl.id, "Se corrigió el entorno")

    const t = getTareas()[0]
    expect(t.bloqueos[0].resuelto).toBe(true)
    expect(t.bloqueos[0].notaResolucion).toBe("Se corrigió el entorno")
    expect(t.bloqueos[0].fechaResolucion).toBeInstanceOf(Date)
    expect(t.bloqueos[0].resueltoPor).toBe("Admin User")
  })

  it("cambia estado a en_progreso si no quedan bloqueos activos", () => {
    const bl = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", estado: "bloqueada", bloqueos: [bl] })
    const { ctx, getTareas } = makeCtx([tarea])

    createBloqueoHandlers(ctx).handleResolverBloqueoTarea("t1", bl.id, "Nota")

    expect(getTareas()[0].estado).toBe("en_progreso")
  })

  it("mantiene estado bloqueada si aún hay bloqueos activos", () => {
    const bl1 = makeBloqueo(false)
    const bl2 = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", estado: "bloqueada", bloqueos: [bl1, bl2] })
    const { ctx, getTareas } = makeCtx([tarea])

    createBloqueoHandlers(ctx).handleResolverBloqueoTarea("t1", bl1.id, "Nota parcial")

    expect(getTareas()[0].estado).toBe("bloqueada")
  })

  it("registra evento en el historial de la HU (sin setTimeout)", () => {
    const bl = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", huId: "hu-1", bloqueos: [bl] })
    const { ctx, getHistorias } = makeCtx([tarea])

    // El historial debe actualizarse síncronamente, sin setTimeout
    createBloqueoHandlers(ctx).handleResolverBloqueoTarea("t1", bl.id, "Resuelto")

    expect(getHistorias()[0].historial).toHaveLength(1)
    expect(getHistorias()[0].historial[0].tipo).toBe("bloqueo_resuelto")
  })

  it("no hace nada si la tarea no existe", () => {
    const tarea = makeTarea({ id: "t1", bloqueos: [makeBloqueo(false)] })
    const { ctx } = makeCtx([tarea])

    createBloqueoHandlers(ctx).handleResolverBloqueoTarea("id-inexistente", "bl-x", "Nota")

    expect(ctx.setTareas).not.toHaveBeenCalled()
    expect(ctx.setHistorias).not.toHaveBeenCalled()
  })

  it("no modifica bloqueos de otras tareas", () => {
    const bl1 = makeBloqueo(false)
    const bl2 = makeBloqueo(false)
    const t1 = makeTarea({ id: "t1", bloqueos: [bl1] })
    const t2 = makeTarea({ id: "t2", bloqueos: [bl2] })
    const { ctx, getTareas } = makeCtx([t1, t2])

    createBloqueoHandlers(ctx).handleResolverBloqueoTarea("t1", bl1.id, "Nota")

    expect(getTareas()[1].bloqueos[0].resuelto).toBe(false)
  })

  it("emite toast de success", () => {
    const bl = makeBloqueo(false)
    const tarea = makeTarea({ id: "t1", bloqueos: [bl] })
    const { ctx } = makeCtx([tarea])

    createBloqueoHandlers(ctx).handleResolverBloqueoTarea("t1", bl.id, "ok")

    expect(ctx.addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "Bloqueo resuelto" })
    )
  })
})
