"use client"

import { useState } from "react"
import { useTareaForm } from "@/lib/hooks/useTareaForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle, Plus, Send, ChevronDown, ChevronUp, Unlock, RefreshCw,
  Pencil, Trash2, Bell, MessageSquare, XCircle,
} from "lucide-react"
import {
  ESTADO_APROBACION_CFG, COMPLEJIDAD_CFG,
  getEtapaHUCfg,
  getTipoPruebaLabel, getTipoPruebaColor,
  type HistoriaUsuario, type CasoPrueba, type Tarea,
  type EtapaEjecucion,
} from "@/lib/types"
import { CommentThread } from "../shared/comment-thread"
import { useHUDetail } from "@/lib/contexts/hu-detail-context"
import { TareaFormFields }       from "./tarea-form-fields"
import { TareaItem }             from "./tarea-item"
import { CasoIntentosHistorial } from "./caso-intentos-historial"

// ── Helpers ──
const PNL: React.CSSProperties = { padding:"13px 15px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }
const SLBL: React.CSSProperties = { fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:10, display:"flex", alignItems:"center", gap:5 }

// ── Props: solo datos de instancia; handlers/permisos/config vienen de HUDetailContext ──
export interface CasoPruebaCardProps {
  caso: CasoPrueba
  hu: HistoriaUsuario
  tareasCaso: Tarea[]
  onAbrirEditar: (caso: CasoPrueba) => void
}

export function CasoPruebaCard({ caso, hu, tareasCaso, onAbrirEditar }: CasoPruebaCardProps) {
  const {
    isAdmin, isQALead, isQA, currentUser,
    configEtapas, configResultados, tiposPrueba,
    onEliminarCaso, onEnviarCasoAprobacion,
    onSolicitarModificacionCaso, onHabilitarModificacionCaso,
    onCompletarCasoEtapa, onRetestearCaso,
    onAddTarea, onEditarTarea, onAddComentarioCaso,
  } = useHUDetail()

  // Helper: look up a ResultadoDef by id, with fallback
  const getResultadoDef = (id: string) =>
    configResultados.find(r => r.id === id) ?? { id, label: id, esAceptado: true, esBase: false, cls: "bg-muted text-muted-foreground border-border" }

  const huCerrada = hu.estado === "exitosa" || hu.estado === "cancelada" || hu.estado === "fallida"

  const [isExpanded, setIsExpanded] = useState(false)

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

  const [showFalloForm, setShowFalloForm] = useState(false)
  const [comentarioFallo, setComentarioFallo] = useState("")
  const [showRetestForm, setShowRetestForm] = useState(false)
  const [comentarioCorreccion, setComentarioCorreccion] = useState("")
  const [showConfirmHabilitar, setShowConfirmHabilitar] = useState(false)

  const aprobCfg = ESTADO_APROBACION_CFG[caso.estadoAprobacion]
  const compCfg = COMPLEJIDAD_CFG[caso.complejidad]
  const tpColor = getTipoPruebaColor(caso.tipoPrueba)
  const bloqueosActivos = caso.bloqueos.filter(b => !b.resuelto)

  const etapaActual = hu.etapa as EtapaEjecucion
  const resultadoEtapaActual = caso.resultadosPorEtapa.find(r => r.etapa === etapaActual)

  const casoCompletado = caso.resultadosPorEtapa.length > 0 &&
    caso.resultadosPorEtapa.every(r => getResultadoDef(r.resultado).esAceptado)

  const puedeEditar = !huCerrada && (isQA || isAdmin || isQALead) && (
    caso.estadoAprobacion === "borrador" ||
    caso.estadoAprobacion === "rechazado" ||
    caso.modificacionHabilitada
  )
  const puedeEliminar = !huCerrada && (isQA || isAdmin || isQALead) && (
    caso.estadoAprobacion === "borrador" || caso.estadoAprobacion === "rechazado"
  )
  const puedeSolicitarMod = !huCerrada && isQA &&
    caso.estadoAprobacion === "aprobado" &&
    !caso.modificacionSolicitada &&
    !caso.modificacionHabilitada
  const adminVeSolicitud = (isAdmin || isQALead) && caso.modificacionSolicitada && !caso.modificacionHabilitada
  const puedeAddTarea = !huCerrada && !casoCompletado && (isQA || isAdmin || isQALead)

  return (
    <div style={{ border:`1px solid ${caso.modificacionSolicitada ? "var(--chart-3)" : "var(--border)"}`, borderRadius:10, background:"var(--card)", overflow:"hidden" }}>
      {/* Cabecera */}
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
            const rDef = r.resultado !== "pendiente" ? getResultadoDef(r.resultado) : null
            const cls = rDef ? rDef.cls : r.estado === "en_ejecucion" ? "bg-chart-1/20 text-chart-1 border-chart-1/30" : "bg-muted text-muted-foreground border-border"
            const icono = rDef ? ` ${rDef.icono ?? "●"}` : r.estado === "en_ejecucion" ? " ▶" : ""
            return (
              <Badge key={r.etapa} variant="outline" className={`hidden sm:inline-flex text-[8px] ${cls}`} style={{ padding:"1px 4px" }}>
                {getEtapaHUCfg(r.etapa, configEtapas).label.slice(0,3)}{icono}{retestLabel}
              </Badge>
            )
          })}
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

      {/* Detalle expandido */}
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

          {/* Acciones del caso */}
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8, marginTop:6 }}>
            {!huCerrada && isQA && (caso.estadoAprobacion === "borrador" || caso.estadoAprobacion === "rechazado") && (
              <Button size="sm" variant="outline" style={{ height:26, fontSize:10, padding:"0 10px" }}
                onClick={() => onEnviarCasoAprobacion(caso.id, hu.id)}>
                <Send size={10} className="mr-1"/> Enviar a aprobación
              </Button>
            )}
            {puedeSolicitarMod && (
              <Button size="sm" variant="outline" style={{ height:26, fontSize:10, padding:"0 10px", borderColor:"var(--chart-3)", color:"var(--chart-3)" }}
                onClick={() => onSolicitarModificacionCaso(caso.id, hu.id)}>
                <Bell size={10} className="mr-1"/> Solicitar modificación
              </Button>
            )}
            {adminVeSolicitud && !showConfirmHabilitar && (
              <Button size="sm" variant="outline" style={{ height:26, fontSize:10, padding:"0 10px" }}
                onClick={() => setShowConfirmHabilitar(true)}>
                <Unlock size={10} className="mr-1"/> Habilitar modificación
              </Button>
            )}
          </div>

          {/* Confirmación: habilitar modificación */}
          {showConfirmHabilitar && (
            <div style={{ padding:"10px 12px", borderRadius:7, background:"color-mix(in oklch, var(--chart-3) 8%, transparent)", border:"1px solid color-mix(in oklch, var(--chart-3) 35%, var(--border))", marginBottom:8, fontSize:11 }}>
              <p style={{ fontWeight:600, color:"var(--chart-3)", marginBottom:4 }}>
                <Unlock size={11} style={{ display:"inline", marginRight:4 }}/>
                ¿Habilitar modificación?
              </p>
              <p style={{ color:"var(--muted-foreground)", marginBottom:8, lineHeight:1.5 }}>
                El caso volverá a estado <strong>borrador</strong> y deberá ser re-aprobado.
                {caso.resultadosPorEtapa.some(r => r.intentos.length > 0) && (
                  <> Los resultados de ejecución registrados se conservan en el historial.</>
                )}
              </p>
              <div style={{ display:"flex", gap:6 }}>
                <Button size="sm" variant="outline" style={{ height:24, fontSize:10, padding:"0 10px", borderColor:"var(--chart-3)", color:"var(--chart-3)" }}
                  onClick={() => { onHabilitarModificacionCaso(caso.id, hu.id); setShowConfirmHabilitar(false) }}>
                  <Unlock size={10} className="mr-1"/> Confirmar
                </Button>
                <Button size="sm" variant="ghost" style={{ height:24, fontSize:10, padding:"0 8px" }}
                  onClick={() => setShowConfirmHabilitar(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {/* Motivo de rechazo */}
          {caso.estadoAprobacion === "rechazado" && caso.motivoRechazo && (
            <div style={{ padding:"6px 10px", borderRadius:7, background:"color-mix(in oklch, var(--chart-4) 6%, transparent)", border:"1px solid color-mix(in oklch, var(--chart-4) 30%, var(--border))", marginBottom:8, fontSize:11 }}>
              <span style={{ fontWeight:600, color:"var(--chart-4)" }}>Rechazo:</span>{" "}
              <span style={{ color:"var(--foreground)" }}>{caso.motivoRechazo}</span>
            </div>
          )}

          {/* Acciones de ejecución — dinámicas según configResultados */}
          {caso.estadoAprobacion === "aprobado" && resultadoEtapaActual?.estado === "en_ejecucion" && (isQA || isAdmin || isQALead) && (
            <div style={{ marginBottom:10, marginTop:6 }}>
              {!showFalloForm ? (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {configResultados.map(rDef => (
                    rDef.esAceptado ? (
                      <Button key={rDef.id} size="sm" variant="outline"
                        style={{ height:26, fontSize:10, padding:"0 10px" }}
                        className={rDef.id === "exitoso" ? "bg-chart-2 hover:bg-chart-2/90 text-white border-chart-2" : ""}
                        onClick={() => onCompletarCasoEtapa(caso.id, etapaActual, rDef.id)}>
                        {rDef.icono && <span style={{ marginRight:4, fontSize:11 }}>{rDef.icono}</span>}
                        {rDef.label}
                      </Button>
                    ) : (
                      <Button key={rDef.id} size="sm" variant="outline"
                        style={{ height:26, fontSize:10, padding:"0 10px", color:"var(--chart-4)", borderColor:"var(--chart-4)" }}
                        onClick={() => { setShowFalloForm(true); setComentarioFallo("") }}>
                        {rDef.icono && <span style={{ marginRight:4, fontSize:11 }}>{rDef.icono}</span>}
                        {rDef.label}
                      </Button>
                    )
                  ))}
                </div>
              ) : (
                (() => {
                  const noAceptados = configResultados.filter(r => !r.esAceptado)
                  return (
                    <div style={{ padding:"10px 12px", borderRadius:8, border:"1px solid var(--chart-4)", background:"color-mix(in oklch, var(--chart-4) 4%, var(--background))" }}>
                      <p style={{ fontSize:11, fontWeight:600, color:"var(--chart-4)", marginBottom:6 }}>Describe qué falló en la prueba *</p>
                      <Textarea rows={2} value={comentarioFallo} onChange={e => setComentarioFallo(e.target.value)}
                        placeholder="Ej: El endpoint retorna 500 cuando se envían credenciales con caracteres especiales..."
                        style={{ fontSize:12, resize:"none", marginBottom:8 }} />
                      <div style={{ display:"flex", gap:6, justifyContent:"flex-end", flexWrap:"wrap" }}>
                        <Button variant="outline" size="sm" style={{ height:26, fontSize:10 }}
                          onClick={() => { setShowFalloForm(false); setComentarioFallo("") }}>Cancelar</Button>
                        {noAceptados.map(rDef => (
                          <Button key={rDef.id} size="sm" style={{ height:26, fontSize:10 }} disabled={!comentarioFallo.trim()}
                            className="bg-chart-4 hover:bg-chart-4/90 text-white"
                            onClick={() => {
                              onCompletarCasoEtapa(caso.id, etapaActual, rDef.id, comentarioFallo.trim())
                              setShowFalloForm(false); setComentarioFallo("")
                            }}>
                            <XCircle size={10} className="mr-1"/> Confirmar: {rDef.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
          )}

          {/* Retesteo */}
          {caso.estadoAprobacion === "aprobado" && resultadoEtapaActual?.resultado && resultadoEtapaActual.resultado !== "pendiente" && !getResultadoDef(resultadoEtapaActual.resultado).esAceptado && (isQA || isAdmin || isQALead) && (
            <div style={{ marginBottom:10, marginTop:6 }}>
              {(() => {
                const resDef = getResultadoDef(resultadoEtapaActual.resultado)
                const intentosActuales = resultadoEtapaActual.intentos?.length || 0
                const limiteAlcanzado = resDef.maxRetesteos !== undefined && intentosActuales >= resDef.maxRetesteos
                if (limiteAlcanzado) {
                  return (
                    <div style={{ padding:"7px 11px", borderRadius:7, background:"color-mix(in oklch, var(--chart-4) 7%, transparent)", border:"1px solid color-mix(in oklch, var(--chart-4) 28%, var(--border))", fontSize:11 }}>
                      <span style={{ fontWeight:600, color:"var(--chart-4)" }}>Límite de retesteos alcanzado</span>
                      <span style={{ color:"var(--muted-foreground)" }}> — {intentosActuales} de {resDef.maxRetesteos} intento{resDef.maxRetesteos !== 1 ? "s" : ""} permitido{resDef.maxRetesteos !== 1 ? "s" : ""}.</span>
                    </div>
                  )
                }
                return !showRetestForm ? (
                  <Button size="sm" variant="outline" style={{ borderColor:"var(--chart-1)", color:"var(--chart-1)" }}
                    onClick={() => { setShowRetestForm(true); setComentarioCorreccion("") }}>
                    <RefreshCw size={12} className="mr-1"/> Solicitar Retesteo
                    {resDef.maxRetesteos !== undefined && (
                      <span style={{ marginLeft:5, fontSize:9, opacity:0.7 }}>({intentosActuales}/{resDef.maxRetesteos})</span>
                    )}
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
                )
              })()}
            </div>
          )}

          {/* Historial de intentos */}
          <CasoIntentosHistorial caso={caso} configEtapas={configEtapas} getResultadoDef={getResultadoDef} />

          {/* Formulario editar tarea */}
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
                onAbrirEditar={abrirEditarTarea}
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
