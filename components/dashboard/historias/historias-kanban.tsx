"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Clock, Edit, Layers, Trash2, UserX } from "lucide-react"
import {
  PRIORIDAD_CFG,
  getEtapaHUCfg, ETAPAS_PREDETERMINADAS,
  type HistoriaUsuario, type CasoPrueba, type EstadoHU,
  type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef,
} from "@/lib/types"
import { useAuth } from "@/lib/contexts/auth-context"
import { isResponsableActivo } from "@/lib/utils/asignaciones"

const PRIORIDAD_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baja: 3 }

const KANBAN_COLUMNAS = [
  { key: "sin_iniciar", label: "Sin iniciar",         color: "var(--muted-foreground)", estados: ["sin_iniciar"] as EstadoHU[] },
  { key: "en_progreso", label: "En progreso",         color: "var(--chart-1)",          estados: ["en_progreso"] as EstadoHU[] },
  { key: "exitosa",     label: "Exitosa",             color: "var(--chart-2)",          estados: ["exitosa"] as EstadoHU[] },
  { key: "cerrada",     label: "Fallida / Cancelada", color: "var(--chart-4)",          estados: ["fallida", "cancelada"] as EstadoHU[] },
] as const

function UrgenciaBadge({ fecha, estado }: { fecha?: Date; estado: string }) {
  if (!fecha || estado === "exitosa" || estado === "cancelada") return null
  const dias = Math.ceil((fecha.getTime() - Date.now()) / 86400000)
  if (dias > 14) return null

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

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  configEtapas: ConfigEtapas
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
  canEdit?: boolean
  onVerDetalle: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
}

export function HistoriasKanban({
  historias, casos, configEtapas, canEdit, onVerDetalle, onEditar, onEliminar,
}: Props) {
  const { users } = useAuth()
  return (
    <div className="overflow-x-auto -mx-1 px-1">
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, alignItems:"start", minWidth: 700 }}>
      {KANBAN_COLUMNAS.map(col => {
        const husCol = historias
          .filter(hu => (col.estados as readonly string[]).includes(hu.estado))
          .sort((a, b) => PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad])

        return (
          <div key={col.key} style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {/* Cabecera columna */}
            <div style={{
              padding:"8px 12px", borderRadius:8,
              borderTop:`3px solid ${col.color}`,
              background:"var(--secondary)", border:`1px solid var(--border)`,
              borderTopColor: col.color,
              display:"flex", alignItems:"center", justifyContent:"space-between",
            }}>
              <span style={{ fontSize:11, fontWeight:700, color: col.color, textTransform:"uppercase", letterSpacing:"0.07em" }}>
                {col.label}
              </span>
              <span style={{
                background: husCol.length > 0 ? `color-mix(in oklch, ${col.color} 18%, transparent)` : "var(--muted)",
                color: husCol.length > 0 ? col.color : "var(--muted-foreground)",
                borderRadius:12, fontSize:10, fontWeight:700,
                padding:"1px 7px", minWidth:20, textAlign:"center",
              }}>
                {husCol.length}
              </span>
            </div>

            {/* Cards */}
            {husCol.length === 0 && (
              <div style={{ textAlign:"center", padding:"24px 12px", color:"var(--muted-foreground)", border:"1px dashed var(--border)", borderRadius:8, fontSize:12 }}>
                Sin HUs
              </div>
            )}

            {husCol.map(hu => {
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
                <div key={hu.id}
                  onClick={() => onVerDetalle(hu)}
                  className="hover:bg-secondary/60"
                  style={{
                    padding:"10px 12px", borderRadius:10, cursor:"pointer",
                    border: tieneBloqueos
                      ? "1px solid color-mix(in oklch, var(--chart-4) 45%, var(--border))"
                      : "1px solid var(--border)",
                    background:"var(--card)", transition:"background 0.15s",
                    display:"flex", flexDirection:"column", gap:7,
                  }}
                >
                  {/* Fila 1: código + prioridad + urgencia + bloqueo */}
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                    <span style={{ fontSize:10, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, flexShrink:0 }}>
                      {hu.codigo}
                    </span>
                    <Badge variant="outline" className={`${priCfg.cls} text-[9px]`} style={{ padding:"0px 5px" }}>
                      {priCfg.label}
                    </Badge>
                    <UrgenciaBadge fecha={hu.fechaFinEstimada} estado={hu.estado} />
                    {tieneBloqueos && <span title="Bloqueos activos"><AlertTriangle size={11} style={{ color:"var(--chart-4)", flexShrink:0 }}/></span>}
                  </div>

                  {/* Fila 2: título */}
                  <p style={{ fontSize:12, fontWeight:600, color:"var(--foreground)", lineHeight:1.35,
                    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
                    margin:0,
                  }}>
                    {hu.titulo}
                  </p>

                  {/* Fila 3: etapa + casos */}
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                    <Badge variant="outline" className={`${etaCfg.cls} text-[9px]`} style={{ padding:"0px 5px" }}>
                      {etaCfg.label}
                    </Badge>
                    <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:"var(--muted-foreground)" }}>
                      <Layers size={9}/> {casosHU.length}
                    </span>
                  </div>

                  {/* Fila 4: barra de progreso (si hay casos aprobados) */}
                  {casosAprobados.length > 0 && (
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <Progress value={pct} className="h-1" style={{ flex:1 }}/>
                      <span style={{ fontSize:9, color:"var(--muted-foreground)", fontFamily:"monospace", flexShrink:0 }}>{pct}%</span>
                    </div>
                  )}

                  {/* Fila 5: responsable + acciones */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:2 }}
                    onClick={e => e.stopPropagation()}>
                    <p style={{ fontSize:10, color:"var(--muted-foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, minWidth:0, display:"flex", alignItems:"center", gap:3 }}>
                      {hu.responsable}
                      {!isResponsableActivo(hu.responsable, users) && (
                        <UserX size={9} style={{ color:"var(--chart-4)", flexShrink:0 }} title="Responsable sin workspace activo" />
                      )}
                    </p>
                    <div style={{ display:"flex", gap:2, flexShrink:0 }}>
                      {canEdit && <>
                        <button onClick={() => onEditar(hu)} title="Editar"
                          style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px", color:"var(--muted-foreground)", borderRadius:4, display:"flex" }}
                          className="hover:text-foreground hover:bg-secondary">
                          <Edit size={11}/>
                        </button>
                        <button onClick={() => onEliminar(hu)} title="Eliminar"
                          style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px", color:"var(--chart-4)", borderRadius:4, display:"flex" }}
                          className="hover:bg-secondary">
                          <Trash2 size={11}/>
                        </button>
                      </>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
    </div>
  )
}
