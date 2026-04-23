"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Eye, Edit, Trash2, Layers, AlertTriangle, UserX } from "lucide-react"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG, getEtapaHUCfg,
  getTipoAplicacionLabel, getAmbienteLabel,
  type HistoriaUsuario, type CasoPrueba,
  type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef,
} from "@/lib/types"
import { isResponsableActivo } from "@/lib/utils/asignaciones"

type UserLite = { nombre: string; activo: boolean }
import { UrgenciaBadge } from "./historia-urgencia-badge"

interface Props {
  hu: HistoriaUsuario
  casos: CasoPrueba[]
  selected: boolean
  canEdit: boolean
  configEtapas: ConfigEtapas
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
  users: UserLite[]
  onVer: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
  onToggleSelect: (id: string) => void
}

function HistoriasRowBase({
  hu, casos, selected, canEdit, configEtapas, tiposAplicacion, ambientes, users,
  onVer, onEditar, onEliminar, onToggleSelect,
}: Props) {
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
    <div role="row" aria-label={`${hu.codigo} — ${hu.titulo}`} style={{
      display:"flex", alignItems:"center", gap:12,
      padding:"13px 16px", borderRadius:12,
      border: selected
        ? "1px solid color-mix(in oklch, var(--primary) 40%, var(--border))"
        : tieneBloqueos
          ? "1px solid color-mix(in oklch, var(--chart-4) 40%, var(--border))"
          : "1px solid var(--border)",
      background: selected
        ? "color-mix(in oklch, var(--primary) 4%, var(--card))"
        : "var(--card)",
      transition:"background 0.15s, border-color 0.15s",
    }} className="hover:bg-secondary/30">

      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(hu.id)}
        onClick={e => e.stopPropagation()}
        style={{ width:14, height:14, cursor:"pointer", accentColor:"var(--primary)", flexShrink:0 }}
      />

      <p style={{ fontSize:12, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, flexShrink:0, minWidth:54 }}>
        {hu.codigo}
      </p>

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
          <UrgenciaBadge fecha={hu.fechaFinEstimada} estado={hu.estado} />
        </div>
      </div>

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

      <div className="hidden sm:block shrink-0" style={{ minWidth:90, overflow:"hidden" }}>
        <p style={{ fontSize:12, color:"var(--muted-foreground)", textOverflow:"ellipsis", whiteSpace:"nowrap", overflow:"hidden", display:"flex", alignItems:"center", gap:4 }}>
          {hu.responsable}
          {!isResponsableActivo(hu.responsable, users) && (
            <UserX size={11} style={{ color:"var(--chart-4)", flexShrink:0 }} aria-label="Responsable sin workspace activo" />
          )}
        </p>
      </div>

      <div style={{ display:"flex", gap:3, flexShrink:0 }}>
        <Button variant="ghost" size="sm" onClick={() => onVer(hu)}>
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
}

export const HistoriasRow = memo(HistoriasRowBase)
