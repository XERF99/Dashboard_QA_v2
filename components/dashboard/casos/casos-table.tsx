"use client"

import { useState, useMemo, useCallback } from "react"
import { Layers, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, BookOpen, Upload } from "lucide-react"
import { Paginador } from "@/components/ui/paginator"
import {
  type CasoPrueba, type HistoriaUsuario, type EstadoAprobacion, type ComplejidadCaso,
  type TipoPruebaDef,
} from "@/lib/types"
import { APROBACION_CFG, APROBACION_ORDER } from "./caso-aprobacion-cfg"
import { CasosRow }          from "./casos-row"
import { CasosCardMobile }   from "./casos-card-mobile"
import { CasosFiltersPanel } from "./casos-filters-panel"

type SortCampo = "id" | "titulo" | "hu" | "aprobacion" | "complejidad" | "fecha"
type SortDir   = "asc" | "desc"

const PAGE_SIZE = 25

interface Props {
  casos:        CasoPrueba[]
  historias:    HistoriaUsuario[]
  onVerHU:      (hu: HistoriaUsuario) => void
  tiposPrueba?: TipoPruebaDef[]
  onImportCSV?: () => void
}

export function CasosTable({ casos, historias, onVerHU, tiposPrueba, onImportCSV }: Props) {
  // ── Filtros ──
  const [filtroAprobacion,  setFiltroAprobacion]  = useState<EstadoAprobacion | "todos">("todos")
  const [filtroComplejidad, setFiltroComplejidad] = useState<ComplejidadCaso | "todos">("todos")
  const [filtroResponsable, setFiltroResponsable] = useState<string>("todos")
  const [filtroTipoPrueba,  setFiltroTipoPrueba]  = useState<string>("todos")
  const [busqueda,          setBusqueda]          = useState("")
  const [filtrosVisibles,   setFiltrosVisibles]   = useState(false)

  // ── Ordenamiento ──
  const [sortCampo, setSortCampo] = useState<SortCampo>("aprobacion")
  const [sortDir,   setSortDir]   = useState<SortDir>("asc")

  // ── Paginación ──
  const [pagina, setPagina] = useState(1)

  const toggleSort = (campo: SortCampo) => {
    if (sortCampo === campo) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortCampo(campo); setSortDir("asc") }
    setPagina(1)
  }

  // Setters de filtros que resetean la paginación — estables para React.memo.
  const updateFiltroAprobacion  = useCallback((v: EstadoAprobacion | "todos") => { setFiltroAprobacion(v);  setPagina(1) }, [])
  const updateFiltroComplejidad = useCallback((v: ComplejidadCaso  | "todos") => { setFiltroComplejidad(v); setPagina(1) }, [])
  const updateFiltroResponsable = useCallback((v: string) => { setFiltroResponsable(v); setPagina(1) }, [])
  const updateFiltroTipoPrueba  = useCallback((v: string) => { setFiltroTipoPrueba(v);  setPagina(1) }, [])

  // Mapa huId → HU para lookups O(1)
  const huMap = useMemo(() => new Map(historias.map(h => [h.id, h])), [historias])

  // Valores únicos para selects
  const responsables = useMemo(() => {
    const set = new Set(casos.map(c => huMap.get(c.huId)?.responsable).filter(Boolean) as string[])
    return [...set].sort()
  }, [casos, huMap])

  const tiposPruebaUnicos = useMemo(() => {
    const set = new Set(casos.map(c => c.tipoPrueba).filter(Boolean))
    return [...set]
  }, [casos])

  // Filtrado
  const casosFiltrados = useMemo(() => {
    return casos.filter(c => {
      const hu = huMap.get(c.huId)
      if (filtroAprobacion  !== "todos" && c.estadoAprobacion !== filtroAprobacion)  return false
      if (filtroComplejidad !== "todos" && c.complejidad      !== filtroComplejidad) return false
      if (filtroTipoPrueba  !== "todos" && c.tipoPrueba       !== filtroTipoPrueba)  return false
      if (filtroResponsable !== "todos" && hu?.responsable    !== filtroResponsable) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        const matchCaso = c.titulo.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
        const matchHU   = hu ? (hu.titulo.toLowerCase().includes(q) || hu.codigo.toLowerCase().includes(q)) : false
        if (!matchCaso && !matchHU) return false
      }
      return true
    })
  }, [casos, huMap, filtroAprobacion, filtroComplejidad, filtroTipoPrueba, filtroResponsable, busqueda])

  // Ordenado
  const casosOrdenados = useMemo(() => {
    const arr = [...casosFiltrados]
    arr.sort((a, b) => {
      const huA = huMap.get(a.huId)
      const huB = huMap.get(b.huId)
      let cmp = 0
      switch (sortCampo) {
        case "id":          cmp = a.id.localeCompare(b.id); break
        case "titulo":      cmp = a.titulo.localeCompare(b.titulo); break
        case "hu":          cmp = (huA?.codigo ?? "").localeCompare(huB?.codigo ?? ""); break
        case "aprobacion":  cmp = APROBACION_ORDER[a.estadoAprobacion] - APROBACION_ORDER[b.estadoAprobacion]; break
        case "complejidad": cmp = (a.complejidad ?? "").localeCompare(b.complejidad ?? ""); break
        case "fecha":       cmp = a.fechaCreacion.getTime() - b.fechaCreacion.getTime(); break
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return arr
  }, [casosFiltrados, sortCampo, sortDir, huMap])

  const casosEnPagina = useMemo(
    () => casosOrdenados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [casosOrdenados, pagina]
  )

  const filtrosActivos = [filtroAprobacion, filtroComplejidad, filtroResponsable, filtroTipoPrueba].filter(f => f !== "todos").length
    + (busqueda ? 1 : 0)

  const limpiarFiltros = () => {
    setFiltroAprobacion("todos")
    setFiltroComplejidad("todos")
    setFiltroResponsable("todos")
    setFiltroTipoPrueba("todos")
    setBusqueda("")
    setPagina(1)
  }

  const SortIcon = ({ campo }: { campo: SortCampo }) => {
    if (sortCampo !== campo) return <ArrowUpDown size={10} style={{ opacity:0.35 }}/>
    return sortDir === "asc" ? <ArrowUp size={10}/> : <ArrowDown size={10}/>
  }

  // ── Contadores rápidos por estado ──
  const counters = useMemo(() => {
    const c = { borrador: 0, pendiente_aprobacion: 0, aprobado: 0, rechazado: 0 }
    casos.forEach(x => c[x.estadoAprobacion]++)
    return c
  }, [casos])

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* ── KPI pills ── */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        {(Object.entries(APROBACION_CFG) as [EstadoAprobacion, typeof APROBACION_CFG[EstadoAprobacion]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => { setFiltroAprobacion(filtroAprobacion === key ? "todos" : key); setPagina(1) }}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600,
              cursor:"pointer", border:"1px solid",
              transition:"all 0.15s",
            }}
            className={filtroAprobacion === key ? cfg.cls : "border-border bg-secondary text-muted-foreground hover:bg-card"}
          >
            {cfg.icon}
            {cfg.label}
            <span style={{ fontFamily:"monospace", fontSize:11 }}>{counters[key]}</span>
          </button>
        ))}
        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          {onImportCSV && (
            <button
              onClick={onImportCSV}
              title="Importar casos desde CSV"
              style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"5px 10px", borderRadius:7, fontSize:11, fontWeight:600, cursor:"pointer",
                border:"1px solid var(--border)", background:"var(--secondary)", color:"var(--foreground)",
              }}
            >
              <Upload size={13}/> <span className="hidden sm:inline">Importar</span>
            </button>
          )}
          <span style={{ fontSize:12, color:"var(--muted-foreground)" }}>
            {casos.length} caso{casos.length !== 1 ? "s" : ""} en total
          </span>
        </div>
      </div>

      {/* ── Barra de búsqueda + filtros ── */}
      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
        <input
          type="text"
          value={busqueda}
          onChange={e => { setBusqueda(e.target.value); setPagina(1) }}
          placeholder="Buscar por título o HU…"
          style={{
            flex:1, minWidth:200, height:32, fontSize:12, padding:"0 10px", borderRadius:7,
            border:"1px solid var(--border)", background:"var(--card)", color:"var(--foreground)", outline:"none",
          }}
        />
        <button
          onClick={() => setFiltrosVisibles(v => !v)}
          style={{
            display:"inline-flex", alignItems:"center", gap:4,
            padding:"5px 10px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer",
            border:"1px solid var(--border)",
            background: filtrosActivos > 0 ? "color-mix(in oklch,var(--primary) 12%,transparent)" : "var(--secondary)",
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
        <span style={{ fontSize:12, color:"var(--muted-foreground)" }}>
          {casosFiltrados.length !== casos.length && `${casosFiltrados.length} de ${casos.length}`}
        </span>
      </div>

      {/* ── Panel de filtros ── */}
      {filtrosVisibles && (
        <CasosFiltersPanel
          filtroAprobacion={filtroAprobacion}
          onFiltroAprobacion={updateFiltroAprobacion}
          filtroComplejidad={filtroComplejidad}
          onFiltroComplejidad={updateFiltroComplejidad}
          filtroResponsable={filtroResponsable}
          onFiltroResponsable={updateFiltroResponsable}
          filtroTipoPrueba={filtroTipoPrueba}
          onFiltroTipoPrueba={updateFiltroTipoPrueba}
          responsables={responsables}
          tiposPruebaUnicos={tiposPruebaUnicos}
          tiposPrueba={tiposPrueba}
        />
      )}

      {/* ── Estado vacío ── */}
      {casos.length === 0 && (
        <div style={{ textAlign:"center", padding:"48px", color:"var(--muted-foreground)" }}>
          <Layers size={32} style={{ margin:"0 auto 12px", opacity:0.4 }} />
          <p style={{ fontSize:14 }}>No hay casos de prueba creados aún.</p>
          <p style={{ fontSize:12, marginTop:4 }}>Crea casos desde el detalle de una Historia de Usuario.</p>
        </div>
      )}

      {casos.length > 0 && casosFiltrados.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px", color:"var(--muted-foreground)", border:"1px dashed var(--border)", borderRadius:10 }}>
          <Filter size={24} style={{ margin:"0 auto 10px", opacity:0.35 }} />
          <p style={{ fontSize:13 }}>Ningún caso coincide con los filtros aplicados.</p>
          <button onClick={limpiarFiltros} style={{ background:"none", border:"none", cursor:"pointer", fontSize:12, color:"var(--primary)", marginTop:6, fontWeight:600 }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {/* ── Vista mobile: cards (< sm) ── */}
      {casosEnPagina.length > 0 && (
        <div className="sm:hidden flex flex-col gap-2">
          {casosEnPagina.map(caso => (
            <CasosCardMobile
              key={caso.id}
              caso={caso}
              hu={huMap.get(caso.huId)}
              onVerHU={onVerHU}
              tiposPrueba={tiposPrueba}
            />
          ))}
        </div>
      )}

      {/* ── Vista desktop: tabla grid (≥ sm) ── */}
      <div className="hidden sm:block overflow-x-auto -mx-1 px-1" role="table" aria-label="Casos de prueba">
      <div style={{ minWidth: 700 }}>
      {casosOrdenados.length > 0 && (
        <div role="row" aria-label="Cabecera de casos" style={{
          display:"grid",
          gridTemplateColumns:"120px 1fr 160px 148px 80px 80px 56px",
          gap:12, padding:"5px 16px", borderRadius:8,
          background:"var(--secondary)", border:"1px solid var(--border)",
          alignItems:"center",
        }}>
          <button onClick={() => toggleSort("id")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="id" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", padding:0 }}>
            ID <SortIcon campo="id"/>
          </button>
          <button onClick={() => toggleSort("titulo")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="titulo" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", padding:0 }}>
            Título <SortIcon campo="titulo"/>
          </button>
          <button onClick={() => toggleSort("hu")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="hu" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", padding:0 }}>
            HU <SortIcon campo="hu"/>
          </button>
          <button onClick={() => toggleSort("aprobacion")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="aprobacion" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", padding:0 }}>
            Aprobación <SortIcon campo="aprobacion"/>
          </button>
          <button onClick={() => toggleSort("complejidad")} style={{ display:"inline-flex", alignItems:"center", gap:3, background:"none", border:"none", cursor:"pointer", fontSize:10, fontWeight:700, color: sortCampo==="complejidad" ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em", padding:0 }}>
            Complejidad <SortIcon campo="complejidad"/>
          </button>
          <span style={{ fontSize:10, fontWeight:700, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
            Ejecución
          </span>
          <span style={{ fontSize:10, fontWeight:700, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.06em" }}>
            Acción
          </span>
        </div>
      )}

      {/* ── Filas ── */}
      {casosEnPagina.map(caso => (
        <CasosRow
          key={caso.id}
          caso={caso}
          hu={huMap.get(caso.huId)}
          onVerHU={onVerHU}
          tiposPrueba={tiposPrueba}
        />
      ))}

      </div>
      </div>
      <Paginador pagina={pagina} total={casosOrdenados.length} pageSize={PAGE_SIZE} onCambiar={setPagina} />

      {/* ── Nota al pie ── */}
      {casos.length > 0 && (
        <p style={{ fontSize:11, color:"var(--muted-foreground)", textAlign:"center", paddingTop:4 }}>
          <BookOpen size={11} style={{ display:"inline", marginRight:4 }}/>
          Haz clic en <strong>Ver</strong> para abrir el detalle completo de la Historia de Usuario.
        </p>
      )}
    </div>
  )
}
