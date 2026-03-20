"use client"

import { useState, useMemo, useEffect } from "react"
import type { HistoriaUsuario, EstadoHU, PrioridadHU, TipoAplicacion } from "@/lib/types"

type SortCampo = "codigo" | "titulo" | "prioridad" | "estado" | "responsable" | "fecha"
type SortDir = "asc" | "desc"

const PRIORIDAD_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baja: 3 }
const ESTADO_ORDER:    Record<string, number> = { en_progreso: 0, sin_iniciar: 1, fallida: 2, exitosa: 3, cancelada: 4 }
const PAGE_SIZE = 20

export type { SortCampo, SortDir }

export function useHistoriasFilters(historias: HistoriaUsuario[]) {
  // Estado de filtros
  const [filtroEstado,      setFiltroEstado]      = useState<EstadoHU | "todos">("todos")
  const [filtroPrioridad,   setFiltroPrioridad]   = useState<PrioridadHU | "todos">("todos")
  const [filtroResponsable, setFiltroResponsable] = useState<string>("todos")
  const [filtroTipo,        setFiltroTipo]        = useState<TipoAplicacion | "todos">("todos")
  const [filtroSprint,      setFiltroSprint]      = useState<string>("todos")
  const [filtroAmbiente,    setFiltroAmbiente]    = useState<string>("todos")
  const [filtroTipoPrueba,  setFiltroTipoPrueba]  = useState<string>("todos")
  const [filtroFechaDesde,  setFiltroFechaDesde]  = useState<string>("")
  const [filtroFechaHasta,  setFiltroFechaHasta]  = useState<string>("")
  const [filtrosVisibles,   setFiltrosVisibles]   = useState(false)

  // Estado de ordenamiento
  const [sortCampo, setSortCampo] = useState<SortCampo>("codigo")
  const [sortDir,   setSortDir]   = useState<SortDir>("asc")

  // Paginación
  const [pagina, setPagina] = useState(1)

  const toggleSort = (campo: SortCampo) => {
    if (sortCampo === campo) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortCampo(campo); setSortDir("asc") }
  }

  // Valores únicos para selects
  const responsables      = useMemo(() => [...new Set(historias.map(h => h.responsable))].sort(), [historias])
  const tiposApp          = useMemo(() => [...new Set(historias.map(h => h.tipoAplicacion))], [historias])
  const sprints           = useMemo(() => [...new Set(historias.map(h => h.sprint).filter(Boolean) as string[])].sort(), [historias])
  const ambientesUnicos   = useMemo(() => [...new Set(historias.map(h => h.ambiente))], [historias])
  const tiposPruebaUnicos = useMemo(() => [...new Set(historias.map(h => h.tipoPrueba).filter(Boolean))], [historias])

  // Aplicar filtros
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

  // Aplicar ordenamiento
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

  // Resetear página al cambiar filtros u ordenamiento
  useEffect(() => { setPagina(1) }, [filtroEstado, filtroPrioridad, filtroResponsable, filtroTipo, filtroSprint, filtroAmbiente, filtroTipoPrueba, filtroFechaDesde, filtroFechaHasta, sortCampo, sortDir])

  const husEnPagina = useMemo(
    () => historiasOrdenadas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [historiasOrdenadas, pagina]
  )

  const filtrosActivos = [filtroEstado, filtroPrioridad, filtroResponsable, filtroTipo, filtroSprint, filtroAmbiente, filtroTipoPrueba].filter(f => f !== "todos").length
    + (filtroFechaDesde ? 1 : 0) + (filtroFechaHasta ? 1 : 0)

  const limpiarFiltros = () => {
    setFiltroEstado("todos")
    setFiltroPrioridad("todos")
    setFiltroResponsable("todos")
    setFiltroTipo("todos")
    setFiltroSprint("todos")
    setFiltroAmbiente("todos")
    setFiltroTipoPrueba("todos")
    setFiltroFechaDesde("")
    setFiltroFechaHasta("")
  }

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
