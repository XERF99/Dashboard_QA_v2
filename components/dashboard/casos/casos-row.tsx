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

// Fila desktop de la tabla de casos. Memoizada — sólo re-renderiza
// cuando su `caso` o `hu` cambian (v2.75 split).
function CasosRowImpl({ caso, hu, onVerHU, tiposPrueba }: Props) {
  const aprobCfg      = APROBACION_CFG[caso.estadoAprobacion]
  const compCfg       = COMPLEJIDAD_CFG[caso.complejidad]
  const tieneBloqueos = caso.bloqueos.some(b => !b.resuelto)

  const totalEtapas    = caso.resultadosPorEtapa.length
  const etapasOk       = caso.resultadosPorEtapa.filter(r => r.estado === "completado" && r.resultado === "exitoso").length
  const etapasFallidas = caso.resultadosPorEtapa.filter(r => r.resultado === "fallido").length
  const pct = totalEtapas > 0 ? Math.round((etapasOk / totalEtapas) * 100) : 0

  return (
    <div style={{
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
}

export const CasosRow = memo(CasosRowImpl)
