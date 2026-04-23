"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, Plus, BookOpen, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, LayoutList, LayoutGrid, FileSpreadsheet, ChevronDown, Upload } from "lucide-react"
import {
  ETAPAS_PREDETERMINADAS,
  type HistoriaUsuario, type CasoPrueba, type EstadoHU,
  type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef, type TipoPruebaDef, type Sprint,
} from "@/lib/types"
import {
  exportarHUsCSV, exportarResultadosCSV,
  exportarHUsPDF, exportarResultadosPDF,
} from "@/lib/export-utils"
// v2.76 — HistoriasKanban usa @dnd-kit (≈60 KB). Se carga sólo cuando
// el usuario activa la vista Kanban, evitando meterlo al bundle inicial.
const HistoriasKanban = dynamic(
  () => import("./historias-kanban").then(m => ({ default: m.HistoriasKanban })),
  { ssr: false, loading: () => <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "var(--muted-foreground)" }}>Cargando vista Kanban…</div> }
)
import { useHistoriasFilters, type SortCampo } from "@/lib/hooks/useHistoriasFilters"
import { SprintPanel } from "../shared/sprint-panel"
import { Paginador } from "@/components/ui/paginator"
import { useAuth } from "@/lib/contexts/auth-context"
import { BulkActionSelect } from "./historias-bulk-action-select"
import { HistoriasFiltersPanel } from "./historias-filters-panel"
import { HistoriasRow } from "./historias-row"

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

export function HistoriasTable({ historias, casos, onVerDetalle, onEditar, onEliminar, onNueva, canEdit=true, configEtapas = ETAPAS_PREDETERMINADAS, tiposAplicacion, ambientes, tiposPrueba, qaUsers, onBulkEliminar, onBulkCambiarEstado, onBulkCambiarResponsable, onImportCSV, sprintEntidades = [] }: Props) {
  const { users } = useAuth()

  const [vistaKanban, setVistaKanban] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)

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

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectAllRef = useRef<HTMLInputElement>(null)

  const allFilteredIds = historiasOrdenadas.map(h => h.id)
  const allSelected  = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedIds.has(id))
  const someSelected = allFilteredIds.some(id => selectedIds.has(id)) && !allSelected

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected
  }, [someSelected])

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(allFilteredIds))

  const toggleSelect = useCallback((id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    }), [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

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
        <HistoriasFiltersPanel
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

      <div className="overflow-x-auto -mx-1 px-1">
      <div>
      {historiasOrdenadas.length > 0 && (
        <div role="row" aria-label="Cabecera de la tabla de historias" style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"5px 16px", borderRadius:8,
          background:"var(--secondary)", border:"1px solid var(--border)",
        }}>
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
          <div style={{ flexShrink:0, width: canEdit ? 106 : 58 }}/>
        </div>
      )}

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

      <div role="table" aria-label="Historias de usuario">
      {husEnPagina.map(hu => (
        <HistoriasRow
          key={hu.id}
          hu={hu}
          casos={casos}
          selected={selectedIds.has(hu.id)}
          canEdit={canEdit}
          configEtapas={configEtapas}
          tiposAplicacion={tiposAplicacion}
          ambientes={ambientes}
          users={users}
          onVer={onVerDetalle}
          onEditar={onEditar}
          onEliminar={onEliminar}
          onToggleSelect={toggleSelect}
        />
      ))}
      </div>

      </div>
      </div>
      <Paginador pagina={pagina} total={historiasOrdenadas.length} pageSize={PAGE_SIZE} onCambiar={setPagina} />
      </>}
    </div>
  )
}
