"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Info, AlertTriangle } from "lucide-react"
import {
  TIPO_TAREA_LABEL, TIPO_TAREA_COLOR, fasesParaTipo,
  TIPO_PRUEBA_LABEL, TIPO_PRUEBA_COLOR,
  type HistoriaUsuario, type Tarea, type EstadoHU,
  type TipoTarea, type EntornoPruebas, type FaseTarea, type TipoPrueba,
} from "@/lib/types"

interface HUFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (hu: HistoriaUsuario, tareas: Tarea[]) => void
  huEditar?: HistoriaUsuario | null
  tareasExistentes?: Tarea[]
  currentUser?: string
}

const ASIGNADOS = ["Maria Garcia","Carlos Lopez","Ana Martinez","Pedro Sanchez","Laura Jimenez","Juan Rodriguez"]

function tareaVacia(huId: string, idx: number): Tarea {
  return {
    id: `T-NEW-${Date.now()}-${idx}`,
    huId,
    titulo: "", descripcion: "",
    tipo: "aplicacion",
    tipoPrueba: "funcional",
    asignado: "",
    entorno: "desarrollo",
    faseActual: "despliegue",
    estado: "pendiente",
    resultado: "pendiente",
    fechaInicio: new Date(), fechaFin: null,
    impactoUsuarios: 5, complejidadTecnica: 5, urgencia: 5,
    horasEstimadas: 8, cantidadArchivos: 3,
    historialFases: [],
    eventosBloqueo: [],
  }
}

const FL: React.CSSProperties = { fontSize:11, fontWeight:600, color:"var(--foreground)", marginBottom:5, display:"block" }
const PNL: React.CSSProperties = { padding:"14px 16px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }

export function HUForm({ open, onClose, onSubmit, huEditar, tareasExistentes=[], currentUser }: HUFormProps) {
  const huId = huEditar?.id || `hu-${Date.now()}`

  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null)

  const [hu, setHu] = useState({
    titulo:"", descripcion:"", criteriosAceptacion:"",
    asignado:"", estado:"pendiente" as EstadoHU,
    prioridad:"media" as "alta"|"media"|"baja", puntos:5,
  })
  const [tareas, setTareas] = useState<Tarea[]>([tareaVacia(huId, 0)])

  useEffect(() => {
    if (!open) return
    if (huEditar) {
      setHu({ titulo:huEditar.titulo, descripcion:huEditar.descripcion,
        criteriosAceptacion:huEditar.criteriosAceptacion,
        asignado:huEditar.asignado, estado:huEditar.estado,
        prioridad:huEditar.prioridad, puntos:huEditar.puntos })
      const t = tareasExistentes.filter(t => huEditar.tareas.includes(t.id))
      setTareas(t.length ? t : [tareaVacia(huEditar.id, 0)])
    } else {
      setHu({ titulo:"", descripcion:"", criteriosAceptacion:"", asignado:"", estado:"pendiente", prioridad:"media", puntos:5 })
      setTareas([tareaVacia(huId, 0)])
    }
  }, [open, huEditar])

  const updT = (idx: number, patch: Partial<Tarea>) => setTareas(prev => prev.map((t, i) => {
    if (i !== idx) return t
    const next = { ...t, ...patch }
    // Si cambia el tipo, verificar que la fase siga siendo válida
    const fases = fasesParaTipo(next.tipo)
    if (!fases.includes(next.faseActual)) next.faseActual = fases[0]
    return next
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ahora = new Date()
    const huFinal: HistoriaUsuario = {
      id: huId, codigo: huEditar?.codigo || `HU-${Date.now().toString().slice(-4)}`,
      ...hu,
      fechaCreacion: huEditar?.fechaCreacion || ahora,
      fechaCierre: ["exitoso","fallido"].includes(hu.estado) ? (huEditar?.fechaCierre || ahora) : null,
      bloqueos: huEditar?.bloqueos || [],
      tareas: tareas.map(t => t.id),
    }
    const tareasFinales = tareas.map((t, i) => ({
      ...t, huId,
      historialFases: t.historialFases.length ? t.historialFases : [{
        id: `ef-${Date.now()}-${i}`, tareaId: t.id, tareaTitulo: t.titulo,
        faseAnterior: null, faseNueva: t.faseActual,
        fecha: ahora, usuario: currentUser || "Sistema",
      }],
    }))
    onSubmit(huFinal, tareasFinales)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="cambio-form-modal">
        <form onSubmit={handleSubmit}>
          <div style={{ padding:"26px 30px" }}>
            {/* HEADER */}
            <div style={{ borderBottom:"1px solid var(--border)", paddingBottom:16, marginBottom:22, paddingRight:36 }}>
              <DialogTitle style={{ fontSize:19, fontWeight:700, color:"var(--foreground)", marginBottom:3 }}>
                {huEditar ? `Editar ${huEditar.codigo}` : "Nueva Historia de Usuario"}
              </DialogTitle>
              <p style={{ fontSize:12, color:"var(--muted-foreground)" }}>
                Define el cambio y las pruebas (tareas) que lo componen
              </p>
            </div>

            {/* BODY */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

              {/* ── COL IZQ: datos HU ── */}
              <div style={{ display:"flex", flexDirection:"column", gap:16, minWidth:0 }}>

                <div style={PNL}>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:12 }}>Historia de Usuario</p>

                  <div style={{ marginBottom:11 }}>
                    <label style={FL}>Título *</label>
                    <Input value={hu.titulo} required placeholder="Título del cambio..."
                      onChange={e => setHu(p => ({...p, titulo:e.target.value}))} />
                  </div>
                  <div style={{ marginBottom:11 }}>
                    <label style={FL}>Descripción</label>
                    <Textarea rows={3} value={hu.descripcion}
                      onChange={e => setHu(p => ({...p, descripcion:e.target.value}))}
                      placeholder="Contexto y objetivo del cambio..."
                      style={{ resize:"vertical", width:"100%", maxWidth:"100%", wordBreak:"break-word", overflowWrap:"break-word" }} />
                  </div>
                  <div>
                    <label style={FL}>Criterios de Aceptación</label>
                    <Textarea rows={3} value={hu.criteriosAceptacion}
                      onChange={e => setHu(p => ({...p, criteriosAceptacion:e.target.value}))}
                      placeholder={"- Criterio 1\n- Criterio 2"}
                      style={{ resize:"vertical", width:"100%", maxWidth:"100%", wordBreak:"break-word", overflowWrap:"break-word" }} />
                  </div>
                </div>

                <div style={PNL}>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:12 }}>Configuración</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={FL}>Responsable *</label>
                      <Select value={hu.asignado} onValueChange={v => setHu(p => ({...p, asignado:v}))}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent>{ASIGNADOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Estado</label>
                      <Select value={hu.estado} onValueChange={(v: EstadoHU) => setHu(p => ({...p, estado:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="bloqueado">Bloqueado</SelectItem>
                          <SelectItem value="stand_by">Stand By</SelectItem>
                          <SelectItem value="exitoso">✅ Exitoso</SelectItem>
                          <SelectItem value="fallido">❌ Fallido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Prioridad</label>
                      <Select value={hu.prioridad} onValueChange={(v: any) => setHu(p => ({...p, prioridad:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="baja">Baja</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Story Points</label>
                      <Input type="number" min={1} max={100} value={hu.puntos}
                        onChange={e => setHu(p => ({...p, puntos: parseInt(e.target.value) || 1}))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── COL DER: Tareas ── */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, minWidth:0 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)" }}>
                    Tareas / Pruebas ({tareas.length})
                  </p>
                  <Button type="button" variant="outline" size="sm"
                    onClick={() => setTareas(p => [...p, tareaVacia(huId, p.length)])}>
                    <Plus size={12} className="mr-1" /> Tarea
                  </Button>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {tareas.map((tarea, idx) => {
                    const fases = fasesParaTipo(tarea.tipo)
                    const soloDespliegue = fases.length === 1
                    return (
                      <div key={tarea.id} style={PNL}>
                        {/* Tipo + eliminar */}
                        <div style={{ display:"flex", gap:6, marginBottom:10, flexWrap:"wrap", alignItems:"center" }}>
                          <Select value={tarea.tipo} onValueChange={(v: TipoTarea) => updT(idx, { tipo:v })}>
                            <SelectTrigger style={{ height:28, fontSize:11, flex:1, minWidth:120 }}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(TIPO_TAREA_LABEL) as TipoTarea[]).map(k => (
                                <SelectItem key={k} value={k}>
                                  <span style={{ fontSize:12 }}>{TIPO_TAREA_LABEL[k]}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Badge variant="outline" className={`${TIPO_TAREA_COLOR[tarea.tipo]} text-[10px]`} style={{ flexShrink:0 }}>
                            {TIPO_TAREA_LABEL[tarea.tipo]}
                          </Badge>
                          {tareas.length > 1 && (
                            <button type="button" onClick={() => setConfirmDeleteIdx(idx)}
                              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--chart-4)", padding:3, flexShrink:0, marginLeft:"auto" }}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Título */}
                        <Input value={tarea.titulo} required
                          onChange={e => updT(idx, { titulo:e.target.value })}
                          placeholder={`Tarea ${idx+1}: descripción corta...`}
                          style={{ fontSize:12, marginBottom:8 }} />

                        {/* Grid: asignado, entorno, fase */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                          <div>
                            <label style={{ ...FL, fontSize:10 }}>Asignado</label>
                            <Select value={tarea.asignado} onValueChange={v => updT(idx, { asignado:v })}>
                              <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue placeholder="Persona" /></SelectTrigger>
                              <SelectContent>{ASIGNADOS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label style={{ ...FL, fontSize:10 }}>Entorno</label>
                            <Select value={tarea.entorno} onValueChange={(v: EntornoPruebas) => updT(idx, { entorno:v })}>
                              <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="desarrollo">Desarrollo</SelectItem>
                                <SelectItem value="qa">QA</SelectItem>
                                <SelectItem value="staging">Staging</SelectItem>
                                <SelectItem value="produccion">Producción</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label style={{ ...FL, fontSize:10 }}>
                              Fase actual
                              {soloDespliegue && <span style={{ color:"var(--chart-3)", marginLeft:4, fontSize:10 }}>(solo Despliegue)</span>}
                            </label>
                            <Select value={tarea.faseActual} disabled={soloDespliegue}
                              onValueChange={(v: FaseTarea) => updT(idx, { faseActual:v })}>
                              <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {fases.map(f => (
                                  <SelectItem key={f} value={f}>
                                    {{ despliegue:"Despliegue", rollback:"Rollback", redespliegue:"Redespliegue", validacion:"Validación" }[f]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label style={{ ...FL, fontSize:10 }}>Tipo de prueba</label>
                            <Select value={tarea.tipoPrueba} onValueChange={(v: TipoPrueba) => updT(idx, { tipoPrueba:v })}>
                              <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="funcional">Funcional</SelectItem>
                                <SelectItem value="no_funcional">No Funcional</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Horas */}
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginTop:7 }}>
                          <div>
                            <label style={{ ...FL, fontSize:10 }}>Horas est.</label>
                            <Input type="number" min={1} value={tarea.horasEstimadas} style={{ height:30, fontSize:11 }}
                              onChange={e => updT(idx, { horasEstimadas:parseInt(e.target.value)||1 })} />
                          </div>
                          <div>
                            <label style={{ ...FL, fontSize:10 }}>Archivos</label>
                            <Input type="number" min={0} value={tarea.cantidadArchivos} style={{ height:30, fontSize:11 }}
                              onChange={e => updT(idx, { cantidadArchivos:parseInt(e.target.value)||0 })} />
                          </div>
                        </div>

                        {soloDespliegue && (
                          <div style={{ marginTop:8, display:"flex", gap:5, alignItems:"center", padding:"5px 8px",
                            borderRadius:6, background:"color-mix(in oklch, var(--chart-3) 10%, transparent)",
                            border:"1px solid color-mix(in oklch, var(--chart-3) 25%, transparent)" }}>
                            <Info size={11} style={{ color:"var(--chart-3)", flexShrink:0 }} />
                            <p style={{ fontSize:10, color:"var(--chart-3)" }}>
                              Tipo <strong>{TIPO_TAREA_LABEL[tarea.tipo]}</strong>: solo fase de Despliegue disponible
                            </p>
                          </div>
                        )}

                        {confirmDeleteIdx === idx && (
                          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8, padding:"8px 10px",
                            borderRadius:7, background:"color-mix(in oklch, var(--chart-4) 10%, transparent)",
                            border:"1px solid color-mix(in oklch, var(--chart-4) 30%, transparent)" }}>
                            <AlertTriangle size={13} style={{ color:"var(--chart-4)", flexShrink:0 }} />
                            <p style={{ fontSize:11, color:"var(--chart-4)", flex:1 }}>¿Eliminar esta tarea?</p>
                            <button type="button" onClick={() => setConfirmDeleteIdx(null)}
                              style={{ fontSize:11, padding:"2px 8px", borderRadius:5, border:"1px solid var(--border)",
                                background:"var(--background)", color:"var(--foreground)", cursor:"pointer" }}>
                              Cancelar
                            </button>
                            <button type="button"
                              onClick={() => { setTareas(p => p.filter((_,i) => i!==idx)); setConfirmDeleteIdx(null) }}
                              style={{ fontSize:11, padding:"2px 8px", borderRadius:5, border:"none",
                                background:"var(--chart-4)", color:"#fff", cursor:"pointer", fontWeight:600 }}>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:22, paddingTop:16, borderTop:"1px solid var(--border)" }}>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={!hu.titulo || !hu.asignado}>
                {huEditar ? "Guardar cambios" : "Crear Historia de Usuario"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
