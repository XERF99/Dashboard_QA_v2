"use client"

import { memo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Eye } from "lucide-react"
import {
  type CasoPrueba, type HistoriaUsuario, type TipoPruebaDef,
  COMPLEJIDAD_CFG, getTipoPruebaLabel,
} from "@/lib/types"
import { APROBACION_CFG } from "./caso-aprobacion-cfg"

interface Props {
  caso:         CasoPrueba
  hu:           HistoriaUsuario | undefined
  onVerHU:      (hu: HistoriaUsuario) => void
  tiposPrueba?: TipoPruebaDef[]
}

// Card mobile (<sm) de la tabla de casos. Memoizada (v2.75 split).
function CasosCardMobileImpl({ caso, hu, onVerHU, tiposPrueba }: Props) {
  const aprobCfg       = APROBACION_CFG[caso.estadoAprobacion]
  const compCfg        = COMPLEJIDAD_CFG[caso.complejidad]
  const tieneBloqueos  = caso.bloqueos.some(b => !b.resuelto)
  const totalEtapas    = caso.resultadosPorEtapa.length
  const etapasOk       = caso.resultadosPorEtapa.filter(r => r.estado === "completado" && r.resultado === "exitoso").length
  const etapasFallidas = caso.resultadosPorEtapa.filter(r => r.resultado === "fallido").length
  const pct = totalEtapas > 0 ? Math.round((etapasOk / totalEtapas) * 100) : 0

  return (
    <div style={{
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
}

export const CasosCardMobile = memo(CasosCardMobileImpl)
