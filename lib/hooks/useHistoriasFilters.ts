"use client"

import { useReducer, useMemo } from "react"
import type { HistoriaUsuario, EstadoHU, PrioridadHU, TipoAplicacion } from "@/lib/types"

type SortCampo = "codigo" | "titulo" | "prioridad" | "estado" | "responsable" | "fecha"
type SortDir = "asc" | "desc"

const PRIORIDAD_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baja: 3 }
const ESTADO_ORDER:    Record<string, number> = { en_progreso: 0, sin_iniciar: 1, fallida: 2, exitosa: 3, cancelada: 4 }
const PAGE_SIZE = 20

export type { SortCampo, SortDir }

// ── Estado y acciones ────────────────────────────────────────

type FiltersState = {
  filtroEstado:      EstadoHU | "todos"
  filtroPrioridad:   PrioridadHU | "todos"
  filtroResponsable: string
  filtroTipo:        TipoAplicacion | "todos"
  filtroSprint:      string
  filtroAmbiente:    string
  filtroTipoPrueba:  string
  filtroFechaDesde:  string
  filtroFechaHasta:  string
  filtrosVisibles:   boolean
  sortCampo:         SortCampo
  sortDir:           SortDir
  pagina:            number
}

type FiltersAction =
  | { type: "SET_ESTADO";        value: EstadoHU | "todos" }
  | { type: "SET_PRIORIDAD";     value: PrioridadHU | "todos" }
  | { type: "SET_RESPONSABLE";   value: string }
  | { type: "SET_TIPO";          value: TipoAplicacion | "todos" }
  | { type: "SET_SPRINT";        value: string }
  | { type: "SET_AMBIENTE";      value: string }
  | { type: "SET_TIPO_PRUEBA";   value: string }
  | { type: "SET_FECHA_DESDE";   value: string }
  | { type: "SET_FECHA_HASTA";   value: string }
  | { type: "SET_VISIBLE";       value: boolean }
  | { type: "TOGGLE_SORT";       campo: SortCampo }
  | { type: "SET_PAGINA";        value: number }
  | { type: "RESET_FILTROS" }

const INITIAL: FiltersState = {
  filtroEstado:      "todos",
  filtroPrioridad:   "todos",
  filtroResponsable: "todos",
  filtroTipo:        "todos",
  filtroSprint:      "todos",
  filtroAmbiente:    "todos",
  filtroTipoPrueba:  "todos",
  filtroFechaDesde:  "",
  filtroFechaHasta:  "",
  filtrosVisibles:   false,
  sortCampo:         "codigo",
  sortDir:           "asc",
  pagina:            1,
}

function reducer(state: FiltersState, action: FiltersAction): FiltersState {
  switch (action.type) {
    case "SET_ESTADO":       return { ...state, filtroEstado:      action.value, pagina: 1 }
    case "SET_PRIORIDAD":    return { ...state, filtroPrioridad:   action.value, pagina: 1 }
    case "SET_RESPONSABLE":  return { ...state, filtroResponsable: action.value, pagina: 1 }
    case "SET_TIPO":         return { ...state, filtroTipo:        action.value, pagina: 1 }
    case "SET_SPRINT":       return { ...state, filtroSprint:      action.value, pagina: 1 }
    case "SET_AMBIENTE":     return { ...state, filtroAmbiente:    action.value, pagina: 1 }
    case "SET_TIPO_PRUEBA":  return { ...state, filtroTipoPrueba:  action.value, pagina: 1 }
    case "SET_FECHA_DESDE":  return { ...state, filtroFechaDesde:  action.value, pagina: 1 }
    case "SET_FECHA_HASTA":  return { ...state, filtroFechaHasta:  action.value, pagina: 1 }
    case "SET_VISIBLE":      return { ...state, filtrosVisibles:   action.value }
    case "TOGGLE_SORT":
      if (state.sortCampo === action.campo) {
        return { ...state, sortDir: state.sortDir === "asc" ? "desc" : "asc", pagina: 1 }
      }
      return { ...state, sortCampo: action.campo, sortDir: "asc", pagina: 1 }
    case "SET_PAGINA":       return { ...state, pagina: action.value }
    case "RESET_FILTROS":    return {
      ...state,
      filtroEstado:      "todos",
      filtroPrioridad:   "todos",
      filtroResponsable: "todos",
      filtroTipo:        "todos",
      filtroSprint:      "todos",
      filtroAmbiente:    "todos",
      filtroTipoPrueba:  "todos",
      filtroFechaDesde:  "",
      filtroFechaHasta:  "",
      pagina:            1,
      // filtrosVisibles, sortCampo y sortDir se preservan
    }
    default: return state
  }
}

// ── Hook público ─────────────────────────────────────────────

export function useHistoriasFilters(historias: HistoriaUsuario[]) {
  const [state, dispatch] = useReducer(reducer, INITIAL)
  const {
    filtroEstado, filtroPrioridad, filtroResponsable, filtroTipo,
    filtroSprint, filtroAmbiente, filtroTipoPrueba, filtroFechaDesde, filtroFechaHasta,
    filtrosVisibles, sortCampo, sortDir, pagina,
  } = state

  // ── Setters (API compatible con la versión anterior) ────────
  const setFiltroEstado      = (v: EstadoHU | "todos")       => dispatch({ type: "SET_ESTADO",      value: v })
  const setFiltroPrioridad   = (v: PrioridadHU | "todos")    => dispatch({ type: "SET_PRIORIDAD",   value: v })
  const setFiltroResponsable = (v: string)                   => dispatch({ type: "SET_RESPONSABLE", value: v })
  const setFiltroTipo        = (v: TipoAplicacion | "todos") => dispatch({ type: "SET_TIPO",        value: v })
  const setFiltroSprint      = (v: string)                   => dispatch({ type: "SET_SPRINT",      value: v })
  const setFiltroAmbiente    = (v: string)                   => dispatch({ type: "SET_AMBIENTE",    value: v })
  const setFiltroTipoPrueba  = (v: string)                   => dispatch({ type: "SET_TIPO_PRUEBA", value: v })
  const setFiltroFechaDesde  = (v: string)                   => dispatch({ type: "SET_FECHA_DESDE", value: v })
  const setFiltroFechaHasta  = (v: string)                   => dispatch({ type: "SET_FECHA_HASTA", value: v })
  const setFiltrosVisibles   = (v: boolean | ((prev: boolean) => boolean)) =>
    dispatch({ type: "SET_VISIBLE", value: typeof v === "function" ? v(state.filtrosVisibles) : v })
  const setPagina            = (v: number)                   => dispatch({ type: "SET_PAGINA",      value: v })
  const toggleSort           = (campo: SortCampo)            => dispatch({ type: "TOGGLE_SORT",     campo })
  const limpiarFiltros       = ()                            => dispatch({ type: "RESET_FILTROS" })

  // ── Valores únicos para selects ─────────────────────────────
  const responsables      = useMemo(() => [...new Set(historias.map(h => h.responsable))].sort(), [historias])
  const tiposApp          = useMemo(() => [...new Set(historias.map(h => h.tipoAplicacion))], [historias])
  const sprints           = useMemo(() => [...new Set(historias.map(h => h.sprint).filter(Boolean) as string[])].sort(), [historias])
  const ambientesUnicos   = useMemo(() => [...new Set(historias.map(h => h.ambiente))], [historias])
  const tiposPruebaUnicos = useMemo(() => [...new Set(historias.map(h => h.tipoPrueba).filter(Boolean))], [historias])

  // ── Aplicar filtros ─────────────────────────────────────────
  const historiasFiltradas = useMemo(() => historias.filter(hu => {
    if (filtroEstado      !== "todos" && hu.estado          !== filtroEstado)      return false
    if (filtroPrioridad   !== "todos" && hu.prioridad       !== filtroPrioridad)   return false
    if (filtroResponsable !== "todos" && hu.responsable     !== filtroResponsable) return false
    if (filtroTipo        !== "todos" && hu.tipoAplicacion  !== filtroTipo)        return false
    if (filtroSprint !== "todos") {
      const sprintBuscado = filtroSprint === "__sin_sprint__" ? "" : filtroSprint
      if ((hu.sprint ?? "") !== sprintBuscado) return false
    }
    if (filtroAmbiente    !== "todos" && hu.ambiente        !== filtroAmbiente)    return false
    if (filtroTipoPrueba  !== "todos" && hu.tipoPrueba      !== filtroTipoPrueba)  return false
    if (filtroFechaDesde) {
      const desde = new Date(filtroFechaDesde + "T00:00:00")
      if (hu.fechaCreacion < desde) return false
    }
    if (filtroFechaHasta) {
      const hasta = new Date(filtroFechaHasta + "T23:59:59")
      if (hu.fechaCreacion > hasta) return false
    }
    return true
  }), [historias, filtroEstado, filtroPrioridad, filtroResponsable, filtroTipo, filtroSprint, filtroAmbiente, filtroTipoPrueba, filtroFechaDesde, filtroFechaHasta])

  // ── Aplicar ordenamiento ────────────────────────────────────
  const historiasOrdenadas = useMemo(() => {
    const arr = [...historiasFiltradas]
    arr.sort((a, b) => {
      let cmp = 0
      switch (sortCampo) {
        case "codigo":      cmp = a.codigo.localeCompare(b.codigo); break
        case "titulo":      cmp = a.titulo.localeCompare(b.titulo); break
        case "prioridad":   cmp = PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad]; break
        case "estado":      cmp = ESTADO_ORDER[a.estado] - ESTADO_ORDER[b.estado]; break
        case "responsable": cmp = a.responsable.localeCompare(b.responsable); break
        case "fecha": {
          const fa = a.fechaFinEstimada?.getTime() ?? Infinity
          const fb = b.fechaFinEstimada?.getTime() ?? Infinity
          cmp = fa - fb; break
        }
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return arr
  }, [historiasFiltradas, sortCampo, sortDir])

  const husEnPagina = useMemo(
    () => historiasOrdenadas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [historiasOrdenadas, pagina]
  )

  const filtrosActivos = [filtroEstado, filtroPrioridad, filtroResponsable, filtroTipo, filtroSprint, filtroAmbiente, filtroTipoPrueba].filter(f => f !== "todos").length
    + (filtroFechaDesde ? 1 : 0) + (filtroFechaHasta ? 1 : 0)

  return {
    // State values
    filtroEstado,      setFiltroEstado,
    filtroPrioridad,   setFiltroPrioridad,
    filtroResponsable, setFiltroResponsable,
    filtroTipo,        setFiltroTipo,
    filtroSprint,      setFiltroSprint,
    filtroAmbiente,    setFiltroAmbiente,
    filtroTipoPrueba,  setFiltroTipoPrueba,
    filtroFechaDesde,  setFiltroFechaDesde,
    filtroFechaHasta,  setFiltroFechaHasta,
    filtrosVisibles,   setFiltrosVisibles,
    sortCampo, sortDir, toggleSort,
    pagina, setPagina,
    // Computed
    historiasFiltradas,
    historiasOrdenadas,
    husEnPagina,
    filtrosActivos,
    limpiarFiltros,
    // Unique values for selects
    responsables,
    tiposApp,
    sprints,
    ambientesUnicos,
    tiposPruebaUnicos,
    PAGE_SIZE,
  }
}
