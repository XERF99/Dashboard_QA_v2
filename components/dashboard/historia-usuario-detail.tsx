"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  CheckSquare, Calendar, Star, TrendingUp,
  AlertTriangle, Plus, CheckCircle2, ShieldAlert, Layers,
  User, Play, XCircle, Send, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, Lock, Unlock, FileText, RefreshCw,
} from "lucide-react"
import {
  ESTADO_HU_CFG, ETAPA_HU_CFG, PRIORIDAD_CFG, TIPO_APLICACION_LABEL,
  ESTADO_APROBACION_CFG, COMPLEJIDAD_CFG, TIPO_PRUEBA_LABEL, TIPO_PRUEBA_COLOR,
  TIPO_TAREA_LABEL, TIPO_TAREA_COLOR, AMBIENTE_LABEL,
  etapasParaTipo, fmtCorto, fmtHora,
  type HistoriaUsuario, type CasoPrueba, type Tarea, type Bloqueo,
  type EtapaEjecucion, type TipoPrueba, type ComplejidadCaso, type EntornoCaso,
  type TipoTarea, type PrioridadTarea, type IntentoEjecucion,
} from "@/lib/types"

interface Props {
  open: boolean
  onClose: () => void
  hu: HistoriaUsuario | null
  casos: CasoPrueba[]
  tareas: Tarea[]
  currentUser?: string
  isAdmin: boolean
  isQA: boolean
  onIniciarHU: (huId: string) => void
  onCancelarHU: (huId: string, motivo: string) => void
  onAddCaso: (caso: CasoPrueba) => void
  onEnviarAprobacion: (huId: string) => void
  onAprobarCasos: (huId: string) => void
  onRechazarCasos: (huId: string, motivo: string) => void
  onIniciarEjecucion: (huId: string, etapa: EtapaEjecucion) => void
  onCompletarCasoEtapa: (casoId: string, etapa: EtapaEjecucion, resultado: "exitoso" | "fallido", comentarioFallo?: string) => void
  onRetestearCaso: (casoId: string, etapa: EtapaEjecucion, comentarioCorreccion: string) => void
  onAddTarea: (tarea: Tarea) => void
  onCompletarTarea: (tareaId: string, resultado: "exitoso" | "fallido") => void
  onBloquearTarea: (tareaId: string, bloqueo: Bloqueo) => void
  onDesbloquearTarea: (tareaId: string, bloqueoId: string) => void
  onAddBloqueo: (huId: string, b: Bloqueo) => void
  onResolverBloqueo: (huId: string, bId: string) => void
  onPermitirCasosAdicionales: (huId: string, motivo: string) => void
}

// ── Helpers ──
const PNL: React.CSSProperties = { padding:"13px 15px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }
const SLBL: React.CSSProperties = { fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:10, display:"flex", alignItems:"center", gap:5 }

const ETAPA_EXEC_LABEL: Record<string,string> = {
  despliegue:"Despliegue", rollback:"Rollback", redespliegue:"Redespliegue",
}

function fmt(d: Date): string {
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export function HistoriaUsuarioDetail({
  open, onClose, hu, casos, tareas, currentUser, isAdmin, isQA,
  onIniciarHU, onCancelarHU, onAddCaso, onEnviarAprobacion,
  onAprobarCasos, onRechazarCasos, onIniciarEjecucion, onCompletarCasoEtapa, onRetestearCaso,
  onAddTarea, onCompletarTarea, onBloquearTarea, onDesbloquearTarea,
  onAddBloqueo, onResolverBloqueo, onPermitirCasosAdicionales,
}: Props) {
  // Form states
  const [showCasoForm, setShowCasoForm] = useState(false)
  const [showTareaForm, setShowTareaForm] = useState<string | null>(null) // casoId
  const [showBloqueoForm, setShowBloqueoForm] = useState(false)
  const [showCancelarForm, setShowCancelarForm] = useState(false)
  const [showRechazoForm, setShowRechazoForm] = useState(false)
  const [showExcepcionForm, setShowExcepcionForm] = useState(false)
  const [showBloqueoTareaForm, setShowBloqueoTareaForm] = useState<string | null>(null)
  const [expandedCaso, setExpandedCaso] = useState<string | null>(null)

  // Caso form
  const [casoTitulo, setCasoTitulo] = useState("")
  const [casoDesc, setCasoDesc] = useState("")
  const [casoEntorno, setCasoEntorno] = useState<EntornoCaso>("test")
  const [casoTipo, setCasoTipo] = useState<TipoPrueba>("funcional")
  const [casoHoras, setCasoHoras] = useState(8)
  const [casoArchivos, setCasoArchivos] = useState("")
  const [casoComplejidad, setCasoComplejidad] = useState<ComplejidadCaso>("media")

  // Tarea form
  const [tareaTitulo, setTareaTitulo] = useState("")
  const [tareaDesc, setTareaDesc] = useState("")
  const [tareaTipo, setTareaTipo] = useState<TipoTarea>("ejecucion")
  const [tareaPrioridad, setTareaPrioridad] = useState<PrioridadTarea>("media")
  const [tareaHoras, setTareaHoras] = useState(4)

  // Text inputs
  const [motivoCancelacion, setMotivoCancelacion] = useState("")
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [motivoExcepcion, setMotivoExcepcion] = useState("")
  const [nuevoBloqueo, setNuevoBloqueo] = useState("")
  const [bloqueoTareaTexto, setBloqueoTareaTexto] = useState("")

  // Retesteo / fallo
  const [showFalloForm, setShowFalloForm] = useState<string | null>(null) // casoId
  const [comentarioFallo, setComentarioFallo] = useState("")
  const [showRetestForm, setShowRetestForm] = useState<string | null>(null) // casoId
  const [comentarioCorreccion, setComentarioCorreccion] = useState("")

  if (!hu) return null

  const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
  const tareasHU = tareas.filter(t => t.huId === hu.id)
  const blActivos = hu.bloqueos.filter(b => !b.resuelto)
  const blResueltos = hu.bloqueos.filter(b => b.resuelto)

  const estCfg = ESTADO_HU_CFG[hu.estado]
  const etaCfg = ETAPA_HU_CFG[hu.etapa]
  const priCfg = PRIORIDAD_CFG[hu.prioridad]

  // Puede agregar casos?
  const etapasDisponibles = etapasParaTipo(hu.tipoAplicacion)
  const enDespliegue = hu.etapa === "despliegue"
  const pasoPrimeraEtapa = hu.etapa !== "sin_iniciar" && hu.etapa !== "despliegue"
  const puedeAgregarCasos = hu.estado === "en_progreso" && (enDespliegue || hu.permitirCasosAdicionales)

  // Casos con estados
  const borradores = casosHU.filter(c => c.estadoAprobacion === "borrador")
  const pendientesAprobacion = casosHU.filter(c => c.estadoAprobacion === "pendiente_aprobacion")
  const aprobados = casosHU.filter(c => c.estadoAprobacion === "aprobado")
  const rechazados = casosHU.filter(c => c.estadoAprobacion === "rechazado")

  // Submit caso
  const submitCaso = () => {
    if (!casoTitulo.trim()) return
    const caso: CasoPrueba = {
      id: `CP-${Date.now()}`,
      huId: hu.id,
      titulo: casoTitulo.trim(),
      descripcion: casoDesc.trim(),
      entorno: casoEntorno,
      tipoPrueba: casoTipo,
      horasEstimadas: casoHoras,
      archivosAnalizados: casoArchivos.split(",").map(s => s.trim()).filter(Boolean),
      complejidad: casoComplejidad,
      estadoAprobacion: "borrador",
      resultadosPorEtapa: [],
      fechaCreacion: new Date(),
      tareasIds: [],
      bloqueos: [],
      creadoPor: currentUser || "Sistema",
      modificacionHabilitada: false,
    }
    onAddCaso(caso)
    setCasoTitulo(""); setCasoDesc(""); setCasoEntorno("test"); setCasoTipo("funcional")
    setCasoHoras(8); setCasoArchivos(""); setCasoComplejidad("media")
    setShowCasoForm(false)
  }

  // Submit tarea
  const submitTarea = (casoPruebaId: string) => {
    if (!tareaTitulo.trim()) return
    const tarea: Tarea = {
      id: `T-${Date.now()}`,
      casoPruebaId,
      huId: hu.id,
      titulo: tareaTitulo.trim(),
      descripcion: tareaDesc.trim(),
      asignado: currentUser || "Sistema",
      estado: "pendiente",
      resultado: "pendiente",
      tipo: tareaTipo,
      prioridad: tareaPrioridad,
      horasEstimadas: tareaHoras,
      horasReales: 0,
      fechaCreacion: new Date(),
      bloqueos: [],
      evidencias: "",
      creadoPor: currentUser || "Sistema",
    }
    onAddTarea(tarea)
    setTareaTitulo(""); setTareaDesc(""); setTareaTipo("ejecucion"); setTareaPrioridad("media"); setTareaHoras(4)
    setShowTareaForm(null)
  }

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
            </div>
            <p style={{ fontSize:19, fontWeight:700, color:"var(--foreground)", lineHeight:1.3, marginBottom:10 }}>{hu.titulo}</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <Badge variant="outline" className={priCfg.cls}>Prioridad {priCfg.label}</Badge>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, color:"var(--muted-foreground)" }}><Star size={12}/>{hu.puntos} pts</span>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, color:"var(--muted-foreground)" }}><User size={12}/>{hu.responsable}</span>
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">{TIPO_APLICACION_LABEL[hu.tipoAplicacion]}</Badge>
              <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[10px]">{AMBIENTE_LABEL[hu.ambiente]}</Badge>
              {blActivos.length>0 && <Badge variant="outline" className="bg-chart-4/20 text-chart-4 border-chart-4/30"><ShieldAlert size={11} className="mr-1"/>{blActivos.length} bloqueo{blActivos.length>1?"s":""}</Badge>}
            </div>

            {/* Acciones de cabecera */}
            <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
              {/* QA inicia HU */}
              {isQA && hu.estado === "sin_iniciar" && (
                <Button size="sm" onClick={() => onIniciarHU(hu.id)}>
                  <Play size={12} className="mr-1"/> Iniciar HU
                </Button>
              )}
              {/* Admin cancela */}
              {isAdmin && hu.estado !== "cancelada" && hu.estado !== "exitosa" && (
                <Button size="sm" variant="outline" style={{ color:"var(--chart-4)", borderColor:"var(--chart-4)" }}
                  onClick={() => setShowCancelarForm(true)}>
                  <XCircle size={12} className="mr-1"/> Cancelar HU
                </Button>
              )}
              {/* QA envía a aprobación */}
              {isQA && borradores.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => onEnviarAprobacion(hu.id)}>
                  <Send size={12} className="mr-1"/> Enviar a aprobación ({borradores.length})
                </Button>
              )}
              {/* Admin aprueba/rechaza */}
              {isAdmin && pendientesAprobacion.length > 0 && (
                <>
                  <Button size="sm" onClick={() => onAprobarCasos(hu.id)} className="bg-chart-2 hover:bg-chart-2/90 text-white">
                    <ThumbsUp size={12} className="mr-1"/> Aprobar ({pendientesAprobacion.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowRechazoForm(true)} style={{ color:"var(--chart-4)" }}>
                    <ThumbsDown size={12} className="mr-1"/> Rechazar
                  </Button>
                </>
              )}
              {/* QA inicia ejecución de etapa */}
              {isQA && hu.estado === "en_progreso" && aprobados.length > 0 && hu.etapa !== "completada" && hu.etapa !== "cambio_cancelado" && hu.etapa !== "sin_iniciar" && (
                <Button size="sm" variant="outline" onClick={() => onIniciarEjecucion(hu.id, hu.etapa as EtapaEjecucion)}>
                  <Play size={12} className="mr-1"/> Iniciar ejecución — {ETAPA_EXEC_LABEL[hu.etapa]}
                </Button>
              )}
              {/* Admin habilita excepción */}
              {isAdmin && pasoPrimeraEtapa && !hu.permitirCasosAdicionales && hu.estado === "en_progreso" && (
                <Button size="sm" variant="outline" onClick={() => setShowExcepcionForm(true)}>
                  <Unlock size={12} className="mr-1"/> Permitir más casos
                </Button>
              )}
            </div>
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
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>

            {/* COL PRINCIPAL */}
            <div style={{ display:"flex", flexDirection:"column", gap:18, minWidth:0 }}>

              {/* Descripción + Criterios + Solicitante */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
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
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
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
                  <div style={{ display:"flex", gap:8 }}>
                    {etapasDisponibles.map((et, i) => {
                      const esCurrent = hu.etapa === et
                      const esCompletada = etapasDisponibles.indexOf(hu.etapa as EtapaEjecucion) > i || hu.etapa === "completada"
                      return (
                        <div key={et} style={{ flex:1, padding:"10px 14px", borderRadius:8,
                          border: esCurrent ? "2px solid var(--primary)" : "1px solid var(--border)",
                          background: esCompletada ? "color-mix(in oklch, var(--chart-2) 8%, transparent)" : esCurrent ? "color-mix(in oklch, var(--primary) 8%, transparent)" : "transparent",
                          textAlign:"center" }}>
                          <p style={{ fontSize:10, fontWeight:700, color: esCompletada ? "var(--chart-2)" : esCurrent ? "var(--primary)" : "var(--muted-foreground)", textTransform:"uppercase" }}>
                            {ETAPA_EXEC_LABEL[et]}
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
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <p style={{ ...SLBL, marginBottom:0 }}>
                    <FileText size={11}/>Casos de Prueba ({casosHU.length})
                  </p>
                  {(isQA || isAdmin) && puedeAgregarCasos && (
                    <Button size="sm" variant="outline" onClick={() => setShowCasoForm(true)}>
                      <Plus size={12} className="mr-1"/> Nuevo Caso
                    </Button>
                  )}
                  {pasoPrimeraEtapa && !hu.permitirCasosAdicionales && !isAdmin && (
                    <span style={{ fontSize:10, color:"var(--chart-3)", display:"flex", alignItems:"center", gap:4 }}>
                      <Lock size={10}/> No se pueden agregar más casos
                    </span>
                  )}
                </div>

                {/* Formulario nuevo caso */}
                {showCasoForm && (
                  <div style={{ ...PNL, marginBottom:12, borderColor:"var(--primary)" }}>
                    <p style={{ fontSize:12, fontWeight:700, color:"var(--foreground)", marginBottom:10 }}>Nuevo Caso de Prueba</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                      <div style={{ gridColumn:"1/3" }}>
                        <Input value={casoTitulo} onChange={e => setCasoTitulo(e.target.value)} placeholder="Título del caso de prueba *" style={{ fontSize:12 }} />
                      </div>
                      <div style={{ gridColumn:"1/3" }}>
                        <Textarea rows={2} value={casoDesc} onChange={e => setCasoDesc(e.target.value)} placeholder="Descripción..." style={{ fontSize:12, resize:"none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Entorno</label>
                        <Select value={casoEntorno} onValueChange={(v: EntornoCaso) => setCasoEntorno(v)}>
                          <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="test">Test</SelectItem>
                            <SelectItem value="preproduccion">Pre-Producción</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Tipo de prueba</label>
                        <Select value={casoTipo} onValueChange={(v: TipoPrueba) => setCasoTipo(v)}>
                          <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="funcional">Funcional</SelectItem>
                            <SelectItem value="no_funcional">No Funcional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Complejidad</label>
                        <Select value={casoComplejidad} onValueChange={(v: ComplejidadCaso) => setCasoComplejidad(v)}>
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
                        <Input type="number" min={1} value={casoHoras} onChange={e => setCasoHoras(parseInt(e.target.value)||1)} style={{ height:30, fontSize:11 }} />
                      </div>
                      <div style={{ gridColumn:"1/3" }}>
                        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Archivos analizados (separados por coma)</label>
                        <Input value={casoArchivos} onChange={e => setCasoArchivos(e.target.value)} placeholder="archivo1.ts, archivo2.tsx" style={{ fontSize:11 }} />
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      <Button variant="outline" size="sm" onClick={() => setShowCasoForm(false)}>Cancelar</Button>
                      <Button size="sm" disabled={!casoTitulo.trim()} onClick={submitCaso}>Crear caso</Button>
                    </div>
                  </div>
                )}

                {/* Lista de casos */}
                {casosHU.length === 0 && !showCasoForm && (
                  <div style={{ textAlign:"center", padding:24, color:"var(--muted-foreground)", border:"1px dashed var(--border)", borderRadius:10 }}>
                    <p style={{ fontSize:13 }}>Sin casos de prueba. {puedeAgregarCasos && "Crea uno con el botón Nuevo Caso."}</p>
                  </div>
                )}

                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {casosHU.map(caso => {
                    const aprobCfg = ESTADO_APROBACION_CFG[caso.estadoAprobacion]
                    const compCfg = COMPLEJIDAD_CFG[caso.complejidad]
                    const tpColor = TIPO_PRUEBA_COLOR[caso.tipoPrueba]
                    const tareasCaso = tareas.filter(t => caso.tareasIds.includes(t.id))
                    const isExpanded = expandedCaso === caso.id
                    const bloqueosActivos = caso.bloqueos.filter(b => !b.resuelto)

                    // Resultado de etapa actual
                    const etapaActual = hu.etapa as EtapaEjecucion
                    const resultadoEtapaActual = caso.resultadosPorEtapa.find(r => r.etapa === etapaActual)

                    return (
                      <div key={caso.id} style={{ border:"1px solid var(--border)", borderRadius:10, background:"var(--card)", overflow:"hidden" }}>
                        {/* Cabecera del caso */}
                        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", cursor:"pointer" }}
                          onClick={() => setExpandedCaso(isExpanded ? null : caso.id)} className="hover:bg-secondary/30">
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                              <p style={{ fontSize:11, fontFamily:"monospace", color:"var(--primary)", fontWeight:600 }}>{caso.id}</p>
                              <Badge variant="outline" className={`${aprobCfg.cls} text-[9px]`}>{aprobCfg.label}</Badge>
                              <Badge variant="outline" className={`${tpColor} text-[9px]`}>{TIPO_PRUEBA_LABEL[caso.tipoPrueba]}</Badge>
                              <Badge variant="outline" className={`${compCfg.cls} text-[9px]`}>{compCfg.label}</Badge>
                              {bloqueosActivos.length > 0 && (
                                <span style={{ display:"flex", alignItems:"center", gap:2 }}>
                                  <AlertTriangle size={11} style={{ color:"var(--chart-4)" }}/>
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{caso.titulo}</p>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                            <span style={{ fontSize:11, color:"var(--muted-foreground)" }}>{caso.horasEstimadas}h</span>
                            <span style={{ fontSize:11, color:"var(--muted-foreground)" }}>{tareasCaso.length} tarea{tareasCaso.length!==1?"s":""}</span>
                            {/* Resultados por etapa mini */}
                            {caso.resultadosPorEtapa.map(r => {
                              const retests = (r.intentos?.length || 0)
                              const retestLabel = retests > 1 ? ` (${retests})` : ""
                              return (
                                <Badge key={r.etapa} variant="outline" className={`text-[8px] ${
                                  r.resultado === "exitoso" ? "bg-chart-2/20 text-chart-2 border-chart-2/30" :
                                  r.resultado === "fallido" ? "bg-chart-4/20 text-chart-4 border-chart-4/30" :
                                  r.estado === "en_ejecucion" ? "bg-chart-1/20 text-chart-1 border-chart-1/30" :
                                  "bg-muted text-muted-foreground border-border"
                                }`} style={{ padding:"1px 4px" }}>
                                  {ETAPA_EXEC_LABEL[r.etapa]?.slice(0,3)}
                                  {r.resultado === "exitoso" ? " ✓" : r.resultado === "fallido" ? " ✗" : r.estado === "en_ejecucion" ? " ▶" : ""}
                                  {retestLabel}
                                </Badge>
                              )
                            })}
                            {isExpanded ? <ChevronUp size={14} style={{ color:"var(--muted-foreground)" }}/> : <ChevronDown size={14} style={{ color:"var(--muted-foreground)" }}/>}
                          </div>
                        </div>

                        {/* Detalle expandido del caso */}
                        {isExpanded && (
                          <div style={{ padding:"0 14px 14px", borderTop:"1px solid var(--border)" }}>
                            {/* Descripción */}
                            {caso.descripcion && (
                              <p style={{ fontSize:12, color:"var(--muted-foreground)", padding:"10px 0 6px", lineHeight:1.5 }}>{caso.descripcion}</p>
                            )}

                            {/* Archivos */}
                            {caso.archivosAnalizados.length > 0 && (
                              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8, marginTop:4 }}>
                                <span style={{ fontSize:10, color:"var(--muted-foreground)" }}>Archivos:</span>
                                {caso.archivosAnalizados.map((a,i) => (
                                  <Badge key={i} variant="outline" className="text-[9px] bg-muted text-muted-foreground border-border" style={{ padding:"1px 5px" }}>{a}</Badge>
                                ))}
                              </div>
                            )}

                            {/* Acciones de ejecución para el caso en etapa actual */}
                            {caso.estadoAprobacion === "aprobado" && resultadoEtapaActual?.estado === "en_ejecucion" && (isQA || isAdmin) && (
                              <div style={{ marginBottom:10, marginTop:6 }}>
                                {showFalloForm !== caso.id ? (
                                  <div style={{ display:"flex", gap:8 }}>
                                    <Button size="sm" className="bg-chart-2 hover:bg-chart-2/90 text-white"
                                      onClick={() => onCompletarCasoEtapa(caso.id, etapaActual, "exitoso")}>
                                      <CheckCircle2 size={12} className="mr-1"/> Exitoso
                                    </Button>
                                    <Button size="sm" variant="outline" style={{ color:"var(--chart-4)" }}
                                      onClick={() => { setShowFalloForm(caso.id); setComentarioFallo("") }}>
                                      <XCircle size={12} className="mr-1"/> Fallido
                                    </Button>
                                  </div>
                                ) : (
                                  <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid var(--chart-4)", background:"color-mix(in oklch, var(--chart-4) 4%, var(--background))" }}>
                                    <p style={{ fontSize:11, fontWeight:600, color:"var(--chart-4)", marginBottom:6 }}>Describe qué falló en la prueba *</p>
                                    <Textarea rows={2} value={comentarioFallo} onChange={e => setComentarioFallo(e.target.value)}
                                      placeholder="Ej: El endpoint /api/login retorna 500 cuando se envían credenciales con caracteres especiales..."
                                      style={{ fontSize:12, resize:"none", marginBottom:8 }} />
                                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                      <Button variant="outline" size="sm" style={{ height:26, fontSize:10 }}
                                        onClick={() => { setShowFalloForm(null); setComentarioFallo("") }}>Cancelar</Button>
                                      <Button size="sm" style={{ height:26, fontSize:10 }} disabled={!comentarioFallo.trim()}
                                        className="bg-chart-4 hover:bg-chart-4/90 text-white"
                                        onClick={() => {
                                          onCompletarCasoEtapa(caso.id, etapaActual, "fallido", comentarioFallo.trim())
                                          setShowFalloForm(null); setComentarioFallo("")
                                        }}>
                                        <XCircle size={10} className="mr-1"/> Confirmar fallo
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Solicitar retesteo cuando el caso falló */}
                            {caso.estadoAprobacion === "aprobado" && resultadoEtapaActual?.resultado === "fallido" && (isQA || isAdmin) && (
                              <div style={{ marginBottom:10, marginTop:6 }}>
                                {showRetestForm !== caso.id ? (
                                  <Button size="sm" variant="outline" style={{ borderColor:"var(--chart-1)", color:"var(--chart-1)" }}
                                    onClick={() => { setShowRetestForm(caso.id); setComentarioCorreccion("") }}>
                                    <RefreshCw size={12} className="mr-1"/> Solicitar Retesteo
                                  </Button>
                                ) : (
                                  <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid var(--chart-1)", background:"color-mix(in oklch, var(--chart-1) 4%, var(--background))" }}>
                                    <p style={{ fontSize:11, fontWeight:600, color:"var(--chart-1)", marginBottom:6 }}>Describe qué se corrigió para re-probar *</p>
                                    <Textarea rows={2} value={comentarioCorreccion} onChange={e => setComentarioCorreccion(e.target.value)}
                                      placeholder="Ej: Se corrigió la validación de caracteres especiales en el endpoint /api/login, deploy realizado en branch fix/login-encoding..."
                                      style={{ fontSize:12, resize:"none", marginBottom:8 }} />
                                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                      <Button variant="outline" size="sm" style={{ height:26, fontSize:10 }}
                                        onClick={() => { setShowRetestForm(null); setComentarioCorreccion("") }}>Cancelar</Button>
                                      <Button size="sm" style={{ height:26, fontSize:10 }}
                                        disabled={!comentarioCorreccion.trim()}
                                        onClick={() => {
                                          onRetestearCaso(caso.id, etapaActual, comentarioCorreccion.trim())
                                          setShowRetestForm(null); setComentarioCorreccion("")
                                        }}>
                                        <RefreshCw size={10} className="mr-1"/> Confirmar retesteo
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Historial de intentos (retesteos) — todas las etapas */}
                            {caso.resultadosPorEtapa.some(r => (r.intentos?.length || 0) > 0) && (
                              <div style={{ marginBottom:10, marginTop:4 }}>
                                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted-foreground)", marginBottom:6 }}>
                                  Historial de intentos ({caso.resultadosPorEtapa.reduce((s, r) => s + (r.intentos?.length || 0), 0)})
                                </p>
                                <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                                  {caso.resultadosPorEtapa.flatMap(r =>
                                    (r.intentos || []).map((intento, idx) => (
                                      <div key={`${r.etapa}-${idx}`} style={{
                                        padding:"8px 10px", borderRadius:7, fontSize:11, lineHeight:1.5,
                                        border:`1px solid ${intento.resultado === "exitoso" ? "color-mix(in oklch, var(--chart-2) 30%, var(--border))" : "color-mix(in oklch, var(--chart-4) 30%, var(--border))"}`,
                                        background: intento.resultado === "exitoso" ? "color-mix(in oklch, var(--chart-2) 5%, transparent)" : "color-mix(in oklch, var(--chart-4) 5%, transparent)",
                                      }}>
                                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3, flexWrap:"wrap" }}>
                                          <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground border-border" style={{ padding:"1px 5px" }}>
                                            {ETAPA_EXEC_LABEL[r.etapa]}
                                          </Badge>
                                          <Badge variant="outline" className={`text-[9px] ${intento.resultado === "exitoso" ? "bg-chart-2/20 text-chart-2 border-chart-2/30" : "bg-chart-4/20 text-chart-4 border-chart-4/30"}`} style={{ padding:"1px 5px" }}>
                                            Intento #{intento.numero} — {intento.resultado === "exitoso" ? "Exitoso" : "Fallido"}
                                          </Badge>
                                          <span style={{ fontSize:10, color:"var(--muted-foreground)" }}>{fmtCorto(intento.fecha)} · {intento.ejecutadoPor}</span>
                                        </div>
                                        {intento.comentarioFallo && (
                                          <p style={{ color:"var(--chart-4)", fontSize:11 }}>
                                            <strong>Fallo:</strong> {intento.comentarioFallo}
                                          </p>
                                        )}
                                        {intento.comentarioCorreccion && (
                                          <p style={{ color:"var(--chart-2)", fontSize:11 }}>
                                            <strong>Corrección:</strong> {intento.comentarioCorreccion}
                                          </p>
                                        )}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Tareas del caso */}
                            <div style={{ marginTop:8 }}>
                              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted-foreground)" }}>
                                  Tareas ({tareasCaso.length})
                                </p>
                                {(isQA || isAdmin) && caso.estadoAprobacion === "aprobado" && (
                                  <button type="button" onClick={(e) => { e.stopPropagation(); setShowTareaForm(caso.id) }}
                                    style={{ fontSize:10, color:"var(--primary)", background:"none", border:"none", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}>
                                    <Plus size={10}/> Tarea
                                  </button>
                                )}
                              </div>

                              {/* Formulario nueva tarea */}
                              {showTareaForm === caso.id && (
                                <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid var(--primary)", background:"var(--background)", marginBottom:8 }}>
                                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:6 }}>
                                    <div style={{ gridColumn:"1/3" }}>
                                      <Input value={tareaTitulo} onChange={e => setTareaTitulo(e.target.value)} placeholder="Título de la tarea *" style={{ fontSize:11 }} />
                                    </div>
                                    <div>
                                      <Select value={tareaTipo} onValueChange={(v: TipoTarea) => setTareaTipo(v)}>
                                        <SelectTrigger style={{ height:28, fontSize:10 }}><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                          {(Object.keys(TIPO_TAREA_LABEL) as TipoTarea[]).map(k => (
                                            <SelectItem key={k} value={k}>{TIPO_TAREA_LABEL[k]}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Select value={tareaPrioridad} onValueChange={(v: PrioridadTarea) => setTareaPrioridad(v)}>
                                        <SelectTrigger style={{ height:28, fontSize:10 }}><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="alta">Alta</SelectItem>
                                          <SelectItem value="media">Media</SelectItem>
                                          <SelectItem value="baja">Baja</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div>
                                      <Input type="number" min={1} value={tareaHoras} onChange={e => setTareaHoras(parseInt(e.target.value)||1)}
                                        placeholder="Horas" style={{ height:28, fontSize:10 }} />
                                    </div>
                                  </div>
                                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                    <Button variant="outline" size="sm" style={{ height:24, fontSize:10 }}
                                      onClick={() => setShowTareaForm(null)}>Cancelar</Button>
                                    <Button size="sm" style={{ height:24, fontSize:10 }} disabled={!tareaTitulo.trim()}
                                      onClick={() => submitTarea(caso.id)}>Crear</Button>
                                  </div>
                                </div>
                              )}

                              {tareasCaso.length === 0 && showTareaForm !== caso.id && (
                                <p style={{ fontSize:11, color:"var(--muted-foreground)", fontStyle:"italic", textAlign:"center", padding:8 }}>Sin tareas</p>
                              )}

                              {tareasCaso.map(tarea => {
                                const tareaBloqueos = tarea.bloqueos.filter(b => !b.resuelto)
                                return (
                                  <div key={tarea.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                                    borderRadius:7, border:"1px solid var(--border)", marginBottom:4, background:"var(--card)" }}>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                                        <Badge variant="outline" className={`${TIPO_TAREA_COLOR[tarea.tipo]} text-[8px]`} style={{ padding:"0px 4px" }}>
                                          {TIPO_TAREA_LABEL[tarea.tipo]}
                                        </Badge>
                                        <p style={{ fontSize:12, fontWeight:500, color:"var(--foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{tarea.titulo}</p>
                                        {tareaBloqueos.length > 0 && <AlertTriangle size={10} style={{ color:"var(--chart-4)", flexShrink:0 }}/>}
                                      </div>
                                      <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:2 }}>{tarea.asignado} · {tarea.horasEstimadas}h</p>
                                    </div>
                                    <Badge variant="outline" className={`text-[9px] ${
                                      tarea.estado === "completada" ? "bg-chart-2/20 text-chart-2 border-chart-2/30" :
                                      tarea.estado === "bloqueada" ? "bg-chart-4/20 text-chart-4 border-chart-4/30" :
                                      tarea.estado === "en_progreso" ? "bg-chart-1/20 text-chart-1 border-chart-1/30" :
                                      "bg-muted text-muted-foreground border-border"
                                    }`}>{tarea.estado === "completada" ? "Completada" : tarea.estado === "bloqueada" ? "Bloqueada" : tarea.estado === "en_progreso" ? "En Progreso" : "Pendiente"}</Badge>

                                    {/* Acciones de tarea */}
                                    {(isQA || isAdmin) && tarea.estado !== "completada" && (
                                      <div style={{ display:"flex", gap:3, flexShrink:0 }}>
                                        {tarea.estado !== "bloqueada" && (
                                          <>
                                            <button type="button" onClick={() => onCompletarTarea(tarea.id, "exitoso")}
                                              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-2)", padding:2 }}>
                                              <CheckCircle2 size={14}/>
                                            </button>
                                            <button type="button" onClick={() => onCompletarTarea(tarea.id, "fallido")}
                                              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-4)", padding:2 }}>
                                              <XCircle size={14}/>
                                            </button>
                                            <button type="button" onClick={() => { setShowBloqueoTareaForm(tarea.id); setBloqueoTareaTexto("") }}
                                              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-3)", padding:2 }}>
                                              <Lock size={13}/>
                                            </button>
                                          </>
                                        )}
                                        {tarea.estado === "bloqueada" && tarea.bloqueos.filter(b => !b.resuelto).length > 0 && (
                                          <button type="button" onClick={() => {
                                            const bl = tarea.bloqueos.find(b => !b.resuelto)
                                            if (bl) onDesbloquearTarea(tarea.id, bl.id)
                                          }}
                                            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-2)", padding:2 }}>
                                            <Unlock size={13}/>
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* Bloqueo tarea form inline */}
                                    {showBloqueoTareaForm === tarea.id && (
                                      <div style={{ position:"absolute", right:0, top:"100%", zIndex:10 }}>
                                        {/* inline below */}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}

                              {/* Formulario bloqueo tarea */}
                              {showBloqueoTareaForm && tareasCaso.some(t => t.id === showBloqueoTareaForm) && (
                                <div style={{ padding:"8px 10px", borderRadius:7, border:"1px solid var(--chart-3)", background:"var(--background)", marginTop:4 }}>
                                  <Input value={bloqueoTareaTexto} onChange={e => setBloqueoTareaTexto(e.target.value)}
                                    placeholder="Descripción del bloqueo..." style={{ fontSize:11, marginBottom:6 }} />
                                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                    <Button variant="outline" size="sm" style={{ height:24, fontSize:10 }}
                                      onClick={() => setShowBloqueoTareaForm(null)}>Cancelar</Button>
                                    <Button size="sm" style={{ height:24, fontSize:10 }} disabled={!bloqueoTareaTexto.trim()}
                                      onClick={() => {
                                        onBloquearTarea(showBloqueoTareaForm, {
                                          id: `bl-${Date.now()}`, descripcion: bloqueoTareaTexto.trim(),
                                          reportadoPor: currentUser || "Sistema", fecha: new Date(), resuelto: false,
                                        })
                                        setShowBloqueoTareaForm(null); setBloqueoTareaTexto("")
                                      }}>Bloquear</Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── BLOQUEOS HU ── */}
              <div style={PNL}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <p style={{ ...SLBL, marginBottom:0 }}><ShieldAlert size={11}/>Bloqueos de la HU</p>
                  {(isQA || isAdmin) && (
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
                    <div key={b.id} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"9px 11px", borderRadius:8, background:"color-mix(in oklch, var(--chart-4) 6%, transparent)", border:"1px solid color-mix(in oklch, var(--chart-4) 30%, var(--border))" }}>
                      <AlertTriangle size={13} style={{ color:"var(--chart-4)", marginTop:2, flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <p style={{ fontSize:13, color:"var(--foreground)", lineHeight:1.4, marginBottom:2 }}>{b.descripcion}</p>
                        <p style={{ fontSize:11, color:"var(--muted-foreground)" }}>{fmt(b.fecha)} · {b.reportadoPor}</p>
                      </div>
                      {(isAdmin || isQA) && (
                        <Button variant="outline" size="sm" onClick={()=>onResolverBloqueo(hu.id,b.id)} style={{ height:26, fontSize:11, flexShrink:0 }}>
                          <CheckCircle2 size={11} className="mr-1"/>Resolver
                        </Button>
                      )}
                    </div>
                  ))}
                  {blResueltos.map(b=>(
                    <div key={b.id} style={{ display:"flex", gap:8, padding:"8px 11px", borderRadius:8, background:"var(--secondary)", opacity:0.6 }}>
                      <CheckCircle2 size={13} style={{ color:"var(--chart-2)", flexShrink:0, marginTop:2 }}/>
                      <div>
                        <p style={{ fontSize:12, color:"var(--foreground)", textDecoration:"line-through" }}>{b.descripcion}</p>
                        <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:1 }}>Resuelto · {b.reportadoPor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COL DERECHA: Timeline / Historial */}
            <div style={{ position:"sticky", top:0 }}>
              <div style={PNL}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                  <TrendingUp size={13} className="text-chart-1"/>
                  <p style={{ fontSize:12, fontWeight:700, color:"var(--foreground)" }}>Historial</p>
                </div>
                {hu.historial.length===0
                  ? <p style={{ fontSize:12, color:"var(--muted-foreground)", textAlign:"center", padding:"12px 0" }}>Sin eventos</p>
                  : (
                    <div style={{ display:"flex", flexDirection:"column", maxHeight:520, overflowY:"auto" }} className="no-scrollbar">
                      {[...hu.historial].reverse().map((ev,i)=>{
                        const isLast = i===hu.historial.length-1
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
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
