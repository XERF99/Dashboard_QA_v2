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
  CheckSquare, Star, TrendingUp,
  AlertTriangle, Plus, CheckCircle2, ShieldAlert, Layers,
  User, Play, XCircle, Send, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, Lock, Unlock, FileText, RefreshCw,
  Pencil, Trash2, Bell, MessageSquare,
} from "lucide-react"
import {
  ESTADO_HU_CFG, ETAPA_HU_CFG, PRIORIDAD_CFG,
  ESTADO_APROBACION_CFG, COMPLEJIDAD_CFG, TIPO_TAREA_LABEL, TIPO_TAREA_COLOR,
  etapasParaTipo, etapaDefsParaTipo, getEtapaHUCfg, ETAPAS_PREDETERMINADAS,
  getTipoAplicacionLabel, getAmbienteLabel, getTipoPruebaLabel, getTipoPruebaColor,
  TIPOS_PRUEBA_PREDETERMINADOS,
  fmtCorto, fmtHora,
  type HistoriaUsuario, type CasoPrueba, type Tarea, type Bloqueo, type Comentario,
  type EtapaEjecucion, type TipoPrueba, type ComplejidadCaso, type EntornoCaso,
  type TipoTarea, type PrioridadTarea, type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef,
  type TipoPruebaDef,
} from "@/lib/types"

interface Props {
  open: boolean
  onClose: () => void
  hu: HistoriaUsuario | null
  casos: CasoPrueba[]
  tareas: Tarea[]
  currentUser?: string
  isAdmin: boolean
  isQALead?: boolean
  isQA: boolean
  onIniciarHU: (huId: string) => void
  onCancelarHU: (huId: string, motivo: string) => void
  onAddCaso: (caso: CasoPrueba) => void
  onEditarCaso: (caso: CasoPrueba) => void
  onEliminarCaso: (casoId: string, huId: string) => void
  onEnviarCasoAprobacion: (casoId: string, huId: string) => void
  onEnviarAprobacion: (huId: string) => void
  onSolicitarModificacionCaso: (casoId: string, huId: string) => void
  onHabilitarModificacionCaso: (casoId: string, huId: string) => void
  onAprobarCasos: (huId: string) => void
  onRechazarCasos: (huId: string, motivo: string) => void
  onIniciarEjecucion: (huId: string, etapa: EtapaEjecucion) => void
  onCompletarCasoEtapa: (casoId: string, etapa: EtapaEjecucion, resultado: "exitoso" | "fallido", comentarioFallo?: string) => void
  onRetestearCaso: (casoId: string, etapa: EtapaEjecucion, comentarioCorreccion: string) => void
  onAddTarea: (tarea: Tarea) => void
  onEditarTarea: (tarea: Tarea) => void
  onEliminarTarea: (tareaId: string, casoId: string) => void
  onCompletarTarea: (tareaId: string, resultado: "exitoso" | "fallido") => void
  onBloquearTarea: (tareaId: string, bloqueo: Bloqueo) => void
  onDesbloquearTarea: (tareaId: string, bloqueoId: string) => void
  onAddBloqueo: (huId: string, b: Bloqueo) => void
  onResolverBloqueo: (huId: string, bId: string, nota: string) => void
  onPermitirCasosAdicionales: (huId: string, motivo: string) => void
  onAddComentarioHU: (huId: string, texto: string) => void
  onAddComentarioCaso: (casoId: string, texto: string) => void
  configEtapas?: ConfigEtapas
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
  tiposPrueba?: TipoPruebaDef[]
}

// ── Helpers ──
const PNL: React.CSSProperties = { padding:"13px 15px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }
const SLBL: React.CSSProperties = { fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:10, display:"flex", alignItems:"center", gap:5 }

function fmt(d: Date): string {
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

// ── Hilo de comentarios ───────────────────────────────────────
function CommentThread({
  comentarios, onAdd, currentUser, canComment,
}: {
  comentarios: Comentario[]
  onAdd: (texto: string) => void
  currentUser?: string
  canComment: boolean
}) {
  const [texto, setTexto] = useState("")
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
  function fmtTs(d: Date) {
    const hoy = new Date()
    const esHoy = d.getFullYear()===hoy.getFullYear() && d.getMonth()===hoy.getMonth() && d.getDate()===hoy.getDate()
    const hhmm = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`
    return esHoy ? `hoy ${hhmm}` : `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${hhmm}`
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {comentarios.length === 0 && (
        <p style={{ fontSize:12, color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin comentarios aún</p>
      )}
      {comentarios.map(c => (
        <div key={c.id} style={{ display:"flex", gap:8 }}>
          <div style={{
            width:26, height:26, borderRadius:"50%", flexShrink:0,
            background:"color-mix(in oklch, var(--primary) 15%, transparent)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, fontWeight:700, color:"var(--primary)",
          }}>
            {c.autor.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--foreground)" }}>{c.autor}</span>
              <span style={{ fontSize:10, color:"var(--muted-foreground)" }}>{fmtTs(c.fecha)}</span>
            </div>
            <p style={{ fontSize:12, color:"var(--foreground)", lineHeight:1.45, wordBreak:"break-word" }}>{c.texto}</p>
          </div>
        </div>
      ))}
      {canComment && (
        <div style={{ display:"flex", gap:8, alignItems:"flex-end", marginTop:4 }}>
          <div style={{
            width:26, height:26, borderRadius:"50%", flexShrink:0,
            background:"color-mix(in oklch, var(--primary) 15%, transparent)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, fontWeight:700, color:"var(--primary)",
          }}>
            {(currentUser||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <Textarea
            rows={2}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && texto.trim()) {
                onAdd(texto.trim()); setTexto("")
              }
            }}
            placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
            style={{ flex:1, resize:"none", fontSize:12 }}
          />
          <button
            onClick={() => { if (!texto.trim()) return; onAdd(texto.trim()); setTexto("") }}
            disabled={!texto.trim()}
            style={{
              padding:"6px 10px", borderRadius:7, border:"none", cursor:"pointer",
              background: texto.trim() ? "var(--primary)" : "var(--secondary)",
              color: texto.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)",
              display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, flexShrink:0,
            }}
          >
            <Send size={12}/> Enviar
          </button>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════
export function HistoriaUsuarioDetail({
  open, onClose, hu, casos, tareas, currentUser, isAdmin, isQALead = false, isQA,
  onIniciarHU, onCancelarHU, onAddCaso, onEditarCaso, onEliminarCaso,
  onEnviarCasoAprobacion, onEnviarAprobacion,
  onSolicitarModificacionCaso, onHabilitarModificacionCaso,
  onAprobarCasos, onRechazarCasos, onIniciarEjecucion, onCompletarCasoEtapa, onRetestearCaso,
  onAddTarea, onEditarTarea, onEliminarTarea, onCompletarTarea, onBloquearTarea, onDesbloquearTarea,
  onAddBloqueo, onResolverBloqueo, onPermitirCasosAdicionales,
  onAddComentarioHU, onAddComentarioCaso,
  configEtapas = ETAPAS_PREDETERMINADAS,
  tiposAplicacion,
  ambientes,
  tiposPrueba,
}: Props) {
  // Form visibility
  const [showCasoForm, setShowCasoForm] = useState(false)
  const [showTareaForm, setShowTareaForm] = useState<string | null>(null)       // casoId
  const [showBloqueoForm, setShowBloqueoForm] = useState(false)
  const [showCancelarForm, setShowCancelarForm] = useState(false)
  const [showRechazoForm, setShowRechazoForm] = useState(false)
  const [showExcepcionForm, setShowExcepcionForm] = useState(false)
  const [showBloqueoTareaForm, setShowBloqueoTareaForm] = useState<string | null>(null)
  const [expandedCaso, setExpandedCaso] = useState<string | null>(null)

  // Edit states
  const [editandoCaso, setEditandoCaso] = useState<CasoPrueba | null>(null)
  const [editandoTarea, setEditandoTarea] = useState<Tarea | null>(null)

  // Caso form (create / edit)
  const [casoTitulo, setCasoTitulo] = useState("")
  const [casoDesc, setCasoDesc] = useState("")
  const [casoEntorno, setCasoEntorno] = useState<EntornoCaso>("test")
  const [casoTipo, setCasoTipo] = useState<TipoPrueba>("funcional")
  const [casoHoras, setCasoHoras] = useState(8)
  const [casoArchivos, setCasoArchivos] = useState("")
  const [casoComplejidad, setCasoComplejidad] = useState<ComplejidadCaso>("media")

  // Tarea form (create / edit)
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
  const [showFalloForm, setShowFalloForm] = useState<string | null>(null)
  const [comentarioFallo, setComentarioFallo] = useState("")
  const [showRetestForm, setShowRetestForm] = useState<string | null>(null)
  const [comentarioCorreccion, setComentarioCorreccion] = useState("")

  // Resolver bloqueo HU
  const [showResolverForm, setShowResolverForm] = useState<string | null>(null)
  const [notaResolucion, setNotaResolucion] = useState("")

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

  // ── Submit caso (crear) ──
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
      comentarios: [],
    }
    onAddCaso(caso)
    resetCasoForm()
    setShowCasoForm(false)
  }

  // ── Submit caso (editar) ──
  const submitEditarCaso = () => {
    if (!editandoCaso || !casoTitulo.trim()) return
    const actualizado: CasoPrueba = {
      ...editandoCaso,
      titulo: casoTitulo.trim(),
      descripcion: casoDesc.trim(),
      entorno: casoEntorno,
      tipoPrueba: casoTipo,
      horasEstimadas: casoHoras,
      archivosAnalizados: casoArchivos.split(",").map(s => s.trim()).filter(Boolean),
      complejidad: casoComplejidad,
      estadoAprobacion: "borrador",      // vuelve a borrador tras editar
      modificacionHabilitada: false,
      modificacionSolicitada: false,
    }
    onEditarCaso(actualizado)
    setEditandoCaso(null)
    resetCasoForm()
  }

  const abrirEditarCaso = (caso: CasoPrueba) => {
    setEditandoCaso(caso)
    setCasoTitulo(caso.titulo)
    setCasoDesc(caso.descripcion)
    setCasoEntorno(caso.entorno)
    setCasoTipo(caso.tipoPrueba)
    setCasoHoras(caso.horasEstimadas)
    setCasoArchivos(caso.archivosAnalizados.join(", "))
    setCasoComplejidad(caso.complejidad)
    setShowCasoForm(false)
  }

  const resetCasoForm = () => {
    setCasoTitulo(""); setCasoDesc(""); setCasoEntorno("test"); setCasoTipo("funcional")
    setCasoHoras(8); setCasoArchivos(""); setCasoComplejidad("media")
  }

  // ── Submit tarea (crear) ──
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
    resetTareaForm()
    setShowTareaForm(null)
  }

  // ── Submit tarea (editar) ──
  const submitEditarTarea = () => {
    if (!editandoTarea || !tareaTitulo.trim()) return
    onEditarTarea({
      ...editandoTarea,
      titulo: tareaTitulo.trim(),
      descripcion: tareaDesc.trim(),
      tipo: tareaTipo,
      prioridad: tareaPrioridad,
      horasEstimadas: tareaHoras,
    })
    setEditandoTarea(null)
    resetTareaForm()
  }

  const abrirEditarTarea = (tarea: Tarea) => {
    setEditandoTarea(tarea)
    setTareaTitulo(tarea.titulo)
    setTareaDesc(tarea.descripcion)
    setTareaTipo(tarea.tipo)
    setTareaPrioridad(tarea.prioridad)
    setTareaHoras(tarea.horasEstimadas)
    setShowTareaForm(null)
  }

  const resetTareaForm = () => {
    setTareaTitulo(""); setTareaDesc(""); setTareaTipo("ejecucion"); setTareaPrioridad("media"); setTareaHoras(4)
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
          <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20, alignItems:"start" }}>

            {/* COL PRINCIPAL */}
            <div style={{ display:"flex", flexDirection:"column", gap:18, minWidth:0 }}>

              {/* Descripción + Criterios */}
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

                {/* Formulario editar tarea (global — fuera de un caso específico) */}
                {editandoTarea && (
                  <div style={{ ...PNL, marginBottom:12, borderColor:"var(--chart-1)" }}>
                    <p style={{ fontSize:12, fontWeight:700, color:"var(--chart-1)", marginBottom:10 }}>
                      <Pencil size={12} style={{ display:"inline", marginRight:5 }}/>Editando tarea: {editandoTarea.titulo}
                    </p>
                    <TareaFormFields
                      titulo={tareaTitulo} onTitulo={setTareaTitulo}
                      desc={tareaDesc} onDesc={setTareaDesc}
                      tipo={tareaTipo} onTipo={setTareaTipo}
                      prioridad={tareaPrioridad} onPrioridad={setTareaPrioridad}
                      horas={tareaHoras} onHoras={setTareaHoras}
                    />
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                      <Button variant="outline" size="sm" style={{ height:26, fontSize:10 }}
                        onClick={() => { setEditandoTarea(null); resetTareaForm() }}>Cancelar</Button>
                      <Button size="sm" style={{ height:26, fontSize:10 }} disabled={!tareaTitulo.trim()}
                        onClick={submitEditarTarea}>Guardar tarea</Button>
                    </div>
                  </div>
                )}

                {casosHU.length === 0 && !showCasoForm && !editandoCaso && (
                  <div style={{ textAlign:"center", padding:24, color:"var(--muted-foreground)", border:"1px dashed var(--border)", borderRadius:10 }}>
                    <p style={{ fontSize:13 }}>Sin casos de prueba.{puedeAgregarCasos ? " Crea uno con el botón Nuevo Caso." : ""}</p>
                  </div>
                )}

                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {casosHU.map(caso => {
                    const aprobCfg = ESTADO_APROBACION_CFG[caso.estadoAprobacion]
                    const compCfg = COMPLEJIDAD_CFG[caso.complejidad]
                    const tpColor = getTipoPruebaColor(caso.tipoPrueba)
                    const tareasCaso = tareas.filter(t => caso.tareasIds.includes(t.id))
                    const isExpanded = expandedCaso === caso.id
                    const bloqueosActivos = caso.bloqueos.filter(b => !b.resuelto)

                    const etapaActual = hu.etapa as EtapaEjecucion
                    const resultadoEtapaActual = caso.resultadosPorEtapa.find(r => r.etapa === etapaActual)

                    // Caso completamente terminado (todas etapas exitosas)
                    const casoCompletado = caso.resultadosPorEtapa.length > 0 &&
                      caso.resultadosPorEtapa.every(r => r.resultado === "exitoso")

                    // Puede editar/eliminar este caso (QA o Admin, siempre que no esté aprobado/pendiente)
                    const puedeEditar = !huCerrada && (isQA || isAdmin || isQALead) && (
                      caso.estadoAprobacion === "borrador" ||
                      caso.estadoAprobacion === "rechazado" ||
                      caso.modificacionHabilitada
                    )
                    const puedeEliminar = !huCerrada && (isQA || isAdmin || isQALead) && (
                      caso.estadoAprobacion === "borrador" || caso.estadoAprobacion === "rechazado"
                    )

                    // Puede QA solicitar modificación de caso aprobado?
                    const puedeSolicitarMod = !huCerrada && isQA &&
                      caso.estadoAprobacion === "aprobado" &&
                      !caso.modificacionSolicitada &&
                      !caso.modificacionHabilitada

                    // Admin ve solicitud de modificación pendiente?
                    const adminVeSolicitud = (isAdmin || isQALead) && caso.modificacionSolicitada && !caso.modificacionHabilitada

                    // Puede añadir tareas (QA o admin, HU no cerrada, caso no completado)
                    const puedeAddTarea = !huCerrada && !casoCompletado && (isQA || isAdmin || isQALead)

                    return (
                      <div key={caso.id} style={{ border:`1px solid ${caso.modificacionSolicitada ? "var(--chart-3)" : "var(--border)"}`, borderRadius:10, background:"var(--card)", overflow:"hidden" }}>
                        {/* Cabecera del caso */}
                        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", cursor:"pointer" }}
                          onClick={() => setExpandedCaso(isExpanded ? null : caso.id)} className="hover:bg-secondary/30">
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                              <p style={{ fontSize:11, fontFamily:"monospace", color:"var(--primary)", fontWeight:600 }}>{caso.id}</p>
                              <Badge variant="outline" className={`${aprobCfg.cls} text-[9px]`}>{aprobCfg.label}</Badge>
                              <Badge variant="outline" className={`${tpColor} text-[9px]`}>{getTipoPruebaLabel(caso.tipoPrueba, tiposPrueba)}</Badge>
                              <Badge variant="outline" className={`${compCfg.cls} text-[9px]`}>{compCfg.label}</Badge>
                              {caso.modificacionSolicitada && !caso.modificacionHabilitada && (
                                <Badge variant="outline" className="bg-chart-3/20 text-chart-3 border-chart-3/30 text-[9px]">
                                  <Bell size={9} className="mr-1"/>Mod. solicitada
                                </Badge>
                              )}
                              {bloqueosActivos.length > 0 && (
                                <span style={{ display:"flex", alignItems:"center", gap:2 }}>
                                  <AlertTriangle size={11} style={{ color:"var(--chart-4)" }}/>
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{caso.titulo}</p>
                            {caso.estadoAprobacion === "rechazado" && caso.motivoRechazo && (
                              <div style={{ display:"flex", alignItems:"flex-start", gap:5, marginTop:4, padding:"5px 8px", borderRadius:6, background:"color-mix(in oklch,var(--chart-4) 8%,transparent)", border:"1px solid color-mix(in oklch,var(--chart-4) 25%,transparent)" }}>
                                <AlertTriangle size={10} style={{ color:"var(--chart-4)", flexShrink:0, marginTop:1 }}/>
                                <p style={{ fontSize:11, color:"var(--chart-4)", fontWeight:600, lineHeight:1.4 }}>
                                  Motivo de rechazo: <span style={{ fontWeight:400 }}>{caso.motivoRechazo}</span>
                                </p>
                              </div>
                            )}
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
                            <span style={{ fontSize:11, color:"var(--muted-foreground)" }}>{caso.horasEstimadas}h</span>
                            <span style={{ fontSize:11, color:"var(--muted-foreground)" }}>{tareasCaso.length} tarea{tareasCaso.length!==1?"s":""}</span>
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
                                  {getEtapaHUCfg(r.etapa, configEtapas).label.slice(0,3)}
                                  {r.resultado === "exitoso" ? " ✓" : r.resultado === "fallido" ? " ✗" : r.estado === "en_ejecucion" ? " ▶" : ""}
                                  {retestLabel}
                                </Badge>
                              )
                            })}
                            {/* Botones editar/eliminar (sin expandir) */}
                            {puedeEditar && (
                              <button type="button" title="Editar caso"
                                onClick={e => { e.stopPropagation(); abrirEditarCaso(caso) }}
                                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-1)", padding:2 }}>
                                <Pencil size={13}/>
                              </button>
                            )}
                            {puedeEliminar && (
                              <button type="button" title="Eliminar caso"
                                onClick={e => { e.stopPropagation(); onEliminarCaso(caso.id, hu.id) }}
                                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-4)", padding:2 }}>
                                <Trash2 size={13}/>
                              </button>
                            )}
                            {isExpanded ? <ChevronUp size={14} style={{ color:"var(--muted-foreground)" }}/> : <ChevronDown size={14} style={{ color:"var(--muted-foreground)" }}/>}
                          </div>
                        </div>

                        {/* Detalle expandido del caso */}
                        {isExpanded && (
                          <div style={{ padding:"0 14px 14px", borderTop:"1px solid var(--border)" }}>
                            {caso.descripcion && (
                              <p style={{ fontSize:12, color:"var(--muted-foreground)", padding:"10px 0 6px", lineHeight:1.5 }}>{caso.descripcion}</p>
                            )}

                            {caso.archivosAnalizados.length > 0 && (
                              <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8, marginTop:4 }}>
                                <span style={{ fontSize:10, color:"var(--muted-foreground)" }}>Archivos:</span>
                                {caso.archivosAnalizados.map((a,i) => (
                                  <Badge key={i} variant="outline" className="text-[9px] bg-muted text-muted-foreground border-border" style={{ padding:"1px 5px" }}>{a}</Badge>
                                ))}
                              </div>
                            )}

                            {/* Acciones del caso (por caso individual) */}
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8, marginTop:6 }}>
                              {/* QA: enviar este caso a aprobación */}
                              {!huCerrada && isQA && (caso.estadoAprobacion === "borrador" || caso.estadoAprobacion === "rechazado") && (
                                <Button size="sm" variant="outline" style={{ height:26, fontSize:10, padding:"0 10px" }}
                                  onClick={() => onEnviarCasoAprobacion(caso.id, hu.id)}>
                                  <Send size={10} className="mr-1"/> Enviar a aprobación
                                </Button>
                              )}
                              {/* QA: solicitar modificación de caso aprobado */}
                              {puedeSolicitarMod && (
                                <Button size="sm" variant="outline" style={{ height:26, fontSize:10, padding:"0 10px", borderColor:"var(--chart-3)", color:"var(--chart-3)" }}
                                  onClick={() => onSolicitarModificacionCaso(caso.id, hu.id)}>
                                  <Bell size={10} className="mr-1"/> Solicitar modificación
                                </Button>
                              )}
                              {/* Admin: habilitar modificación solicitada */}
                              {adminVeSolicitud && (
                                <Button size="sm" variant="outline" style={{ height:26, fontSize:10, padding:"0 10px" }}
                                  onClick={() => onHabilitarModificacionCaso(caso.id, hu.id)}>
                                  <Unlock size={10} className="mr-1"/> Habilitar modificación
                                </Button>
                              )}
                            </div>

                            {/* Motivo de rechazo */}
                            {caso.estadoAprobacion === "rechazado" && caso.motivoRechazo && (
                              <div style={{ padding:"6px 10px", borderRadius:7, background:"color-mix(in oklch, var(--chart-4) 6%, transparent)", border:"1px solid color-mix(in oklch, var(--chart-4) 30%, var(--border))", marginBottom:8, fontSize:11 }}>
                                <span style={{ fontWeight:600, color:"var(--chart-4)" }}>Rechazo:</span>{" "}
                                <span style={{ color:"var(--foreground)" }}>{caso.motivoRechazo}</span>
                              </div>
                            )}

                            {/* Acciones de ejecución para el caso en etapa actual */}
                            {caso.estadoAprobacion === "aprobado" && resultadoEtapaActual?.estado === "en_ejecucion" && (isQA || isAdmin || isQALead) && (
                              <div style={{ marginBottom:10, marginTop:6 }}>
                                {showFalloForm !== caso.id ? (
                                  <div style={{ display:"flex", gap:6 }}>
                                    <Button size="sm" className="bg-chart-2 hover:bg-chart-2/90 text-white"
                                      style={{ height:26, fontSize:10, padding:"0 10px" }}
                                      onClick={() => onCompletarCasoEtapa(caso.id, etapaActual, "exitoso")}>
                                      <CheckCircle2 size={11} className="mr-1"/> Exitoso
                                    </Button>
                                    <Button size="sm" variant="outline" style={{ color:"var(--chart-4)", height:26, fontSize:10, padding:"0 10px" }}
                                      onClick={() => { setShowFalloForm(caso.id); setComentarioFallo("") }}>
                                      <XCircle size={11} className="mr-1"/> Fallido
                                    </Button>
                                  </div>
                                ) : (
                                  <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid var(--chart-4)", background:"color-mix(in oklch, var(--chart-4) 4%, var(--background))" }}>
                                    <p style={{ fontSize:11, fontWeight:600, color:"var(--chart-4)", marginBottom:6 }}>Describe qué falló en la prueba *</p>
                                    <Textarea rows={2} value={comentarioFallo} onChange={e => setComentarioFallo(e.target.value)}
                                      placeholder="Ej: El endpoint retorna 500 cuando se envían credenciales con caracteres especiales..."
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
                            {caso.estadoAprobacion === "aprobado" && resultadoEtapaActual?.resultado === "fallido" && (isQA || isAdmin || isQALead) && (
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
                                      placeholder="Ej: Se corrigió la validación, deploy realizado en branch fix/login-encoding..."
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

                            {/* Historial de intentos */}
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
                                            {getEtapaHUCfg(r.etapa, configEtapas).label}
                                          </Badge>
                                          <Badge variant="outline" className={`text-[9px] ${intento.resultado === "exitoso" ? "bg-chart-2/20 text-chart-2 border-chart-2/30" : "bg-chart-4/20 text-chart-4 border-chart-4/30"}`} style={{ padding:"1px 5px" }}>
                                            Intento #{intento.numero} — {intento.resultado === "exitoso" ? "Exitoso" : "Fallido"}
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
                                    ))
                                  )}
                                </div>
                              </div>
                            )}

                            {/* ── Tareas del caso ── */}
                            <div style={{ marginTop:8 }}>
                              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                                <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted-foreground)" }}>
                                  Tareas ({tareasCaso.length})
                                </p>
                                {puedeAddTarea && showTareaForm !== caso.id && (
                                  <button type="button" onClick={e => { e.stopPropagation(); setShowTareaForm(caso.id) }}
                                    style={{ fontSize:10, color:"var(--primary)", background:"none", border:"none", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}>
                                    <Plus size={10}/> Tarea
                                  </button>
                                )}
                              </div>

                              {/* Formulario nueva tarea */}
                              {showTareaForm === caso.id && (
                                <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid var(--primary)", background:"var(--background)", marginBottom:8 }}>
                                  <TareaFormFields
                                    titulo={tareaTitulo} onTitulo={setTareaTitulo}
                                    desc={tareaDesc} onDesc={setTareaDesc}
                                    tipo={tareaTipo} onTipo={setTareaTipo}
                                    prioridad={tareaPrioridad} onPrioridad={setTareaPrioridad}
                                    horas={tareaHoras} onHoras={setTareaHoras}
                                  />
                                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                    <Button variant="outline" size="sm" style={{ height:24, fontSize:10 }}
                                      onClick={() => { setShowTareaForm(null); resetTareaForm() }}>Cancelar</Button>
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
                                const puedeManejarTarea = !huCerrada && (isQA || isAdmin || isQALead) && tarea.estado !== "completada"
                                const puedeEditarTarea = !huCerrada && (isQA || isAdmin || isQALead) && tarea.estado === "pendiente"
                                const puedeEliminarTarea = !huCerrada && (isQA || isAdmin || isQALead) &&
                                  (tarea.estado === "pendiente" || tarea.estado === "en_progreso")

                                return (
                                  <div key={tarea.id} style={{ padding:"8px 10px", borderRadius:7, border:"1px solid var(--border)", marginBottom:4, background:"var(--card)" }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
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
                                      }`}>
                                        {tarea.estado === "completada" ? "Completada" : tarea.estado === "bloqueada" ? "Bloqueada" : tarea.estado === "en_progreso" ? "En Progreso" : "Pendiente"}
                                      </Badge>

                                      {/* Acciones de tarea */}
                                      <div style={{ display:"flex", gap:3, flexShrink:0 }}>
                                        {puedeEditarTarea && (
                                          <button type="button" title="Editar tarea"
                                            onClick={() => abrirEditarTarea(tarea)}
                                            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-1)", padding:2 }}>
                                            <Pencil size={13}/>
                                          </button>
                                        )}
                                        {puedeEliminarTarea && (
                                          <button type="button" title="Eliminar tarea"
                                            onClick={() => onEliminarTarea(tarea.id, caso.id)}
                                            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-4)", padding:2 }}>
                                            <Trash2 size={13}/>
                                          </button>
                                        )}
                                        {puedeManejarTarea && tarea.estado !== "bloqueada" && (
                                          <>
                                            <button type="button" title="Completar exitosa" onClick={() => onCompletarTarea(tarea.id, "exitoso")}
                                              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-2)", padding:2 }}>
                                              <CheckCircle2 size={14}/>
                                            </button>
                                            <button type="button" title="Marcar como fallida" onClick={() => onCompletarTarea(tarea.id, "fallido")}
                                              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-4)", padding:2 }}>
                                              <XCircle size={14}/>
                                            </button>
                                            <button type="button" title="Bloquear tarea" onClick={() => { setShowBloqueoTareaForm(tarea.id); setBloqueoTareaTexto("") }}
                                              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-3)", padding:2 }}>
                                              <Lock size={13}/>
                                            </button>
                                          </>
                                        )}
                                        {puedeManejarTarea && tarea.estado === "bloqueada" && tareaBloqueos.length > 0 && (
                                          <button type="button" title="Desbloquear tarea" onClick={() => {
                                            const bl = tarea.bloqueos.find(b => !b.resuelto)
                                            if (bl) onDesbloquearTarea(tarea.id, bl.id)
                                          }}
                                            style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-2)", padding:2 }}>
                                            <Unlock size={13}/>
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Formulario bloqueo tarea (inline bajo la tarea) */}
                                    {showBloqueoTareaForm === tarea.id && (
                                      <div style={{ padding:"8px 10px", borderRadius:7, border:"1px solid var(--chart-3)", background:"var(--background)", marginTop:6 }}>
                                        <Input value={bloqueoTareaTexto} onChange={e => setBloqueoTareaTexto(e.target.value)}
                                          placeholder="Descripción del bloqueo..." style={{ fontSize:11, marginBottom:6 }} />
                                        <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                                          <Button variant="outline" size="sm" style={{ height:24, fontSize:10 }}
                                            onClick={() => setShowBloqueoTareaForm(null)}>Cancelar</Button>
                                          <Button size="sm" style={{ height:24, fontSize:10 }} disabled={!bloqueoTareaTexto.trim()}
                                            onClick={() => {
                                              onBloquearTarea(tarea.id, {
                                                id: `bl-${Date.now()}`, descripcion: bloqueoTareaTexto.trim(),
                                                reportadoPor: currentUser || "Sistema", fecha: new Date(), resuelto: false,
                                              })
                                              setShowBloqueoTareaForm(null); setBloqueoTareaTexto("")
                                            }}>Bloquear</Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>

                            {/* ── Comentarios del caso ── */}
                            <div style={{ marginTop:8, paddingTop:10, borderTop:"1px solid var(--border)" }}>
                              <p style={{ ...SLBL, marginBottom:10 }}><MessageSquare size={10}/>Comentarios ({caso.comentarios.length})</p>
                              <CommentThread
                                comentarios={caso.comentarios}
                                onAdd={texto => onAddComentarioCaso(caso.id, texto)}
                                currentUser={currentUser}
                                canComment={isAdmin || isQALead || isQA}
                              />
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

// ── Sub-formularios reutilizables ──────────────────────────────

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
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
      <div style={{ gridColumn:"1/3" }}>
        <Input value={titulo} onChange={e => onTitulo(e.target.value)} placeholder="Título del caso de prueba *" style={{ fontSize:12 }} />
      </div>
      <div style={{ gridColumn:"1/3" }}>
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

interface TareaFormFieldsProps {
  titulo: string; onTitulo: (v: string) => void
  desc: string; onDesc: (v: string) => void
  tipo: TipoTarea; onTipo: (v: TipoTarea) => void
  prioridad: PrioridadTarea; onPrioridad: (v: PrioridadTarea) => void
  horas: number; onHoras: (v: number) => void
}

function TareaFormFields({ titulo, onTitulo, desc, onDesc, tipo, onTipo, prioridad, onPrioridad, horas, onHoras }: TareaFormFieldsProps) {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:6 }}>
      <div style={{ gridColumn:"1/3" }}>
        <Input value={titulo} onChange={e => onTitulo(e.target.value)} placeholder="Título de la tarea *" style={{ fontSize:11 }} />
      </div>
      <div style={{ gridColumn:"1/3" }}>
        <Input value={desc} onChange={e => onDesc(e.target.value)} placeholder="Descripción (opcional)" style={{ fontSize:11 }} />
      </div>
      <div>
        <Select value={tipo} onValueChange={(v: TipoTarea) => onTipo(v)}>
          <SelectTrigger style={{ height:28, fontSize:10 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            {(Object.keys(TIPO_TAREA_LABEL) as TipoTarea[]).map(k => (
              <SelectItem key={k} value={k}>{TIPO_TAREA_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select value={prioridad} onValueChange={(v: PrioridadTarea) => onPrioridad(v)}>
          <SelectTrigger style={{ height:28, fontSize:10 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Input type="number" min={1} value={horas} onChange={e => onHoras(parseInt(e.target.value)||1)}
          placeholder="Horas" style={{ height:28, fontSize:10 }} />
      </div>
    </div>
  )
}
