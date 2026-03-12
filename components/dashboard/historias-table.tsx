"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, Star, BookOpen, AlertTriangle, Plus, Layers, CheckCircle2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { TIPO_TAREA_LABEL, TIPO_TAREA_COLOR, type HistoriaUsuario, type Tarea } from "@/lib/types"

interface Props {
  historias: HistoriaUsuario[]
  tareas: Tarea[]
  onVerDetalle: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
  onNueva: () => void
  canEdit?: boolean
}

const ESTADO_HU: Record<string,{label:string;cls:string}> = {
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

export function HistoriasTable({ historias, tareas, onVerDetalle, onEditar, onEliminar, onNueva, canEdit=true }: Props) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Barra superior */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <p style={{ fontSize:13, color:"var(--muted-foreground)" }}>
          {historias.length} {historias.length===1?"historia":"historias"} · clic en <strong>Ver</strong> para historial de fases y tareas
        </p>
        {canEdit && (
          <Button onClick={onNueva} size="sm">
            <Plus size={13} className="mr-1.5" /> Nueva HU
          </Button>
        )}
      </div>

      {historias.length === 0 && (
        <div style={{ textAlign:"center", padding:"48px", color:"var(--muted-foreground)" }}>
          <BookOpen size={32} style={{ margin:"0 auto 12px", opacity:0.4 }} />
          <p style={{ fontSize:14 }}>Sin historias de usuario. {canEdit && "Crea una con el botón Nueva HU."}</p>
        </div>
      )}

      {historias.map(hu => {
        const estCfg  = ESTADO_HU[hu.estado]    || ESTADO_HU.pendiente
        const priCfg  = PRIORIDAD_CFG[hu.prioridad] || PRIORIDAD_CFG.media
        const tareasHU = tareas.filter(t => hu.tareas.includes(t.id))
        const tieneBloqueos = hu.bloqueos.some(b => !b.resuelto)
        // Tipos únicos de tareas
        const tiposUnicos = [...new Set(tareasHU.map(t => t.tipo))]

        return (
          <div key={hu.id} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"13px 16px", borderRadius:12,
            border: tieneBloqueos
              ? "1px solid color-mix(in oklch, var(--chart-4) 40%, var(--border))"
              : "1px solid var(--border)",
            background:"var(--card)", transition:"background 0.15s",
          }} className="hover:bg-secondary/30">

            {/* Código */}
            <p style={{ fontSize:12, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, flexShrink:0, minWidth:54 }}>
              {hu.codigo}
            </p>

            {/* Título + tipos de tarea */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <p style={{ fontSize:14, fontWeight:600, color:"var(--foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {hu.titulo}
                </p>
                {tieneBloqueos && <AlertTriangle size={13} style={{ color:"var(--chart-4)", flexShrink:0 }} title="Bloqueos activos" />}
              </div>
              {/* Tipos de tarea como mini badges */}
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                {tiposUnicos.slice(0, 4).map(tipo => (
                  <Badge key={tipo} variant="outline" className={`${TIPO_TAREA_COLOR[tipo]} text-[9px]`} style={{ padding:"1px 5px" }}>
                    {TIPO_TAREA_LABEL[tipo]}
                  </Badge>
                ))}
                {tiposUnicos.length > 4 && (
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                    +{tiposUnicos.length - 4}
                  </Badge>
                )}
              </div>
            </div>

            {/* Meta: pts, tareas, prioridad, estado + progreso */}
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, flexWrap:"wrap" }}>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--muted-foreground)" }}>
                <Star size={11} /> {hu.puntos}
              </span>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--muted-foreground)" }}>
                <Layers size={11} /> {tareasHU.length}
              </span>
              {/* Mini progreso */}
              {tareasHU.length > 0 && (() => {
                const comp = tareasHU.filter(t=>t.estado==="completada").length
                const pct  = Math.round((comp/tareasHU.length)*100)
                return (
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                    <Progress value={pct} className="h-1.5 w-16"/>
                    <span style={{ fontSize:10, color:"var(--muted-foreground)", fontFamily:"monospace" }}>{pct}%</span>
                  </div>
                )
              })()}
              <Badge variant="outline" className={`${priCfg.cls} text-[10px]`}>{priCfg.label}</Badge>
              <Badge variant="outline" className={`${estCfg.cls} text-[10px]`}>{estCfg.label}</Badge>
            </div>

            {/* Responsable */}
            <p style={{ fontSize:12, color:"var(--muted-foreground)", flexShrink:0, minWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {hu.asignado}
            </p>

            {/* Acciones */}
            <div style={{ display:"flex", gap:3, flexShrink:0 }}>
              <Button variant="ghost" size="sm" onClick={() => onVerDetalle(hu)}>
                <Eye size={13} className="mr-1" /> Ver
              </Button>
              {canEdit && <>
                <Button variant="ghost" size="sm" onClick={() => onEditar(hu)} title="Editar">
                  <Edit size={13} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEliminar(hu)}
                  title="Eliminar" style={{ color:"var(--chart-4)" }}>
                  <Trash2 size={13} />
                </Button>
              </>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
