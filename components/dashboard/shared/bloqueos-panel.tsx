"use client"

import { useState, useMemo, useEffect } from "react"
import {
  AlertTriangle, BookOpen, FlaskConical, ListTodo,
  ShieldCheck, Download, FileText,
} from "lucide-react"
import type { HistoriaUsuario, CasoPrueba, Tarea } from "@/lib/types"
import { Paginador } from "@/components/ui/paginator"
import { BloqueoRow, type BloqueoEnriquecido } from "./bloqueos-row"
import { exportarBloqueosCSV, exportarBloqueosPDF } from "./bloqueos-export"

type FiltroEstado = "activos" | "resueltos" | "todos"
type FiltroNivel  = "todos" | "hu" | "caso" | "tarea"

interface BloqueoPanelProps {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  tareas: Tarea[]
  onResolverBloqueoHU:    (huId: string, bId: string, nota: string) => void
  onResolverBloqueoCaso:  (casoId: string, huId: string, bId: string, nota: string) => void
  onResolverBloqueoTarea: (tareaId: string, bId: string, nota: string) => void
  onVerHU?: (hu: HistoriaUsuario) => void
  canEdit?: boolean
}

const PAGE_SIZE = 20

export function BloqueosPanel({
  historias, casos, tareas,
  onResolverBloqueoHU, onResolverBloqueoCaso, onResolverBloqueoTarea,
  onVerHU, canEdit = true,
}: BloqueoPanelProps) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("activos")
  const [filtroNivel,  setFiltroNivel]  = useState<FiltroNivel>("todos")
  const [pagina,       setPagina]       = useState(1)

  const todos: BloqueoEnriquecido[] = useMemo(() => {
    const result: BloqueoEnriquecido[] = []

    for (const hu of historias) {
      for (const b of hu.bloqueos) {
        result.push({
          key: `hu-${hu.id}-${b.id}`, id: b.id,
          descripcion: b.descripcion, reportadoPor: b.reportadoPor,
          fecha: b.fecha, resuelto: b.resuelto,
          fechaResolucion: b.resuelto ? b.fechaResolucion : undefined, resueltoPor: b.resuelto ? b.resueltoPor : undefined, notaResolucion: b.resuelto ? b.notaResolucion : undefined,
          nivel: "hu", huId: hu.id, huCodigo: hu.codigo,
          huTitulo: hu.titulo, huResponsable: hu.responsable, huPrioridad: hu.prioridad,
        })
      }
    }

    for (const c of casos) {
      const hu = historias.find(h => h.id === c.huId)
      if (!hu) continue
      for (const b of c.bloqueos) {
        result.push({
          key: `caso-${c.id}-${b.id}`, id: b.id,
          descripcion: b.descripcion, reportadoPor: b.reportadoPor,
          fecha: b.fecha, resuelto: b.resuelto,
          fechaResolucion: b.resuelto ? b.fechaResolucion : undefined, resueltoPor: b.resuelto ? b.resueltoPor : undefined, notaResolucion: b.resuelto ? b.notaResolucion : undefined,
          nivel: "caso", huId: hu.id, huCodigo: hu.codigo,
          huTitulo: hu.titulo, huResponsable: hu.responsable, huPrioridad: hu.prioridad,
          casoId: c.id, casoTitulo: c.titulo,
        })
      }
    }

    for (const t of tareas) {
      const hu = historias.find(h => h.id === t.huId)
      if (!hu) continue
      const c = casos.find(c => c.id === t.casoPruebaId)
      for (const b of t.bloqueos) {
        result.push({
          key: `tarea-${t.id}-${b.id}`, id: b.id,
          descripcion: b.descripcion, reportadoPor: b.reportadoPor,
          fecha: b.fecha, resuelto: b.resuelto,
          fechaResolucion: b.resuelto ? b.fechaResolucion : undefined, resueltoPor: b.resuelto ? b.resueltoPor : undefined, notaResolucion: b.resuelto ? b.notaResolucion : undefined,
          nivel: "tarea", huId: hu.id, huCodigo: hu.codigo,
          huTitulo: hu.titulo, huResponsable: hu.responsable, huPrioridad: hu.prioridad,
          casoId: c?.id, casoTitulo: c?.titulo,
          tareaId: t.id, tareaTitulo: t.titulo,
        })
      }
    }

    return result.sort((a, b) => {
      if (a.resuelto !== b.resuelto) return a.resuelto ? 1 : -1
      return b.fecha.getTime() - a.fecha.getTime()
    })
  }, [historias, casos, tareas])

  const filtrados = useMemo(() => todos.filter(item => {
    if (filtroEstado === "activos"   && item.resuelto)  return false
    if (filtroEstado === "resueltos" && !item.resuelto) return false
    if (filtroNivel !== "todos" && item.nivel !== filtroNivel) return false
    return true
  }), [todos, filtroEstado, filtroNivel])

  useEffect(() => { setPagina(1) }, [filtroEstado, filtroNivel])

  const filtradosEnPagina = useMemo(
    () => filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [filtrados, pagina]
  )

  const countActivos = todos.filter(i => !i.resuelto).length
  const countHU      = todos.filter(i => !i.resuelto && i.nivel === "hu").length
  const countCaso    = todos.filter(i => !i.resuelto && i.nivel === "caso").length
  const countTarea   = todos.filter(i => !i.resuelto && i.nivel === "tarea").length

  const handleResolver = (item: BloqueoEnriquecido, nota: string) => {
    if (item.nivel === "hu") {
      onResolverBloqueoHU(item.huId, item.id, nota)
    } else if (item.nivel === "caso" && item.casoId) {
      onResolverBloqueoCaso(item.casoId, item.huId, item.id, nota)
    } else if (item.nivel === "tarea" && item.tareaId) {
      onResolverBloqueoTarea(item.tareaId, item.id, nota)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bloqueos activos", count: countActivos, color: "var(--chart-4)", bg: "color-mix(in oklch, var(--chart-4) 8%, var(--card))", icon: <AlertTriangle size={18}/> },
          { label: "En HUs",           count: countHU,      color: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 8%, var(--card))", icon: <BookOpen size={18}/> },
          { label: "En Casos",         count: countCaso,    color: "var(--chart-2)", bg: "color-mix(in oklch, var(--chart-2) 8%, var(--card))", icon: <FlaskConical size={18}/> },
          { label: "En Tareas",        count: countTarea,   color: "var(--chart-3)", bg: "color-mix(in oklch, var(--chart-3) 8%, var(--card))", icon: <ListTodo size={18}/> },
        ].map(stat => (
          <div
            key={stat.label}
            className="px-4 py-3.5 rounded-xl border border-border flex items-center gap-3"
            style={{ background: stat.bg }}
          >
            <div className="shrink-0" style={{ color: stat.color }}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold leading-none" style={{ color: stat.color }}>{stat.count}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <div className="flex rounded-lg border border-border overflow-hidden bg-secondary">
          {(["activos", "todos", "resueltos"] as FiltroEstado[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              className={`px-3 py-1 border-none cursor-pointer text-xs transition-colors ${
                filtroEstado === f
                  ? "font-bold bg-primary text-primary-foreground"
                  : "font-normal bg-transparent text-muted-foreground"
              }`}
            >
              {f === "activos" ? "Activos" : f === "todos" ? "Todos" : "Resueltos"}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {([
            { v: "todos", label: "Todos los niveles" },
            { v: "hu",    label: "HU" },
            { v: "caso",  label: "Casos" },
            { v: "tarea", label: "Tareas" },
          ] as const).map(opt => (
            <button
              key={opt.v}
              onClick={() => setFiltroNivel(opt.v)}
              className={`px-2.5 py-1 rounded-[7px] text-[11px] font-semibold cursor-pointer ${
                filtroNivel === opt.v
                  ? "border border-border bg-card text-foreground shadow-sm"
                  : "border border-transparent bg-transparent text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
        <div className="flex gap-1.5">
          <button
            onClick={() => exportarBloqueosCSV(filtrados)}
            disabled={filtrados.length === 0}
            title="Exportar a CSV"
            className={`flex items-center gap-1.5 h-8 px-3 rounded-[7px] border border-border bg-card text-xs text-foreground hover:bg-secondary ${
              filtrados.length === 0 ? "opacity-40 cursor-default" : "cursor-pointer"
            }`}
          >
            <Download size={13}/> CSV
          </button>
          <button
            onClick={() => exportarBloqueosPDF(filtrados)}
            disabled={filtrados.length === 0}
            title="Exportar a PDF"
            className={`flex items-center gap-1.5 h-8 px-3 rounded-[7px] border border-border bg-card text-xs text-foreground hover:bg-secondary ${
              filtrados.length === 0 ? "opacity-40 cursor-default" : "cursor-pointer"
            }`}
          >
            <FileText size={13}/> PDF
          </button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="p-14 text-center">
          <ShieldCheck size={44} className="mx-auto mb-3 block text-chart-2 opacity-35"/>
          <p className="text-sm font-semibold text-foreground mb-1">
            {filtroEstado === "activos"
              ? "Sin bloqueos activos"
              : filtroEstado === "resueltos"
                ? "Sin bloqueos resueltos"
                : "Sin bloqueos registrados"}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {filtroEstado === "activos"
              ? "Todas las historias, casos y tareas funcionan sin impedimentos"
              : "Cambia los filtros para ver otros resultados"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtradosEnPagina.map(item => (
            <BloqueoRow
              key={item.key}
              item={item}
              onResolver={nota => handleResolver(item, nota)}
              onVerHU={onVerHU
                ? () => { const hu = historias.find(h => h.id === item.huId); if (hu) onVerHU(hu) }
                : undefined}
              canEdit={canEdit && !item.resuelto}
            />
          ))}
        </div>
      )}

      <Paginador pagina={pagina} total={filtrados.length} pageSize={PAGE_SIZE} onCambiar={setPagina} />
    </div>
  )
}
