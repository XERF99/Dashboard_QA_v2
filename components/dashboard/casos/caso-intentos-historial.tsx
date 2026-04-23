"use client"

import { Badge } from "@/components/ui/badge"
import { getEtapaHUCfg, fmtCorto, type CasoPrueba, type ConfigEtapas, type ResultadoDef } from "@/lib/types"

interface Props {
  caso:              CasoPrueba
  configEtapas:      ConfigEtapas
  getResultadoDef:   (id: string) => ResultadoDef
}

// Historial de intentos por etapa del caso. Extraído de caso-prueba-card.tsx (v2.75).
export function CasoIntentosHistorial({ caso, configEtapas, getResultadoDef }: Props) {
  const totalIntentos = caso.resultadosPorEtapa.reduce((s, r) => s + (r.intentos?.length || 0), 0)
  if (totalIntentos === 0) return null

  return (
    <div style={{ marginBottom:10, marginTop:4 }}>
      <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted-foreground)", marginBottom:6 }}>
        Historial de intentos ({totalIntentos})
      </p>
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {caso.resultadosPorEtapa.flatMap(r =>
          (r.intentos || []).map((intento, idx) => {
            const iDef = getResultadoDef(intento.resultado)
            return (
              <div key={`${r.etapa}-${idx}`} style={{
                padding:"8px 10px", borderRadius:7, fontSize:11, lineHeight:1.5,
                border:`1px solid ${iDef.esAceptado ? "color-mix(in oklch, var(--chart-2) 30%, var(--border))" : "color-mix(in oklch, var(--chart-4) 30%, var(--border))"}`,
                background: iDef.esAceptado ? "color-mix(in oklch, var(--chart-2) 5%, transparent)" : "color-mix(in oklch, var(--chart-4) 5%, transparent)",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
                  <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground border-border" style={{ padding:"1px 5px" }}>
                    {getEtapaHUCfg(r.etapa, configEtapas).label}
                  </Badge>
                  <Badge variant="outline" className={`text-[9px] ${iDef.cls}`} style={{ padding:"1px 5px" }}>
                    Intento #{intento.numero} — {iDef.icono ? `${iDef.icono} ` : ""}{iDef.label}
                  </Badge>
                  <span style={{ fontSize:10, color:"var(--muted-foreground)" }}>{fmtCorto(intento.fecha)} · {intento.ejecutadoPor}</span>
                </div>
                {intento.comentarioFallo && (
                  <p style={{ color:"var(--chart-4)", fontSize:11 }}><strong>Fallo:</strong> {intento.comentarioFallo}</p>
                )}
                {intento.comentarioCorreccion && (
                  <p style={{ color:"var(--chart-2)", fontSize:11 }}><strong>Corrección:</strong> {intento.comentarioCorreccion}</p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
