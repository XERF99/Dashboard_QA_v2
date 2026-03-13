"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TIPO_APLICACION_LABEL, AMBIENTE_LABEL, PRIORIDAD_CFG,
  crearEvento,
  type HistoriaUsuario, type TipoAplicacion, type AmbientePrueba, type PrioridadHU,
} from "@/lib/types"

interface HUFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (hu: HistoriaUsuario) => void
  huEditar?: HistoriaUsuario | null
  currentUser?: string
}

const QA_USERS = ["Maria Garcia", "Carlos Lopez", "Ana Martinez", "Pedro Sanchez", "Laura Jimenez", "Juan Rodriguez"]

const FL: React.CSSProperties = { fontSize:11, fontWeight:600, color:"var(--foreground)", marginBottom:5, display:"block" }
const PNL: React.CSSProperties = { padding:"14px 16px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }

export function HUForm({ open, onClose, onSubmit, huEditar, currentUser }: HUFormProps) {
  const [hu, setHu] = useState({
    titulo: "",
    descripcion: "",
    criteriosAceptacion: "",
    responsable: "",
    prioridad: "media" as PrioridadHU,
    puntos: 5,
    aplicacion: "",
    tipoAplicacion: "aplicacion" as TipoAplicacion,
    requiriente: "",
    areaSolicitante: "",
    ambiente: "test" as AmbientePrueba,
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
        aplicacion: huEditar.aplicacion,
        tipoAplicacion: huEditar.tipoAplicacion,
        requiriente: huEditar.requiriente,
        areaSolicitante: huEditar.areaSolicitante,
        ambiente: huEditar.ambiente,
      })
    } else {
      setHu({
        titulo: "", descripcion: "", criteriosAceptacion: "",
        responsable: "", prioridad: "media", puntos: 5,
        aplicacion: "", tipoAplicacion: "aplicacion",
        requiriente: "", areaSolicitante: "", ambiente: "test",
      })
    }
  }, [open, huEditar])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
      aplicacion: hu.aplicacion,
      tipoAplicacion: hu.tipoAplicacion,
      requiriente: hu.requiriente,
      areaSolicitante: hu.areaSolicitante,
      fechaCreacion: huEditar?.fechaCreacion || ahora,
      fechaFinEstimada: huEditar?.fechaFinEstimada,
      fechaCierre: huEditar?.fechaCierre,
      etapa: huEditar?.etapa || "sin_iniciar",
      ambiente: hu.ambiente,
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
    }
    onSubmit(huFinal)
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
                {huEditar ? "Modifica los datos de la historia de usuario" : "Define el cambio que será asignado a un QA para pruebas"}
              </p>
            </div>

            {/* BODY */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

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
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
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
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={FL}>QA Responsable *</label>
                      <Select value={hu.responsable} onValueChange={v => setHu(p => ({...p, responsable:v}))}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar QA" /></SelectTrigger>
                        <SelectContent>{QA_USERS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Story Points</label>
                      <Input type="number" min={1} max={100} value={hu.puntos}
                        onChange={e => setHu(p => ({...p, puntos: parseInt(e.target.value) || 1}))} />
                    </div>
                  </div>
                </div>

                <div style={PNL}>
                  <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:12 }}>Configuración Técnica</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div>
                      <label style={FL}>Aplicación / Sistema *</label>
                      <Input value={hu.aplicacion} required placeholder="Nombre del sistema"
                        onChange={e => setHu(p => ({...p, aplicacion:e.target.value}))} />
                    </div>
                    <div>
                      <label style={FL}>Tipo de Aplicación *</label>
                      <Select value={hu.tipoAplicacion} onValueChange={(v: TipoAplicacion) => setHu(p => ({...p, tipoAplicacion:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(TIPO_APLICACION_LABEL) as TipoAplicacion[]).map(k => (
                            <SelectItem key={k} value={k}>{TIPO_APLICACION_LABEL[k]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label style={FL}>Ambiente</label>
                      <Select value={hu.ambiente} onValueChange={(v: AmbientePrueba) => setHu(p => ({...p, ambiente:v}))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(AMBIENTE_LABEL) as AmbientePrueba[]).map(k => (
                            <SelectItem key={k} value={k}>{AMBIENTE_LABEL[k]}</SelectItem>
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
                <div style={{ padding:"10px 14px", borderRadius:8,
                  background:"color-mix(in oklch, var(--chart-3) 8%, transparent)",
                  border:"1px solid color-mix(in oklch, var(--chart-3) 25%, transparent)" }}>
                  <p style={{ fontSize:11, color:"var(--chart-3)", lineHeight:1.5 }}>
                    {hu.tipoAplicacion === "base_de_datos" || hu.tipoAplicacion === "batch"
                      ? "Este tipo solo tiene etapa de Despliegue."
                      : "Este tipo tiene 3 etapas: Despliegue → Rollback → Redespliegue."}
                    {" "}El QA asignado creará los casos de prueba una vez inicie la HU.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:22, paddingTop:16, borderTop:"1px solid var(--border)" }}>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={!hu.titulo || !hu.responsable || !hu.aplicacion || !hu.requiriente || !hu.areaSolicitante}>
                {huEditar ? "Guardar cambios" : "Crear Historia de Usuario"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
