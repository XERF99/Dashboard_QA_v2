"use client"

import { useMemo } from "react"
import { AlertTriangle, ArrowRight, CheckCircle, Clock, Eye, ShieldAlert, XCircle } from "lucide-react"
import { type HistoriaUsuario, type CasoPrueba } from "@/lib/types"

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  onVerHU: (hu: HistoriaUsuario) => void
  onIrATab: (tab: string) => void
}

const CARD: React.CSSProperties = {
  background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12,
}
const LABEL_UPPER: React.CSSProperties = {
  fontSize: 10, textTransform: "uppercase" as const, letterSpacing: "0.08em",
  fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 6,
}

function HUList({ hus, color, onVerHU, limit = 3 }: {
  hus: HistoriaUsuario[]; color: string; onVerHU: (hu: HistoriaUsuario) => void; limit?: number
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {hus.slice(0, limit).map(hu => (
        <div
          key={hu.id}
          onClick={() => onVerHU(hu)}
          className="hover:bg-secondary/60"
          style={{
            display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            padding: "5px 7px", borderRadius: 7,
            border: `1px solid color-mix(in oklch, ${color} 25%, var(--border))`,
          }}
        >
          <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--primary)", fontWeight: 700, flexShrink: 0 }}>{hu.codigo}</span>
          <span style={{ fontSize: 11, color: "var(--foreground)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hu.titulo}</span>
        </div>
      ))}
      {hus.length > limit && (
        <p style={{ fontSize: 10, color: "var(--muted-foreground)", paddingLeft: 7 }}>+{hus.length - limit} más</p>
      )}
    </div>
  )
}

export function PanelRiesgos({ historias, casos, onVerHU, onIrATab }: Props) {
  const hoy = Date.now()

  const riesgos = useMemo(() => {
    const activas = historias.filter(h => h.estado !== "exitosa" && h.estado !== "cancelada")

    const husVencidas = activas.filter(h =>
      h.fechaFinEstimada && h.fechaFinEstimada.getTime() < hoy
    )
    const husPorVencer3 = activas.filter(h => {
      if (!h.fechaFinEstimada) return false
      const dias = (h.fechaFinEstimada.getTime() - hoy) / 86400000
      return dias >= 0 && dias <= 3
    })
    const husPorVencer7 = activas.filter(h => {
      if (!h.fechaFinEstimada) return false
      const dias = (h.fechaFinEstimada.getTime() - hoy) / 86400000
      return dias > 3 && dias <= 7
    })
    const husBloqueadas = activas.filter(h => h.bloqueos.some(b => !b.resuelto))

    const casosHuerfanos: { caso: CasoPrueba; hu: HistoriaUsuario }[] = []
    historias
      .filter(h => h.etapa !== "sin_iniciar" && h.estado !== "cancelada")
      .forEach(h => {
        casos
          .filter(c => h.casosIds.includes(c.id) && c.estadoAprobacion === "aprobado" && c.resultadosPorEtapa.length === 0)
          .forEach(c => casosHuerfanos.push({ caso: c, hu: h }))
      })

    return { husVencidas, husPorVencer3, husPorVencer7, husBloqueadas, casosHuerfanos }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historias, casos])

  const totalAlertas =
    riesgos.husVencidas.length +
    riesgos.husPorVencer3.length +
    riesgos.husBloqueadas.length +
    riesgos.casosHuerfanos.length

  const sinRiesgo = totalAlertas === 0 && riesgos.husPorVencer7.length === 0

  if (sinRiesgo) {
    return (
      <div style={{ ...CARD, padding: "16px 20px", borderLeft: "3px solid var(--chart-2)", display: "flex", alignItems: "center", gap: 10 }}>
        <CheckCircle size={16} style={{ color: "var(--chart-2)", flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>Sin riesgos detectados</p>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Todas las HUs activas están dentro del plazo y sin bloqueos.</p>
        </div>
      </div>
    )
  }

  const hasDetailItems =
    riesgos.husVencidas.length > 0 ||
    riesgos.husPorVencer3.length > 0 ||
    riesgos.husPorVencer7.length > 0 ||
    riesgos.husBloqueadas.length > 0 ||
    riesgos.casosHuerfanos.length > 0

  return (
    <div style={{ ...CARD, padding: "18px 20px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <ShieldAlert size={14} style={{ color: totalAlertas > 0 ? "var(--chart-4)" : "var(--chart-3)" }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>Panel de Riesgos</span>
        {totalAlertas > 0 && (
          <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: "color-mix(in oklch, var(--chart-4) 15%, transparent)", color: "var(--chart-4)", borderRadius: 8, padding: "2px 8px" }}>
            {totalAlertas} alerta{totalAlertas !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Cards de conteo — responsive ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" style={{ marginBottom: hasDetailItems ? 16 : 0 }}>
        <div style={{ ...CARD, padding: "12px 14px", ...(riesgos.husVencidas.length > 0 ? { borderLeft: "3px solid var(--chart-4)" } : {}) }}>
          <p style={LABEL_UPPER}>Vencidas</p>
          <p style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: riesgos.husVencidas.length > 0 ? "var(--chart-4)" : "var(--muted-foreground)" }}>
            {riesgos.husVencidas.length}
          </p>
          <p style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>fecha superada</p>
        </div>

        <div style={{ ...CARD, padding: "12px 14px", ...(riesgos.husPorVencer3.length > 0 ? { borderLeft: "3px solid var(--chart-4)" } : {}) }}>
          <p style={LABEL_UPPER}>Próx. 3 días</p>
          <p style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: riesgos.husPorVencer3.length > 0 ? "var(--chart-4)" : "var(--muted-foreground)" }}>
            {riesgos.husPorVencer3.length}
          </p>
          <p style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>por vencer</p>
        </div>

        <div style={{ ...CARD, padding: "12px 14px", ...(riesgos.husPorVencer7.length > 0 ? { borderLeft: "3px solid var(--chart-3)" } : {}) }}>
          <p style={LABEL_UPPER}>Próx. 7 días</p>
          <p style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: riesgos.husPorVencer7.length > 0 ? "var(--chart-3)" : "var(--muted-foreground)" }}>
            {riesgos.husPorVencer7.length}
          </p>
          <p style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>atención pronto</p>
        </div>

        <div style={{ ...CARD, padding: "12px 14px", ...(riesgos.husBloqueadas.length > 0 ? { borderLeft: "3px solid var(--chart-4)" } : {}) }}>
          <p style={LABEL_UPPER}>Bloqueadas</p>
          <p style={{ fontSize: 24, fontWeight: 800, lineHeight: 1, color: riesgos.husBloqueadas.length > 0 ? "var(--chart-4)" : "var(--muted-foreground)" }}>
            {riesgos.husBloqueadas.length}
          </p>
          <p style={{ fontSize: 10, color: "var(--muted-foreground)", marginTop: 3 }}>con bloqueos</p>
        </div>
      </div>

      {/* ── Detalle de items — responsive ── */}
      {hasDetailItems && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {riesgos.husVencidas.length > 0 && (
            <div>
              <p style={{ ...LABEL_UPPER, marginBottom: 7, display: "flex", alignItems: "center", gap: 4 }}>
                <XCircle size={10} style={{ color: "var(--chart-4)" }} /> HUs Vencidas
              </p>
              <HUList hus={riesgos.husVencidas} color="var(--chart-4)" onVerHU={onVerHU} />
            </div>
          )}

          {(riesgos.husPorVencer3.length > 0 || riesgos.husPorVencer7.length > 0) && (
            <div>
              <p style={{ ...LABEL_UPPER, marginBottom: 7, display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} style={{ color: "var(--chart-3)" }} /> Por vencer
              </p>
              <HUList hus={[...riesgos.husPorVencer3, ...riesgos.husPorVencer7]} color="var(--chart-3)" onVerHU={onVerHU} />
            </div>
          )}

          {riesgos.husBloqueadas.length > 0 && (
            <div>
              <p style={{ ...LABEL_UPPER, marginBottom: 7, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={10} style={{ color: "var(--chart-4)" }} /> Bloqueadas
              </p>
              <HUList hus={riesgos.husBloqueadas} color="var(--chart-4)" onVerHU={onVerHU} />
              <button
                onClick={() => onIrATab("bloqueos")}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 8, fontSize: 11, fontWeight: 600, color: "var(--chart-4)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Ver bloqueos <ArrowRight size={10} />
              </button>
            </div>
          )}

          {riesgos.casosHuerfanos.length > 0 && (
            <div>
              <p style={{ ...LABEL_UPPER, marginBottom: 7, display: "flex", alignItems: "center", gap: 4 }}>
                <Eye size={10} style={{ color: "var(--chart-3)" }} /> Casos sin ejecutar
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {riesgos.casosHuerfanos.slice(0, 3).map(({ caso, hu }) => (
                  <div
                    key={caso.id}
                    onClick={() => onVerHU(hu)}
                    className="hover:bg-secondary/60"
                    style={{
                      display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                      padding: "5px 7px", borderRadius: 7,
                      border: "1px solid color-mix(in oklch, var(--chart-3) 25%, var(--border))",
                    }}
                  >
                    <span style={{ fontSize: 9, fontFamily: "monospace", color: "var(--primary)", fontWeight: 700, flexShrink: 0 }}>{hu.codigo}</span>
                    <span style={{ fontSize: 11, color: "var(--foreground)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{caso.titulo}</span>
                  </div>
                ))}
                {riesgos.casosHuerfanos.length > 3 && (
                  <p style={{ fontSize: 10, color: "var(--muted-foreground)", paddingLeft: 7 }}>
                    +{riesgos.casosHuerfanos.length - 3} más
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
