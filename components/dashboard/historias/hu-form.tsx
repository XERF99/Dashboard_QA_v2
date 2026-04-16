"use client"

import { useState, useEffect, useCallback } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PRIORIDAD_CFG,
  crearEvento, etapaDefsParaTipo, ETAPAS_PREDETERMINADAS,
  TIPOS_APLICACION_PREDETERMINADOS, AMBIENTES_PREDETERMINADOS, TIPOS_PRUEBA_PREDETERMINADOS,
  type HistoriaUsuario, type TipoAplicacion, type AmbientePrueba, type PrioridadHU, type TipoPrueba,
  type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef, type TipoPruebaDef, type Sprint,
} from "@/lib/types"
import { PlantillasSelector, type PlantillaHU } from "./hu-templates"

interface HUFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (hu: HistoriaUsuario) => void
  huEditar?: HistoriaUsuario | null
  currentUser?: string
  configEtapas?: ConfigEtapas
  qaUsers?: string[]
  aplicaciones?: string[]
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
  tiposPrueba?: TipoPruebaDef[]
  sprints?: Sprint[]
}

const FL: React.CSSProperties = { fontSize:11, fontWeight:600, color:"var(--foreground)", marginBottom:5, display:"block" }
const PNL: React.CSSProperties = { padding:"14px 16px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }

export function HUForm({ open, onClose, onSubmit, huEditar, currentUser, configEtapas = ETAPAS_PREDETERMINADAS, qaUsers = [], aplicaciones = [], tiposAplicacion, ambientes, tiposPrueba, sprints = [] }: HUFormProps) {
  const tiposDisponibles = tiposAplicacion?.length ? tiposAplicacion : TIPOS_APLICACION_PREDETERMINADOS
  const ambientesDisponibles = ambientes?.length ? ambientes : AMBIENTES_PREDETERMINADOS
  const tiposPruebaDisponibles = tiposPrueba?.length ? tiposPrueba : TIPOS_PRUEBA_PREDETERMINADOS
  const defaultAmbiente = ambientesDisponibles[0]?.id ?? "test"
  const defaultTipoPrueba = tiposPruebaDisponibles[0]?.id ?? "funcional"
  const [submitting, setSubmitting] = useState(false)
  const [hu, setHu] = useState({
    titulo: "",
    descripcion: "",
    criteriosAceptacion: "",
    responsable: "",
    prioridad: "media" as PrioridadHU,
    puntos: 5,
    sprint: "",
    aplicacion: "",
    tipoAplicacion: "aplicacion" as TipoAplicacion,
    requiriente: "",
    areaSolicitante: "",
    ambiente: defaultAmbiente as AmbientePrueba,
    tipoPrueba: defaultTipoPrueba as TipoPrueba,
  })

  useEffect(() => {
    if (!open) return
    if (huEditar) {
      setHu({
        titulo: huEditar.titulo,
        descripcion: huEditar.descripcion,
        criteriosAceptacion: huEditar.criteriosAceptacion,
        responsable: huEditar.responsable,
        prioridad: huEditar.prioridad,
        puntos: huEditar.puntos,
        sprint: huEditar.sprint || "",
        aplicacion: huEditar.aplicacion,
        tipoAplicacion: huEditar.tipoAplicacion,
        requiriente: huEditar.requiriente,
        areaSolicitante: huEditar.areaSolicitante,
        ambiente: huEditar.ambiente,
        tipoPrueba: huEditar.tipoPrueba,
      })
    } else {
      setHu({
        titulo: "", descripcion: "", criteriosAceptacion: "",
        responsable: "", prioridad: "media", puntos: 5,
        sprint: "",
        aplicacion: "", tipoAplicacion: tiposDisponibles[0]?.id ?? "aplicacion",
        requiriente: "", areaSolicitante: "", ambiente: defaultAmbiente,
        tipoPrueba: defaultTipoPrueba,
      })
    }
  }, [open, huEditar])

  const aplicarPlantilla = (campos: PlantillaHU["campos"]) => {
    setHu(prev => ({
      ...prev,
      tipoAplicacion: campos.tipoAplicacion,
      tipoPrueba: campos.tipoPrueba,
      puntos: campos.puntos,
      prioridad: campos.prioridad,
      ambiente: campos.ambiente,
      criteriosAceptacion: campos.criteriosAceptacion,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const ahora = new Date()
    const id = huEditar?.id || `hu-${Date.now()}`
    const usuario = currentUser || "Sistema"

    const huFinal: HistoriaUsuario = {
      id,
      codigo: huEditar?.codigo || `HU-${Date.now().toString().slice(-4)}`,
      titulo: hu.titulo,
      descripcion: hu.descripcion,
      criteriosAceptacion: hu.criteriosAceptacion,
      responsable: hu.responsable,
      prioridad: hu.prioridad,
      estado: huEditar?.estado || "sin_iniciar",
      puntos: hu.puntos,
      sprint: hu.sprint || undefined,
      aplicacion: hu.aplicacion,
      tipoAplicacion: hu.tipoAplicacion,
      requiriente: hu.requiriente,
      areaSolicitante: hu.areaSolicitante,
      fechaCreacion: huEditar?.fechaCreacion || ahora,
      fechaFinEstimada: huEditar?.fechaFinEstimada,
      fechaCierre: huEditar?.fechaCierre,
      etapa: huEditar?.etapa || "sin_iniciar",
      ambiente: hu.ambiente,
      tipoPrueba: hu.tipoPrueba,
      casosIds: huEditar?.casosIds || [],
      bloqueos: huEditar?.bloqueos || [],
      historial: [
        ...(huEditar?.historial || []),
        crearEvento(
          huEditar ? "hu_editada" : "hu_creada",
          huEditar ? `HU editada por ${usuario}` : `Historia de usuario creada`,
          usuario
        ),
      ],
      creadoPor: huEditar?.creadoPor || usuario,
      delegadoPor: huEditar?.delegadoPor || usuario,
      permitirCasosAdicionales: huEditar?.permitirCasosAdicionales || false,
      motivoCasosAdicionales: huEditar?.motivoCasosAdicionales,
      motivoCancelacion: huEditar?.motivoCancelacion,
      comentarios: huEditar?.comentarios || [],
    }
    onSubmit(huFinal)
    setSubmitting(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="cambio-form-modal" aria-describedby={undefined}>
        <form onSubmit={handleSubmit} aria-label={huEditar ? "Editar historia de usuario" : "Nueva historia de usuario"}>
          <div className="px-4 sm:px-7.5 py-6.5">
            {/* HEADER */}
            <div style={{ borderBottom:"1px solid var(--border)", paddingBottom:16, marginBottom:22, paddingRight:36 }}>
              <DialogTitle style={{ fontSize:19, fontWeight:700, color:"var(--foreground)", marginBottom:3 }}>
                {huEditar ? `Editar ${huEditar.codigo}` : "Nueva Historia de Usuario"}
              </DialogTitle>
              <p style={{ fontSize:12, color:"var(--muted-foreground)" }}>
                {huEditar ? "Modifica los datos de la historia de usuario" : "Define el cambio que será asignado a un QA para pruebas"}
              </p>
              {!huEditar && (
                <div style={{ marginTop: 10 }}>
                  <PlantillasSelector onSelect={aplicarPlantilla} />
                </div>
              )}
            </div>

            {/* BODY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ── COL IZQ: datos principales ── */}
              <div style={{ display:"flex", flexDirection:"column", gap:16, minWidth:0 }}>

                <div style={PNL}>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:12 }}>Datos del Cambio</p>

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
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:12 }}>Solicitante</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label style={FL}>Requiriente *</label>
                      <Input value={hu.requiriente} required placeholder="Nombre del solicitante"
                        onChange={e => setHu(p => ({...p, requiriente:e.target.value}))} />
                    </div>
                    <div>
                      <label style={FL}>Área Solicitante *</label>
                      <Input value={hu.areaSolicitante} required placeholder="Departamento/área"
                        onChange={e => setHu(p => ({...p, areaSolicitante:e.target.value}))} />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── COL DER: configuración ── */}
              <div style={{ display:"flex", flexDirection:"column", gap:16, minWidth:0 }}>

                <div style={PNL}>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:12 }}>Asignación</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label style={FL}>QA Responsable *</label>
                      <Select value={hu.responsable} onValueChange={v => setHu(p => ({...p, responsable:v}))}>
                        <SelectTrigger><SelectValue placeholder={qaUsers.length === 0 ? "Sin QAs activos" : "Seleccionar QA"} /></SelectTrigger>
                        <SelectContent>
                          {/* Si el valor actual no está en la lista (ej: usuario desactivado), mostrarlo igual */}
                          {hu.responsable && !qaUsers.includes(hu.responsable) && (
                            <SelectItem value={hu.responsable}>{hu.responsable}</SelectItem>
                          )}
                          {qaUsers.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Story Points</label>
                      <Input type="number" min={1} max={100} value={hu.puntos}
                        onChange={e => setHu(p => ({...p, puntos: parseInt(e.target.value) || 1}))} />
                    </div>
                  </div>
                  <div style={{ marginTop:10 }}>
                    <label style={FL}>Sprint / Versión</label>
                    {sprints.length > 0 ? (
                      <Select value={hu.sprint || "__none__"} onValueChange={v => setHu(p => ({ ...p, sprint: v === "__none__" ? "" : v }))}>
                        <SelectTrigger><SelectValue placeholder="Sin sprint" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Sin sprint</SelectItem>
                          {sprints.map(s => (
                            <SelectItem key={s.id} value={s.nombre}>{s.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={hu.sprint} placeholder="Ej. Sprint 3, v2.1, Q1-2026..."
                        onChange={e => setHu(p => ({...p, sprint: e.target.value}))} />
                    )}
                  </div>
                </div>

                <div style={PNL}>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:12 }}>Configuración Técnica</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label style={FL}>Aplicación / Sistema *</label>
                      {aplicaciones.length > 0 ? (
                        <Select value={hu.aplicacion} onValueChange={v => setHu(p => ({...p, aplicacion:v}))}>
                          <SelectTrigger><SelectValue placeholder="Seleccionar aplicación" /></SelectTrigger>
                          <SelectContent>
                            {/* Si el valor actual no está en la lista (ej: HU antigua), mostrarlo igual */}
                            {hu.aplicacion && !aplicaciones.includes(hu.aplicacion) && (
                              <SelectItem value={hu.aplicacion}>{hu.aplicacion}</SelectItem>
                            )}
                            {aplicaciones.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={hu.aplicacion} required placeholder="Nombre del sistema"
                          onChange={e => setHu(p => ({...p, aplicacion:e.target.value}))} />
                      )}
                    </div>
                    <div>
                      <label style={FL}>Tipo de Aplicación *</label>
                      <Select value={hu.tipoAplicacion} onValueChange={(v: TipoAplicacion) => setHu(p => ({...p, tipoAplicacion:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {/* Si la HU tiene un tipo que ya no está en la lista (ej: borrado), mostrarlo igual */}
                          {hu.tipoAplicacion && !tiposDisponibles.some(t => t.id === hu.tipoAplicacion) && (
                            <SelectItem value={hu.tipoAplicacion}>{hu.tipoAplicacion}</SelectItem>
                          )}
                          {tiposDisponibles.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Ambiente</label>
                      <Select value={hu.ambiente} onValueChange={(v: AmbientePrueba) => setHu(p => ({...p, ambiente:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {hu.ambiente && !ambientesDisponibles.some(a => a.id === hu.ambiente) && (
                            <SelectItem value={hu.ambiente}>{hu.ambiente}</SelectItem>
                          )}
                          {ambientesDisponibles.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Tipo de Prueba</label>
                      <Select value={hu.tipoPrueba} onValueChange={(v: TipoPrueba) => setHu(p => ({...p, tipoPrueba:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {hu.tipoPrueba && !tiposPruebaDisponibles.some(t => t.id === hu.tipoPrueba) && (
                            <SelectItem value={hu.tipoPrueba}>{hu.tipoPrueba}</SelectItem>
                          )}
                          {tiposPruebaDisponibles.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Prioridad</label>
                      <Select value={hu.prioridad} onValueChange={(v: PrioridadHU) => setHu(p => ({...p, prioridad:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PRIORIDAD_CFG) as PrioridadHU[]).map(k => (
                            <SelectItem key={k} value={k}>{PRIORIDAD_CFG[k].label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Nota informativa sobre etapas */}
                {(() => {
                  const etapas = etapaDefsParaTipo(hu.tipoAplicacion, configEtapas)
                  const notaEtapas = etapas.length === 0
                    ? "Este tipo no tiene etapas de ejecución definidas."
                    : etapas.length === 1
                    ? `Este tipo tiene 1 etapa: ${etapas[0]!.label}.`
                    : `Este tipo tiene ${etapas.length} etapas: ${etapas.map(e => e.label).join(" → ")}.`
                  return (
                    <div style={{ padding:"10px 14px", borderRadius:8,
                      background:"color-mix(in oklch, var(--chart-3) 8%, transparent)",
                      border:"1px solid color-mix(in oklch, var(--chart-3) 25%, transparent)" }}>
                      <p style={{ fontSize:11, color:"var(--chart-3)", lineHeight:1.5 }}>
                        {notaEtapas}{" "}El QA asignado creará los casos de prueba una vez inicie la HU.
                      </p>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:22, paddingTop:16, borderTop:"1px solid var(--border)" }}>
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>Cancelar</Button>
              <Button type="submit" disabled={submitting || !hu.titulo || !hu.responsable || !hu.aplicacion || !hu.requiriente || !hu.areaSolicitante}>
                {submitting ? "Guardando..." : huEditar ? "Guardar cambios" : "Crear Historia de Usuario"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
