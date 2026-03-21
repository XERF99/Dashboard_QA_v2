import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useHistoriasVisibles } from "@/lib/hooks/useHistoriasVisibles"
import type { HistoriaUsuario, CasoPrueba } from "@/lib/types"

// ── Factories ────────────────────────────────────────────────

function makeHU(id: string, responsable: string, overrides: Partial<HistoriaUsuario> = {}): HistoriaUsuario {
  return {
    id,
    codigo: `HU-${id}`,
    titulo: `HU ${id}`,
    descripcion: "",
    criteriosAceptacion: "",
    responsable,
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

const BASE_USER = { id: "usr-1", nombre: "Admin Principal", activo: true }
const QA_USER = { id: "usr-2", nombre: "QA User", activo: true }
const LEAD_USER = { id: "usr-3", nombre: "Laura Lead", activo: true }

// ── Tests de visibilidad por rol ─────────────────────────────

describe("useHistoriasVisibles — filtrado por rol", () => {
  const historias = [
    makeHU("hu-1", "Admin Principal"),
    makeHU("hu-2", "QA User"),
    makeHU("hu-3", "Laura Lead"),
    makeHU("hu-4", "Otro miembro"),
  ]

  const baseOptions = {
    historias,
    casos: [] as CasoPrueba[],
    busqueda: "",
    isOwner: false,
    isAdmin: false,
    isQALead: false,
    verSoloPropios: false,
    user: BASE_USER,
    users: [BASE_USER, QA_USER, LEAD_USER, { id: "usr-4", nombre: "Otro miembro", activo: true }],
  }

  it("owner ve todas las historias", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isOwner: true }),
    )
    expect(result.current.historiasVisibles).toHaveLength(4)
  })

  it("owner tiene filtroNombresCarga undefined (sin restricción)", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isOwner: true }),
    )
    expect(result.current.filtroNombresCarga).toBeUndefined()
  })

  it("verSoloPropios solo ve sus propias HUs", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, verSoloPropios: true, user: QA_USER }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0].responsable).toBe("QA User")
  })

  it("admin sin equipo solo ve sus propias HUs", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({
        ...baseOptions,
        isAdmin: true,
        user: { ...BASE_USER, equipoIds: [] },
      }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0].responsable).toBe("Admin Principal")
  })

  it("admin con equipo ve sus propias HUs y las del equipo", () => {
    const adminConEquipo = { ...BASE_USER, equipoIds: ["usr-2", "usr-3"] } // QA User + Laura Lead

    const { result } = renderHook(() =>
      useHistoriasVisibles({
        ...baseOptions,
        isAdmin: true,
        user: adminConEquipo,
      }),
    )
    const responsables = result.current.historiasVisibles.map(h => h.responsable)
    expect(responsables).toContain("Admin Principal")
    expect(responsables).toContain("QA User")
    expect(responsables).toContain("Laura Lead")
    expect(responsables).not.toContain("Otro miembro")
  })

  it("qa lead sin equipo ve todas las historias (sin restricción hasta asignar equipo)", () => {
    // A diferencia del Admin, un QA Lead sin equipoIds no tiene scope restringido:
    // la lógica del hook solo filtra cuando equipoIds.length > 0.
    const { result } = renderHook(() =>
      useHistoriasVisibles({
        ...baseOptions,
        isQALead: true,
        user: { ...LEAD_USER, equipoIds: [] },
      }),
    )
    expect(result.current.historiasVisibles).toHaveLength(historias.length)
  })

  it("qa lead con equipo ve al equipo + sí mismo", () => {
    const lead = { ...LEAD_USER, equipoIds: ["usr-2"] } // QA User

    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isQALead: true, user: lead }),
    )
    const responsables = result.current.historiasVisibles.map(h => h.responsable)
    expect(responsables).toContain("Laura Lead")
    expect(responsables).toContain("QA User")
    expect(responsables).not.toContain("Admin Principal")
  })
})

// ── Tests de filtroNombresCarga ───────────────────────────────

describe("useHistoriasVisibles — filtroNombresCarga", () => {
  const users = [
    BASE_USER,
    QA_USER,
    { id: "usr-5", nombre: "Miembro", activo: true },
  ]

  it("admin sin equipo solo incluye su nombre", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({
        historias: [],
        casos: [],
        busqueda: "",
        isOwner: false,
        isAdmin: true,
        isQALead: false,
        verSoloPropios: false,
        user: { ...BASE_USER, equipoIds: [] },
        users,
      }),
    )
    expect(result.current.filtroNombresCarga).toEqual(["Admin Principal"])
  })

  it("admin con equipo incluye nombre propio + miembros activos", () => {
    const adminConEquipo = { ...BASE_USER, equipoIds: ["usr-2", "usr-5"] }

    const { result } = renderHook(() =>
      useHistoriasVisibles({
        historias: [],
        casos: [],
        busqueda: "",
        isOwner: false,
        isAdmin: true,
        isQALead: false,
        verSoloPropios: false,
        user: adminConEquipo,
        users,
      }),
    )
    expect(result.current.filtroNombresCarga).toContain("Admin Principal")
    expect(result.current.filtroNombresCarga).toContain("QA User")
    expect(result.current.filtroNombresCarga).toContain("Miembro")
  })
})

// ── Tests de búsqueda ────────────────────────────────────────

describe("useHistoriasVisibles — búsqueda", () => {
  const historias = [
    makeHU("hu-1", "Admin", { titulo: "Login con Google", codigo: "HU-001" }),
    makeHU("hu-2", "Admin", { titulo: "Registro de usuarios", codigo: "HU-002" }),
    makeHU("hu-3", "Admin", { titulo: "Reset de contraseña", codigo: "HU-003" }),
  ]

  const baseOptions = {
    historias,
    casos: [] as CasoPrueba[],
    isOwner: true,
    isAdmin: false,
    isQALead: false,
    verSoloPropios: false,
    user: BASE_USER,
    users: [BASE_USER],
  }

  it("filtra por título (case-insensitive)", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, busqueda: "login" }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0].titulo).toBe("Login con Google")
  })

  it("filtra por código", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, busqueda: "HU-002" }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0].codigo).toBe("HU-002")
  })

  it("sin búsqueda devuelve todas", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, busqueda: "" }),
    )
    expect(result.current.historiasVisibles).toHaveLength(3)
  })

  it("búsqueda sin resultados devuelve lista vacía", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, busqueda: "xxxxxx" }),
    )
    expect(result.current.historiasVisibles).toHaveLength(0)
  })

  it("filtra por responsable", () => {
    const historiasMixed = [
      makeHU("hu-a", "Juan Perez"),
      makeHU("hu-b", "Ana Lopez"),
    ]
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, historias: historiasMixed, busqueda: "Juan" }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0].responsable).toBe("Juan Perez")
  })
})
