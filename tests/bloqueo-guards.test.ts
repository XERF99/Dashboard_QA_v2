import { describe, it, expect, vi, beforeEach } from "vitest"
import { createCasoHandlers } from "@/lib/hooks/domain/casoHandlers"
import { createHUHandlers }   from "@/lib/hooks/domain/huHandlers"
import type { DomainCtx }     from "@/lib/hooks/domain/types"
import type { CasoPrueba, HistoriaUsuario, Tarea, Bloqueo } from "@/lib/types"

// ── Factories ────────────────────────────────────────────────

function makeBloqueo(resuelto = false): Bloqueo {
  return {
    id: `bl-${Math.random()}`,
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
    resultadosPorEtapa: [{ etapa: "test", estado: "en_ejecucion", resultado: "pendiente", intentos: [] }],
    fechaCreacion: new Date(),
    tareasIds: ["tarea-1"],
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
    responsable: "QA",
    prioridad: "media",
    estado: "en_progreso",
    puntos: 3,
    aplicacion: "App",
    tipoAplicacion: "web",
    requiriente: "Admin",
    areaSolicitante: "TI",
    fechaCreacion: new Date(),
    etapa: "test",
    ambiente: "qa",
    tipoPrueba: "funcional",
    casosIds: ["caso-1"],
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

const BASE_USER: DomainCtx["user"] = {
  id: "usr-qa",
  nombre: "QA User",
  email: "qa@test.com",
  rol: "qa",
  activo: true,
  fechaCreacion: new Date(),
  debeCambiarPassword: false,
}

function makeCtx(
  opts: {
    historias?: HistoriaUsuario[]
    casos?: CasoPrueba[]
    tareas?: Tarea[]
  } = {},
) {
  const historias = opts.historias ?? [makeHU()]
  const casos     = opts.casos     ?? [makeCaso()]
  const tareas    = opts.tareas    ?? [makeTarea()]

  const addToast = vi.fn()

  const ctx: DomainCtx = {
    historias,
    casos,
    tareas,
    setHistorias: vi.fn((upd) => { /* no-op in guards tests */ }),
    setCasos:     vi.fn((upd) => { /* no-op in guards tests */ }),
    setTareas:    vi.fn(),
    user: BASE_USER,
    configEtapas: { web: [{ id: "test", label: "Test", cls: "" }] },
    configResultados: [],
    addToast,
    addNotificacion: vi.fn(),
  }

  return { ctx, addToast }
}

// ════════════════════════════════════════════════════════════
// GUARD 1: handleCompletarCasoEtapa
//   tarea con bloqueo activo → no se puede completar el caso
// ════════════════════════════════════════════════════════════

describe("handleCompletarCasoEtapa — guardia de bloqueos de tareas", () => {
  it("bloquea la acción si hay una tarea con bloqueo activo en ese caso", () => {
    const tarea = makeTarea({ bloqueos: [makeBloqueo(false)] })
    const { ctx, addToast } = makeCtx({ tareas: [tarea] })
    const setCasos = ctx.setCasos as ReturnType<typeof vi.fn>

    createCasoHandlers(ctx).handleCompletarCasoEtapa("caso-1", "test", "exitoso")

    expect(setCasos).not.toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", title: "Caso bloqueado" })
    )
  })

  it("bloquea aunque la tarea esté en otro caso (no debería, pero confirma filtro por casoId)", () => {
    const tareaOtroCaso = makeTarea({ id: "tarea-2", casoPruebaId: "caso-otro", bloqueos: [makeBloqueo(false)] })
    const { ctx, addToast } = makeCtx({ tareas: [tareaOtroCaso] })
    const setCasos = ctx.setCasos as ReturnType<typeof vi.fn>

    createCasoHandlers(ctx).handleCompletarCasoEtapa("caso-1", "test", "exitoso")

    // La tarea no pertenece a caso-1, debe pasar
    expect(setCasos).toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error" }))
  })

  it("permite completar si el bloqueo de la tarea ya fue resuelto", () => {
    const tarea = makeTarea({ bloqueos: [makeBloqueo(true)] })
    const { ctx, addToast } = makeCtx({ tareas: [tarea] })
    const setCasos = ctx.setCasos as ReturnType<typeof vi.fn>

    createCasoHandlers(ctx).handleCompletarCasoEtapa("caso-1", "test", "exitoso")

    expect(setCasos).toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error" }))
  })

  it("permite completar si la tarea no tiene bloqueos", () => {
    const tarea = makeTarea({ bloqueos: [] })
    const { ctx, addToast } = makeCtx({ tareas: [tarea] })
    const setCasos = ctx.setCasos as ReturnType<typeof vi.fn>

    createCasoHandlers(ctx).handleCompletarCasoEtapa("caso-1", "test", "exitoso")

    expect(setCasos).toHaveBeenCalled()
    expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error" }))
  })

  it("bloquea con mensaje que indica la cantidad de tareas afectadas (plural)", () => {
    const tareas = [
      makeTarea({ id: "t1", bloqueos: [makeBloqueo(false)] }),
      makeTarea({ id: "t2", bloqueos: [makeBloqueo(false)] }),
    ]
    const { ctx, addToast } = makeCtx({ tareas })

    createCasoHandlers(ctx).handleCompletarCasoEtapa("caso-1", "test", "exitoso")

    const call = (addToast as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.desc).toContain("2 tareas")
  })

  it("bloquea con mensaje en singular cuando solo hay una tarea afectada", () => {
    const tarea = makeTarea({ bloqueos: [makeBloqueo(false)] })
    const { ctx, addToast } = makeCtx({ tareas: [tarea] })

    createCasoHandlers(ctx).handleCompletarCasoEtapa("caso-1", "test", "exitoso")

    const call = (addToast as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.desc).toMatch(/^Hay 1 tarea /)
  })
})

// ════════════════════════════════════════════════════════════
// GUARD 2: handleAvanzarEtapa
//   caso con bloqueo activo → no se puede avanzar/completar la HU
// ════════════════════════════════════════════════════════════

describe("handleAvanzarEtapa — guardia de bloqueos de casos", () => {
  it("bloquea el avance si un caso de la HU tiene bloqueo activo", () => {
    const caso = makeCaso({ bloqueos: [makeBloqueo(false)] })
    const { ctx, addToast } = makeCtx({ casos: [caso] })
    const setHistorias = ctx.setHistorias as ReturnType<typeof vi.fn>

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    expect(setHistorias).not.toHaveBeenCalled()
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", title: "HU bloqueada" })
    )
  })

  it("no afecta bloqueos de casos de otras HUs", () => {
    const casoOtraHU = makeCaso({ id: "caso-2", huId: "hu-otra", bloqueos: [makeBloqueo(false)] })
    const casoEstaHU = makeCaso({ id: "caso-1", huId: "hu-1",    bloqueos: [] })
    const { ctx, addToast } = makeCtx({ casos: [casoEstaHU, casoOtraHU] })

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    // debe avanzar (o fallar por otra razón, pero no por bloqueo)
    expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error", title: "HU bloqueada" }))
  })

  it("permite avanzar si el bloqueo del caso fue resuelto", () => {
    const caso = makeCaso({ bloqueos: [makeBloqueo(true)] })
    const { ctx, addToast } = makeCtx({ casos: [caso] })

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error", title: "HU bloqueada" }))
  })

  it("permite avanzar si ningún caso tiene bloqueos", () => {
    const caso = makeCaso({ bloqueos: [] })
    const { ctx, addToast } = makeCtx({ casos: [caso] })

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    expect(addToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error", title: "HU bloqueada" }))
  })

  it("bloquea con mensaje en plural cuando hay múltiples casos con bloqueos", () => {
    const casos = [
      makeCaso({ id: "c1", bloqueos: [makeBloqueo(false)] }),
      makeCaso({ id: "c2", bloqueos: [makeBloqueo(false)] }),
    ]
    const { ctx, addToast } = makeCtx({ casos })

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    const call = (addToast as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.desc).toContain("2 casos")
  })

  it("bloquea con mensaje en singular cuando solo hay un caso afectado", () => {
    const caso = makeCaso({ bloqueos: [makeBloqueo(false)] })
    const { ctx, addToast } = makeCtx({ casos: [caso] })

    createHUHandlers(ctx).handleAvanzarEtapa("hu-1")

    const call = (addToast as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.desc).toMatch(/^Hay 1 caso /)
  })
})
