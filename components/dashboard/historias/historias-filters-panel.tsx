"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTipoAplicacionLabel, getAmbienteLabel, getTipoPruebaLabel,
  type EstadoHU, type PrioridadHU, type TipoAplicacion,
  type TipoAplicacionDef, type AmbienteDef, type TipoPruebaDef,
} from "@/lib/types"

export interface HistoriasFiltersPanelProps {
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

export function HistoriasFiltersPanel({
  filtroEstado, setFiltroEstado, filtroPrioridad, setFiltroPrioridad,
  filtroResponsable, setFiltroResponsable, filtroTipo, setFiltroTipo,
  filtroSprint, setFiltroSprint, filtroAmbiente, setFiltroAmbiente,
  filtroTipoPrueba, setFiltroTipoPrueba, filtroFechaDesde, setFiltroFechaDesde,
  filtroFechaHasta, setFiltroFechaHasta,
  responsables, tiposApp, sprints, ambientesUnicos, tiposPruebaUnicos,
  tiposAplicacion, ambientes, tiposPrueba,
}: HistoriasFiltersPanelProps) {
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
