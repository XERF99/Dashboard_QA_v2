"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  BookOpen, ClipboardList, BarChart2, Users,
  Pencil, Trash2, Power, PowerOff, Layers,
  CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { type Grupo, type GrupoConMetricas, type Usuario } from "./owner-panel-shared"
import { MembersTable } from "./owner-panel-members"

function KpiTile({ icon, label, value, colorCls }: {
  icon: React.ReactNode; label: string; value: number; colorCls: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
      <span className={cn("shrink-0", colorCls)}>{icon}</span>
      <div>
        <div className="text-xl font-bold leading-none">{value}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}

export function GrupoDetail({ item, usuarios, onEdit, onDelete, onToggle, onRefreshUsers, saving, setSaving, setError }: {
  item: GrupoConMetricas
  usuarios: Usuario[]
  onEdit: (g: Grupo) => void
  onDelete: (id: string) => void
  onToggle: (id: string, activo: boolean) => void
  onRefreshUsers: () => void
  saving: boolean
  setSaving: (v: boolean) => void
  setError: (e: string | null) => void
}) {
  const { grupo, metricas } = item
  const exitosas = metricas.husPorEstado.find(h => h.estado === "exitosa")?.total ?? 0
  const progreso = metricas.totalHUs > 0 ? Math.round((exitosas / metricas.totalHUs) * 100) : 0
  const miembros = usuarios.filter(u => u.grupoId === grupo.id)
  const sinGrupo = usuarios.filter(u => !u.grupoId && u.rol !== "owner")

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            grupo.activo ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}>
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base truncate">{grupo.nombre}</h3>
              <Badge className={cn(
                "shrink-0 text-[10px] px-1.5 py-0 flex items-center gap-0.5",
                grupo.activo
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15"
                  : "bg-muted text-muted-foreground",
              )}>
                {grupo.activo ? <CheckCircle2 className="h-2.5 w-2.5" /> : null}
                {grupo.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            {grupo.descripcion && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{grupo.descripcion}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon-sm" title="Editar grupo" onClick={() => onEdit(grupo)} className="text-muted-foreground hover:text-foreground">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon-sm"
            title={grupo.activo ? "Desactivar grupo" : "Activar grupo"}
            onClick={() => onToggle(grupo.id, !grupo.activo)}
            className={grupo.activo ? "text-muted-foreground hover:text-amber-600" : "text-muted-foreground hover:text-emerald-600"}
          >
            {grupo.activo ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon-sm" title="Eliminar grupo" onClick={() => onDelete(grupo.id)} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <KpiTile icon={<BookOpen    className="h-4 w-4" />} label="Historias" value={metricas.totalHUs}      colorCls="text-primary" />
        <KpiTile icon={<ClipboardList className="h-4 w-4" />} label="Casos"  value={metricas.totalCasos}    colorCls="text-violet-500" />
        <KpiTile icon={<BarChart2   className="h-4 w-4" />} label="Tareas"   value={metricas.totalTareas}   colorCls="text-amber-500" />
        <KpiTile icon={<Users       className="h-4 w-4" />} label="Miembros" value={metricas.totalUsuarios} colorCls="text-sky-500" />
      </div>

      {metricas.totalHUs > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso de Historias</span>
            <span className="font-semibold text-foreground">{progreso}%</span>
          </div>
          <Progress value={progreso} className="h-1.5" />
          <div className="flex gap-4 text-[11px] text-muted-foreground">
            <span className="text-primary font-medium">{exitosas} exitosas</span>
            <span>{metricas.totalHUs - exitosas} restantes</span>
          </div>
        </div>
      )}

      <Separator />

      <MembersTable
        miembros={miembros}
        sinGrupo={sinGrupo}
        grupoNombre={grupo.nombre}
        grupoId={grupo.id}
        onRefresh={onRefreshUsers}
        saving={saving}
        setSaving={setSaving}
        setError={setError}
      />
    </div>
  )
}
