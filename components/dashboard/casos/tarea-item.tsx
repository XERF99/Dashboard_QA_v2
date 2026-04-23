"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertTriangle, CheckCircle2, Lock, Pencil, Trash2, Unlock, UserX, XCircle } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { useHUDetail } from "@/lib/contexts/hu-detail-context"
import { isResponsableActivo } from "@/lib/utils/asignaciones"
import { TIPO_TAREA_COLOR, TIPO_TAREA_LABEL, type Bloqueo, type Tarea } from "@/lib/types"

// Sub-componente de caso-prueba-card.tsx: renderiza una tarea con sus
// acciones (editar / eliminar / completar / bloquear). Extraído en v2.75.
export interface TareaItemProps {
  tarea:          Tarea
  casoId:         string
  huCerrada:      boolean
  onAbrirEditar:  (tarea: Tarea) => void
}

export function TareaItem({ tarea, casoId, huCerrada, onAbrirEditar }: TareaItemProps) {
  const { isQA, isAdmin, isQALead, currentUser, onEliminarTarea, onCompletarTarea, onBloquearTarea, onDesbloquearTarea } = useHUDetail()
  const { users } = useAuth()
  const [showBloqueoForm, setShowBloqueoForm] = useState(false)
  const [bloqueoTexto,   setBloqueoTexto]    = useState("")

  const tareaBloqueos = tarea.bloqueos.filter(b => !b.resuelto)
  const puedeManejar  = !huCerrada && (isQA || isAdmin || isQALead) && tarea.estado !== "completada"
  const puedeEditar   = !huCerrada && (isQA || isAdmin || isQALead) && tarea.estado === "pendiente"
  const puedeEliminar = !huCerrada && (isQA || isAdmin || isQALead) && (tarea.estado === "pendiente" || tarea.estado === "en_progreso")

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
          <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:2, display:"flex", alignItems:"center", gap:3 }}>
            {tarea.asignado} · {tarea.horasEstimadas}h
            {!isResponsableActivo(tarea.asignado, users) && (
              <UserX size={9} style={{ color:"var(--chart-4)", flexShrink:0 }} aria-label="Usuario sin workspace activo" />
            )}
          </p>
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
                } as Bloqueo)
                setShowBloqueoForm(false); setBloqueoTexto("")
              }}>Bloquear</Button>
          </div>
        </div>
      )}
    </div>
  )
}
