"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import {
  User, FileText, Calendar, Server, GitBranch,
  FlaskConical, Activity, AlertTriangle, Clock,
  Users, FileCode, Zap, TestTube
} from "lucide-react"
import type { Cambio, EstadoCambio, EntornoPruebas, FasePruebas, TipoPrueba } from "@/lib/types"
import { calcularCriticidad, calcularEsfuerzo } from "@/lib/types"

interface CambioFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (cambio: Omit<Cambio, "id"> | Cambio) => void
  cambioEditar?: Cambio | null
}

const asignadosDisponibles = [
  "María García", "Carlos López", "Ana Martínez",
  "Pedro Sánchez", "Laura Jiménez", "Juan Rodríguez"
]

// Estilos reutilizables
const S = {
  sectionLabel: {
    fontSize: "10px", textTransform: "uppercase" as const,
    letterSpacing: "0.1em", fontWeight: 600,
    color: "var(--muted-foreground)", marginBottom: "12px",
    display: "flex", alignItems: "center", gap: "6px",
  },
  fieldLabel: {
    fontSize: "12px", fontWeight: 500,
    color: "var(--foreground)", marginBottom: "6px",
    display: "block",
  },
  panel: {
    padding: "18px", borderRadius: "12px",
    border: "1px solid var(--border)", background: "var(--background)",
  },
}

export function CambioForm({ open, onClose, onSubmit, cambioEditar }: CambioFormProps) {
  const [formData, setFormData] = useState({
    titulo: "", descripcion: "", asignado: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    impactoUsuarios: 5, complejidadTecnica: 5, urgencia: 5,
    horasEstimadas: 8, cantidadArchivos: 3,
    requierePruebas: true,
    estado: "pendiente" as EstadoCambio,
    entornoPruebas: "desarrollo" as EntornoPruebas,
    fasePruebas: "despliegue" as FasePruebas,
    tipoPrueba: "funcional" as TipoPrueba,
  })

  useEffect(() => {
    if (cambioEditar) {
      setFormData({
        titulo: cambioEditar.titulo,
        descripcion: cambioEditar.descripcion,
        asignado: cambioEditar.asignado,
        fechaInicio: cambioEditar.fechaInicio.toISOString().split("T")[0],
        fechaFin: cambioEditar.fechaFin ? cambioEditar.fechaFin.toISOString().split("T")[0] : "",
        impactoUsuarios: cambioEditar.impactoUsuarios,
        complejidadTecnica: cambioEditar.complejidadTecnica,
        urgencia: cambioEditar.urgencia,
        horasEstimadas: cambioEditar.horasEstimadas,
        cantidadArchivos: cambioEditar.cantidadArchivos,
        requierePruebas: cambioEditar.requierePruebas,
        estado: cambioEditar.estado,
        entornoPruebas: cambioEditar.entornoPruebas,
        fasePruebas: cambioEditar.fasePruebas,
        tipoPrueba: cambioEditar.tipoPrueba,
      })
    } else {
      setFormData({
        titulo: "", descripcion: "", asignado: "",
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaFin: "",
        impactoUsuarios: 5, complejidadTecnica: 5, urgencia: 5,
        horasEstimadas: 8, cantidadArchivos: 3,
        requierePruebas: true,
        estado: "pendiente",
        entornoPruebas: "desarrollo",
        fasePruebas: "despliegue",
        tipoPrueba: "funcional" as TipoPrueba,
      })
    }
  }, [cambioEditar, open])

  const cambioTemporal: Cambio = {
    ...formData, id: cambioEditar?.id || "",
    naturaleza: cambioEditar?.naturaleza || "aplicacion",
    historiaUsuarioId: cambioEditar?.historiaUsuarioId || "",
    historialFases: cambioEditar?.historialFases || [],
    fechaInicio: new Date(formData.fechaInicio),
    fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : null,
  }
  const criticidadCalculada = calcularCriticidad(cambioTemporal)
  const esfuerzoCalculado   = calcularEsfuerzo(cambioTemporal)

  const colorCrit = criticidadCalculada === "alta"  ? "bg-chart-4/20 text-chart-4 border-chart-4/30"
                  : criticidadCalculada === "media" ? "bg-chart-3/20 text-chart-3 border-chart-3/30"
                  :                                   "bg-chart-2/20 text-chart-2 border-chart-2/30"
  const colorEsf  = esfuerzoCalculado === "alto"   ? "bg-chart-4/20 text-chart-4 border-chart-4/30"
                  : esfuerzoCalculado === "medio"  ? "bg-chart-3/20 text-chart-3 border-chart-3/30"
                  :                                  "bg-chart-2/20 text-chart-2 border-chart-2/30"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...(cambioEditar ? { id: cambioEditar.id } : {}),
      naturaleza: cambioEditar?.naturaleza || "aplicacion",
      historiaUsuarioId: cambioEditar?.historiaUsuarioId || "",
      historialFases: cambioEditar?.historialFases || [],
      titulo: formData.titulo,
      descripcion: formData.descripcion,
      asignado: formData.asignado,
      fechaInicio: new Date(formData.fechaInicio),
      fechaFin: formData.fechaFin ? new Date(formData.fechaFin) : null,
      impactoUsuarios: formData.impactoUsuarios,
      complejidadTecnica: formData.complejidadTecnica,
      urgencia: formData.urgencia,
      horasEstimadas: formData.horasEstimadas,
      cantidadArchivos: formData.cantidadArchivos,
      requierePruebas: formData.requierePruebas,
      estado: formData.estado,
      entornoPruebas: formData.entornoPruebas,
      fasePruebas: formData.fasePruebas,
      tipoPrueba: formData.tipoPrueba,
    } as Cambio)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="cambio-form-modal">
        <form onSubmit={handleSubmit}>
          <div style={{ padding: "28px 32px" }}>

            {/* ── HEADER ── */}
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "18px", marginBottom: "24px", paddingRight: "32px" }}>
              <DialogTitle style={{ fontSize: "20px", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.3, marginBottom: "4px" }}>
                {cambioEditar ? "Editar Cambio" : "Nuevo Cambio"}
              </DialogTitle>
              <p style={{ fontSize: "13px", color: "var(--muted-foreground)" }}>
                {cambioEditar ? `Modificando: ${cambioEditar.id}` : "Completa los datos para registrar un nuevo cambio"}
              </p>
            </div>

            {/* ── BODY: 3 col izq / 2 col der ── */}
            <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "32px" }}>

              {/* ══ COLUMNA IZQUIERDA ══ */}
              <div style={{ display: "flex", flexDirection: "column", gap: "22px", minWidth: 0, overflow: "hidden" }}>

                {/* Información General */}
                <div style={{ ...S.panel, overflow: "hidden" }}>
                  <p style={S.sectionLabel}><FileText size={12} /> Información General</p>

                  {/* Título */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={S.fieldLabel} htmlFor="titulo">Título del cambio</label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Ej: Actualizar módulo de login"
                      required
                    />
                  </div>

                  {/* Asignado */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={S.fieldLabel}><User size={11} style={{ display:"inline", marginRight:"4px" }}/>Persona asignada</label>
                    <Select
                      value={formData.asignado}
                      onValueChange={v => setFormData({ ...formData, asignado: v })}
                    >
                      <SelectTrigger><SelectValue placeholder="Seleccionar persona" /></SelectTrigger>
                      <SelectContent>
                        {asignadosDisponibles.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label style={S.fieldLabel} htmlFor="descripcion">Descripción</label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Describe el cambio a realizar..."
                      rows={3}
                      style={{ resize: "vertical", width: "100%", maxWidth: "100%", wordBreak: "break-word", overflowWrap: "break-word", whiteSpace: "pre-wrap" }}
                    />
                  </div>
                </div>

                {/* Fechas */}
                <div style={S.panel}>
                  <p style={S.sectionLabel}><Calendar size={12} /> Fechas</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    <div>
                      <label style={S.fieldLabel} htmlFor="fechaInicio">Fecha de inicio</label>
                      <Input id="fechaInicio" type="date" value={formData.fechaInicio}
                        onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} required />
                    </div>
                    <div>
                      <label style={S.fieldLabel} htmlFor="fechaFin">Fecha de fin <span style={{ fontWeight:400, color:"var(--muted-foreground)" }}>(opcional)</span></label>
                      <Input id="fechaFin" type="date" value={formData.fechaFin}
                        onChange={e => setFormData({ ...formData, fechaFin: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Configuración de Pruebas */}
                <div style={S.panel}>
                  <p style={S.sectionLabel}><Server size={12} /> Configuración de Pruebas</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>

                    <div>
                      <label style={S.fieldLabel}>Entorno</label>
                      <Select value={formData.entornoPruebas}
                        onValueChange={(v: EntornoPruebas) => setFormData({ ...formData, entornoPruebas: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desarrollo">Desarrollo</SelectItem>
                          <SelectItem value="qa">QA</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="produccion">Producción</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Fase</label>
                      <Select value={formData.fasePruebas}
                        onValueChange={(v: FasePruebas) => setFormData({ ...formData, fasePruebas: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="despliegue">Despliegue</SelectItem>
                          <SelectItem value="rollback">Rollback</SelectItem>
                          <SelectItem value="redespliegue">Redespliegue</SelectItem>
                          <SelectItem value="validacion">Validación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Tipo de Prueba</label>
                      <Select value={formData.tipoPrueba}
                        onValueChange={(v: TipoPrueba) => setFormData({ ...formData, tipoPrueba: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="funcional">Funcional</SelectItem>
                          <SelectItem value="no_funcional">No Funcional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label style={S.fieldLabel}>Estado</label>
                      <Select value={formData.estado}
                        onValueChange={(v: EstadoCambio) => setFormData({ ...formData, estado: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_progreso">En Progreso</SelectItem>
                          <SelectItem value="completado">Completado</SelectItem>
                          <SelectItem value="bloqueado">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  </div>
                </div>

              </div>

              {/* ══ COLUMNA DERECHA ══ */}
              <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>

                {/* Criticidad */}
                <div style={S.panel}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <p style={{ ...S.sectionLabel, marginBottom: 0 }}>
                      <AlertTriangle size={12} className="text-chart-4" /> Criticidad
                    </p>
                    <Badge variant="outline" className={`${colorCrit} text-xs`}>
                      {criticidadCalculada.charAt(0).toUpperCase() + criticidadCalculada.slice(1)}
                    </Badge>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    {[
                      { icon:<Users size={12}/>,    label:"Impacto usuarios",   pct:"40%", key:"impactoUsuarios"    as const },
                      { icon:<FileCode size={12}/>, label:"Complejidad técnica", pct:"30%", key:"complejidadTecnica" as const },
                      { icon:<Zap size={12}/>,      label:"Urgencia",            pct:"30%", key:"urgencia"           as const },
                    ].map(({ icon, label, pct, key }) => (
                      <div key={key}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px" }}>
                          <span style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:"var(--muted-foreground)" }}>
                            {icon}{label} <span style={{ fontSize:"10px", opacity:0.6 }}>({pct})</span>
                          </span>
                          <span style={{ fontSize:"13px", fontWeight:700, color:"var(--foreground)", minWidth:"32px", textAlign:"right" }}>
                            {formData[key]}/10
                          </span>
                        </div>
                        <Slider
                          value={[formData[key]]}
                          onValueChange={([v]) => setFormData({ ...formData, [key]: v })}
                          min={1} max={10} step={1}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Esfuerzo */}
                <div style={S.panel}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                    <p style={{ ...S.sectionLabel, marginBottom: 0 }}>
                      <Clock size={12} className="text-chart-1" /> Esfuerzo
                    </p>
                    <Badge variant="outline" className={`${colorEsf} text-xs`}>
                      {esfuerzoCalculado.charAt(0).toUpperCase() + esfuerzoCalculado.slice(1)}
                    </Badge>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={S.fieldLabel} htmlFor="horasEstimadas">Horas estimadas</label>
                      <Input id="horasEstimadas" type="number" min={1}
                        value={formData.horasEstimadas}
                        onChange={e => setFormData({ ...formData, horasEstimadas: parseInt(e.target.value) || 0 })} />
                    </div>

                    <div>
                      <label style={S.fieldLabel} htmlFor="cantidadArchivos">Archivos a modificar</label>
                      <Input id="cantidadArchivos" type="number" min={1}
                        value={formData.cantidadArchivos}
                        onChange={e => setFormData({ ...formData, cantidadArchivos: parseInt(e.target.value) || 0 })} />
                    </div>

                    {/* Toggle requiere pruebas */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", borderRadius:"10px", background:"var(--secondary)", border:"1px solid var(--border)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <TestTube size={14} className="text-chart-2 shrink-0" />
                        <div>
                          <p style={{ fontSize:"12px", fontWeight:500, color:"var(--foreground)" }}>Requiere pruebas</p>
                          <p style={{ fontSize:"10px", color:"var(--muted-foreground)", marginTop:"1px" }}>Testing adicional</p>
                        </div>
                      </div>
                      <Switch
                        id="requierePruebas"
                        checked={formData.requierePruebas}
                        onCheckedChange={v => setFormData({ ...formData, requierePruebas: v })}
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ── FOOTER ── */}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px", marginTop:"24px", paddingTop:"18px", borderTop:"1px solid var(--border)" }}>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!formData.titulo || !formData.asignado}>
                {cambioEditar ? "Guardar cambios" : "Crear cambio"}
              </Button>
            </div>

          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
