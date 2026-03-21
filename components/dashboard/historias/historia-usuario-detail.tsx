"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  CheckSquare, Star, TrendingUp,
  AlertTriangle, Plus, CheckCircle2, ShieldAlert, Layers,
  User, Play, XCircle, Send, ThumbsUp, ThumbsDown,
  Lock, Unlock, FileText,
  Pencil, MessageSquare,
} from "lucide-react"
import {
  ESTADO_HU_CFG, PRIORIDAD_CFG,
  etapaDefsParaTipo, getEtapaHUCfg, ETAPAS_PREDETERMINADAS,
  getTipoAplicacionLabel, getAmbienteLabel, getTipoPruebaLabel, getTipoPruebaColor,
  TIPOS_PRUEBA_PREDETERMINADOS,
  fmtCorto, fmtHora,
  type HistoriaUsuario, type CasoPrueba, type Tarea, type Bloqueo,
  type EtapaEjecucion, type TipoPrueba, type ComplejidadCaso, type EntornoCaso,
  type TipoPruebaDef,
} from "@/lib/types"
import { CommentThread } from "../shared/comment-thread"
import { CasoPruebaCard } from "../casos/caso-prueba-card"
import { useHUDetail } from "@/lib/contexts/hu-detail-context"

// ── Props ──────────────────────────────────────────────────────
// Los handlers, permisos y config se consumen desde HUDetailContext.
// Solo se pasan los datos específicos de cada instancia del diálogo.
interface Props {
  open: boolean
  onClose: () => void
  hu: HistoriaUsuario | null
  casos: CasoPrueba[]
  tareas: Tarea[]
}

// ── Helpers ──
const PNL: React.CSSProperties = { padding:"13px 15px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }
const SLBL: React.CSSProperties = { fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:10, display:"flex", alignItems:"center", gap:5 }

function fmt(d: Date): string {
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
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
  const blActivos = hu.bloqueos.filter(b => !b.resuelto)
  const blResueltos = hu.bloqueos.filter(b => b.resuelto)

  const estCfg = ESTADO_HU_CFG[hu.estado]
  const etaCfg = getEtapaHUCfg(hu.etapa, configEtapas)
  const priCfg = PRIORIDAD_CFG[hu.prioridad]

  // HU cerrada = ya no se puede crear nada
  const huCerrada = hu.estado === "exitosa" || hu.estado === "cancelada" || hu.estado === "fallida"

  // Puede agregar casos?
  const etapasDisponibles = etapaDefsParaTipo(hu.tipoAplicacion, configEtapas)
  const primeraEtapa = etapasDisponibles[0]?.id
  const enDespliegue = hu.etapa === primeraEtapa
  const pasoPrimeraEtapa = hu.etapa !== "sin_iniciar" && hu.etapa !== primeraEtapa
  const puedeAgregarCasos = !huCerrada && hu.estado === "en_progreso" && (enDespliegue || hu.permitirCasosAdicionales)

  // Casos con estados
  const borradores = casosHU.filter(c => c.estadoAprobacion === "borrador")
  const pendientesAprobacion = casosHU.filter(c => c.estadoAprobacion === "pendiente_aprobacion")
  const aprobados = casosHU.filter(c => c.estadoAprobacion === "aprobado")

  // Etapa ya iniciada
  const etapaYaIniciada = aprobados.some(c =>
    c.resultadosPorEtapa.some(r => r.etapa === hu.etapa && r.estado !== "pendiente")
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ width:"min(1200px, calc(100vw - 32px))", maxWidth:"min(1200px, calc(100vw - 32px))", maxHeight:"92vh", overflowY:"auto", padding:0 }} className="no-scrollbar">
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
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, color:"var(--muted-foreground)" }}><User size={12}/>{hu.responsable}</span>
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
                {/* Enviar todos los borradores/rechazados a aprobación */}
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

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════

// ── Bloqueos de la HU ─────────────────────────────────────────
interface HUBloqueosProps {
  hu: HistoriaUsuario
  blActivos: Bloqueo[]
  blResueltos: Bloqueo[]
  huCerrada: boolean
}

function HUBloqueos({ hu, blActivos, blResueltos, huCerrada }: HUBloqueosProps) {
  const { isQA, isAdmin, isQALead, currentUser, onAddBloqueo, onResolverBloqueo } = useHUDetail()
  const [showBloqueoForm, setShowBloqueoForm] = useState(false)
  const [nuevoBloqueo, setNuevoBloqueo] = useState("")
  const [showResolverForm, setShowResolverForm] = useState<string | null>(null)
  const [notaResolucion, setNotaResolucion] = useState("")

  return (
    <div style={PNL}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <p style={{ ...SLBL, marginBottom:0 }}><ShieldAlert size={11}/>Bloqueos de la HU</p>
        {(isQA || isAdmin || isQALead) && !huCerrada && (
          <button onClick={()=>setShowBloqueoForm(v=>!v)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"var(--primary)", display:"flex", alignItems:"center", gap:4, fontWeight:600 }}>
            <Plus size={11}/>Reportar
          </button>
        )}
      </div>
      {showBloqueoForm && (
        <div style={{ marginBottom:10 }}>
          <Textarea rows={2} value={nuevoBloqueo} onChange={e=>setNuevoBloqueo(e.target.value)}
            placeholder="Describe el bloqueo..."
            style={{ marginBottom:8, resize:"vertical", width:"100%", maxWidth:"100%", wordBreak:"break-word" }}/>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Button variant="outline" size="sm" onClick={()=>setShowBloqueoForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={()=>{
              if (!nuevoBloqueo.trim()) return
              onAddBloqueo(hu.id, { id:`bl-${Date.now()}`, descripcion:nuevoBloqueo.trim(), fecha:new Date(), resuelto:false, reportadoPor:currentUser||"Sistema" })
              setNuevoBloqueo(""); setShowBloqueoForm(false)
            }} disabled={!nuevoBloqueo.trim()}>Guardar</Button>
          </div>
        </div>
      )}
      {hu.bloqueos.length===0 && !showBloqueoForm && <p style={{ fontSize:12, color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin bloqueos</p>}
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {blActivos.map(b=>(
          <div key={b.id} style={{ borderRadius:8, background:"color-mix(in oklch, var(--chart-4) 6%, transparent)", border:"1px solid color-mix(in oklch, var(--chart-4) 30%, var(--border))", overflow:"hidden" }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"9px 11px" }}>
              <AlertTriangle size={13} style={{ color:"var(--chart-4)", marginTop:2, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, color:"var(--foreground)", lineHeight:1.4, marginBottom:2 }}>{b.descripcion}</p>
                <p style={{ fontSize:11, color:"var(--muted-foreground)" }}>{fmt(b.fecha)} · {b.reportadoPor}</p>
              </div>
              {(isAdmin || isQALead || isQA) && showResolverForm !== b.id && (
                <Button variant="outline" size="sm" onClick={()=>{ setShowResolverForm(b.id); setNotaResolucion("") }} style={{ height:26, fontSize:11, flexShrink:0 }}>
                  <CheckCircle2 size={11} className="mr-1"/>Resolver
                </Button>
              )}
            </div>
            {showResolverForm === b.id && (
              <div style={{ padding:"0 11px 10px 11px", borderTop:"1px solid color-mix(in oklch, var(--chart-4) 20%, var(--border))" }}>
                <p style={{ fontSize:11, fontWeight:600, color:"var(--chart-3)", margin:"8px 0 5px" }}>¿Cómo se levantó el bloqueo? *</p>
                <Textarea rows={2} value={notaResolucion} onChange={e => setNotaResolucion(e.target.value)}
                  placeholder="Describe cómo se resolvió el bloqueo..." style={{ fontSize:11, resize:"none", marginBottom:7 }} />
                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                  <Button variant="outline" size="sm" style={{ height:24, fontSize:10 }}
                    onClick={() => { setShowResolverForm(null); setNotaResolucion("") }}>Cancelar</Button>
                  <Button size="sm" style={{ height:24, fontSize:10 }} disabled={!notaResolucion.trim()}
                    className="bg-chart-2 hover:bg-chart-2/90 text-white"
                    onClick={() => { onResolverBloqueo(hu.id, b.id, notaResolucion.trim()); setShowResolverForm(null); setNotaResolucion("") }}>
                    <CheckCircle2 size={10} className="mr-1"/>Confirmar resolución
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {blResueltos.map(b=>(
          <div key={b.id} style={{ display:"flex", gap:8, padding:"8px 11px", borderRadius:8, background:"var(--secondary)", opacity:0.7 }}>
            <CheckCircle2 size={13} style={{ color:"var(--chart-2)", flexShrink:0, marginTop:2 }}/>
            <div>
              <p style={{ fontSize:12, color:"var(--foreground)", textDecoration:"line-through" }}>{b.descripcion}</p>
              <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:1 }}>Resuelto · {b.reportadoPor}{b.resueltoPor ? ` por ${b.resueltoPor}` : ""}</p>
              {b.notaResolucion && <p style={{ fontSize:11, color:"var(--chart-2)", marginTop:2 }}><strong>Resolución:</strong> {b.notaResolucion}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Historial de la HU ────────────────────────────────────────
interface HUHistorialPanelProps {
  historial: HistoriaUsuario["historial"]
}

function HUHistorialPanel({ historial }: HUHistorialPanelProps) {
  return (
    <div style={PNL}>
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
        <TrendingUp size={13} className="text-chart-1"/>
        <p style={{ fontSize:12, fontWeight:700, color:"var(--foreground)" }}>Historial</p>
      </div>
      {historial.length===0
        ? <p style={{ fontSize:12, color:"var(--muted-foreground)", textAlign:"center", padding:"12px 0" }}>Sin eventos</p>
        : (
          <div style={{ display:"flex", flexDirection:"column", maxHeight:520, overflowY:"auto" }} className="no-scrollbar">
            {[...historial].reverse().map((ev,i)=>{
              const isLast = i===historial.length-1
              const dotColor =
                ev.tipo.includes("bloqueo") ? (ev.tipo === "bloqueo_resuelto" ? "var(--chart-2)" : "var(--chart-4)") :
                ev.tipo.includes("rechazado") || ev.tipo.includes("cancelada") || ev.tipo.includes("fallida") ? "var(--chart-4)" :
                ev.tipo.includes("aprobado") || ev.tipo.includes("completada") || ev.tipo.includes("exitosa") ? "var(--chart-2)" :
                "var(--chart-1)"
              return (
                <div key={ev.id} style={{ display:"flex", gap:8 }}>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", marginTop:4, flexShrink:0,
                      background:dotColor, boxShadow:`0 0 0 2px ${dotColor}` }}/>
                    {!isLast && <div style={{ width:2, flex:1, minHeight:14, margin:"2px 0", background:"var(--border)" }}/>}
                  </div>
                  <div style={{ paddingBottom:isLast?0:14, flex:1, minWidth:0 }}>
                    <p style={{ fontSize:11, color:"var(--foreground)", lineHeight:1.4, marginBottom:2 }}>{ev.descripcion}</p>
                    <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{fmtCorto(ev.fecha)} · <span style={{ fontFamily:"monospace" }}>{fmtHora(ev.fecha)}</span></p>
                    <p style={{ fontSize:10, fontWeight:600, color:"var(--foreground)" }}>{ev.usuario}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </div>
  )
}

// ── Casos de Prueba panel ─────────────────────────────────────
interface HUCasosPanelProps {
  casosHU: CasoPrueba[]
  hu: HistoriaUsuario
  tareas: Tarea[]
  puedeAgregarCasos: boolean
  pasoPrimeraEtapa: boolean
}

function HUCasosPanel({ casosHU, hu, tareas, puedeAgregarCasos, pasoPrimeraEtapa }: HUCasosPanelProps) {
  const {
    isQA, isAdmin, isQALead, currentUser,
    tiposPrueba, onAddCaso, onEditarCaso,
  } = useHUDetail()

  const huCerrada = hu.estado === "exitosa" || hu.estado === "cancelada" || hu.estado === "fallida"

  const [showCasoForm, setShowCasoForm] = useState(false)
  const [editandoCaso, setEditandoCaso] = useState<CasoPrueba | null>(null)
  const [casoTitulo, setCasoTitulo]         = useState("")
  const [casoDesc, setCasoDesc]             = useState("")
  const [casoEntorno, setCasoEntorno]       = useState<EntornoCaso>("test")
  const [casoTipo, setCasoTipo]             = useState<TipoPrueba>("funcional")
  const [casoHoras, setCasoHoras]           = useState(8)
  const [casoArchivos, setCasoArchivos]     = useState("")
  const [casoComplejidad, setCasoComplejidad] = useState<ComplejidadCaso>("media")

  const resetCasoForm = () => {
    setCasoTitulo(""); setCasoDesc(""); setCasoEntorno("test"); setCasoTipo("funcional")
    setCasoHoras(8); setCasoArchivos(""); setCasoComplejidad("media")
  }

  const submitCaso = () => {
    if (!casoTitulo.trim()) return
    const caso: CasoPrueba = {
      id: `CP-${Date.now()}`, huId: hu.id,
      titulo: casoTitulo.trim(), descripcion: casoDesc.trim(),
      entorno: casoEntorno, tipoPrueba: casoTipo, horasEstimadas: casoHoras,
      archivosAnalizados: casoArchivos.split(",").map((s: string) => s.trim()).filter(Boolean),
      complejidad: casoComplejidad, estadoAprobacion: "borrador",
      resultadosPorEtapa: [], fechaCreacion: new Date(), tareasIds: [], bloqueos: [],
      creadoPor: currentUser || "Sistema", modificacionHabilitada: false, comentarios: [],
    }
    onAddCaso(caso)
    resetCasoForm()
    setShowCasoForm(false)
  }

  const submitEditarCaso = () => {
    if (!editandoCaso || !casoTitulo.trim()) return
    onEditarCaso({
      ...editandoCaso,
      titulo: casoTitulo.trim(), descripcion: casoDesc.trim(),
      entorno: casoEntorno, tipoPrueba: casoTipo, horasEstimadas: casoHoras,
      archivosAnalizados: casoArchivos.split(",").map((s: string) => s.trim()).filter(Boolean),
      complejidad: casoComplejidad, estadoAprobacion: "borrador",
      modificacionHabilitada: false, modificacionSolicitada: false,
    })
    setEditandoCaso(null)
    resetCasoForm()
  }

  const abrirEditarCaso = (caso: CasoPrueba) => {
    setEditandoCaso(caso)
    setCasoTitulo(caso.titulo); setCasoDesc(caso.descripcion)
    setCasoEntorno(caso.entorno); setCasoTipo(caso.tipoPrueba)
    setCasoHoras(caso.horasEstimadas)
    setCasoArchivos(caso.archivosAnalizados.join(", "))
    setCasoComplejidad(caso.complejidad)
    setShowCasoForm(false)
  }

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <p style={{ ...SLBL, marginBottom:0 }}>
          <FileText size={11}/>Casos de Prueba ({casosHU.length})
        </p>
        {(isQA || isAdmin || isQALead) && puedeAgregarCasos && (
          <Button size="sm" variant="outline" onClick={() => { setShowCasoForm(true); setEditandoCaso(null); resetCasoForm() }}>
            <Plus size={12} className="mr-1"/> Nuevo Caso
          </Button>
        )}
        {pasoPrimeraEtapa && !hu.permitirCasosAdicionales && !isAdmin && !isQALead && !huCerrada && (
          <span style={{ fontSize:10, color:"var(--chart-3)", display:"flex", alignItems:"center", gap:4 }}>
            <Lock size={10}/> No se pueden agregar más casos
          </span>
        )}
      </div>

      {/* Formulario nuevo caso */}
      {showCasoForm && !editandoCaso && (
        <div style={{ ...PNL, marginBottom:12, borderColor:"var(--primary)" }}>
          <p style={{ fontSize:12, fontWeight:700, color:"var(--foreground)", marginBottom:10 }}>Nuevo Caso de Prueba</p>
          <CasoFormFields
            titulo={casoTitulo} onTitulo={setCasoTitulo}
            desc={casoDesc} onDesc={setCasoDesc}
            entorno={casoEntorno} onEntorno={setCasoEntorno}
            tipo={casoTipo} onTipo={setCasoTipo}
            horas={casoHoras} onHoras={setCasoHoras}
            archivos={casoArchivos} onArchivos={setCasoArchivos}
            complejidad={casoComplejidad} onComplejidad={setCasoComplejidad}
            tiposPrueba={tiposPrueba}
          />
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Button variant="outline" size="sm" onClick={() => { setShowCasoForm(false); resetCasoForm() }}>Cancelar</Button>
            <Button size="sm" disabled={!casoTitulo.trim()} onClick={submitCaso}>Crear caso</Button>
          </div>
        </div>
      )}

      {/* Formulario editar caso */}
      {editandoCaso && (
        <div style={{ ...PNL, marginBottom:12, borderColor:"var(--chart-1)" }}>
          <p style={{ fontSize:12, fontWeight:700, color:"var(--chart-1)", marginBottom:10 }}>
            <Pencil size={12} style={{ display:"inline", marginRight:5 }}/>Editando caso: {editandoCaso.id}
          </p>
          <CasoFormFields
            titulo={casoTitulo} onTitulo={setCasoTitulo}
            desc={casoDesc} onDesc={setCasoDesc}
            entorno={casoEntorno} onEntorno={setCasoEntorno}
            tipo={casoTipo} onTipo={setCasoTipo}
            horas={casoHoras} onHoras={setCasoHoras}
            archivos={casoArchivos} onArchivos={setCasoArchivos}
            complejidad={casoComplejidad} onComplejidad={setCasoComplejidad}
            tiposPrueba={tiposPrueba}
          />
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Button variant="outline" size="sm" onClick={() => { setEditandoCaso(null); resetCasoForm() }}>Cancelar</Button>
            <Button size="sm" disabled={!casoTitulo.trim()} onClick={submitEditarCaso}>Guardar cambios</Button>
          </div>
        </div>
      )}

      {casosHU.length === 0 && !showCasoForm && !editandoCaso && (
        <div style={{ textAlign:"center", padding:24, color:"var(--muted-foreground)", border:"1px dashed var(--border)", borderRadius:10 }}>
          <p style={{ fontSize:13 }}>Sin casos de prueba.{puedeAgregarCasos ? " Crea uno con el botón Nuevo Caso." : ""}</p>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {casosHU.map(caso => (
          <CasoPruebaCard
            key={caso.id}
            caso={caso}
            hu={hu}
            tareasCaso={tareas.filter(t => caso.tareasIds.includes(t.id))}
            onAbrirEditar={abrirEditarCaso}
          />
        ))}
      </div>
    </div>
  )
}

interface CasoFormFieldsProps {
  titulo: string; onTitulo: (v: string) => void
  desc: string; onDesc: (v: string) => void
  entorno: EntornoCaso; onEntorno: (v: EntornoCaso) => void
  tipo: TipoPrueba; onTipo: (v: TipoPrueba) => void
  horas: number; onHoras: (v: number) => void
  archivos: string; onArchivos: (v: string) => void
  complejidad: ComplejidadCaso; onComplejidad: (v: ComplejidadCaso) => void
  tiposPrueba?: TipoPruebaDef[]
}

function CasoFormFields({ titulo, onTitulo, desc, onDesc, entorno, onEntorno, tipo, onTipo, horas, onHoras, archivos, onArchivos, complejidad, onComplejidad, tiposPrueba }: CasoFormFieldsProps) {
  const tiposPruebaOpts = tiposPrueba?.length ? tiposPrueba : TIPOS_PRUEBA_PREDETERMINADOS
  return (
    <div className="grid grid-cols-2 gap-2 mb-2">
      <div style={{ gridColumn:"1/-1" }}>
        <Input value={titulo} onChange={e => onTitulo(e.target.value)} placeholder="Título del caso de prueba *" style={{ fontSize:12 }} />
      </div>
      <div style={{ gridColumn:"1/-1" }}>
        <Textarea rows={2} value={desc} onChange={e => onDesc(e.target.value)} placeholder="Descripción..." style={{ fontSize:12, resize:"none" }} />
      </div>
      <div>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Entorno</label>
        <Select value={entorno} onValueChange={(v: EntornoCaso) => onEntorno(v)}>
          <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
            <SelectItem value="preproduccion">Pre-Producción</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Tipo de prueba</label>
        <Select value={tipo} onValueChange={(v: TipoPrueba) => onTipo(v)}>
          <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            {tipo && !tiposPruebaOpts.some(t => t.id === tipo) && (
              <SelectItem value={tipo}>{tipo}</SelectItem>
            )}
            {tiposPruebaOpts.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Complejidad</label>
        <Select value={complejidad} onValueChange={(v: ComplejidadCaso) => onComplejidad(v)}>
          <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Horas estimadas</label>
        <Input type="number" min={1} value={horas} onChange={e => onHoras(parseInt(e.target.value)||1)} style={{ height:30, fontSize:11 }} />
      </div>
      <div style={{ gridColumn:"1/3" }}>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Archivos analizados (separados por coma)</label>
        <Input value={archivos} onChange={e => onArchivos(e.target.value)} placeholder="archivo1.ts, archivo2.tsx" style={{ fontSize:11 }} />
      </div>
    </div>
  )
}
