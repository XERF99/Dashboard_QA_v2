"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, AlertTriangle, Layers, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, Clock, XCircle, FileText, BookOpen, Upload } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Paginador } from "@/components/ui/paginator"
import {
  type CasoPrueba, type HistoriaUsuario, type EstadoAprobacion, type ComplejidadCaso,
  getTipoPruebaLabel, type TipoPruebaDef, COMPLEJIDAD_CFG,
} from "@/lib/types"

// ── Configs visuales de aprobación ───────────────────────
const APROBACION_CFG: Record<EstadoAprobacion, { label: string; cls: string; icon: React.ReactNode }> = {
  borrador:              { label: "Borrador",         cls: "bg-muted text-muted-foreground border-border",                       icon: <FileText size={10}/> },
  pendiente_aprobacion:  { label: "Pend. Aprobación", cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800", icon: <Clock size={10}/> },
  aprobado:              { label: "Aprobado",          cls: "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800", icon: <CheckCircle size={10}/> },
  rechazado:             { label: "Rechazado",         cls: "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",             icon: <XCircle size={10}/> },
}


const APROBACION_ORDER: Record<EstadoAprobacion, number> = {
  pendiente_aprobacion: 0,
  rechazado: 1,
  borrador: 2,
  aprobado: 3,
}

type SortCampo = "id" | "titulo" | "hu" | "aprobacion" | "complejidad" | "fecha"
type SortDir   = "asc" | "desc"

const PAGE_SIZE = 25

interface Props {
  casos: CasoPrueba[]
  historias: HistoriaUsuario[]
  onVerHU: (hu: HistoriaUsuario) => void
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
        <div style={{
          display:"flex", gap:8, flexWrap:"wrap", alignItems:"center",
          padding:"10px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--card)",
        }}>
          <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, color:"var(--muted-foreground)", flexShrink:0 }}>
            Filtrar por
          </span>

          <Select value={filtroAprobacion} onValueChange={v => { setFiltroAprobacion(v as EstadoAprobacion | "todos"); setPagina(1) }}>
            <SelectTrigger className="h-7 text-xs w-44">
              <SelectValue placeholder="Aprobación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="pendiente_aprobacion">Pend. Aprobación</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroComplejidad} onValueChange={v => { setFiltroComplejidad(v as ComplejidadCaso | "todos"); setPagina(1) }}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue placeholder="Complejidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          {responsables.length > 1 && (
            <Select value={filtroResponsable} onValueChange={v => { setFiltroResponsable(v); setPagina(1) }}>
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {responsables.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {tiposPruebaUnicos.length > 1 && (
            <Select value={filtroTipoPrueba} onValueChange={v => { setFiltroTipoPrueba(v); setPagina(1) }}>
              <SelectTrigger className="h-7 text-xs w-40">
                <SelectValue placeholder="Tipo de prueba" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tiposPruebaUnicos.map(t => (
                  <SelectItem key={t} value={t}>{getTipoPruebaLabel(t, tiposPrueba)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
          {casosEnPagina.map(caso => {
            const hu            = huMap.get(caso.huId)
            const aprobCfg      = APROBACION_CFG[caso.estadoAprobacion]
            const compCfg       = COMPLEJIDAD_CFG[caso.complejidad]
            const tieneBloqueos = caso.bloqueos.some(b => !b.resuelto)
            const totalEtapas   = caso.resultadosPorEtapa.length
            const etapasOk      = caso.resultadosPorEtapa.filter(r => r.estado === "completado" && r.resultado === "exitoso").length
            const etapasFallidas = caso.resultadosPorEtapa.filter(r => r.resultado === "fallido").length
            const pct = totalEtapas > 0 ? Math.round((etapasOk / totalEtapas) * 100) : 0
            return (
              <div key={caso.id} style={{
                padding:"12px", borderRadius:10,
                border: tieneBloqueos
                  ? "1px solid color-mix(in oklch, var(--chart-4) 35%, var(--border))"
                  : "1px solid var(--border)",
                background:"var(--card)",
              }}>
                {/* Fila 1: ID + aprobación + Ver */}
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
                  <p style={{ fontSize:11, fontFamily:"monospace", color:"var(--primary)", fontWeight:700 }}>
                    {caso.id}
                  </p>
                  {tieneBloqueos && <AlertTriangle size={12} style={{ color:"var(--chart-4)" }}/>}
                  <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:6 }}>
                    <Badge variant="outline" className={`${aprobCfg.cls} text-[10px] gap-1`}>
                      {aprobCfg.icon}{aprobCfg.label}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => hu && onVerHU(hu)} disabled={!hu}>
                      <Eye size={12} className="mr-1"/> Ver
                    </Button>
                  </div>
                </div>
                {/* Fila 2: Título */}
                <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)", marginBottom:4 }}>
                  {caso.titulo}
                  {caso.modificacionSolicitada && (
                    <span style={{ marginLeft:6, fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:4, background:"color-mix(in oklch,var(--chart-3) 15%,transparent)", color:"var(--chart-3)", border:"1px solid color-mix(in oklch,var(--chart-3) 30%,transparent)" }}>
                      Mod. solicitada
                    </span>
                  )}
                </p>
                {/* Fila 3: Badges tipo + entorno */}
                <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:6 }}>
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                    {getTipoPruebaLabel(caso.tipoPrueba, tiposPrueba)}
                  </Badge>
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                    {caso.entorno === "test" ? "Test" : "Pre-prod"}
                  </Badge>
                  {caso.horasEstimadas > 0 && (
                    <span style={{ fontSize:9, color:"var(--muted-foreground)" }}>{caso.horasEstimadas}h est.</span>
                  )}
                </div>
                {/* Fila 4: HU + complejidad */}
                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                  {hu && (
                    <p style={{ fontSize:11, color:"var(--muted-foreground)", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      <span style={{ fontFamily:"monospace", color:"var(--primary)", fontWeight:700 }}>{hu.codigo}</span>
                      {" · "}{hu.titulo}
                    </p>
                  )}
                  <Badge variant="outline" className={`${compCfg.cls} text-[10px] shrink-0`}>
                    {compCfg.label}
                  </Badge>
                </div>
                {/* Fila 5: Progreso ejecución */}
                {totalEtapas > 0 && (
                  <div style={{ marginTop:8, display:"flex", flexDirection:"column", gap:3 }}>
                    <Progress value={pct} className={`h-1.5 ${etapasFallidas > 0 ? "[&>div]:bg-red-500" : ""}`} />
                    <span style={{ fontSize:9, color: etapasFallidas > 0 ? "var(--chart-4)" : "var(--muted-foreground)", fontFamily:"monospace" }}>
                      Ejecución: {etapasOk}/{totalEtapas}{etapasFallidas > 0 && ` · ${etapasFallidas}✗`}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Vista desktop: tabla grid (≥ sm) ── */}
      <div className="hidden sm:block overflow-x-auto -mx-1 px-1">
      <div style={{ minWidth: 700 }}>
      {casosOrdenados.length > 0 && (
        <div style={{
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
      {casosEnPagina.map(caso => {
        const hu        = huMap.get(caso.huId)
        const aprobCfg  = APROBACION_CFG[caso.estadoAprobacion]
        const compCfg   = COMPLEJIDAD_CFG[caso.complejidad]
        const tieneBloqueos = caso.bloqueos.some(b => !b.resuelto)

        // Progreso de ejecución: etapas completadas / total
        const totalEtapas     = caso.resultadosPorEtapa.length
        const etapasOk        = caso.resultadosPorEtapa.filter(r => r.estado === "completado" && r.resultado === "exitoso").length
        const etapasFallidas  = caso.resultadosPorEtapa.filter(r => r.resultado === "fallido").length
        const pct = totalEtapas > 0 ? Math.round((etapasOk / totalEtapas) * 100) : 0

        return (
          <div key={caso.id} style={{
            display:"grid",
            gridTemplateColumns:"120px 1fr 160px 148px 80px 80px 56px",
            gap:12, padding:"12px 16px", borderRadius:12, alignItems:"center",
            border: tieneBloqueos
              ? "1px solid color-mix(in oklch, var(--chart-4) 35%, var(--border))"
              : "1px solid var(--border)",
            background:"var(--card)", transition:"background 0.15s",
          }} className="hover:bg-secondary/30">

            {/* ID */}
            <p style={{ fontSize:11, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {caso.id}
            </p>

            {/* Título + info extra */}
            <div style={{ minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {caso.titulo}
                </p>
                {tieneBloqueos && (
                  <span title="Bloqueos activos">
                    <AlertTriangle size={12} style={{ color:"var(--chart-4)", flexShrink:0 }}/>
                  </span>
                )}
                {caso.modificacionSolicitada && (
                  <span title="Modificación solicitada" style={{ fontSize:9, fontWeight:700, padding:"1px 5px", borderRadius:4, background:"color-mix(in oklch,var(--chart-3) 15%,transparent)", color:"var(--chart-3)", border:"1px solid color-mix(in oklch,var(--chart-3) 30%,transparent)", flexShrink:0 }}>
                    Mod. solicitada
                  </span>
                )}
              </div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                  {getTipoPruebaLabel(caso.tipoPrueba, tiposPrueba)}
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                  {caso.entorno === "test" ? "Test" : "Pre-prod"}
                </Badge>
                {caso.horasEstimadas > 0 && (
                  <span style={{ fontSize:9, color:"var(--muted-foreground)" }}>{caso.horasEstimadas}h est.</span>
                )}
              </div>
            </div>

            {/* HU asociada */}
            {hu ? (
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:10, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, marginBottom:2 }}>
                  {hu.codigo}
                </p>
                <p style={{ fontSize:11, color:"var(--muted-foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {hu.titulo}
                </p>
                <p style={{ fontSize:10, color:"var(--muted-foreground)", opacity:0.7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {hu.responsable}
                </p>
              </div>
            ) : (
              <span style={{ fontSize:11, color:"var(--muted-foreground)", fontStyle:"italic" }}>HU no encontrada</span>
            )}

            {/* Aprobación */}
            <Badge variant="outline" className={`${aprobCfg.cls} text-[10px] gap-1`}>
              {aprobCfg.icon}
              {aprobCfg.label}
            </Badge>

            {/* Complejidad */}
            <Badge variant="outline" className={`${compCfg.cls} text-[10px]`}>
              {compCfg.label}
            </Badge>

            {/* Ejecución */}
            {totalEtapas === 0 ? (
              <span style={{ fontSize:10, color:"var(--muted-foreground)", fontStyle:"italic" }}>—</span>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                <Progress
                  value={pct}
                  className={`h-1.5 ${etapasFallidas > 0 ? "[&>div]:bg-red-500" : ""}`}
                />
                <span style={{ fontSize:9, color: etapasFallidas > 0 ? "var(--chart-4)" : "var(--muted-foreground)", fontFamily:"monospace" }}>
                  {etapasOk}/{totalEtapas}
                  {etapasFallidas > 0 && ` · ${etapasFallidas}✗`}
                </span>
              </div>
            )}

            {/* Acción */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => hu && onVerHU(hu)}
              disabled={!hu}
              title="Ver Historia de Usuario"
            >
              <Eye size={13} className="mr-1" /> Ver
            </Button>

          </div>
        )
      })}

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
