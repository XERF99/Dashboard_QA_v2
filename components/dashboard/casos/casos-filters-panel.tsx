"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTipoPruebaLabel, type EstadoAprobacion, type ComplejidadCaso, type TipoPruebaDef } from "@/lib/types"

// Panel de filtros de casos de prueba. Extraído de casos-table.tsx (v2.75).
interface Props {
  filtroAprobacion:    EstadoAprobacion | "todos"
  onFiltroAprobacion:  (v: EstadoAprobacion | "todos") => void
  filtroComplejidad:   ComplejidadCaso | "todos"
  onFiltroComplejidad: (v: ComplejidadCaso | "todos") => void
  filtroResponsable:   string
  onFiltroResponsable: (v: string) => void
  filtroTipoPrueba:    string
  onFiltroTipoPrueba:  (v: string) => void
  responsables:        string[]
  tiposPruebaUnicos:   string[]
  tiposPrueba?:        TipoPruebaDef[]
}

export function CasosFiltersPanel(props: Props) {
  const {
    filtroAprobacion, onFiltroAprobacion,
    filtroComplejidad, onFiltroComplejidad,
    filtroResponsable, onFiltroResponsable,
    filtroTipoPrueba, onFiltroTipoPrueba,
    responsables, tiposPruebaUnicos, tiposPrueba,
  } = props

  return (
    <div style={{
      display:"flex", gap:8, flexWrap:"wrap", alignItems:"center",
      padding:"10px 14px", borderRadius:10, border:"1px solid var(--border)", background:"var(--card)",
    }}>
      <span style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, color:"var(--muted-foreground)", flexShrink:0 }}>
        Filtrar por
      </span>

      <Select value={filtroAprobacion} onValueChange={v => onFiltroAprobacion(v as EstadoAprobacion | "todos")}>
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

      <Select value={filtroComplejidad} onValueChange={v => onFiltroComplejidad(v as ComplejidadCaso | "todos")}>
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
        <Select value={filtroResponsable} onValueChange={onFiltroResponsable}>
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
        <Select value={filtroTipoPrueba} onValueChange={onFiltroTipoPrueba}>
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
  )
}
