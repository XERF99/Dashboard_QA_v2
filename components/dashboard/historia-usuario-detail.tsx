"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  CheckSquare, Calendar, Star, ArrowRight, TrendingUp,
  AlertTriangle, Plus, CheckCircle2, ShieldAlert, Layers,
  MessageSquare, User
} from "lucide-react"
import {
  TIPO_TAREA_LABEL, TIPO_TAREA_COLOR,
  TIPO_PRUEBA_LABEL, TIPO_PRUEBA_COLOR,
  fasesParaTipo,
  calcularCriticidad, calcularEsfuerzo, calcularFechaFinEstimada,
  type HistoriaUsuario, type Tarea, type Bloqueo, type Observacion, type EventoBloqueo,
  type FaseTarea, type EstadoTarea, type ResultadoTarea, type TipoPrueba,
} from "@/lib/types"

interface Props {
  open: boolean
  onClose: () => void
  hu: HistoriaUsuario | null
  tareas: Tarea[]
  observaciones: Observacion[]
  currentUser?: string
  canEdit?: boolean
  onAddBloqueo?: (huId: string, b: Bloqueo) => void
  onResolverBloqueo?: (huId: string, bId: string) => void
  onCambiarFaseTarea?: (tareaId: string, fase: FaseTarea, estado: EstadoTarea, resultado: ResultadoTarea, nota?: string) => void
  onAddObservacion?: (obs: Observacion) => void
}

// ── Helpers ──────────────────────────────────────────────
const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
function fmt(d: Date): string {
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
function fmtCorto(d: Date): string {
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]}`
}
function fmtHora(d: Date): string {
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`
}

// ── Configs visuales ─────────────────────────────────────
const ESTADO_HU_CFG: Record<string,{label:string;cls:string}> = {
  pendiente:   { label:"Pendiente",   cls:"bg-muted text-muted-foreground border-border" },
  en_progreso: { label:"En Progreso", cls:"bg-chart-1/20 text-chart-1 border-chart-1/30" },
  bloqueado:   { label:"Bloqueado",   cls:"bg-chart-4/20 text-chart-4 border-chart-4/30" },
  stand_by:    { label:"Stand By",    cls:"bg-chart-5/20 text-chart-5 border-chart-5/30" },
  exitoso:     { label:"✅ Exitoso",  cls:"bg-chart-2/20 text-chart-2 border-chart-2/30" },
  fallido:     { label:"❌ Fallido",  cls:"bg-chart-4/30 text-chart-4 border-chart-4/50" },
}
const PRIORIDAD_CFG: Record<string,{label:string;cls:string}> = {
  alta:  { label:"Alta",  cls:"bg-chart-4/20 text-chart-4 border-chart-4/30" },
  media: { label:"Media", cls:"bg-chart-3/20 text-chart-3 border-chart-3/30" },
  baja:  { label:"Baja",  cls:"bg-chart-2/20 text-chart-2 border-chart-2/30" },
}
const FASE_LABELS: Record<string,string> = {
  despliegue:"Despliegue", rollback:"Rollback", redespliegue:"Redespliegue", validacion:"Validación",
}
const FASE_COLOR: Record<string,string> = {
  despliegue:   "bg-chart-1/20 text-chart-1 border-chart-1/30",
  rollback:     "bg-chart-4/20 text-chart-4 border-chart-4/30",
  redespliegue: "bg-chart-3/20 text-chart-3 border-chart-3/30",
  validacion:   "bg-chart-2/20 text-chart-2 border-chart-2/30",
}
const ESTADO_TAREA_CFG: Record<string,{label:string;cls:string}> = {
  pendiente:   { label:"Pendiente",   cls:"bg-muted text-muted-foreground border-border" },
  en_progreso: { label:"En Progreso", cls:"bg-chart-1/20 text-chart-1 border-chart-1/30" },
  completada:  { label:"Completada",  cls:"bg-chart-2/20 text-chart-2 border-chart-2/30" },
  bloqueada:   { label:"Bloqueada",   cls:"bg-chart-4/20 text-chart-4 border-chart-4/30" },
}
const RESULTADO_CFG: Record<string,{label:string;cls:string}> = {
  pendiente: { label:"—",          cls:"bg-muted text-muted-foreground border-border" },
  exitoso:   { label:"✅ Exitoso", cls:"bg-chart-2/20 text-chart-2 border-chart-2/30" },
  fallido:   { label:"❌ Fallido", cls:"bg-chart-4/20 text-chart-4 border-chart-4/30" },
  omitido:   { label:"Omitida",    cls:"bg-muted text-muted-foreground border-border" },
}
const CRIT_CFG: Record<string,{label:string;cls:string}> = {
  alta:  { label:"Alta",  cls:"bg-chart-4/20 text-chart-4 border-chart-4/30" },
  media: { label:"Media", cls:"bg-chart-3/20 text-chart-3 border-chart-3/30" },
  baja:  { label:"Baja",  cls:"bg-chart-2/20 text-chart-2 border-chart-2/30" },
}
const ESF_CFG: Record<string,{label:string;cls:string}> = {
  alto:  { label:"Alto",  cls:"bg-chart-4/20 text-chart-4 border-chart-4/30" },
  medio: { label:"Medio", cls:"bg-chart-3/20 text-chart-3 border-chart-3/30" },
  bajo:  { label:"Bajo",  cls:"bg-chart-2/20 text-chart-2 border-chart-2/30" },
}

const PNL: React.CSSProperties = { padding:"13px 15px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }
const SLBL: React.CSSProperties = { fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:10, display:"flex", alignItems:"center", gap:5 }
const TH: React.CSSProperties = { padding:"8px 10px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--muted-foreground)", background:"var(--secondary)", whiteSpace:"nowrap", textAlign:"left" }
const TD: React.CSSProperties = { padding:"10px 10px", fontSize:12, color:"var(--foreground)", borderBottom:"1px solid var(--border)", verticalAlign:"middle" }

// ── Fila expandible de Tarea ─────────────────────────────
function FilaTarea({ tarea, observaciones, canEdit, currentUser, onCambiarFase, onAddObs }: {
  tarea: Tarea; observaciones: Observacion[]; canEdit: boolean; currentUser?: string
  onCambiarFase?: (id:string, f:FaseTarea, e:EstadoTarea, r:ResultadoTarea, nota?:string)=>void
  onAddObs?: (obs:Observacion)=>void
}) {
  const [expanded, setExpanded]       = useState(false)
  const [tab, setTab]                 = useState<"avance"|"obs">("avance")
  const [nuevaFase, setNuevaFase]     = useState<FaseTarea>(tarea.faseActual)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoTarea>(tarea.estado)
  const [resultado, setResultado]     = useState<ResultadoTarea>(tarea.resultado)
  const [nota, setNota]               = useState("")
  const [textoObs, setTextoObs]       = useState("")
  const [diasExtra, setDiasExtra]     = useState(0)

  const fases       = fasesParaTipo(tarea.tipo)
  const criticidad  = calcularCriticidad(tarea)
  const esfuerzo    = calcularEsfuerzo(tarea)
  const obsT        = observaciones.filter(o => o.tareaId === tarea.id)
  const fechaFinEst = calcularFechaFinEstimada(tarea, obsT)
  const diasExtraTotal = obsT.reduce((s,o)=>s+o.diasExtra,0)

  const critCfg   = CRIT_CFG[criticidad]
  const esfCfg    = ESF_CFG[esfuerzo]
  const estadoCfg = ESTADO_TAREA_CFG[tarea.estado] || ESTADO_TAREA_CFG.pendiente
  const resCfg    = RESULTADO_CFG[tarea.resultado]  || RESULTADO_CFG.pendiente
  const tpColor   = TIPO_PRUEBA_COLOR[tarea.tipoPrueba] || "bg-muted text-muted-foreground border-border"
  const tpLabel   = TIPO_PRUEBA_LABEL[tarea.tipoPrueba] || tarea.tipoPrueba

  const handleRowClick = () => { if (canEdit) setExpanded(v=>!v) }

  return (
    <>
      <tr onClick={handleRowClick} className="hover:bg-secondary/40" style={{ cursor: canEdit?"pointer":"default", transition:"background 0.12s" }}>
        {/* Tipo de tarea */}
        <td style={TD}>
          <Badge variant="outline" className={`${TIPO_TAREA_COLOR[tarea.tipo]} text-[10px]`}>{TIPO_TAREA_LABEL[tarea.tipo]}</Badge>
        </td>
        {/* Tipo de prueba */}
        <td style={TD}>
          <Badge variant="outline" className={`${tpColor} text-[10px]`}>{tpLabel}</Badge>
        </td>
        {/* Título + responsable */}
        <td style={{ ...TD, minWidth:170 }}>
          <p style={{ fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:170 }}>{tarea.titulo}</p>
          <p style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:2 }}>{tarea.asignado}</p>
        </td>
        {/* Fecha inicio */}
        <td style={TD}>
          <p style={{ fontSize:12, fontWeight:500 }}>{fmtCorto(tarea.fechaInicio)}</p>
        </td>
        {/* Fase */}
        <td style={TD}>
          <Badge variant="outline" className={`${FASE_COLOR[tarea.faseActual]} text-[10px]`}>{FASE_LABELS[tarea.faseActual]}</Badge>
        </td>
        {/* Estado */}
        <td style={TD}>
          <Badge variant="outline" className={`${estadoCfg.cls} text-[10px]`}>{estadoCfg.label}</Badge>
        </td>
        {/* Resultado */}
        <td style={TD}>
          <Badge variant="outline" className={`${resCfg.cls} text-[10px]`}>{resCfg.label}</Badge>
        </td>
        {/* Criticidad */}
        <td style={TD}>
          <Badge variant="outline" className={`${critCfg.cls} text-[10px]`}>{critCfg.label}</Badge>
        </td>
        {/* Esfuerzo */}
        <td style={TD}>
          <Badge variant="outline" className={`${esfCfg.cls} text-[10px]`}>{esfCfg.label}</Badge>
        </td>
        {/* Fecha fin estimada */}
        <td style={TD}>
          <p style={{ fontSize:12, fontWeight:600 }}>{fmtCorto(fechaFinEst)}</p>
          {diasExtraTotal > 0 && <p style={{ fontSize:10, color:"var(--chart-4)" }}>+{diasExtraTotal}d</p>}
        </td>
        {/* Horas */}
        <td style={{ ...TD, textAlign:"right", paddingRight:14 }}>
          <span style={{ fontFamily:"monospace", fontSize:12 }}>{tarea.horasEstimadas}h</span>
        </td>
        {/* Indicador editable */}
        {canEdit && (
          <td style={{ ...TD, width:32, textAlign:"center", paddingRight:8 }}>
            <span style={{ fontSize:14, color:"var(--muted-foreground)" }}>{expanded?"▲":"▼"}</span>
          </td>
        )}
      </tr>

      {/* Panel expandido */}
      {expanded && canEdit && (
        <tr>
          <td colSpan={12} style={{ padding:0, background:"color-mix(in oklch, var(--primary) 4%, var(--secondary))" }}>
            <div style={{ padding:"14px 16px", borderTop:"2px solid var(--primary)" }}>
              {/* Tabs */}
              <div style={{ display:"flex", gap:8, marginBottom:14 }}>
                {(["avance","obs"] as const).map(t => (
                  <button key={t} type="button" onClick={e => { e.stopPropagation(); setTab(t) }}
                    style={{ padding:"5px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer",
                      border: tab===t ? "1px solid var(--primary)" : "1px solid var(--border)",
                      background: tab===t ? "color-mix(in oklch, var(--primary) 15%, transparent)" : "transparent",
                      color: tab===t ? "var(--primary)" : "var(--muted-foreground)" }}>
                    {t==="avance" ? "⚡ Actualizar estado" : "💬 Agregar observación"}
                  </button>
                ))}
              </div>

              {tab === "avance" && (
                <div onClick={e=>e.stopPropagation()}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 2fr", gap:10, marginBottom:10 }}>
                    <div>
                      <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Nueva fase</label>
                      <Select value={nuevaFase} onValueChange={(v:FaseTarea)=>setNuevaFase(v)}>
                        <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
                        <SelectContent>{fases.map(f=><SelectItem key={f} value={f}>{FASE_LABELS[f]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Estado</label>
                      <Select value={nuevoEstado} onValueChange={(v:EstadoTarea)=>setNuevoEstado(v)}>
                        <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="bloqueada">Bloqueada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Resultado</label>
                      <Select value={resultado} onValueChange={(v:ResultadoTarea)=>setResultado(v)}>
                        <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="exitoso">✅ Exitoso</SelectItem>
                          <SelectItem value="fallido">❌ Fallido</SelectItem>
                          <SelectItem value="omitido">Omitida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Nota (opcional)</label>
                      <Input value={nota} onChange={e=>setNota(e.target.value)} placeholder="Motivo del cambio..." style={{ height:30, fontSize:11 }}/>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <button type="button"
                      onClick={()=>{ onCambiarFase?.(tarea.id,nuevaFase,nuevoEstado,resultado,nota||undefined); setExpanded(false); setNota("") }}
                      style={{ fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:6, border:"none",
                        background:"var(--primary)", color:"var(--primary-foreground)", cursor:"pointer", letterSpacing:"0.01em" }}>
                      Registrar avance
                    </button>
                    <button type="button" onClick={()=>setExpanded(false)}
                      style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"1px solid var(--border)",
                        background:"transparent", color:"var(--muted-foreground)", cursor:"pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {tab === "obs" && (
                <div onClick={e=>e.stopPropagation()}>
                  {obsT.length > 0 && (
                    <div style={{ marginBottom:12, display:"flex", flexDirection:"column", gap:6 }}>
                      {obsT.map(o=>(
                        <div key={o.id} style={{ display:"flex", gap:10, padding:"8px 12px", borderRadius:7, background:"var(--card)", border:"1px solid var(--border)" }}>
                          <MessageSquare size={13} style={{ color:"var(--muted-foreground)", flexShrink:0, marginTop:2 }}/>
                          <div style={{ flex:1 }}>
                            <p style={{ fontSize:12, color:"var(--foreground)" }}>{o.texto}</p>
                            <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:2 }}>
                              {fmt(o.fecha)} · {fmtHora(o.fecha)} · {o.usuario}
                              {o.diasExtra>0 && <span style={{ color:"var(--chart-4)", marginLeft:6 }}>+{o.diasExtra}d a la fecha fin</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ display:"grid", gridTemplateColumns:"3fr 1fr", gap:10, marginBottom:10 }}>
                    <div>
                      <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Observación / incidente</label>
                      <Textarea rows={2} value={textoObs} onChange={e=>setTextoObs(e.target.value)}
                        placeholder="Describe el incidente..."
                        style={{ fontSize:12, resize:"none", width:"100%", maxWidth:"100%" }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Días adicionales</label>
                      <Input type="number" min={0} max={30} value={diasExtra} onChange={e=>setDiasExtra(parseInt(e.target.value)||0)} style={{ height:30, fontSize:12 }}/>
                      {diasExtra>0 && <p style={{ fontSize:10, color:"var(--chart-4)", marginTop:3 }}>
                        Nueva fin: {fmtCorto(calcularFechaFinEstimada(tarea,[...obsT,{id:"x",tareaId:tarea.id,texto:"",fecha:new Date(),usuario:"",diasExtra}]))}
                      </p>}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                    <button type="button" disabled={!textoObs.trim()}
                      onClick={()=>{ onAddObs?.({id:`obs-${Date.now()}`,tareaId:tarea.id,texto:textoObs.trim(),fecha:new Date(),usuario:currentUser||"Sistema",diasExtra}); setTextoObs(""); setDiasExtra(0); setExpanded(false) }}
                      style={{ fontSize:11, fontWeight:600, padding:"4px 12px", borderRadius:6, border:"none",
                        background:"var(--primary)", color:"var(--primary-foreground)", cursor:"pointer", letterSpacing:"0.01em",
                        opacity: textoObs.trim() ? 1 : 0.45 }}>
                      Guardar observación
                    </button>
                    <button type="button" onClick={()=>setExpanded(false)}
                      style={{ fontSize:11, padding:"4px 10px", borderRadius:6, border:"1px solid var(--border)",
                        background:"transparent", color:"var(--muted-foreground)", cursor:"pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Componente principal ─────────────────────────────────
export function HistoriaUsuarioDetail({
  open, onClose, hu, tareas, observaciones, currentUser, canEdit=false,
  onAddBloqueo, onResolverBloqueo, onCambiarFaseTarea, onAddObservacion,
}: Props) {
  const [nuevoBloqueo, setNuevoBloqueo] = useState("")
  const [showBloqueoForm, setShowBloqueoForm] = useState(false)

  if (!hu) return null

  const tareasHU    = tareas.filter(t=>hu.tareas.includes(t.id))
  const estCfg      = ESTADO_HU_CFG[hu.estado] || ESTADO_HU_CFG.pendiente
  const prioridad   = PRIORIDAD_CFG[hu.prioridad] || PRIORIDAD_CFG.media
  const blActivos   = hu.bloqueos.filter(b=>!b.resuelto)
  const blResueltos = hu.bloqueos.filter(b=>b.resuelto)

  // Progreso
  const totalTareas  = tareasHU.length
  const completadas  = tareasHU.filter(t=>t.estado==="completada").length
  const enProgreso   = tareasHU.filter(t=>t.estado==="en_progreso").length
  const bloqueadas   = tareasHU.filter(t=>t.estado==="bloqueada").length
  const exitosas     = tareasHU.filter(t=>t.resultado==="exitoso").length
  const fallidas     = tareasHU.filter(t=>t.resultado==="fallido").length
  const porcentaje   = totalTareas ? Math.round((completadas/totalTareas)*100) : 0

  // Timeline: eventos de fase + eventos de bloqueo, mezclados y ordenados
  type TimelineItem =
    | { kind: "fase";    ev: typeof tareasHU[0]["historialFases"][0]; tipo: string }
    | { kind: "bloqueo"; ev: { id:string; tipo:"reportado"|"resuelto"; descripcion:string; fecha:Date; usuario:string }; tareaTitulo?: string }

  const timelineItems: TimelineItem[] = [
    ...tareasHU.flatMap(t =>
      t.historialFases.map(e => ({ kind: "fase" as const, ev: e, tipo: t.tipo }))
    ),
    // Bloqueos a nivel HU — evento original siempre como "reportado"
    ...hu.bloqueos.map(b => ({
      kind: "bloqueo" as const,
      ev: { id: b.id, tipo: "reportado" as const,
        descripcion: b.descripcion, fecha: b.fecha, usuario: b.reportadoPor },
    })),
    // Evento de resolución separado (solo si fue resuelto)
    ...hu.bloqueos.filter(b => b.resuelto && b.fechaResolucion).map(b => ({
      kind: "bloqueo" as const,
      ev: { id: `${b.id}-res`, tipo: "resuelto" as const,
        descripcion: b.descripcion, fecha: b.fechaResolucion!, usuario: b.reportadoPor },
    })),
    // Bloqueos a nivel de tarea (eventosBloqueo)
    ...tareasHU.flatMap(t =>
      (t.eventosBloqueo || []).map(eb => ({
        kind: "bloqueo" as const,
        ev: eb,
        tareaTitulo: t.titulo,
      }))
    ),
  ].sort((a,b) => a.ev.fecha.getTime() - b.ev.fecha.getTime())

  const addBloqueo = () => {
    if (!nuevoBloqueo.trim() || !onAddBloqueo) return
    onAddBloqueo(hu.id, { id:`bl-${Date.now()}`, descripcion:nuevoBloqueo.trim(), fecha:new Date(), resuelto:false, reportadoPor:currentUser||"Sistema" })
    setNuevoBloqueo(""); setShowBloqueoForm(false)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent style={{ width:"min(1160px, calc(100vw - 32px))", maxWidth:"min(1160px, calc(100vw - 32px))", maxHeight:"92vh", overflowY:"auto", padding:0 }} className="no-scrollbar">
        <DialogTitle style={{ position:"absolute", width:1, height:1, overflow:"hidden", clip:"rect(0,0,0,0)", whiteSpace:"nowrap" }}>{hu.titulo}</DialogTitle>

        <div style={{ padding:"24px 28px" }}>

          {/* ── HEADER ── */}
          <div style={{ borderBottom:"1px solid var(--border)", paddingBottom:16, marginBottom:20, paddingRight:36 }}>
            <p style={{ fontSize:11, fontFamily:"monospace", color:"var(--primary)", letterSpacing:"0.12em", marginBottom:4 }}>{hu.codigo}</p>
            <p style={{ fontSize:19, fontWeight:700, color:"var(--foreground)", lineHeight:1.3, marginBottom:10 }}>{hu.titulo}</p>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <Badge variant="outline" className={estCfg.cls}>{estCfg.label}</Badge>
              <Badge variant="outline" className={prioridad.cls}>Prioridad {prioridad.label}</Badge>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, color:"var(--muted-foreground)" }}><Star size={12}/>{hu.puntos} pts</span>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:12, color:"var(--muted-foreground)" }}><User size={12}/>{hu.asignado}</span>
              {blActivos.length>0 && <Badge variant="outline" className="bg-chart-4/20 text-chart-4 border-chart-4/30"><ShieldAlert size={11} className="mr-1"/>{blActivos.length} bloqueo{blActivos.length>1?"s":""}</Badge>}
            </div>
          </div>

          {/* ── RESUMEN 5 tarjetas ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginBottom:20 }}>
            {[
              { label:"Progreso",    value:`${porcentaje}%`, sub:`${completadas}/${totalTareas} tareas`,  color:"var(--primary)",  bar:true },
              { label:"En Progreso", value:enProgreso,       sub:"tareas activas",                        color:"var(--chart-1)",  bar:false },
              { label:"Bloqueadas",  value:bloqueadas,       sub:"con impedimento",                       color:"var(--chart-4)",  bar:false },
              { label:"Exitosas",    value:exitosas,         sub:"completadas OK",                        color:"var(--chart-2)",  bar:false },
              { label:"Fallidas",    value:fallidas,         sub:"con fallo",                             color:"var(--chart-4)",  bar:false },
            ].map((m,i)=>(
              <div key={i} style={{ ...PNL, padding:"12px 14px" }}>
                <p style={{ fontSize:10, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>{m.label}</p>
                <p style={{ fontSize:22, fontWeight:700, color:m.color, lineHeight:1 }}>{m.value}</p>
                <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:3 }}>{m.sub}</p>
                {m.bar && <Progress value={porcentaje} className="h-1 mt-3"/>}
              </div>
            ))}
          </div>

          {/* ── BODY 2 cols ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20, alignItems:"start" }}>

            {/* COL PRINCIPAL */}
            <div style={{ display:"flex", flexDirection:"column", gap:18, minWidth:0 }}>

              {/* Descripción + Criterios */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                <div style={PNL}>
                  <p style={SLBL}>Descripción</p>
                  <p style={{ fontSize:13, color:"var(--foreground)", lineHeight:1.6 }}>{hu.descripcion}</p>
                </div>
                <div style={PNL}>
                  <p style={SLBL}><CheckSquare size={11}/>Criterios de Aceptación</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                    {hu.criteriosAceptacion.split("\n").filter(Boolean).map((c,i)=>(
                      <div key={i} style={{ display:"flex", gap:7, alignItems:"flex-start" }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:"var(--primary)", marginTop:6, flexShrink:0 }}/>
                        <p style={{ fontSize:12, color:"var(--foreground)", lineHeight:1.5 }}>{c.replace(/^-\s*/,"")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── TABLA DE TAREAS ── */}
              <div>
                <p style={{ ...SLBL, marginBottom:12 }}>
                  <Layers size={11}/>Tareas / Pruebas
                  {canEdit && <span style={{ fontWeight:400, color:"var(--muted-foreground)", fontSize:10 }}>· clic en fila para actualizar</span>}
                </p>
                {/* overflow-x con scrollbar invisible */}
                <div style={{ overflowX:"auto", borderRadius:10, border:"1px solid var(--border)" }} className="no-scrollbar">
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:900 }}>
                    <thead>
                      <tr style={{ borderBottom:"2px solid var(--border)" }}>
                        <th style={TH}>Tipo</th>
                        <th style={TH}>T. Prueba</th>
                        <th style={{ ...TH, minWidth:160 }}>Tarea / Responsable</th>
                        <th style={TH}>Inicio</th>
                        <th style={TH}>Fase</th>
                        <th style={TH}>Estado</th>
                        <th style={TH}>Resultado</th>
                        <th style={TH}>Criticidad</th>
                        <th style={TH}>Esfuerzo</th>
                        <th style={TH}>Fin Est.</th>
                        <th style={{ ...TH, textAlign:"right" }}>Horas</th>
                        {canEdit && <th style={{ ...TH, width:32 }}></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {tareasHU.length===0
                        ? <tr><td colSpan={12} style={{ ...TD, textAlign:"center", color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin tareas registradas</td></tr>
                        : tareasHU.map(t=>(
                          <FilaTarea key={t.id} tarea={t} observaciones={observaciones}
                            canEdit={canEdit} currentUser={currentUser}
                            onCambiarFase={onCambiarFaseTarea}
                            onAddObs={onAddObservacion}
                          />
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── BLOQUEOS ── */}
              <div style={PNL}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <p style={{ ...SLBL, marginBottom:0 }}><ShieldAlert size={11}/>Bloqueos de la HU</p>
                  {canEdit && onAddBloqueo && (
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
                      <Button size="sm" onClick={addBloqueo} disabled={!nuevoBloqueo.trim()}>Guardar</Button>
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
                      {canEdit && onResolverBloqueo && (
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

            {/* COL DERECHA: Timeline unificado */}
            <div style={{ position:"sticky", top:0 }}>
              <div style={PNL}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:14 }}>
                  <TrendingUp size={13} className="text-chart-1"/>
                  <p style={{ fontSize:12, fontWeight:700, color:"var(--foreground)" }}>Historial</p>
                </div>
                {timelineItems.length===0
                  ? <p style={{ fontSize:12, color:"var(--muted-foreground)", textAlign:"center", padding:"12px 0" }}>Sin eventos</p>
                  : (
                    <div style={{ display:"flex", flexDirection:"column", maxHeight:520, overflowY:"auto" }} className="no-scrollbar">
                      {timelineItems.map((item,i)=>{
                        const isLast = i===timelineItems.length-1
                        const dotColor = item.kind==="bloqueo"
                          ? (item.ev.tipo==="resuelto"?"var(--chart-2)":"var(--chart-4)")
                          : (item.ev.faseAnterior===null?"var(--chart-2)":"var(--chart-1)")
                        return (
                          <div key={item.ev.id+i} style={{ display:"flex", gap:8 }}>
                            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                              <div style={{ width:8, height:8, borderRadius:"50%", marginTop:4, flexShrink:0,
                                background:dotColor, boxShadow:`0 0 0 2px ${dotColor}` }}/>
                              {!isLast && <div style={{ width:2, flex:1, minHeight:14, margin:"2px 0", background:"var(--border)" }}/>}
                            </div>
                            <div style={{ paddingBottom:isLast?0:14, flex:1, minWidth:0 }}>
                              {item.kind==="bloqueo" ? (
                                <>
                                  <Badge variant="outline" className={item.ev.tipo==="resuelto"?"bg-chart-2/20 text-chart-2 border-chart-2/30 text-[9px]":"bg-chart-4/20 text-chart-4 border-chart-4/30 text-[9px]"} style={{ marginBottom:3 }}>
                                    {item.ev.tipo==="resuelto"?"✅ Bloqueo resuelto":"🔴 Bloqueo reportado"}
                                  </Badge>
                                  {item.tareaTitulo && <p style={{ fontSize:10, color:"var(--muted-foreground)", fontStyle:"italic", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.tareaTitulo}</p>}
                                  <p style={{ fontSize:10, color:"var(--foreground)", lineHeight:1.4, marginBottom:2 }}>{item.ev.descripcion}</p>
                                </>
                              ) : (
                                <>
                                  <Badge variant="outline" className={`${TIPO_TAREA_COLOR[item.tipo as keyof typeof TIPO_TAREA_COLOR]} text-[9px]`} style={{ marginBottom:3 }}>
                                    {TIPO_TAREA_LABEL[item.tipo as keyof typeof TIPO_TAREA_LABEL]}
                                  </Badge>
                                  {/* Transición de fase */}
                                  <div style={{ display:"flex", alignItems:"center", gap:3, flexWrap:"wrap", marginBottom:2 }}>
                                    {item.ev.faseAnterior
                                      ? <><Badge variant="outline" className={`${FASE_COLOR[item.ev.faseAnterior]} text-[9px]`} style={{ padding:"1px 4px" }}>{FASE_LABELS[item.ev.faseAnterior]}</Badge><ArrowRight size={8} style={{ color:"var(--muted-foreground)" }}/></>
                                      : <span style={{ fontSize:9, color:"var(--muted-foreground)", fontStyle:"italic" }}>Inicio</span>}
                                    <Badge variant="outline" className={`${FASE_COLOR[item.ev.faseNueva]} text-[9px]`} style={{ padding:"1px 4px" }}>{FASE_LABELS[item.ev.faseNueva]}</Badge>
                                  </div>
                                  {/* Estado y resultado si están disponibles */}
                                  {(item.ev.estadoNuevo || item.ev.resultadoNuevo) && (
                                    <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:2 }}>
                                      {item.ev.estadoNuevo && (
                                        <Badge variant="outline" className={`${ESTADO_TAREA_CFG[item.ev.estadoNuevo]?.cls||""} text-[9px]`} style={{ padding:"1px 4px" }}>
                                          {ESTADO_TAREA_CFG[item.ev.estadoNuevo]?.label}
                                        </Badge>
                                      )}
                                      {item.ev.resultadoNuevo && item.ev.resultadoNuevo!=="pendiente" && (
                                        <Badge variant="outline" className={`${RESULTADO_CFG[item.ev.resultadoNuevo]?.cls||""} text-[9px]`} style={{ padding:"1px 4px" }}>
                                          {RESULTADO_CFG[item.ev.resultadoNuevo]?.label}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  <p style={{ fontSize:10, color:"var(--muted-foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.ev.tareaTitulo}</p>
                                </>
                              )}
                              <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{fmt(item.ev.fecha)} · <span style={{ fontFamily:"monospace" }}>{fmtHora(item.ev.fecha)}</span></p>
                              <p style={{ fontSize:10, fontWeight:600, color:"var(--foreground)" }}>{item.ev.usuario}</p>
                              {"nota" in item.ev && item.ev.nota && (
                                <p style={{ fontSize:10, color:"var(--muted-foreground)", fontStyle:"italic", marginTop:2, padding:"2px 6px", background:"var(--secondary)", borderRadius:4, borderLeft:"2px solid var(--border)" }}>"{item.ev.nota}"</p>
                              )}
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
