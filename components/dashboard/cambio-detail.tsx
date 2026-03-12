"use client"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Calendar, Clock, FileCode, TestTube,
  AlertTriangle, Zap, Users,
  Server, GitBranch, ShieldAlert, FlaskConical
} from "lucide-react"
import type { Cambio } from "@/lib/types"
import { calcularCriticidad, calcularEsfuerzo, calcularTiempo, calcularRiesgo } from "@/lib/types"

interface CambioDetailProps {
  open: boolean
  onClose: () => void
  cambio: Cambio | null
}

function getInitials(nombre: string) {
  return nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function formatFecha(fecha: Date) {
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
  return `${fecha.getUTCDate().toString().padStart(2,"0")} ${meses[fecha.getUTCMonth()]} ${fecha.getUTCFullYear()}`
}

const S = {
  sectionLabel: {
    fontSize: "10px", textTransform: "uppercase" as const,
    letterSpacing: "0.1em", fontWeight: 600,
    color: "var(--muted-foreground)", marginBottom: "10px",
  },
  card: {
    padding: "12px 14px", borderRadius: "10px",
    border: "1px solid var(--border)", background: "var(--background)",
  },
  cardLabel: {
    fontSize: "10px", textTransform: "uppercase" as const,
    letterSpacing: "0.07em", color: "var(--muted-foreground)", marginBottom: "4px",
  },
  cardValue: {
    fontSize: "13px", fontWeight: 500, color: "var(--foreground)",
  },
}

export function CambioDetail({ open, onClose, cambio }: CambioDetailProps) {
  if (!cambio) return null

  const criticidad = calcularCriticidad(cambio)
  const esfuerzo   = calcularEsfuerzo(cambio)
  const riesgo     = calcularRiesgo(cambio)
  const tiempo     = calcularTiempo(cambio.fechaInicio, cambio.fechaFin)

  const entornoLabel = { desarrollo:"Desarrollo", qa:"QA", staging:"Staging", produccion:"Producción" }[cambio.entornoPruebas]
  const faseLabel    = { despliegue:"Despliegue", rollback:"Rollback", redespliegue:"Redespliegue", validacion:"Validación" }[cambio.fasePruebas]
  const naturalezaLabel = cambio.naturaleza === "infraestructura" ? "Infraestructura" : "Aplicación"
  const naturalezaColor = cambio.naturaleza === "infraestructura" ? "bg-chart-3/20 text-chart-3 border-chart-3/30" : "bg-primary/20 text-primary border-primary/30"

  const colorEstado = {
    completado:  "bg-chart-2/15 text-chart-2 border-chart-2/30",
    en_progreso: "bg-chart-1/15 text-chart-1 border-chart-1/30",
    bloqueado:   "bg-chart-4/15 text-chart-4 border-chart-4/30",
    pendiente:   "bg-muted text-muted-foreground border-border",
  }[cambio.estado]
  const labelEstado = { completado:"Completado", en_progreso:"En Progreso", bloqueado:"Bloqueado", pendiente:"Pendiente" }[cambio.estado]
  const colorRiesgo = { critico:"bg-chart-4/30 text-chart-4 border-chart-4/50", alto:"bg-chart-4/20 text-chart-4 border-chart-4/30", moderado:"bg-chart-3/20 text-chart-3 border-chart-3/30", bajo:"bg-chart-2/20 text-chart-2 border-chart-2/30" }[riesgo]
  const colorCrit   = criticidad==="alta" ? "bg-chart-4/20 text-chart-4 border-chart-4/30" : criticidad==="media" ? "bg-chart-3/20 text-chart-3 border-chart-3/30" : "bg-chart-2/20 text-chart-2 border-chart-2/30"
  const colorEsf    = esfuerzo==="alto"   ? "bg-chart-4/20 text-chart-4 border-chart-4/30" : esfuerzo==="medio"  ? "bg-chart-3/20 text-chart-3 border-chart-3/30" : "bg-chart-2/20 text-chart-2 border-chart-2/30"
  const colorTipo   = cambio.tipoPrueba==="funcional" ? "bg-chart-1/15 text-chart-1 border-chart-1/30" : "bg-chart-3/15 text-chart-3 border-chart-3/30"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* className se aplica SOBRE las clases base — el !important en globals.css garantiza el ancho */}
      <DialogContent className="cambio-detail-modal">
        {/* DialogTitle oculto visualmente — requerido por accesibilidad (screen readers) */}
        <DialogTitle style={{ position:"absolute", width:"1px", height:"1px", padding:0, margin:"-1px", overflow:"hidden", clip:"rect(0,0,0,0)", whiteSpace:"nowrap", border:0 }}>
          {cambio.titulo}
        </DialogTitle>
        <div style={{ padding: "28px 32px" }}>

          {/* ── HEADER ── */}
          <div style={{ borderBottom:"1px solid var(--border)", paddingBottom:"18px", marginBottom:"24px", paddingRight:"32px" }}>
            <p style={{ fontSize:"11px", fontFamily:"monospace", color:"var(--primary)", letterSpacing:"0.12em", marginBottom:"6px" }}>
              {cambio.id}
            </p>
            <p style={{ fontSize:"20px", fontWeight:700, color:"var(--foreground)", lineHeight:1.3, marginBottom:"12px" }}>
              {cambio.titulo}
            </p>
            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              <Badge variant="outline" className={colorEstado}>{labelEstado}</Badge>
              <Badge variant="outline" className={naturalezaColor}>{naturalezaLabel}</Badge>
              <Badge variant="outline" className={colorTipo}>
                <FlaskConical className="h-3 w-3 mr-1.5" />
                {cambio.tipoPrueba === "funcional" ? "Funcional" : "No Funcional"}
              </Badge>
            </div>
          </div>

          {/* ── BODY: 3 col izq / 2 col der ── */}
          <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:"32px" }}>

            {/* ══ COLUMNA IZQUIERDA ══ */}
            <div style={{ display:"flex", flexDirection:"column", gap:"22px" }}>

              {/* Descripción */}
              <div>
                <p style={S.sectionLabel}>Descripción</p>
                <p style={{ fontSize:"14px", color:"var(--foreground)", lineHeight:1.65 }}>{cambio.descripcion}</p>
              </div>

              {/* Asignado */}
              <div style={{ display:"flex", alignItems:"center", gap:"14px", padding:"14px 16px", borderRadius:"12px", background:"var(--secondary)", border:"1px solid var(--border)" }}>
                <Avatar className="h-11 w-11 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                    {getInitials(cambio.asignado)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p style={{ fontSize:"11px", color:"var(--muted-foreground)", marginBottom:"2px" }}>Asignado a</p>
                  <p style={{ fontSize:"15px", fontWeight:600, color:"var(--foreground)" }}>{cambio.asignado}</p>
                </div>
              </div>

              {/* Info de Pruebas — 2×2 */}
              <div>
                <p style={S.sectionLabel}>Información de Pruebas</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
                  {([
                    { icon:<Server size={15} className="text-chart-1" />,    label:"Entorno",        value:entornoLabel },
                    { icon:<GitBranch size={15} className="text-chart-3" />, label:"Fase",           value:faseLabel },
                    { icon:<FlaskConical size={15} className={cambio.tipoPrueba==="funcional"?"text-chart-1":"text-chart-3"} />, label:"Tipo de Prueba", value:cambio.tipoPrueba==="funcional"?"Funcional":"No Funcional" },
                  ] as const).map(({ icon, label, value }) => (
                    <div key={label} style={{ display:"flex", alignItems:"center", gap:"12px", ...S.card }}>
                      <div style={{ flexShrink:0 }}>{icon}</div>
                      <div>
                        <p style={S.cardLabel}>{label}</p>
                        <p style={S.cardValue}>{value}</p>
                      </div>
                    </div>
                  ))}
                  {/* Riesgo con badge */}
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", ...S.card }}>
                    <ShieldAlert size={15} className="text-chart-4 shrink-0" />
                    <div>
                      <p style={S.cardLabel}>Nivel de Riesgo</p>
                      <Badge variant="outline" className={`${colorRiesgo} text-xs mt-0.5`}>
                        {riesgo.charAt(0).toUpperCase()+riesgo.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas — 3 columnas */}
              <div>
                <p style={S.sectionLabel}>Fechas</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
                  {[
                    { icon:<Calendar size={13} className="text-chart-1"/>, label:"Inicio",       value:formatFecha(cambio.fechaInicio) },
                    { icon:<Calendar size={13} className="text-chart-2"/>, label:"Fin",          value:cambio.fechaFin?formatFecha(cambio.fechaFin):"Sin definir" },
                    { icon:<Clock    size={13} className="text-chart-3"/>, label:"Transcurrido", value:tiempo },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={S.card}>
                      <p style={{ display:"flex", alignItems:"center", gap:"4px", ...S.cardLabel }}>{icon}{label}</p>
                      <p style={S.cardValue}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ══ COLUMNA DERECHA ══ */}
            <div style={{ display:"flex", flexDirection:"column", gap:"22px" }}>

              {/* Criticidad */}
              <div style={{ padding:"18px", borderRadius:"12px", border:"1px solid var(--border)", background:"var(--background)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                  <p style={{ fontSize:"12px", fontWeight:600, color:"var(--foreground)", display:"flex", alignItems:"center", gap:"7px" }}>
                    <AlertTriangle size={14} className="text-chart-4" />
                    Criticidad Calculada
                  </p>
                  <Badge variant="outline" className={`${colorCrit} text-xs`}>
                    {criticidad.charAt(0).toUpperCase()+criticidad.slice(1)}
                  </Badge>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  {[
                    { icon:<Users size={12}/>,    label:"Impacto usuarios",   val:cambio.impactoUsuarios },
                    { icon:<FileCode size={12}/>, label:"Complejidad técnica", val:cambio.complejidadTecnica },
                    { icon:<Zap size={12}/>,      label:"Urgencia",            val:cambio.urgencia },
                  ].map(({ icon, label, val }) => (
                    <div key={label}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"11px", color:"var(--muted-foreground)" }}>{icon}{label}</span>
                        <span style={{ fontSize:"12px", fontWeight:700, color:"var(--foreground)" }}>{val}/10</span>
                      </div>
                      <Progress value={val * 10} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Esfuerzo */}
              <div style={{ padding:"18px", borderRadius:"12px", border:"1px solid var(--border)", background:"var(--background)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
                  <p style={{ fontSize:"12px", fontWeight:600, color:"var(--foreground)", display:"flex", alignItems:"center", gap:"7px" }}>
                    <Clock size={14} className="text-chart-1" />
                    Esfuerzo Calculado
                  </p>
                  <Badge variant="outline" className={`${colorEsf} text-xs`}>
                    {esfuerzo.charAt(0).toUpperCase()+esfuerzo.slice(1)}
                  </Badge>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
                  {[
                    { valor:`${cambio.horasEstimadas}h`,   label:"Horas est.", icon:null },
                    { valor:`${cambio.cantidadArchivos}`,  label:"Archivos",   icon:null },
                    { valor:cambio.requierePruebas?"Sí":"No", label:"Pruebas",
                      icon:<TestTube size={14} className={cambio.requierePruebas?"text-chart-2":"text-muted-foreground"}/> },
                  ].map(({ valor, label, icon }) => (
                    <div key={label} style={{ textAlign:"center", padding:"14px 8px", borderRadius:"10px", background:"var(--secondary)", border:"1px solid var(--border)" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"4px" }}>
                        {icon}
                        <p style={{ fontSize:"22px", fontWeight:700, color:"var(--foreground)", lineHeight:1 }}>{valor}</p>
                      </div>
                      <p style={{ fontSize:"10px", color:"var(--muted-foreground)", marginTop:"5px", lineHeight:1.3 }}>{label}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
