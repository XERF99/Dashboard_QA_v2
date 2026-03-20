"use client"

import { useState } from "react"
import { useTareaForm } from "@/lib/hooks/useTareaForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertTriangle, Plus, CheckCircle2,
  Send, ChevronDown, ChevronUp, Lock, Unlock, RefreshCw,
  Pencil, Trash2, Bell, MessageSquare, XCircle,
} from "lucide-react"
import {
  ESTADO_APROBACION_CFG, COMPLEJIDAD_CFG, TIPO_TAREA_LABEL, TIPO_TAREA_COLOR,
  getEtapaHUCfg,
  getTipoPruebaLabel, getTipoPruebaColor,
  fmtCorto,
  TIPO_TAREA_LABEL as TTLABEL,
  type HistoriaUsuario, type CasoPrueba, type Tarea, type Bloqueo,
  type EtapaEjecucion, type TipoTarea, type PrioridadTarea, type ConfigEtapas,
  type TipoPruebaDef,
} from "@/lib/types"
import { CommentThread } from "../shared/comment-thread"

// ── Helpers ──
const PNL: React.CSSProperties = { padding:"13px 15px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }
const SLBL: React.CSSProperties = { fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:10, display:"flex", alignItems:"center", gap:5 }

interface TareaFormFieldsProps {
  titulo: string; onTitulo: (v: string) => void
  desc: string; onDesc: (v: string) => void
  tipo: TipoTarea; onTipo: (v: TipoTarea) => void
  prioridad: PrioridadTarea; onPrioridad: (v: PrioridadTarea) => void
  horas: number; onHoras: (v: number) => void
}

function TareaFormFields({ titulo, onTitulo, desc, onDesc, tipo, onTipo, prioridad, onPrioridad, horas, onHoras }: TareaFormFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5 mb-1.5">
      <div style={{ gridColumn:"1/-1" }}>
        <Input value={titulo} onChange={e => onTitulo(e.target.value)} placeholder="Título de la tarea *" style={{ fontSize:11 }} />
      </div>
      <div style={{ gridColumn:"1/-1" }}>
        <Input value={desc} onChange={e => onDesc(e.target.value)} placeholder="Descripción (opcional)" style={{ fontSize:11 }} />
      </div>
      <div>
        <Select value={tipo} onValueChange={(v: TipoTarea) => onTipo(v)}>
          <SelectTrigger style={{ height:28, fontSize:10 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            {(Object.keys(TTLABEL) as TipoTarea[]).map(k => (
              <SelectItem key={k} value={k}>{TTLABEL[k]}</SelectItem>
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

export interface CasoPruebaCardProps {
  caso: CasoPrueba
  hu: HistoriaUsuario
  tareasCaso: Tarea[]
  isAdmin: boolean
  isQALead: boolean
  isQA: boolean
  huCerrada: boolean
  configEtapas: ConfigEtapas
  tiposPrueba?: TipoPruebaDef[]
  currentUser?: string
  onEliminarCaso: (casoId: string, huId: string) => void
  onEnviarCasoAprobacion: (casoId: string, huId: string) => void
  onSolicitarModificacionCaso: (casoId: string, huId: string) => void
  onHabilitarModificacionCaso: (casoId: string, huId: string) => void
  onAbrirEditar: (caso: CasoPrueba) => void
  onCompletarCasoEtapa: (casoId: string, etapa: EtapaEjecucion, resultado: "exitoso" | "fallido", comentarioFallo?: string) => void
  onRetestearCaso: (casoId: string, etapa: EtapaEjecucion, comentarioCorreccion: string) => void
  onAddTarea: (tarea: Tarea) => void
  onEditarTarea: (tarea: Tarea) => void
  onEliminarTarea: (tareaId: string, casoId: string) => void
  onCompletarTarea: (tareaId: string, resultado: "exitoso" | "fallido") => void
  onBloquearTarea: (tareaId: string, bloqueo: Bloqueo) => void
  onDesbloquearTarea: (tareaId: string, bloqueoId: string) => void
  onAddComentarioCaso: (casoId: string, texto: string) => void
}

export function CasoPruebaCard({
  caso,
  hu,
  tareasCaso,
  isAdmin,
  isQALead,
  isQA,
  huCerrada,
  configEtapas,
  tiposPrueba,
  currentUser,
  onEliminarCaso,
  onEnviarCasoAprobacion,
  onSolicitarModificacionCaso,
  onHabilitarModificacionCaso,
  onAbrirEditar,
  onCompletarCasoEtapa,
  onRetestearCaso,
  onAddTarea,
  onEditarTarea,
  onEliminarTarea,
  onCompletarTarea,
  onBloquearTarea,
  onDesbloquearTarea,
  onAddComentarioCaso,
}: CasoPruebaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Tarea form state
  const {
    editandoTarea, setEditandoTarea,
    showTareaForm, setShowTareaForm,
    tareaTitulo, setTareaTitulo,
    tareaDesc, setTareaDesc,
    tareaTipo, setTareaTipo,
    tareaPrioridad, setTareaPrioridad,
    tareaHoras, setTareaHoras,
    resetTareaForm,
    submitTarea,
    submitEditarTarea,
    abrirEditarTarea,
  } = useTareaForm({
    casoPruebaId: caso.id,
    huId: hu.id,
    currentUser,
    onAddTarea,
    onEditarTarea,
  })

  // Fallo / retest state
  const [showFalloForm, setShowFalloForm] = useState(false)
  const [comentarioFallo, setComentarioFallo] = useState("")
  const [showRetestForm, setShowRetestForm] = useState(false)
  const [comentarioCorreccion, setComentarioCorreccion] = useState("")


  const aprobCfg = ESTADO_APROBACION_CFG[caso.estadoAprobacion]
  const compCfg = COMPLEJIDAD_CFG[caso.complejidad]
  const tpColor = getTipoPruebaColor(caso.tipoPrueba)
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
    <div style={{ border:`1px solid ${caso.modificacionSolicitada ? "var(--chart-3)" : "var(--border)"}`, borderRadius:10, background:"var(--card)", overflow:"hidden" }}>
      {/* Cabecera del caso */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", cursor:"pointer" }}
        onClick={() => setIsExpanded(v => !v)} className="hover:bg-secondary/30">
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4, flexWrap:"wrap" }}>
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
          <span className="hidden sm:inline" style={{ fontSize:11, color:"var(--muted-foreground)" }}>{caso.horasEstimadas}h</span>
          <span className="hidden sm:inline" style={{ fontSize:11, color:"var(--muted-foreground)" }}>{tareasCaso.length} tarea{tareasCaso.length!==1?"s":""}</span>
          {caso.resultadosPorEtapa.map(r => {
            const retests = (r.intentos?.length || 0)
            const retestLabel = retests > 1 ? ` (${retests})` : ""
            return (
              <Badge key={r.etapa} variant="outline" className={`hidden sm:inline-flex text-[8px] ${
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
              onClick={e => { e.stopPropagation(); onAbrirEditar(caso) }}
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
              {!showFalloForm ? (
                <div style={{ display:"flex", gap:6 }}>
                  <Button size="sm" className="bg-chart-2 hover:bg-chart-2/90 text-white"
                    style={{ height:26, fontSize:10, padding:"0 10px" }}
                    onClick={() => onCompletarCasoEtapa(caso.id, etapaActual, "exitoso")}>
                    <CheckCircle2 size={11} className="mr-1"/> Exitoso
                  </Button>
                  <Button size="sm" variant="outline" style={{ color:"var(--chart-4)", height:26, fontSize:10, padding:"0 10px" }}
                    onClick={() => { setShowFalloForm(true); setComentarioFallo("") }}>
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
                      onClick={() => { setShowFalloForm(false); setComentarioFallo("") }}>Cancelar</Button>
                    <Button size="sm" style={{ height:26, fontSize:10 }} disabled={!comentarioFallo.trim()}
                      className="bg-chart-4 hover:bg-chart-4/90 text-white"
                      onClick={() => {
                        onCompletarCasoEtapa(caso.id, etapaActual, "fallido", comentarioFallo.trim())
                        setShowFalloForm(false); setComentarioFallo("")
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
              {!showRetestForm ? (
                <Button size="sm" variant="outline" style={{ borderColor:"var(--chart-1)", color:"var(--chart-1)" }}
                  onClick={() => { setShowRetestForm(true); setComentarioCorreccion("") }}>
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
                      onClick={() => { setShowRetestForm(false); setComentarioCorreccion("") }}>Cancelar</Button>
                    <Button size="sm" style={{ height:26, fontSize:10 }}
                      disabled={!comentarioCorreccion.trim()}
                      onClick={() => {
                        onRetestearCaso(caso.id, etapaActual, comentarioCorreccion.trim())
                        setShowRetestForm(false); setComentarioCorreccion("")
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

          {/* Formulario editar tarea (dentro del card) */}
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

          {/* ── Tareas del caso ── */}
          <div style={{ marginTop:8 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <p style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted-foreground)" }}>
                Tareas ({tareasCaso.length})
              </p>
              {puedeAddTarea && !showTareaForm && (
                <button type="button" onClick={e => { e.stopPropagation(); setShowTareaForm(true) }}
                  style={{ fontSize:10, color:"var(--primary)", background:"none", border:"none", cursor:"pointer", fontWeight:600, display:"flex", alignItems:"center", gap:3 }}>
                  <Plus size={10}/> Tarea
                </button>
              )}
            </div>

            {/* Formulario nueva tarea */}
            {showTareaForm && (
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
                    onClick={() => { setShowTareaForm(false); resetTareaForm() }}>Cancelar</Button>
                  <Button size="sm" style={{ height:24, fontSize:10 }} disabled={!tareaTitulo.trim()}
                    onClick={submitTarea}>Crear</Button>
                </div>
              </div>
            )}

            {tareasCaso.length === 0 && !showTareaForm && (
              <p style={{ fontSize:11, color:"var(--muted-foreground)", fontStyle:"italic", textAlign:"center", padding:8 }}>Sin tareas</p>
            )}

            {tareasCaso.map(tarea => (
              <TareaItem
                key={tarea.id}
                tarea={tarea}
                casoId={caso.id}
                huCerrada={huCerrada}
                isQA={isQA}
                isAdmin={isAdmin}
                isQALead={isQALead}
                currentUser={currentUser}
                onAbrirEditar={abrirEditarTarea}
                onEliminarTarea={onEliminarTarea}
                onCompletarTarea={onCompletarTarea}
                onBloquearTarea={onBloquearTarea}
                onDesbloquearTarea={onDesbloquearTarea}
              />
            ))}
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
}

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTES
// ══════════════════════════════════════════════════════════════

interface TareaItemProps {
  tarea: Tarea
  casoId: string
  huCerrada: boolean
  isQA: boolean
  isAdmin: boolean
  isQALead: boolean
  currentUser?: string
  onAbrirEditar: (tarea: Tarea) => void
  onEliminarTarea: (tareaId: string, casoId: string) => void
  onCompletarTarea: (tareaId: string, resultado: "exitoso" | "fallido") => void
  onBloquearTarea: (tareaId: string, bloqueo: Bloqueo) => void
  onDesbloquearTarea: (tareaId: string, bloqueoId: string) => void
}

function TareaItem({ tarea, casoId, huCerrada, isQA, isAdmin, isQALead, currentUser, onAbrirEditar, onEliminarTarea, onCompletarTarea, onBloquearTarea, onDesbloquearTarea }: TareaItemProps) {
  const [showBloqueoForm, setShowBloqueoForm] = useState(false)
  const [bloqueoTexto, setBloqueoTexto] = useState("")

  const tareaBloqueos   = tarea.bloqueos.filter(b => !b.resuelto)
  const puedeManejar    = !huCerrada && (isQA || isAdmin || isQALead) && tarea.estado !== "completada"
  const puedeEditar     = !huCerrada && (isQA || isAdmin || isQALead) && tarea.estado === "pendiente"
  const puedeEliminar   = !huCerrada && (isQA || isAdmin || isQALead) && (tarea.estado === "pendiente" || tarea.estado === "en_progreso")

  return (
    <div style={{ padding:"8px 10px", borderRadius:7, border:"1px solid var(--border)", marginBottom:4, background:"var(--card)" }}>
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
          tarea.estado === "bloqueada"  ? "bg-chart-4/20 text-chart-4 border-chart-4/30" :
          tarea.estado === "en_progreso"? "bg-chart-1/20 text-chart-1 border-chart-1/30" :
          "bg-muted text-muted-foreground border-border"
        }`}>
          {tarea.estado === "completada" ? "Completada" : tarea.estado === "bloqueada" ? "Bloqueada" : tarea.estado === "en_progreso" ? "En Progreso" : "Pendiente"}
        </Badge>
        <div style={{ display:"flex", gap:3, flexShrink:0 }}>
          {puedeEditar && (
            <button type="button" title="Editar tarea" onClick={() => onAbrirEditar(tarea)}
              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-1)", padding:2 }}>
              <Pencil size={13}/>
            </button>
          )}
          {puedeEliminar && (
            <button type="button" title="Eliminar tarea" onClick={() => onEliminarTarea(tarea.id, casoId)}
              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-4)", padding:2 }}>
              <Trash2 size={13}/>
            </button>
          )}
          {puedeManejar && tarea.estado !== "bloqueada" && (
            <>
              <button type="button" title="Completar exitosa" onClick={() => onCompletarTarea(tarea.id, "exitoso")}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-2)", padding:2 }}>
                <CheckCircle2 size={14}/>
              </button>
              <button type="button" title="Marcar como fallida" onClick={() => onCompletarTarea(tarea.id, "fallido")}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-4)", padding:2 }}>
                <XCircle size={14}/>
              </button>
              <button type="button" title="Bloquear tarea" onClick={() => { setShowBloqueoForm(true); setBloqueoTexto("") }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-3)", padding:2 }}>
                <Lock size={13}/>
              </button>
            </>
          )}
          {puedeManejar && tarea.estado === "bloqueada" && tareaBloqueos.length > 0 && (
            <button type="button" title="Desbloquear tarea" onClick={() => {
              const bl = tarea.bloqueos.find(b => !b.resuelto)
              if (bl) onDesbloquearTarea(tarea.id, bl.id)
            }} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-2)", padding:2 }}>
              <Unlock size={13}/>
            </button>
          )}
        </div>
      </div>
      {showBloqueoForm && (
        <div style={{ padding:"8px 10px", borderRadius:7, border:"1px solid var(--chart-3)", background:"var(--background)", marginTop:6 }}>
          <Input value={bloqueoTexto} onChange={e => setBloqueoTexto(e.target.value)}
            placeholder="Descripción del bloqueo..." style={{ fontSize:11, marginBottom:6 }} />
          <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
            <Button variant="outline" size="sm" style={{ height:24, fontSize:10 }}
              onClick={() => setShowBloqueoForm(false)}>Cancelar</Button>
            <Button size="sm" style={{ height:24, fontSize:10 }} disabled={!bloqueoTexto.trim()}
              onClick={() => {
                onBloquearTarea(tarea.id, {
                  id: `bl-${Date.now()}`, descripcion: bloqueoTexto.trim(),
                  reportadoPor: currentUser || "Sistema", fecha: new Date(), resuelto: false,
                })
                setShowBloqueoForm(false); setBloqueoTexto("")
              }}>Bloquear</Button>
          </div>
        </div>
      )}
    </div>
  )
}
