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

// Usuarios con rol explícito (como llegan del workspace)
const ADMIN_USER  = { id: "usr-1", nombre: "Admin Principal", rol: "admin",   activo: true }
const QA_USER     = { id: "usr-2", nombre: "QA User",         rol: "qa",      activo: true }
const QA_USER_2   = { id: "usr-5", nombre: "QA Segundo",      rol: "qa",      activo: true }
const LEAD_USER   = { id: "usr-3", nombre: "Laura Lead",      rol: "qa_lead", activo: true }
const VIEWER_USER = { id: "usr-4", nombre: "Viewer",          rol: "viewer",  activo: true }

const ALL_USERS = [ADMIN_USER, QA_USER, QA_USER_2, LEAD_USER, VIEWER_USER]

// ── Tests de visibilidad por rol ─────────────────────────────

describe("useHistoriasVisibles — filtrado por rol", () => {
  const historias = [
    makeHU("hu-1", "Admin Principal"),
    makeHU("hu-2", "QA User"),
    makeHU("hu-3", "Laura Lead"),
    makeHU("hu-4", "QA Segundo"),
    makeHU("hu-5", "Viewer"),
  ]

  const baseOptions = {
    historias,
    casos: [] as CasoPrueba[],
    busqueda: "",
    isOwner: false,
    isAdmin: false,
    isQALead: false,
    verSoloPropios: false,
    user: ADMIN_USER,
    users: ALL_USERS,
  }

  it("owner ve todas las historias del workspace", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isOwner: true }),
    )
    expect(result.current.historiasVisibles).toHaveLength(5)
  })

  it("owner tiene filtroNombresCarga undefined (sin restricción)", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isOwner: true }),
    )
    expect(result.current.filtroNombresCarga).toBeUndefined()
  })

  it("admin ve todas las HUs del workspace", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isAdmin: true, user: ADMIN_USER }),
    )
    expect(result.current.historiasVisibles).toHaveLength(5)
  })

  it("admin tiene filtroNombresCarga undefined (ve toda la carga del workspace)", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isAdmin: true, user: ADMIN_USER }),
    )
    expect(result.current.filtroNombresCarga).toBeUndefined()
  })

  it("viewer ve todas las HUs del workspace", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, user: VIEWER_USER }),
    )
    expect(result.current.historiasVisibles).toHaveLength(5)
  })

  it("verSoloPropios (qa) solo ve sus propias HUs", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, verSoloPropios: true, user: QA_USER }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0]!.responsable).toBe("QA User")
  })

  it("qa lead ve sus propias HUs + las de todos los usuarios qa del workspace", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isQALead: true, user: LEAD_USER }),
    )
    const responsables = result.current.historiasVisibles.map(h => h.responsable)
    expect(responsables).toContain("Laura Lead")   // propio
    expect(responsables).toContain("QA User")      // qa del workspace
    expect(responsables).toContain("QA Segundo")   // qa del workspace
    expect(responsables).not.toContain("Admin Principal")
    expect(responsables).not.toContain("Viewer")
  })

  it("qa lead sin usuarios qa en workspace solo ve sus propias HUs", () => {
    const soloAdminYLead = [ADMIN_USER, LEAD_USER, VIEWER_USER]
    const { result } = renderHook(() =>
      useHistoriasVisibles({
        ...baseOptions,
        isQALead: true,
        user: LEAD_USER,
        users: soloAdminYLead,
      }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0]!.responsable).toBe("Laura Lead")
  })
})

// ── Tests de filtroNombresCarga ───────────────────────────────

describe("useHistoriasVisibles — filtroNombresCarga", () => {
  const baseOptions = {
    historias: [],
    casos: [] as CasoPrueba[],
    busqueda: "",
    isOwner: false,
    isAdmin: false,
    isQALead: false,
    verSoloPropios: false,
    user: LEAD_USER,
    users: ALL_USERS,
  }

  it("lead incluye su nombre + todos los qa activos", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isQALead: true }),
    )
    expect(result.current.filtroNombresCarga).toContain("Laura Lead")
    expect(result.current.filtroNombresCarga).toContain("QA User")
    expect(result.current.filtroNombresCarga).toContain("QA Segundo")
    expect(result.current.filtroNombresCarga).not.toContain("Admin Principal")
    expect(result.current.filtroNombresCarga).not.toContain("Viewer")
  })

  it("lead sin qa en workspace tiene filtroNombresCarga con solo su nombre", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({
        ...baseOptions,
        isQALead: true,
        users: [ADMIN_USER, LEAD_USER, VIEWER_USER],
      }),
    )
    expect(result.current.filtroNombresCarga).toEqual(["Laura Lead"])
  })

  it("qa (verSoloPropios) tiene filtroNombresCarga con solo su nombre", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({
        ...baseOptions,
        verSoloPropios: true,
        user: QA_USER,
      }),
    )
    expect(result.current.filtroNombresCarga).toEqual(["QA User"])
  })

  it("admin tiene filtroNombresCarga undefined", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, isAdmin: true, user: ADMIN_USER }),
    )
    expect(result.current.filtroNombresCarga).toBeUndefined()
  })

  it("viewer tiene filtroNombresCarga undefined", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, user: VIEWER_USER }),
    )
    expect(result.current.filtroNombresCarga).toBeUndefined()
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
    user: ADMIN_USER,
    users: [ADMIN_USER],
  }

  it("filtra por título (case-insensitive)", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, busqueda: "login" }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0]!.titulo).toBe("Login con Google")
  })

  it("filtra por código", () => {
    const { result } = renderHook(() =>
      useHistoriasVisibles({ ...baseOptions, busqueda: "HU-002" }),
    )
    expect(result.current.historiasVisibles).toHaveLength(1)
    expect(result.current.historiasVisibles[0]!.codigo).toBe("HU-002")
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
    expect(result.current.historiasVisibles[0]!.responsable).toBe("Juan Perez")
  })
})
