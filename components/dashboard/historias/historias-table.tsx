"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Edit, Trash2, Plus, BookOpen, AlertTriangle, Layers, Clock, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, LayoutList, LayoutGrid, FileSpreadsheet, ChevronDown, Upload, UserX } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG,
  getEtapaHUCfg, ETAPAS_PREDETERMINADAS, getTipoAplicacionLabel, getAmbienteLabel, getTipoPruebaLabel,
  type HistoriaUsuario, type CasoPrueba, type EstadoHU, type PrioridadHU, type TipoAplicacion,
  type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef, type TipoPruebaDef, type Sprint,
} from "@/lib/types"
import {
  exportarHUsCSV, exportarResultadosCSV,
  exportarHUsPDF, exportarResultadosPDF,
} from "@/lib/export-utils"
import { HistoriasKanban } from "./historias-kanban"
import { useHistoriasFilters, type SortCampo } from "@/lib/hooks/useHistoriasFilters"
import { SprintPanel } from "../shared/sprint-panel"
import { Paginador } from "@/components/ui/paginator"
import { useAuth } from "@/lib/contexts/auth-context"
import { isResponsableActivo } from "@/lib/utils/asignaciones"

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  onVerDetalle: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
  onNueva: () => void
  canEdit?: boolean
  configEtapas?: ConfigEtapas
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
  tiposPrueba?: TipoPruebaDef[]
  qaUsers?: string[]
  onBulkEliminar?: (ids: string[]) => void
  onBulkCambiarEstado?: (ids: string[], estado: EstadoHU) => void
  onBulkCambiarResponsable?: (ids: string[], responsable: string) => void
  onImportCSV?: () => void
  sprintEntidades?: Sprint[]
}

// ── Urgencia: días hasta fechaFinEstimada ─────────────────
function UrgenciaBadge({ fecha, estado }: { fecha?: Date; estado: string }) {
  if (!fecha || estado === "exitosa" || estado === "cancelada") return null
  const dias = Math.ceil((fecha.getTime() - Date.now()) / 86400000)
  if (dias > 14) return null // no mostrar si está muy lejos

  const vencida  = dias <= 0
  const critica  = dias > 0 && dias <= 3
  const alerta   = dias > 3 && dias <= 7

  const color = vencida ? "var(--chart-4)" : critica ? "var(--chart-4)" : alerta ? "var(--chart-3)" : "var(--chart-2)"
  const bg    = vencida ? "color-mix(in oklch,var(--chart-4) 12%,transparent)"
               : critica ? "color-mix(in oklch,var(--chart-4) 10%,transparent)"
               : alerta  ? "color-mix(in oklch,var(--chart-3) 10%,transparent)"
               :            "color-mix(in oklch,var(--chart-2) 10%,transparent)"
  const label = vencida ? "Vencida" : dias === 1 ? "Mañana" : `${dias}d`

  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:3,
      padding:"1px 6px", borderRadius:6, border:`1px solid ${color}`,
      background:bg, color, fontSize:9, fontWeight:700, flexShrink:0,
    }}>
      <Clock size={9} style={{ flexShrink:0 }}/>
      {label}
    </span>
  )
}

// ── Dropdown de acción masiva ─────────────────────────────
function BulkActionSelect({ label, options, onSelect }: {
  label: string
  options: { value: string; label: string }[]
  onSelect: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid color-mix(in oklch, var(--primary) 35%, transparent)", background:"color-mix(in oklch, var(--primary) 10%, transparent)", color:"var(--primary)" }}
      >
        {label} <ChevronDown size={10}/>
      </button>
      {open && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:40 }} onClick={() => setOpen(false)}/>
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:50, background:"var(--card)", border:"1px solid var(--border)", borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.12)", padding:4, minWidth:170 }}>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onSelect(opt.value); setOpen(false) }}
                style={{ display:"block", width:"100%", textAlign:"left", padding:"6px 10px", fontSize:12, border:"none", borderRadius:6, cursor:"pointer", background:"none", color:"var(--foreground)" }}
                className="hover:bg-secondary"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export function HistoriasTable({ historias, casos, onVerDetalle, onEditar, onEliminar, onNueva, canEdit=true, configEtapas = ETAPAS_PREDETERMINADAS, tiposAplicacion, ambientes, tiposPrueba, qaUsers, onBulkEliminar, onBulkCambiarEstado, onBulkCambiarResponsable, onImportCSV, sprintEntidades = [] }: Props) {
  const { users } = useAuth()

  // ── Vista activa ──
  const [vistaKanban, setVistaKanban] = useState(false)

  // ── Exportar dropdown ──
  const [exportOpen, setExportOpen] = useState(false)

  // ── Filtros, orden y paginación (hook) ──
  const {
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
    historiasFiltradas,
    historiasOrdenadas,
    husEnPagina,
    filtrosActivos,
    limpiarFiltros,
    responsables,
    tiposApp,
    sprints,
    ambientesUnicos,
    tiposPruebaUnicos,
    PAGE_SIZE,
  } = useHistoriasFilters(historias)

  // ── Selección masiva ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  // ── Selección: computed + handlers ──
  const allFilteredIds = historiasOrdenadas.map(h => h.id)
  const allSelected  = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id))
  const someSelected = allFilteredIds.some(id => selectedIds.has(id)) && !allSelected

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(allFilteredIds))

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  const clearSelection = () => setSelectedIds(new Set())

  const handleBulkEstado = (estado: string) => {
    onBulkCambiarEstado?.([...selectedIds], estado as EstadoHU)
    clearSelection()
  }
  const handleBulkResponsable = (r: string) => {
    onBulkCambiarResponsable?.([...selectedIds], r)
    clearSelection()
  }
  const handleBulkDelete = () => {
    onBulkEliminar?.([...selectedIds])
    clearSelection()
  }

  // ── Helper: icono de sort ──
  const SortIcon = ({ campo }: { campo: SortCampo }) => {
    if (sortCampo !== campo) return <ArrowUpDown size={10} style={{ opacity:0.35 }}/>
    return sortDir === "asc" ? <ArrowUp size={10}/> : <ArrowDown size={10}/>
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* ── Barra superior ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <p style={{ fontSize:13, color:"var(--muted-foreground)" }}>
            {historiasFiltradas.length} {historiasFiltradas.length===1?"historia":"historias"}
            {filtrosActivos > 0 && ` (de ${historias.length})`}
            {!vistaKanban && <>{" "}· clic en <strong>Ver</strong> para detalle</>}
          </p>
          <button
            onClick={() => setFiltrosVisibles(v => !v)}
            style={{
              display:"inline-flex", alignItems:"center", gap:4,
              padding:"3px 8px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
              border:"1px solid var(--border)", background: filtrosActivos > 0 ? "color-mix(in oklch,var(--primary) 12%,transparent)" : "var(--secondary)",
              color: filtrosActivos > 0 ? "var(--primary)" : "var(--muted-foreground)",
            }}
          >
            <Filter size={11}/>
            Filtros
            {filtrosActivos > 0 && (
              <span style={{ background:"var(--primary)", color:"var(--primary-foreground)", borderRadius:"50%", width:15, height:15, fontSize:9, fontWeight:700, display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                {filtrosActivos}
              </span>
            )}
          </button>
          {filtrosActivos > 0 && (
            <button onClick={limpiarFiltros} style={{ background:"none", border:"none", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:3, fontSize:11, color:"var(--muted-foreground)" }}>
              <X size={11}/> Limpiar
            </button>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {/* Toggle vista tabla / kanban */}
          <div style={{ display:"flex", borderRadius:7, border:"1px solid var(--border)", overflow:"hidden" }}>
            <button
              onClick={() => setVistaKanban(false)}
              title="Vista lista"
              style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                padding:"5px 9px", border:"none", cursor:"pointer",
                background: !vistaKanban ? "var(--primary)" : "var(--secondary)",
                color:       !vistaKanban ? "var(--primary-foreground)" : "var(--muted-foreground)",
                transition:"background 0.15s",
              }}
            ><LayoutList size={14}/></button>
            <button
              onClick={() => { setVistaKanban(true); clearSelection() }}
              title="Vista tablero"
              style={{
                display:"inline-flex", alignItems:"center", justifyContent:"center",
                padding:"5px 9px", border:"none", borderLeft:"1px solid var(--border)", cursor:"pointer",
                background: vistaKanban ? "var(--primary)" : "var(--secondary)",
                color:      vistaKanban ? "var(--primary-foreground)" : "var(--muted-foreground)",
                transition:"background 0.15s",
              }}
            ><LayoutGrid size={14}/></button>
          </div>
          {/* Exportar dropdown */}
          <div style={{ position:"relative" }}>
            <button
              onClick={() => setExportOpen(v => !v)}
              style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
                border:"1px solid var(--border)", background:"var(--secondary)",
                color:"var(--foreground)",
              }}
            >
              <FileSpreadsheet size={13}/> Exportar <ChevronDown size={11}/>
            </button>
            {exportOpen && (
              <>
                {/* overlay invisible para cerrar al hacer clic fuera */}
                <div
                  style={{ position:"fixed", inset:0, zIndex:40 }}
                  onClick={() => setExportOpen(false)}
                />
                <div style={{
                  position:"absolute", top:"calc(100% + 6px)", right:0, zIndex:50,
                  background:"var(--card)", border:"1px solid var(--border)", borderRadius:10,
                  boxShadow:"0 4px 20px rgba(0,0,0,0.12)", padding:"6px", minWidth:220,
                  display:"flex", flexDirection:"column", gap:2,
                }}>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted-foreground)", fontWeight:700, padding:"4px 8px 6px" }}>
                    Lista de HUs
                  </p>
                  <button onClick={() => { exportarHUsCSV(historiasFiltradas, casos, configEtapas, tiposAplicacion, ambientes); setExportOpen(false) }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, border:"none", cursor:"pointer", background:"none", color:"var(--foreground)", fontSize:12, textAlign:"left", width:"100%" }}
                    className="hover:bg-secondary">
                    <FileSpreadsheet size={13} style={{ color:"var(--chart-2)" }}/> Descargar CSV
                  </button>
                  <button onClick={() => { exportarHUsPDF(historiasFiltradas, casos, configEtapas, tiposAplicacion); setExportOpen(false) }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, border:"none", cursor:"pointer", background:"none", color:"var(--foreground)", fontSize:12, textAlign:"left", width:"100%" }}
                    className="hover:bg-secondary">
                    <FileSpreadsheet size={13} style={{ color:"var(--chart-4)" }}/> Exportar PDF
                  </button>
                  <div style={{ height:1, background:"var(--border)", margin:"4px 0" }}/>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted-foreground)", fontWeight:700, padding:"4px 8px 6px" }}>
                    Resultados de Prueba
                  </p>
                  <button onClick={() => { exportarResultadosCSV(historiasFiltradas, casos, configEtapas, tiposAplicacion); setExportOpen(false) }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, border:"none", cursor:"pointer", background:"none", color:"var(--foreground)", fontSize:12, textAlign:"left", width:"100%" }}
                    className="hover:bg-secondary">
                    <FileSpreadsheet size={13} style={{ color:"var(--chart-2)" }}/> Descargar CSV
                  </button>
                  <button onClick={() => { exportarResultadosPDF(historiasFiltradas, casos, configEtapas, tiposAplicacion); setExportOpen(false) }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, border:"none", cursor:"pointer", background:"none", color:"var(--foreground)", fontSize:12, textAlign:"left", width:"100%" }}
                    className="hover:bg-secondary">
                    <FileSpreadsheet size={13} style={{ color:"var(--chart-4)" }}/> Exportar PDF
                  </button>
                </div>
              </>
            )}
          </div>

          {canEdit && onImportCSV && (
            <button
              onClick={onImportCSV}
              title="Importar HUs desde CSV"
              style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
                border:"1px solid var(--border)", background:"var(--secondary)", color:"var(--foreground)",
              }}
            >
              <Upload size={13}/> <span className="hidden sm:inline">Importar</span>
            </button>
          )}
          {canEdit && (
            <Button onClick={onNueva} size="sm">
              <Plus size={13} className="mr-1.5" /> <span className="hidden sm:inline">Nueva HU</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── Selector de Sprint ── */}
      {sprints.length > 0 && (
        <SprintPanel
          historias={historias}
          sprints={sprints}
          sprintEntidades={sprintEntidades}
          filtroSprint={filtroSprint}
          onChangeSprint={setFiltroSprint}
        />
      )}

      {/* ── Barra de acciones masivas ── */}
      {selectedIds.size > 0 && !vistaKanban && (
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 12px", borderRadius:8, background:"color-mix(in oklch, var(--primary) 8%, transparent)", border:"1px solid color-mix(in oklch, var(--primary) 25%, transparent)", flexWrap:"wrap" }}>
          <span style={{ fontSize:12, fontWeight:700, color:"var(--primary)", flexShrink:0 }}>
            {selectedIds.size} seleccionada{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button
            onClick={clearSelection}
            title="Limpiar selección"
            style={{ background:"none", border:"none", cursor:"pointer", display:"inline-flex", alignItems:"center", color:"var(--primary)", padding:2 }}
          >
            <X size={13}/>
          </button>
          <div style={{ height:16, width:1, background:"color-mix(in oklch, var(--primary) 30%, transparent)", flexShrink:0 }}/>
          <BulkActionSelect
            label="Cambiar estado"
            options={[
              { value:"sin_iniciar", label:"Sin iniciar" },
              { value:"en_progreso", label:"En progreso" },
              { value:"exitosa",     label:"Exitosa" },
              { value:"fallida",     label:"Fallida" },
              { value:"cancelada",   label:"Cancelada" },
            ]}
            onSelect={handleBulkEstado}
          />
          <BulkActionSelect
            label="Cambiar responsable"
            options={(qaUsers ?? responsables).map(r => ({ value: r, label: r }))}
            onSelect={handleBulkResponsable}
          />
          {canEdit && (
            <button
              onClick={handleBulkDelete}
              style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid color-mix(in oklch, var(--destructive) 35%, transparent)", background:"color-mix(in oklch, var(--destructive) 10%, transparent)", color:"var(--destructive)", marginLeft:"auto" }}
            >
              <Trash2 size={12}/> Eliminar seleccionadas
            </button>
          )}
        </div>
      )}

      {/* ── Panel de filtros ── */}
      {filtrosVisibles && (
        <HUFiltersPanel
          filtroEstado={filtroEstado}            setFiltroEstado={setFiltroEstado}
          filtroPrioridad={filtroPrioridad}      setFiltroPrioridad={setFiltroPrioridad}
          filtroResponsable={filtroResponsable}  setFiltroResponsable={setFiltroResponsable}
          filtroTipo={filtroTipo}                setFiltroTipo={setFiltroTipo}
          filtroSprint={filtroSprint}            setFiltroSprint={setFiltroSprint}
          filtroAmbiente={filtroAmbiente}        setFiltroAmbiente={setFiltroAmbiente}
          filtroTipoPrueba={filtroTipoPrueba}    setFiltroTipoPrueba={setFiltroTipoPrueba}
          filtroFechaDesde={filtroFechaDesde}    setFiltroFechaDesde={setFiltroFechaDesde}
          filtroFechaHasta={filtroFechaHasta}    setFiltroFechaHasta={setFiltroFechaHasta}
          responsables={responsables}
          tiposApp={tiposApp}
          sprints={sprints}
          ambientesUnicos={ambientesUnicos}
          tiposPruebaUnicos={tiposPruebaUnicos}
          tiposAplicacion={tiposAplicacion}
          ambientes={ambientes}
          tiposPrueba={tiposPrueba}
        />
      )}

      {/* ── TABLERO KANBAN ── */}
      {vistaKanban && (
        <HistoriasKanban
          historias={historiasFiltradas}
          casos={casos}
          configEtapas={configEtapas}
          tiposAplicacion={tiposAplicacion}
          ambientes={ambientes}
          canEdit={canEdit}
          onVerDetalle={onVerDetalle}
          onEditar={onEditar}
          onEliminar={onEliminar}
          onMoverHU={onBulkCambiarEstado ? (huId, estado) => onBulkCambiarEstado([huId], estado) : undefined}
        />
      )}

      {/* ── VISTA LISTA ── */}
      {!vistaKanban && <>

      {/* ── Cabecera de ordenamiento ── */}
      <div className="overflow-x-auto -mx-1 px-1">
      <div>
      {historiasOrdenadas.length > 0 && (
        <div role="row" aria-label="Cabecera de la tabla de historias" style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"5px 16px", borderRadius:8,
          background:"var(--secondary)", border:"1px solid var(--border)",
        }}>
          {/* Select-all checkbox */}
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            title={allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
            style={{ width:14, height:14, cursor:"pointer", accentColor:"var(--primary)", flexShrink:0 }}
          />
          <button onClick={() => toggleSort("codigo")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="codigo" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0, minWidth:54, padding:0 }}>
            Código <SortIcon campo="codigo"/>
          </button>
          <button onClick={() => toggleSort("titulo")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="titulo" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", flex:1, padding:0 }}>
            Título <SortIcon campo="titulo"/>
          </button>
          <button onClick={() => toggleSort("prioridad")} className="hidden sm:inline-flex items-center gap-0.5 shrink-0" style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="prioridad" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", padding:0 }}>
            Prioridad <SortIcon campo="prioridad"/>
          </button>
          <button onClick={() => toggleSort("estado")} className="hidden sm:inline-flex items-center gap-0.5 shrink-0" style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="estado" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", padding:0 }}>
            Estado <SortIcon campo="estado"/>
          </button>
          <button onClick={() => toggleSort("fecha")} className="hidden sm:inline-flex items-center gap-0.5 shrink-0" style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="fecha" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", padding:0 }}>
            Fecha <SortIcon campo="fecha"/>
          </button>
          <button onClick={() => toggleSort("responsable")} className="hidden sm:inline-flex items-center gap-0.5 shrink-0" style={{ background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="responsable" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", minWidth:90, padding:0 }}>
            Responsable <SortIcon campo="responsable"/>
          </button>
          {/* Espacio para acciones */}
          <div style={{ flexShrink:0, width: canEdit ? 106 : 58 }}/>
        </div>
      )}

      {/* ── Lista vacía ── */}
      {historias.length === 0 && (
        <div style={{ textAlign:"center", padding:"48px", color:"var(--muted-foreground)" }}>
          <BookOpen size={32} style={{ margin:"0 auto 12px", opacity:0.4 }} />
          <p style={{ fontSize:14 }}>Sin historias de usuario. {canEdit && "Crea una con el botón Nueva HU."}</p>
        </div>
      )}

      {historias.length > 0 && historiasFiltradas.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px", color:"var(--muted-foreground)", border:"1px dashed var(--border)", borderRadius:10 }}>
          <Filter size={24} style={{ margin:"0 auto 10px", opacity:0.35 }} />
          <p style={{ fontSize:13 }}>Ninguna HU coincide con los filtros aplicados.</p>
          <button onClick={limpiarFiltros} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--primary)", marginTop:6, fontWeight:600 }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {/* ── Filas ── */}
      <div role="table" aria-label="Historias de usuario">
      {husEnPagina.map(hu => {
        const estCfg  = ESTADO_HU_CFG[hu.estado]
        const priCfg  = PRIORIDAD_CFG[hu.prioridad]
        const etaCfg  = getEtapaHUCfg(hu.etapa, configEtapas)
        const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
        const tieneBloqueos = hu.bloqueos.some(b => !b.resuelto)

        const casosAprobados   = casosHU.filter(c => c.estadoAprobacion === "aprobado")
        const casosCompletados = casosAprobados.filter(c =>
          c.resultadosPorEtapa.length > 0 && c.resultadosPorEtapa.every(r => r.estado === "completado")
        )
        const pct = casosAprobados.length > 0 ? Math.round((casosCompletados.length / casosAprobados.length) * 100) : 0

        return (
          <div key={hu.id} role="row" aria-label={`${hu.codigo} — ${hu.titulo}`} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"13px 16px", borderRadius:12,
            border: selectedIds.has(hu.id)
              ? "1px solid color-mix(in oklch, var(--primary) 40%, var(--border))"
              : tieneBloqueos
                ? "1px solid color-mix(in oklch, var(--chart-4) 40%, var(--border))"
                : "1px solid var(--border)",
            background: selectedIds.has(hu.id)
              ? "color-mix(in oklch, var(--primary) 4%, var(--card))"
              : "var(--card)",
            transition:"background 0.15s, border-color 0.15s",
          }} className="hover:bg-secondary/30">

            {/* Checkbox selección */}
            <input
              type="checkbox"
              checked={selectedIds.has(hu.id)}
              onChange={() => toggleSelect(hu.id)}
              onClick={e => e.stopPropagation()}
              style={{ width:14, height:14, cursor:"pointer", accentColor:"var(--primary)", flexShrink:0 }}
            />

            {/* Código */}
            <p style={{ fontSize:12, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, flexShrink:0, minWidth:54 }}>
              {hu.codigo}
            </p>

            {/* Título + tipo aplicación + ambiente */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <p style={{ fontSize:14, fontWeight:600, color:"var(--foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {hu.titulo}
                </p>
                {tieneBloqueos && <span title="Bloqueos activos"><AlertTriangle size={13} style={{ color:"var(--chart-4)", flexShrink:0 }} /></span>}
              </div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap", alignItems:"center" }}>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                  {getTipoAplicacionLabel(hu.tipoAplicacion, tiposAplicacion)}
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                  {getAmbienteLabel(hu.ambiente, ambientes)}
                </Badge>
                {hu.sprint && (
                  <Badge variant="outline" style={{ padding:"1px 5px", fontSize:9, background:"color-mix(in oklch,var(--primary) 8%,transparent)", color:"var(--primary)", borderColor:"color-mix(in oklch,var(--primary) 25%,transparent)" }}>
                    {hu.sprint}
                  </Badge>
                )}
                {/* Indicador de urgencia */}
                <UrgenciaBadge fecha={hu.fechaFinEstimada} estado={hu.estado} />
              </div>
            </div>

            {/* Meta: casos, etapa, prioridad, estado + progreso */}
            <div className="hidden sm:flex items-center flex-wrap shrink-0" style={{ gap:6 }}>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--muted-foreground)" }}>
                <Layers size={11} /> {casosHU.length} caso{casosHU.length!==1?"s":""}
              </span>
              {casosAprobados.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                  <Progress value={pct} className="h-1.5 w-16"/>
                  <span style={{ fontSize:10, color:"var(--muted-foreground)", fontFamily:"monospace" }}>{pct}%</span>
                </div>
              )}
              <Badge variant="outline" className={`${etaCfg.cls} text-[10px]`}>{etaCfg.label}</Badge>
              <Badge variant="outline" className={`${priCfg.cls} text-[10px]`}>{priCfg.label}</Badge>
              <Badge variant="outline" className={`${estCfg.cls} text-[10px]`}>{estCfg.label}</Badge>
            </div>

            {/* Responsable */}
            <div className="hidden sm:block shrink-0" style={{ minWidth:90, overflow:"hidden" }}>
              <p style={{ fontSize:12, color:"var(--muted-foreground)", textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden", display:"flex", alignItems:"center", gap:4 }}>
                {hu.responsable}
                {!isResponsableActivo(hu.responsable, users) && (
                  <UserX size={11} style={{ color:"var(--chart-4)", flexShrink:0 }} aria-label="Responsable sin workspace activo" />
                )}
              </p>
            </div>

            {/* Acciones */}
            <div style={{ display:"flex", gap:3, flexShrink:0 }}>
              <Button variant="ghost" size="sm" onClick={() => onVerDetalle(hu)}>
                <Eye size={13} className="mr-1" /> Ver
              </Button>
              {canEdit && <>
                <Button variant="ghost" size="sm" onClick={() => onEditar(hu)} title="Editar">
                  <Edit size={13} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEliminar(hu)}
                  title="Eliminar" style={{ color:"var(--chart-4)" }}>
                  <Trash2 size={13} />
                </Button>
              </>}
            </div>
          </div>
        )
      })}
      </div>

      </div>
      </div>
      <Paginador pagina={pagina} total={historiasOrdenadas.length} pageSize={PAGE_SIZE} onCambiar={setPagina} />
      </>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════

interface HUFiltersPanelProps {
  filtroEstado: EstadoHU | "todos";           setFiltroEstado: (v: EstadoHU | "todos") => void
  filtroPrioridad: PrioridadHU | "todos";     setFiltroPrioridad: (v: PrioridadHU | "todos") => void
  filtroResponsable: string;                  setFiltroResponsable: (v: string) => void
  filtroTipo: TipoAplicacion | "todos";       setFiltroTipo: (v: TipoAplicacion | "todos") => void
  filtroSprint: string;                       setFiltroSprint: (v: string) => void
  filtroAmbiente: string;                     setFiltroAmbiente: (v: string) => void
  filtroTipoPrueba: string;                   setFiltroTipoPrueba: (v: string) => void
  filtroFechaDesde: string;                   setFiltroFechaDesde: (v: string) => void
  filtroFechaHasta: string;                   setFiltroFechaHasta: (v: string) => void
  responsables: string[]
  tiposApp: TipoAplicacion[]
  sprints: string[]
  ambientesUnicos: string[]
  tiposPruebaUnicos: string[]
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
  tiposPrueba?: TipoPruebaDef[]
}

function HUFiltersPanel({
  filtroEstado, setFiltroEstado, filtroPrioridad, setFiltroPrioridad,
  filtroResponsable, setFiltroResponsable, filtroTipo, setFiltroTipo,
  filtroSprint, setFiltroSprint, filtroAmbiente, setFiltroAmbiente,
  filtroTipoPrueba, setFiltroTipoPrueba, filtroFechaDesde, setFiltroFechaDesde,
  filtroFechaHasta, setFiltroFechaHasta,
  responsables, tiposApp, sprints, ambientesUnicos, tiposPruebaUnicos,
  tiposAplicacion, ambientes, tiposPrueba,
}: HUFiltersPanelProps) {
  return (
    <div style={{
      display:"flex", gap:8, flexWrap:"wrap", alignItems:"center",
      padding:"10px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--card)",
    }}>
      <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, color:"var(--muted-foreground)", flexShrink:0 }}>
        Filtrar por
      </span>

      <Select value={filtroEstado} onValueChange={v => setFiltroEstado(v as EstadoHU | "todos")}>
        <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="Estado" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos los estados</SelectItem>
          <SelectItem value="sin_iniciar">Sin Iniciar</SelectItem>
          <SelectItem value="en_progreso">En Progreso</SelectItem>
          <SelectItem value="exitosa">Exitosa</SelectItem>
          <SelectItem value="fallida">Fallida</SelectItem>
          <SelectItem value="cancelada">Cancelada</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filtroPrioridad} onValueChange={v => setFiltroPrioridad(v as PrioridadHU | "todos")}>
        <SelectTrigger className="h-7 text-xs w-32"><SelectValue placeholder="Prioridad" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas las prioridades</SelectItem>
          <SelectItem value="critica">Crítica</SelectItem>
          <SelectItem value="alta">Alta</SelectItem>
          <SelectItem value="media">Media</SelectItem>
          <SelectItem value="baja">Baja</SelectItem>
        </SelectContent>
      </Select>

      {responsables.length > 1 && (
        <Select value={filtroResponsable} onValueChange={setFiltroResponsable}>
          <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Responsable" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los responsables</SelectItem>
            {responsables.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {tiposApp.length > 1 && (
        <Select value={filtroTipo} onValueChange={v => setFiltroTipo(v as TipoAplicacion | "todos")}>
          <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Tipo de app" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposApp.map(t => <SelectItem key={t} value={t}>{getTipoAplicacionLabel(t, tiposAplicacion)}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {sprints.length > 0 && (
        <Select value={filtroSprint} onValueChange={setFiltroSprint}>
          <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="Sprint" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los sprints</SelectItem>
            <SelectItem value="__sin_sprint__">Sin sprint</SelectItem>
            {sprints.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      {ambientesUnicos.length > 1 && (
        <Select value={filtroAmbiente} onValueChange={setFiltroAmbiente}>
          <SelectTrigger className="h-7 text-xs w-36"><SelectValue placeholder="Ambiente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los ambientes</SelectItem>
            {ambientesUnicos.map(a => (
              <SelectItem key={a} value={a}>{getAmbienteLabel(a, ambientes)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {tiposPruebaUnicos.length > 1 && (
        <Select value={filtroTipoPrueba} onValueChange={setFiltroTipoPrueba}>
          <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Tipo de prueba" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {tiposPruebaUnicos.map(t => (
              <SelectItem key={t} value={t}>{getTipoPruebaLabel(t, tiposPrueba)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:4 }}>
        <span style={{ fontSize:10, color:"var(--muted-foreground)", flexShrink:0 }}>Creación</span>
        <input type="date" value={filtroFechaDesde} onChange={e => setFiltroFechaDesde(e.target.value)} title="Desde"
          style={{ height:28, fontSize:11, padding:"0 6px", borderRadius:6, border:"1px solid var(--border)", background:"var(--card)", color:"var(--foreground)", cursor:"pointer", outline:"none" }} />
        <span style={{ fontSize:10, color:"var(--muted-foreground)" }}>–</span>
        <input type="date" value={filtroFechaHasta} onChange={e => setFiltroFechaHasta(e.target.value)} title="Hasta"
          style={{ height:28, fontSize:11, padding:"0 6px", borderRadius:6, border:"1px solid var(--border)", background:"var(--card)", color:"var(--foreground)", cursor:"pointer", outline:"none" }} />
      </div>
    </div>
  )
}
