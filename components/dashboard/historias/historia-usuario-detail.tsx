"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  CheckSquare, Star,
  ShieldAlert, Layers,
  User, Play, XCircle, Send, ThumbsUp, ThumbsDown,
  Lock, Unlock,
  MessageSquare, UserX,
} from "lucide-react"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG,
  etapaDefsParaTipo, getEtapaHUCfg,
  getTipoAplicacionLabel, getAmbienteLabel, getTipoPruebaLabel, getTipoPruebaColor,
  type HistoriaUsuario, type CasoPrueba, type Tarea, type BloqueoActivo, type BloqueoResuelto,
  type EtapaEjecucion,
} from "@/lib/types"
import { CommentThread } from "../shared/comment-thread"
import { useHUDetail } from "@/lib/contexts/hu-detail-context"
import { useAuth } from "@/lib/contexts/auth-context"
import { isResponsableActivo } from "@/lib/utils/asignaciones"
import { HUBloqueos } from "./hu-bloqueos"
import { HUHistorialPanel } from "./hu-historial"
import { HUCasosPanel } from "./hu-casos-panel"
import { PNL, SLBL, fmt } from "./hu-detail-shared"

// ── Props ──────────────────────────────────────────────────────
interface Props {
  open: boolean
  onClose: () => void
  hu: HistoriaUsuario | null
  casos: CasoPrueba[]
  tareas: Tarea[]
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export function HistoriaUsuarioDetail({ open, onClose, hu, casos, tareas }: Props) {
  const {
    isAdmin, isQALead, isQA, currentUser,
    configEtapas, tiposAplicacion, ambientes, tiposPrueba,
    onIniciarHU, onCancelarHU, onEnviarAprobacion,
    onAprobarCasos, onRechazarCasos, onIniciarEjecucion,
    onPermitirCasosAdicionales, onAddComentarioHU,
  } = useHUDetail()
  const { users } = useAuth()

  // Form visibility
  const [showCancelarForm, setShowCancelarForm] = useState(false)
  const [showRechazoForm, setShowRechazoForm] = useState(false)
  const [showExcepcionForm, setShowExcepcionForm] = useState(false)

  // Text inputs
  const [motivoCancelacion, setMotivoCancelacion] = useState("")
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [motivoExcepcion, setMotivoExcepcion] = useState("")
  if (!hu) return null

  const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
  const blActivos = hu.bloqueos.filter((b): b is BloqueoActivo => !b.resuelto)
  const blResueltos = hu.bloqueos.filter((b): b is BloqueoResuelto => b.resuelto)

  const estCfg = ESTADO_HU_CFG[hu.estado]
  const etaCfg = getEtapaHUCfg(hu.etapa, configEtapas)
  const priCfg = PRIORIDAD_CFG[hu.prioridad]

  const huCerrada = hu.estado === "exitosa" || hu.estado === "cancelada" || hu.estado === "fallida"

  const etapasDisponibles = etapaDefsParaTipo(hu.tipoAplicacion, configEtapas)
  const primeraEtapa = etapasDisponibles[0]?.id
  const enDespliegue = hu.etapa === primeraEtapa
  const pasoPrimeraEtapa = hu.etapa !== "sin_iniciar" && hu.etapa !== primeraEtapa
  const puedeAgregarCasos = !huCerrada && hu.estado === "en_progreso" && (enDespliegue || hu.permitirCasosAdicionales)

  const borradores = casosHU.filter(c => c.estadoAprobacion === "borrador")
  const pendientesAprobacion = casosHU.filter(c => c.estadoAprobacion === "pendiente_aprobacion")
  const aprobados = casosHU.filter(c => c.estadoAprobacion === "aprobado")

  const etapaYaIniciada = aprobados.some(c =>
    c.resultadosPorEtapa.some(r => r.etapa === hu.etapa && r.estado !== "pendiente")
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ width:"min(1200px, calc(100vw - 32px))", maxWidth:"min(1200px, calc(100vw - 32px))", maxHeight:"92vh", overflowY:"auto", padding:0 }} className="no-scrollbar" aria-describedby={undefined}>
        <DialogTitle style={{ position:"absolute", width:1, height:1, overflow:"hidden", clip:"rect(0,0,0,0)", whiteSpace:"nowrap" }}>{hu.titulo}</DialogTitle>

        <div style={{ padding:"24px 28px" }}>

          {/* ── HEADER ── */}
          <div style={{ borderBottom:"1px solid var(--border)", paddingBottom:16, marginBottom:20, paddingRight:36 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <p style={{ fontSize:11, fontFamily:"monospace", color:"var(--primary)", letterSpacing:"0.12em" }}>{hu.codigo}</p>
              <Badge variant="outline" className={estCfg.cls}>{estCfg.label}</Badge>
              <Badge variant="outline" className={etaCfg.cls}>{etaCfg.label}</Badge>
              {huCerrada && (
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]">
                  <Lock size={9} className="mr-1"/> Solo lectura
                </Badge>
              )}
            </div>
            <p style={{ fontSize:19, fontWeight:700, color:"var(--foreground)", lineHeight:1.3, marginBottom:10 }}>{hu.titulo}</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <Badge variant="outline" className={priCfg.cls}>Prioridad {priCfg.label}</Badge>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, color:"var(--muted-foreground)" }}><Star size={12}/>{hu.puntos} pts</span>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, color:"var(--muted-foreground)" }}>
                <User size={12}/>
                {hu.responsable}
                {!isResponsableActivo(hu.responsable, users) && (
                  <UserX size={11} style={{ color:"var(--chart-4)" }} aria-label="Responsable sin workspace activo" />
                )}
              </span>
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">{getTipoAplicacionLabel(hu.tipoAplicacion, tiposAplicacion)}</Badge>
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">{getAmbienteLabel(hu.ambiente, ambientes)}</Badge>
              <Badge variant="outline" className={`${getTipoPruebaColor(hu.tipoPrueba)} text-[10px]`}>{getTipoPruebaLabel(hu.tipoPrueba, tiposPrueba)}</Badge>
              {blActivos.length>0 && <Badge variant="outline" className="bg-chart-4/20 text-chart-4 border-chart-4/30"><ShieldAlert size={11} className="mr-1"/>{blActivos.length} bloqueo{blActivos.length>1?"s":""}</Badge>}
            </div>

            {/* Acciones de cabecera */}
            {!huCerrada && (
              <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                {isQA && hu.estado === "sin_iniciar" && (
                  <Button size="sm" onClick={() => onIniciarHU(hu.id)}>
                    <Play size={12} className="mr-1"/> Iniciar HU
                  </Button>
                )}
                {(isAdmin || isQALead) && hu.estado !== "cancelada" && hu.estado !== "exitosa" && (
                  <Button size="sm" variant="outline" style={{ color:"var(--chart-4)", borderColor:"var(--chart-4)" }}
                    onClick={() => setShowCancelarForm(true)}>
                    <XCircle size={12} className="mr-1"/> Cancelar HU
                  </Button>
                )}
                {isQA && (borradores.length > 0 || casosHU.filter(c => c.estadoAprobacion === "rechazado").length > 0) && (
                  <Button size="sm" variant="outline" onClick={() => onEnviarAprobacion(hu.id)}>
                    <Send size={12} className="mr-1"/>
                    Enviar todos a aprobación ({borradores.length + casosHU.filter(c => c.estadoAprobacion === "rechazado").length})
                  </Button>
                )}
                {(isAdmin || isQALead) && pendientesAprobacion.length > 0 && (
                  <>
                    <Button size="sm" onClick={() => onAprobarCasos(hu.id)} className="bg-chart-2 hover:bg-chart-2/90 text-white">
                      <ThumbsUp size={12} className="mr-1"/> Aprobar ({pendientesAprobacion.length})
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowRechazoForm(true)} style={{ color:"var(--chart-4)" }}>
                      <ThumbsDown size={12} className="mr-1"/> Rechazar
                    </Button>
                  </>
                )}
                {isQA && hu.estado === "en_progreso" && aprobados.length > 0 && hu.etapa !== "completada" && hu.etapa !== "cambio_cancelado" && hu.etapa !== "sin_iniciar" && (
                  <Button size="sm" variant="outline" disabled={etapaYaIniciada}
                    style={etapaYaIniciada ? { borderColor:"var(--chart-1)", color:"var(--chart-1)", opacity:0.7, cursor:"not-allowed" } : {}}
                    onClick={() => !etapaYaIniciada && onIniciarEjecucion(hu.id, hu.etapa as EtapaEjecucion)}>
                    {etapaYaIniciada
                      ? <><span style={{ width:7, height:7, borderRadius:"50%", background:"var(--chart-1)", display:"inline-block", marginRight:6 }}/> En progreso — {getEtapaHUCfg(hu.etapa, configEtapas).label}</>
                      : <><Play size={12} className="mr-1"/> Iniciar ejecución — {getEtapaHUCfg(hu.etapa, configEtapas).label}</>
                    }
                  </Button>
                )}
                {(isAdmin || isQALead) && pasoPrimeraEtapa && !hu.permitirCasosAdicionales && hu.estado === "en_progreso" && (
                  <Button size="sm" variant="outline" onClick={() => setShowExcepcionForm(true)}>
                    <Unlock size={12} className="mr-1"/> Permitir más casos
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Cancelación form */}
          {showCancelarForm && (
            <div style={{ ...PNL, marginBottom:16, borderColor:"var(--chart-4)" }}>
              <p style={{ fontSize:12, fontWeight:600, color:"var(--chart-4)", marginBottom:8 }}>Motivo de cancelación *</p>
              <Textarea rows={2} value={motivoCancelacion} onChange={e => setMotivoCancelacion(e.target.value)}
                placeholder="Razón por la que se cancela esta HU..." style={{ marginBottom:8, resize:"none" }} />
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button variant="outline" size="sm" onClick={() => { setShowCancelarForm(false); setMotivoCancelacion("") }}>Cancelar</Button>
                <Button size="sm" disabled={!motivoCancelacion.trim()} className="bg-chart-4 hover:bg-chart-4/90 text-white"
                  onClick={() => { onCancelarHU(hu.id, motivoCancelacion.trim()); setShowCancelarForm(false); setMotivoCancelacion("") }}>
                  Confirmar cancelación
                </Button>
              </div>
            </div>
          )}

          {/* Rechazo form */}
          {showRechazoForm && (
            <div style={{ ...PNL, marginBottom:16, borderColor:"var(--chart-4)" }}>
              <p style={{ fontSize:12, fontWeight:600, color:"var(--chart-4)", marginBottom:8 }}>Motivo de rechazo *</p>
              <Textarea rows={2} value={motivoRechazo} onChange={e => setMotivoRechazo(e.target.value)}
                placeholder="Razón del rechazo de los casos..." style={{ marginBottom:8, resize:"none" }} />
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button variant="outline" size="sm" onClick={() => { setShowRechazoForm(false); setMotivoRechazo("") }}>Cancelar</Button>
                <Button size="sm" disabled={!motivoRechazo.trim()} className="bg-chart-4 hover:bg-chart-4/90 text-white"
                  onClick={() => { onRechazarCasos(hu.id, motivoRechazo.trim()); setShowRechazoForm(false); setMotivoRechazo("") }}>
                  Confirmar rechazo
                </Button>
              </div>
            </div>
          )}

          {/* Excepción form */}
          {showExcepcionForm && (
            <div style={{ ...PNL, marginBottom:16, borderColor:"var(--chart-3)" }}>
              <p style={{ fontSize:12, fontWeight:600, color:"var(--chart-3)", marginBottom:8 }}>Justificación para agregar más casos *</p>
              <Textarea rows={2} value={motivoExcepcion} onChange={e => setMotivoExcepcion(e.target.value)}
                placeholder="Razón por la que se permite agregar más casos post-despliegue..." style={{ marginBottom:8, resize:"none" }} />
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <Button variant="outline" size="sm" onClick={() => { setShowExcepcionForm(false); setMotivoExcepcion("") }}>Cancelar</Button>
                <Button size="sm" disabled={!motivoExcepcion.trim()}
                  onClick={() => { onPermitirCasosAdicionales(hu.id, motivoExcepcion.trim()); setShowExcepcionForm(false); setMotivoExcepcion("") }}>
                  Habilitar
                </Button>
              </div>
            </div>
          )}

          {/* ── BODY 2 cols ── */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

            {/* COL PRINCIPAL */}
            <div style={{ display:"flex", flexDirection:"column", gap:18, minWidth:0 }}>

              {/* Descripción + Criterios */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div style={PNL}>
                  <p style={SLBL}>Descripción</p>
                  <p style={{ fontSize:13, color:"var(--foreground)", lineHeight:1.6 }}>{hu.descripcion || "—"}</p>
                </div>
                <div style={PNL}>
                  <p style={SLBL}><CheckSquare size={11}/>Criterios de Aceptación</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {hu.criteriosAceptacion ? hu.criteriosAceptacion.split("\n").filter(Boolean).map((c,i)=>(
                      <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start" }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--primary)", marginTop:6, flexShrink:0 }}/>
                        <p style={{ fontSize:12, color:"var(--foreground)", lineHeight:1.5 }}>{c.replace(/^-\s*/,"")}</p>
                      </div>
                    )) : <p style={{ fontSize:12, color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin criterios definidos</p>}
                  </div>
                </div>
              </div>

              {/* Info adicional */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label:"Aplicación", value: hu.aplicacion },
                  { label:"Requiriente", value: hu.requiriente },
                  { label:"Área", value: hu.areaSolicitante },
                  { label:"Creado", value: fmt(hu.fechaCreacion) },
                ].map((m,i)=>(
                  <div key={i} style={{ ...PNL, padding:"10px 12px" }}>
                    <p style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted-foreground)", marginBottom:4 }}>{m.label}</p>
                    <p style={{ fontSize:12, fontWeight:600, color:"var(--foreground)" }}>{m.value}</p>
                  </div>
                ))}
              </div>

              {/* ── ETAPAS DE EJECUCIÓN ── */}
              {hu.etapa !== "sin_iniciar" && (
                <div style={PNL}>
                  <p style={SLBL}><Layers size={11}/>Etapas de Ejecución</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(80px, 1fr))", gap:8 }}>
                    {etapasDisponibles.map((et, i) => {
                      const esCurrent = hu.etapa === et.id
                      const currentIdx = etapasDisponibles.findIndex(e => e.id === hu.etapa)
                      const esCompletada = currentIdx > i || hu.etapa === "completada"
                      return (
                        <div key={et.id} style={{ flex:1, padding:"10px 14px", borderRadius:8,
                          border: esCurrent ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: esCompletada ? "color-mix(in oklch, var(--chart-2) 8%, transparent)" : esCurrent ? "color-mix(in oklch, var(--primary) 8%, transparent)" : "transparent",
                          textAlign:"center" }}>
                          <p style={{ fontSize:10, fontWeight:700, color: esCompletada ? "var(--chart-2)" : esCurrent ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase" }}>
                            {et.label}
                          </p>
                          <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:2 }}>
                            {esCompletada ? "Completada" : esCurrent ? "Actual" : "Pendiente"}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── CASOS DE PRUEBA ── */}
              <HUCasosPanel
                casosHU={casosHU}
                hu={hu}
                tareas={tareas}
                puedeAgregarCasos={puedeAgregarCasos}
                pasoPrimeraEtapa={pasoPrimeraEtapa}
              />

              {/* ── BLOQUEOS HU ── */}
              <HUBloqueos
                hu={hu}
                blActivos={blActivos}
                blResueltos={blResueltos}
                huCerrada={huCerrada}
              />

              {/* ── COMENTARIOS HU ── */}
              <div style={PNL}>
                <p style={{ ...SLBL, marginBottom:12 }}><MessageSquare size={11}/>Comentarios de la HU ({hu.comentarios.length})</p>
                <CommentThread
                  comentarios={hu.comentarios}
                  onAdd={texto => onAddComentarioHU(hu.id, texto)}
                  currentUser={currentUser}
                  canComment={isAdmin || isQALead || isQA}
                />
              </div>
            </div>

            {/* COL DERECHA: Historial */}
            <div style={{ position:"sticky", top:0 }}>
              <HUHistorialPanel historial={hu.historial} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
