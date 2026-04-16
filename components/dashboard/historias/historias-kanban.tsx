"use client"

import { useState, useMemo } from "react"
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from "@dnd-kit/core"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, Clock, Edit, GripVertical, Layers, Trash2, UserX } from "lucide-react"
import {
  PRIORIDAD_CFG,
  getEtapaHUCfg,
  type HistoriaUsuario, type CasoPrueba, type EstadoHU,
  type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef,
} from "@/lib/types"
import { useAuth } from "@/lib/contexts/auth-context"
import { isResponsableActivo } from "@/lib/utils/asignaciones"

const PRIORIDAD_ORDER: Record<string, number> = { critica: 0, alta: 1, media: 2, baja: 3 }

interface KanbanColumn {
  key: string
  label: string
  color: string
  estados: EstadoHU[]
  /** The default estado when dropping into this column */
  defaultEstado: EstadoHU
}

const KANBAN_COLUMNAS: KanbanColumn[] = [
  { key: "sin_iniciar", label: "Sin iniciar",         color: "var(--muted-foreground)", estados: ["sin_iniciar"],             defaultEstado: "sin_iniciar" },
  { key: "en_progreso", label: "En progreso",         color: "var(--chart-1)",          estados: ["en_progreso"],             defaultEstado: "en_progreso" },
  { key: "exitosa",     label: "Exitosa",             color: "var(--chart-2)",          estados: ["exitosa"],                 defaultEstado: "exitosa" },
  { key: "cerrada",     label: "Fallida / Cancelada", color: "var(--chart-4)",          estados: ["fallida", "cancelada"],    defaultEstado: "cancelada" },
]

function UrgenciaBadge({ fecha, estado }: { fecha?: Date; estado: string }) {
  if (!fecha || estado === "exitosa" || estado === "cancelada") return null
  const dias = Math.ceil((fecha.getTime() - Date.now()) / 86400000)
  if (dias > 14) return null

  const vencida  = dias <= 0
  const critica  = dias > 0 && dias <= 3
  const alerta   = dias > 3 && dias <= 7

  const color = vencida ? "var(--chart-4)" : critica ? "var(--chart-4)" : alerta ? "var(--chart-3)" : "var(--chart-2)"
  const bg    = vencida ? "color-mix(in oklch,var(--chart-4) 12%,transparent)"
               : critica ? "color-mix(in oklch,var(--chart-4) 10%,transparent)"
               : alerta  ? "color-mix(in oklch,var(--chart-3) 10%,transparent)"
               :            "color-mix(in oklch,var(--chart-2) 10%,transparent)"
  const label = vencida ? "Vencida" : dias === 1 ? "Manana" : `${dias}d`

  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:3,
      padding:"1px 6px", borderRadius:6, border:`1px solid ${color}`,
      background:bg, color, fontSize:9, fontWeight:700, flexShrink:0,
    }}>
      <Clock size={9} style={{ flexShrink:0 }}/>
      {label}
    </span>
  )
}

// ── Draggable Card ──────────────────────────────────────
function KanbanCard({
  hu, casos, configEtapas, canEdit, isDragOverlay,
  onVerDetalle, onEditar, onEliminar, users,
}: {
  hu: HistoriaUsuario
  casos: CasoPrueba[]
  configEtapas: ConfigEtapas
  canEdit?: boolean
  isDragOverlay?: boolean
  onVerDetalle: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
  users: { nombre: string; activo: boolean }[]
}) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: hu.id, data: { hu } })

  const style = isDragOverlay ? undefined : {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const priCfg  = PRIORIDAD_CFG[hu.prioridad]
  const etaCfg  = getEtapaHUCfg(hu.etapa, configEtapas)
  const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
  const tieneBloqueos = hu.bloqueos.some(b => !b.resuelto)
  const casosAprobados   = casosHU.filter(c => c.estadoAprobacion === "aprobado")
  const casosCompletados = casosAprobados.filter(c =>
    c.resultadosPorEtapa.length > 0 && c.resultadosPorEtapa.every(r => r.estado === "completado")
  )
  const pct = casosAprobados.length > 0 ? Math.round((casosCompletados.length / casosAprobados.length) * 100) : 0

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding:"10px 12px", borderRadius:10, cursor:"pointer",
        border: tieneBloqueos
          ? "1px solid color-mix(in oklch, var(--chart-4) 45%, var(--border))"
          : "1px solid var(--border)",
        background:"var(--card)", transition: style?.transition ?? "background 0.15s",
        display:"flex", flexDirection:"column", gap:7,
      }}
      className="hover:bg-secondary/60"
      onClick={() => !isDragging && onVerDetalle(hu)}
    >
      {/* Fila 1: drag handle + codigo + prioridad + urgencia + bloqueo */}
      <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            style={{ background:"none", border:"none", padding:0, display:"flex", flexShrink:0 }}
            onClick={e => e.stopPropagation()}
          >
            <GripVertical size={12} />
          </button>
        )}
        <span style={{ fontSize:10, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, flexShrink:0 }}>
          {hu.codigo}
        </span>
        <Badge variant="outline" className={`${priCfg.cls} text-[9px]`} style={{ padding:"0px 5px" }}>
          {priCfg.label}
        </Badge>
        <UrgenciaBadge fecha={hu.fechaFinEstimada} estado={hu.estado} />
        {tieneBloqueos && <span title="Bloqueos activos"><AlertTriangle size={11} style={{ color:"var(--chart-4)", flexShrink:0 }}/></span>}
      </div>

      {/* Fila 2: titulo */}
      <p style={{ fontSize:12, fontWeight:600, color:"var(--foreground)", lineHeight:1.35,
        display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
        margin:0,
      }}>
        {hu.titulo}
      </p>

      {/* Fila 3: etapa + casos */}
      <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
        <Badge variant="outline" className={`${etaCfg.cls} text-[9px]`} style={{ padding:"0px 5px" }}>
          {etaCfg.label}
        </Badge>
        <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:10, color:"var(--muted-foreground)" }}>
          <Layers size={9}/> {casosHU.length}
        </span>
      </div>

      {/* Fila 4: barra de progreso */}
      {casosAprobados.length > 0 && (
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Progress value={pct} className="h-1" style={{ flex:1 }}/>
          <span style={{ fontSize:9, color:"var(--muted-foreground)", fontFamily:"monospace", flexShrink:0 }}>{pct}%</span>
        </div>
      )}

      {/* Fila 5: responsable + acciones */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:2 }}
        onClick={e => e.stopPropagation()}>
        <p style={{ fontSize:10, color:"var(--muted-foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1, minWidth:0, display:"flex", alignItems:"center", gap:3 }}>
          {hu.responsable}
          {!isResponsableActivo(hu.responsable, users) && (
            <UserX size={9} style={{ color:"var(--chart-4)", flexShrink:0 }} aria-label="Responsable sin workspace activo" />
          )}
        </p>
        <div style={{ display:"flex", gap:2, flexShrink:0 }}>
          {canEdit && <>
            <button onClick={() => onEditar(hu)} title="Editar"
              style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px", color:"var(--muted-foreground)", borderRadius:4, display:"flex" }}
              className="hover:text-foreground hover:bg-secondary">
              <Edit size={11}/>
            </button>
            <button onClick={() => onEliminar(hu)} title="Eliminar"
              style={{ background:"none", border:"none", cursor:"pointer", padding:"2px 4px", color:"var(--chart-4)", borderRadius:4, display:"flex" }}
              className="hover:bg-secondary">
              <Trash2 size={11}/>
            </button>
          </>}
        </div>
      </div>
    </div>
  )
}

// ── Main Kanban ─────────────────────────────────────────
interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  configEtapas: ConfigEtapas
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
  canEdit?: boolean
  onVerDetalle: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
  onMoverHU?: (huId: string, nuevoEstado: EstadoHU) => void
}

export function HistoriasKanban({
  historias, casos, configEtapas, canEdit, onVerDetalle, onEditar, onEliminar, onMoverHU,
}: Props) {
  const { users } = useAuth()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const huMap = useMemo(
    () => new Map(historias.map(hu => [hu.id, hu])),
    [historias],
  )

  // Group HUs by column key
  const columnHUs = useMemo(() => {
    const map = new Map<string, HistoriaUsuario[]>()
    for (const col of KANBAN_COLUMNAS) {
      map.set(col.key, historias
        .filter(hu => (col.estados as readonly string[]).includes(hu.estado))
        .sort((a, b) => (PRIORIDAD_ORDER[a.prioridad] ?? 0) - (PRIORIDAD_ORDER[b.prioridad] ?? 0))
      )
    }
    return map
  }, [historias])

  const activeHU = activeId ? huMap.get(activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || !onMoverHU || !canEdit) return

    const huId = active.id as string
    const hu = huMap.get(huId)
    if (!hu) return

    // Determine target column from the over element
    const overId = over.id as string
    // over could be a column key or another card's id
    const targetCol = KANBAN_COLUMNAS.find(c => c.key === overId)
      ?? KANBAN_COLUMNAS.find(c => {
        const overHU = huMap.get(overId)
        return overHU && (c.estados as readonly string[]).includes(overHU.estado)
      })

    if (!targetCol) return

    // Don't fire if staying in the same column
    if ((targetCol.estados as readonly string[]).includes(hu.estado)) return

    onMoverHU(huId, targetCol.defaultEstado)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto -mx-1 px-1">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, alignItems:"start", minWidth: 700 }}>
          {KANBAN_COLUMNAS.map(col => {
            const husCol = columnHUs.get(col.key) ?? []

            return (
              <KanbanColumnDrop key={col.key} col={col} count={husCol.length}>
                {husCol.length === 0 && (
                  <div style={{ textAlign:"center", padding:"24px 12px", color:"var(--muted-foreground)", border:"1px dashed var(--border)", borderRadius:8, fontSize:12 }}>
                    Sin HUs
                  </div>
                )}

                {husCol.map(hu => (
                  <KanbanCard
                    key={hu.id}
                    hu={hu} casos={casos} configEtapas={configEtapas} canEdit={canEdit}
                    onVerDetalle={onVerDetalle} onEditar={onEditar} onEliminar={onEliminar}
                    users={users}
                  />
                ))}
              </KanbanColumnDrop>
            )
          })}
        </div>
      </div>

      <DragOverlay>
        {activeHU && (
          <KanbanCard
            hu={activeHU} casos={casos} configEtapas={configEtapas} canEdit={canEdit}
            isDragOverlay
            onVerDetalle={() => {}} onEditar={() => {}} onEliminar={() => {}}
            users={users}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ── Droppable Column ────────────────────────────────────
function KanbanColumnDrop({ col, count, children }: { col: KanbanColumn; count: number; children: React.ReactNode }) {
  const { setNodeRef } = useSortable({ id: col.key, data: { type: "column" } })

  return (
    <div ref={setNodeRef} style={{ display:"flex", flexDirection:"column", gap:8, minHeight: 100 }}>
      {/* Column header */}
      <div style={{
        padding:"8px 12px", borderRadius:8,
        borderTop:`3px solid ${col.color}`,
        background:"var(--secondary)", border:`1px solid var(--border)`,
        borderTopColor: col.color,
        display:"flex", alignItems:"center", justifyContent:"space-between",
      }}>
        <span style={{ fontSize:11, fontWeight:700, color: col.color, textTransform:"uppercase", letterSpacing:"0.07em" }}>
          {col.label}
        </span>
        <span style={{
          background: count > 0 ? `color-mix(in oklch, ${col.color} 18%, transparent)` : "var(--muted)",
          color: count > 0 ? col.color : "var(--muted-foreground)",
          borderRadius:12, fontSize:10, fontWeight:700,
          padding:"1px 7px", minWidth:20, textAlign:"center",
        }}>
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}
