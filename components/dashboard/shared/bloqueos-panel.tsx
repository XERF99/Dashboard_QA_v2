"use client"

import { useState, useMemo, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  AlertTriangle, CheckCircle2, BookOpen, FlaskConical,
  ListTodo, Eye, ShieldCheck, Download, FileText,
} from "lucide-react"
import { PRIORIDAD_CFG, fmtCorto } from "@/lib/types"
import type { HistoriaUsuario, CasoPrueba, Tarea } from "@/lib/types"
import { Paginador } from "@/components/ui/paginator"

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

type NivelBloqueo  = "hu" | "caso" | "tarea"
type FiltroEstado  = "activos" | "resueltos" | "todos"
type FiltroNivel   = "todos" | "hu" | "caso" | "tarea"

interface BloqueoEnriquecido {
  key: string
  id: string
  descripcion: string
  reportadoPor: string
  fecha: Date
  resuelto: boolean
  fechaResolucion?: Date
  resueltoPor?: string
  notaResolucion?: string
  nivel: NivelBloqueo
  huId: string
  huCodigo: string
  huTitulo: string
  huResponsable: string
  huPrioridad: string
  casoId?: string
  casoTitulo?: string
  tareaId?: string
  tareaTitulo?: string
}

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

const NIVEL_CFG: Record<NivelBloqueo, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  hu:    { label: "Historia de Usuario", color: "var(--primary)",  bg: "color-mix(in oklch, var(--primary) 10%, transparent)",  border: "var(--primary)",  icon: <BookOpen size={12}/> },
  caso:  { label: "Caso de Prueba",      color: "var(--chart-2)",  bg: "color-mix(in oklch, var(--chart-2) 10%, transparent)",  border: "var(--chart-2)",  icon: <FlaskConical size={12}/> },
  tarea: { label: "Tarea",               color: "var(--chart-3)",  bg: "color-mix(in oklch, var(--chart-3) 10%, transparent)",  border: "var(--chart-3)",  icon: <ListTodo size={12}/> },
}

function BloqueoRow({
  item, onResolver, onVerHU, canEdit,
}: {
  item: BloqueoEnriquecido
  onResolver: (nota: string) => void
  onVerHU?: () => void
  canEdit?: boolean
}) {
  const [resolviendo, setResolviendo] = useState(false)
  const [nota, setNota] = useState("")
  const cfg          = NIVEL_CFG[item.nivel]
  const prioridadCfg = PRIORIDAD_CFG[item.huPrioridad as keyof typeof PRIORIDAD_CFG]
  const activo       = !item.resuelto

  const handleConfirmar = () => {
    onResolver(nota)
    setNota("")
    setResolviendo(false)
  }

  return (
    <div
      className={`rounded-[10px] bg-card overflow-hidden ${activo ? "opacity-100" : "opacity-65"}`}
      style={{
        border: `1px solid ${activo ? "color-mix(in oklch, var(--chart-4) 40%, var(--border))" : "var(--border)"}`,
        borderLeft: `3px solid ${activo ? "var(--chart-4)" : "var(--muted-foreground)"}`,
      }}
    >
      <div className="px-3.5 py-3 flex gap-3 items-start">
        <div
          className="w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center"
          style={{
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid color-mix(in oklch, ${cfg.border} 40%, transparent)`,
          }}
        >
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-px shrink-0"
              style={{ color: cfg.color, borderColor: `color-mix(in oklch, ${cfg.border} 50%, transparent)`, background: cfg.bg }}
            >
              {cfg.label}
            </Badge>
            <span className="text-[11px] font-bold text-primary font-mono shrink-0">
              {item.huCodigo}
            </span>
            <span className="text-xs font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              {item.huTitulo}
            </span>
            {prioridadCfg && (
              <Badge variant="outline" className={`${prioridadCfg.cls} text-[9px] shrink-0 px-1.5 py-px`}>
                {prioridadCfg.label}
              </Badge>
            )}
          </div>

          {(item.casoTitulo || item.tareaTitulo) && (
            <p className="text-[11px] text-muted-foreground mb-1">
              {item.casoTitulo && <><span className="font-semibold">Caso:</span> {item.casoTitulo}</>}
              {item.tareaTitulo && <> · <span className="font-semibold">Tarea:</span> {item.tareaTitulo}</>}
            </p>
          )}

          <p className={`text-[13px] font-medium mb-1.5 leading-[1.4] ${activo ? "text-foreground" : "text-muted-foreground"}`}>
            {item.descripcion}
          </p>

          <div className="flex gap-3.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground">
              Reportado por <span className="font-semibold">{item.reportadoPor}</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {fmtCorto(item.fecha)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Responsable HU: <span className="font-semibold">{item.huResponsable}</span>
            </span>
          </div>

          {item.resuelto && (item.notaResolucion || item.resueltoPor) && (
            <div
              className="mt-2 px-2.5 py-1.5 rounded-[7px]"
              style={{
                background: "color-mix(in oklch, var(--chart-2) 8%, transparent)",
                border: "1px solid color-mix(in oklch, var(--chart-2) 25%, transparent)",
              }}
            >
              <p className="text-[11px] text-chart-2 leading-normal">
                <CheckCircle2 size={11} className="inline mr-1 align-middle"/>
                {item.notaResolucion && <><span className="font-semibold">Resolución:</span> {item.notaResolucion}</>}
                {item.resueltoPor && <> · Por {item.resueltoPor}</>}
                {item.fechaResolucion && <> · {fmtCorto(item.fechaResolucion)}</>}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0 items-end">
          {item.resuelto ? (
            <div className="flex items-center gap-1 text-[11px] text-chart-2 font-semibold">
              <CheckCircle2 size={12}/> Resuelto
            </div>
          ) : (
            <>
              {onVerHU && (
                <button
                  onClick={onVerHU}
                  title="Ver Historia de Usuario"
                  className="bg-transparent border border-border rounded-md cursor-pointer px-2 py-1 text-[11px] text-muted-foreground flex items-center gap-0.75 hover:bg-secondary hover:text-foreground"
                >
                  <Eye size={11}/> Ver HU
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setResolviendo(v => !v)}
                  className="bg-transparent rounded-md cursor-pointer px-2 py-1 text-[11px] text-chart-2 font-semibold flex items-center gap-0.75 hover:bg-chart-2/10"
                  style={{ border: "1px solid color-mix(in oklch, var(--chart-2) 50%, transparent)" }}
                >
                  <CheckCircle2 size={11}/> Resolver
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {resolviendo && (
        <div className="px-3.5 pb-3 pt-2.5 border-t border-border bg-background">
          <p className="text-[11px] text-muted-foreground mb-1.5">
            Nota de resolución <span className="opacity-60">(opcional)</span>
          </p>
          <div className="flex gap-2">
            <Input
              value={nota}
              onChange={e => setNota(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleConfirmar() }}
              placeholder="Describe cómo se resolvió el bloqueo..."
              className="h-8 text-xs flex-1"
              autoFocus
            />
            <Button size="sm" onClick={handleConfirmar} className="h-8 shrink-0">
              Confirmar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setResolviendo(false)} className="h-8 shrink-0">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
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

  const exportarPDF = () => {
    const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    const filas = filtrados.map(item => `
      <tr>
        <td><span class="badge nivel-${item.nivel}">${esc(NIVEL_CFG[item.nivel].label)}</span></td>
        <td><strong>${esc(item.huCodigo)}</strong><br/><span class="sub">${esc(item.huTitulo)}</span></td>
        <td>${esc(item.descripcion)}</td>
        <td>${esc(item.reportadoPor)}<br/><span class="sub">${fmtCorto(item.fecha)}</span></td>
        <td>${esc(item.casoTitulo ?? "")}${item.tareaTitulo ? `<br/><span class="sub">${esc(item.tareaTitulo)}</span>` : ""}</td>
        <td><span class="estado ${item.resuelto ? "resuelto" : "activo"}">${item.resuelto ? "Resuelto" : "Activo"}</span>
          ${item.notaResolucion ? `<br/><span class="sub">${esc(item.notaResolucion)}</span>` : ""}</td>
      </tr>`).join("")
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
      <title>Bloqueos ${fecha}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px}
        h1{font-size:16px;margin-bottom:4px}
        .meta{font-size:11px;color:#666;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        th{background:#1e293b;color:#fff;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
        td{padding:6px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}
        tr:nth-child(even) td{background:#f8fafc}
        .badge{display:inline-block;font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px}
        .nivel-hu{background:#dbeafe;color:#1d4ed8}
        .nivel-caso{background:#dcfce7;color:#15803d}
        .nivel-tarea{background:#fef9c3;color:#a16207}
        .estado.activo{color:#dc2626;font-weight:700}
        .estado.resuelto{color:#16a34a;font-weight:700}
        .sub{font-size:10px;color:#64748b}
        @media print{body{padding:0}@page{margin:12mm;size:landscape}}
      </style></head><body>
      <h1>Registro de Bloqueos</h1>
      <p class="meta">Generado el ${fecha} · ${filtrados.length} bloqueo${filtrados.length !== 1 ? "s" : ""}</p>
      <table>
        <thead><tr><th>Nivel</th><th>Historia</th><th>Descripción</th><th>Reportado</th><th>Caso / Tarea</th><th>Estado</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}</script>
      </body></html>`
    const w = window.open("", "_blank", "width=1000,height=700")
    if (w) { w.document.write(html); w.document.close() }
  }

  const exportarCSV = () => {
    const headers = [
      "Nivel", "HU Código", "HU Título", "Responsable HU", "Prioridad HU",
      "Caso de Prueba", "Tarea", "Descripción del bloqueo", "Reportado Por",
      "Fecha reporte", "Estado", "Resuelto Por", "Fecha resolución", "Nota resolución",
    ]
    const rows = filtrados.map(item => [
      NIVEL_CFG[item.nivel].label,
      item.huCodigo,
      item.huTitulo,
      item.huResponsable,
      item.huPrioridad,
      item.casoTitulo ?? "",
      item.tareaTitulo ?? "",
      item.descripcion,
      item.reportadoPor,
      fmtCorto(item.fecha),
      item.resuelto ? "Resuelto" : "Activo",
      item.resueltoPor ?? "",
      item.fechaResolucion ? fmtCorto(item.fechaResolucion) : "",
      item.notaResolucion ?? "",
    ])
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const lines = [headers, ...rows].map(r => r.map(escape).join(","))
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `bloqueos_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
            onClick={exportarCSV}
            disabled={filtrados.length === 0}
            title="Exportar a CSV"
            className={`flex items-center gap-1.5 h-8 px-3 rounded-[7px] border border-border bg-card text-xs text-foreground hover:bg-secondary ${
              filtrados.length === 0 ? "opacity-40 cursor-default" : "cursor-pointer"
            }`}
          >
            <Download size={13}/> CSV
          </button>
          <button
            onClick={exportarPDF}
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
