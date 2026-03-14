"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Edit, Trash2, Plus, BookOpen, AlertTriangle, Layers, Clock, Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  ESTADO_HU_CFG, ETAPA_HU_CFG, PRIORIDAD_CFG, TIPO_APLICACION_LABEL, AMBIENTE_LABEL,
  type HistoriaUsuario, type CasoPrueba, type EstadoHU, type PrioridadHU, type TipoAplicacion,
} from "@/lib/types"

type SortCampo = "codigo" | "titulo" | "prioridad" | "estado" | "responsable" | "fecha"
type SortDir = "asc" | "desc"

const PRIORIDAD_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baja: 3 }
const ESTADO_ORDER:    Record<string, number> = { en_progreso: 0, sin_iniciar: 1, fallida: 2, exitosa: 3, cancelada: 4 }

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  onVerDetalle: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
  onNueva: () => void
  canEdit?: boolean
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

export function HistoriasTable({ historias, casos, onVerDetalle, onEditar, onEliminar, onNueva, canEdit=true }: Props) {
  // ── Estado de filtros ──
  const [filtroEstado,      setFiltroEstado]      = useState<EstadoHU | "todos">("todos")
  const [filtroPrioridad,   setFiltroPrioridad]   = useState<PrioridadHU | "todos">("todos")
  const [filtroResponsable, setFiltroResponsable] = useState<string>("todos")
  const [filtroTipo,        setFiltroTipo]        = useState<TipoAplicacion | "todos">("todos")
  const [filtrosVisibles,   setFiltrosVisibles]   = useState(false)

  // ── Estado de ordenamiento ──
  const [sortCampo, setSortCampo] = useState<SortCampo>("codigo")
  const [sortDir,   setSortDir]   = useState<SortDir>("asc")

  const toggleSort = (campo: SortCampo) => {
    if (sortCampo === campo) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortCampo(campo); setSortDir("asc") }
  }

  // Valores únicos para los selects
  const responsables = useMemo(() => [...new Set(historias.map(h => h.responsable))].sort(), [historias])
  const tiposApp     = useMemo(() => [...new Set(historias.map(h => h.tipoAplicacion))], [historias])

  // Aplicar filtros
  const historiasFiltradas = useMemo(() => historias.filter(hu => {
    if (filtroEstado      !== "todos" && hu.estado          !== filtroEstado)      return false
    if (filtroPrioridad   !== "todos" && hu.prioridad       !== filtroPrioridad)   return false
    if (filtroResponsable !== "todos" && hu.responsable     !== filtroResponsable) return false
    if (filtroTipo        !== "todos" && hu.tipoAplicacion  !== filtroTipo)        return false
    return true
  }), [historias, filtroEstado, filtroPrioridad, filtroResponsable, filtroTipo])

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

  const filtrosActivos = [filtroEstado, filtroPrioridad, filtroResponsable, filtroTipo].filter(f => f !== "todos").length

  const limpiarFiltros = () => {
    setFiltroEstado("todos")
    setFiltroPrioridad("todos")
    setFiltroResponsable("todos")
    setFiltroTipo("todos")
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
            {" "}· clic en <strong>Ver</strong> para detalle
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
        {canEdit && (
          <Button onClick={onNueva} size="sm">
            <Plus size={13} className="mr-1.5" /> Nueva HU
          </Button>
        )}
      </div>

      {/* ── Panel de filtros ── */}
      {filtrosVisibles && (
        <div style={{
          display:"flex", gap:8, flexWrap:"wrap", alignItems:"center",
          padding:"10px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--card)",
        }}>
          <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, color:"var(--muted-foreground)", flexShrink:0 }}>
            Filtrar por
          </span>

          <Select value={filtroEstado} onValueChange={v => setFiltroEstado(v as EstadoHU | "todos")}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
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
            <SelectTrigger className="h-7 text-xs w-32">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
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
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los responsables</SelectItem>
                {responsables.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {tiposApp.length > 1 && (
            <Select value={filtroTipo} onValueChange={v => setFiltroTipo(v as TipoAplicacion | "todos")}>
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="Tipo de app" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposApp.map(t => <SelectItem key={t} value={t}>{TIPO_APLICACION_LABEL[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* ── Cabecera de ordenamiento ── */}
      {historiasOrdenadas.length > 0 && (
        <div style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"5px 16px", borderRadius:8,
          background:"var(--secondary)", border:"1px solid var(--border)",
        }}>
          <button onClick={() => toggleSort("codigo")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="codigo" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0, minWidth:54, padding:0 }}>
            Código <SortIcon campo="codigo"/>
          </button>
          <button onClick={() => toggleSort("titulo")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="titulo" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", flex:1, padding:0 }}>
            Título <SortIcon campo="titulo"/>
          </button>
          <button onClick={() => toggleSort("prioridad")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="prioridad" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0, padding:0 }}>
            Prioridad <SortIcon campo="prioridad"/>
          </button>
          <button onClick={() => toggleSort("estado")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="estado" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0, padding:0 }}>
            Estado <SortIcon campo="estado"/>
          </button>
          <button onClick={() => toggleSort("fecha")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="fecha" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0, padding:0 }}>
            Fecha <SortIcon campo="fecha"/>
          </button>
          <button onClick={() => toggleSort("responsable")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="responsable" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", flexShrink:0, minWidth:90, padding:0 }}>
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
      {historiasOrdenadas.map(hu => {
        const estCfg  = ESTADO_HU_CFG[hu.estado]
        const priCfg  = PRIORIDAD_CFG[hu.prioridad]
        const etaCfg  = ETAPA_HU_CFG[hu.etapa]
        const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
        const tieneBloqueos = hu.bloqueos.some(b => !b.resuelto)

        const casosAprobados   = casosHU.filter(c => c.estadoAprobacion === "aprobado")
        const casosCompletados = casosAprobados.filter(c =>
          c.resultadosPorEtapa.length > 0 && c.resultadosPorEtapa.every(r => r.estado === "completado")
        )
        const pct = casosAprobados.length > 0 ? Math.round((casosCompletados.length / casosAprobados.length) * 100) : 0

        return (
          <div key={hu.id} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"13px 16px", borderRadius:12,
            border: tieneBloqueos
              ? "1px solid color-mix(in oklch, var(--chart-4) 40%, var(--border))"
              : "1px solid var(--border)",
            background:"var(--card)", transition:"background 0.15s",
          }} className="hover:bg-secondary/30">

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
                  {TIPO_APLICACION_LABEL[hu.tipoAplicacion]}
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                  {AMBIENTE_LABEL[hu.ambiente]}
                </Badge>
                {/* Indicador de urgencia */}
                <UrgenciaBadge fecha={hu.fechaFinEstimada} estado={hu.estado} />
              </div>
            </div>

            {/* Meta: casos, etapa, prioridad, estado + progreso */}
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, flexWrap:"wrap" }}>
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
            <p style={{ fontSize:12, color:"var(--muted-foreground)", flexShrink:0, minWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {hu.responsable}
            </p>

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
  )
}
