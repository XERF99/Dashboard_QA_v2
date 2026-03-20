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

// ── Tipos internos ───────────────────────────────────────────
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
  // contexto
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

// ── Configuración visual por nivel ───────────────────────────
const NIVEL_CFG: Record<NivelBloqueo, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  hu:    { label: "Historia de Usuario", color: "var(--primary)",  bg: "color-mix(in oklch, var(--primary) 10%, transparent)",  border: "var(--primary)",  icon: <BookOpen size={12}/> },
  caso:  { label: "Caso de Prueba",      color: "var(--chart-2)",  bg: "color-mix(in oklch, var(--chart-2) 10%, transparent)",  border: "var(--chart-2)",  icon: <FlaskConical size={12}/> },
  tarea: { label: "Tarea",               color: "var(--chart-3)",  bg: "color-mix(in oklch, var(--chart-3) 10%, transparent)",  border: "var(--chart-3)",  icon: <ListTodo size={12}/> },
}

// ── Fila de un bloqueo individual ────────────────────────────
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
    <div style={{
      border: `1px solid ${activo ? "color-mix(in oklch, var(--chart-4) 40%, var(--border))" : "var(--border)"}`,
      borderLeft: `3px solid ${activo ? "var(--chart-4)" : "var(--muted-foreground)"}`,
      borderRadius: 10,
      background: "var(--card)",
      overflow: "hidden",
      opacity: activo ? 1 : 0.65,
    }}>
      {/* Fila principal */}
      <div style={{ padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>

        {/* Ícono de nivel */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
          background: cfg.bg, color: cfg.color,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `1px solid color-mix(in oklch, ${cfg.border} 40%, transparent)`,
        }}>
          {cfg.icon}
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Nivel + HU + prioridad */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <Badge variant="outline" style={{ fontSize: 9, padding: "1px 6px", color: cfg.color, borderColor: `color-mix(in oklch, ${cfg.border} 50%, transparent)`, background: cfg.bg, flexShrink: 0 }}>
              {cfg.label}
            </Badge>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary)", fontFamily: "monospace", flexShrink: 0 }}>
              {item.huCodigo}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.huTitulo}
            </span>
            {prioridadCfg && (
              <Badge variant="outline" className={`${prioridadCfg.cls} text-[9px] shrink-0`} style={{ padding: "1px 6px" }}>
                {prioridadCfg.label}
              </Badge>
            )}
          </div>

          {/* Sub-contexto: caso / tarea */}
          {(item.casoTitulo || item.tareaTitulo) && (
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>
              {item.casoTitulo && <><span style={{ fontWeight: 600 }}>Caso:</span> {item.casoTitulo}</>}
              {item.tareaTitulo && <> · <span style={{ fontWeight: 600 }}>Tarea:</span> {item.tareaTitulo}</>}
            </p>
          )}

          {/* Descripción del bloqueo */}
          <p style={{ fontSize: 13, fontWeight: 500, color: activo ? "var(--foreground)" : "var(--muted-foreground)", marginBottom: 6, lineHeight: 1.4 }}>
            {item.descripcion}
          </p>

          {/* Metadata */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              Reportado por <span style={{ fontWeight: 600 }}>{item.reportadoPor}</span>
            </span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              {fmtCorto(item.fecha)}
            </span>
            <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
              Responsable HU: <span style={{ fontWeight: 600 }}>{item.huResponsable}</span>
            </span>
          </div>

          {/* Nota de resolución */}
          {item.resuelto && (item.notaResolucion || item.resueltoPor) && (
            <div style={{
              marginTop: 8, padding: "6px 10px", borderRadius: 7,
              background: "color-mix(in oklch, var(--chart-2) 8%, transparent)",
              border: "1px solid color-mix(in oklch, var(--chart-2) 25%, transparent)",
            }}>
              <p style={{ fontSize: 11, color: "var(--chart-2)", lineHeight: 1.5 }}>
                <CheckCircle2 size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }}/>
                {item.notaResolucion && <><span style={{ fontWeight: 600 }}>Resolución:</span> {item.notaResolucion}</>}
                {item.resueltoPor && <> · Por {item.resueltoPor}</>}
                {item.fechaResolucion && <> · {fmtCorto(item.fechaResolucion)}</>}
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flexShrink: 0, alignItems: "flex-end" }}>
          {item.resuelto ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--chart-2)", fontWeight: 600 }}>
              <CheckCircle2 size={12}/> Resuelto
            </div>
          ) : (
            <>
              {onVerHU && (
                <button
                  onClick={onVerHU}
                  title="Ver Historia de Usuario"
                  style={{ background: "none", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", padding: "4px 8px", fontSize: 11, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 3 }}
                  className="hover:bg-secondary hover:text-foreground"
                >
                  <Eye size={11}/> Ver HU
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setResolviendo(v => !v)}
                  style={{ background: "none", border: "1px solid color-mix(in oklch, var(--chart-2) 50%, transparent)", borderRadius: 6, cursor: "pointer", padding: "4px 8px", fontSize: 11, color: "var(--chart-2)", fontWeight: 600, display: "flex", alignItems: "center", gap: 3 }}
                  className="hover:bg-chart-2/10"
                >
                  <CheckCircle2 size={11}/> Resolver
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Formulario inline de resolución */}
      {resolviendo && (
        <div style={{ padding: "0 14px 12px 14px", paddingTop: 10, borderTop: "1px solid var(--border)", background: "var(--background)" }}>
          <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 6 }}>
            Nota de resolución <span style={{ opacity: 0.6 }}>(opcional)</span>
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              value={nota}
              onChange={e => setNota(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleConfirmar() }}
              placeholder="Describe cómo se resolvió el bloqueo..."
              style={{ height: 32, fontSize: 12, flex: 1 }}
              autoFocus
            />
            <Button size="sm" onClick={handleConfirmar} style={{ height: 32, flexShrink: 0 }}>
              Confirmar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setResolviendo(false)} style={{ height: 32, flexShrink: 0 }}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const PAGE_SIZE = 20

// ── Componente principal ──────────────────────────────────────
export function BloqueosPanel({
  historias, casos, tareas,
  onResolverBloqueoHU, onResolverBloqueoCaso, onResolverBloqueoTarea,
  onVerHU, canEdit = true,
}: BloqueoPanelProps) {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("activos")
  const [filtroNivel,  setFiltroNivel]  = useState<FiltroNivel>("todos")
  const [pagina,       setPagina]       = useState(1)

  // ── Construir lista plana de todos los bloqueos con contexto ──
  const todos: BloqueoEnriquecido[] = useMemo(() => {
    const result: BloqueoEnriquecido[] = []

    // Nivel HU
    for (const hu of historias) {
      for (const b of hu.bloqueos) {
        result.push({
          key: `hu-${hu.id}-${b.id}`, id: b.id,
          descripcion: b.descripcion, reportadoPor: b.reportadoPor,
          fecha: b.fecha, resuelto: b.resuelto,
          fechaResolucion: b.fechaResolucion, resueltoPor: b.resueltoPor, notaResolucion: b.notaResolucion,
          nivel: "hu", huId: hu.id, huCodigo: hu.codigo,
          huTitulo: hu.titulo, huResponsable: hu.responsable, huPrioridad: hu.prioridad,
        })
      }
    }

    // Nivel Caso de Prueba
    for (const c of casos) {
      const hu = historias.find(h => h.id === c.huId)
      if (!hu) continue
      for (const b of c.bloqueos) {
        result.push({
          key: `caso-${c.id}-${b.id}`, id: b.id,
          descripcion: b.descripcion, reportadoPor: b.reportadoPor,
          fecha: b.fecha, resuelto: b.resuelto,
          fechaResolucion: b.fechaResolucion, resueltoPor: b.resueltoPor, notaResolucion: b.notaResolucion,
          nivel: "caso", huId: hu.id, huCodigo: hu.codigo,
          huTitulo: hu.titulo, huResponsable: hu.responsable, huPrioridad: hu.prioridad,
          casoId: c.id, casoTitulo: c.titulo,
        })
      }
    }

    // Nivel Tarea
    for (const t of tareas) {
      const hu = historias.find(h => h.id === t.huId)
      if (!hu) continue
      const c = casos.find(c => c.id === t.casoPruebaId)
      for (const b of t.bloqueos) {
        result.push({
          key: `tarea-${t.id}-${b.id}`, id: b.id,
          descripcion: b.descripcion, reportadoPor: b.reportadoPor,
          fecha: b.fecha, resuelto: b.resuelto,
          fechaResolucion: b.fechaResolucion, resueltoPor: b.resueltoPor, notaResolucion: b.notaResolucion,
          nivel: "tarea", huId: hu.id, huCodigo: hu.codigo,
          huTitulo: hu.titulo, huResponsable: hu.responsable, huPrioridad: hu.prioridad,
          casoId: c?.id, casoTitulo: c?.titulo,
          tareaId: t.id, tareaTitulo: t.titulo,
        })
      }
    }

    // Ordenar: activos primero, luego por fecha desc
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

  // Resetear página al cambiar filtros
  useEffect(() => { setPagina(1) }, [filtroEstado, filtroNivel])

  const filtradosEnPagina = useMemo(
    () => filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [filtrados, pagina]
  )

  // Stats (siempre sobre activos)
  const countActivos = todos.filter(i => !i.resuelto).length
  const countHU      = todos.filter(i => !i.resuelto && i.nivel === "hu").length
  const countCaso    = todos.filter(i => !i.resuelto && i.nivel === "caso").length
  const countTarea   = todos.filter(i => !i.resuelto && i.nivel === "tarea").length

  const exportarPDF = () => {
    const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    const filas = filtrados.map(item => `
      <tr>
        <td><span class="badge nivel-${item.nivel}">${NIVEL_CFG[item.nivel].label}</span></td>
        <td><strong>${item.huCodigo}</strong><br/><span class="sub">${item.huTitulo}</span></td>
        <td>${item.descripcion}</td>
        <td>${item.reportadoPor}<br/><span class="sub">${fmtCorto(item.fecha)}</span></td>
        <td>${item.casoTitulo ?? ""}${item.tareaTitulo ? `<br/><span class="sub">${item.tareaTitulo}</span>` : ""}</td>
        <td><span class="estado ${item.resuelto ? "resuelto" : "activo"}">${item.resuelto ? "Resuelto" : "Activo"}</span>
          ${item.notaResolucion ? `<br/><span class="sub">${item.notaResolucion}</span>` : ""}</td>
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
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Tarjetas de resumen ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Bloqueos activos", count: countActivos, color: "var(--chart-4)", bg: "color-mix(in oklch, var(--chart-4) 8%, var(--card))", icon: <AlertTriangle size={18}/> },
          { label: "En HUs",           count: countHU,      color: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 8%, var(--card))", icon: <BookOpen size={18}/> },
          { label: "En Casos",         count: countCaso,    color: "var(--chart-2)", bg: "color-mix(in oklch, var(--chart-2) 8%, var(--card))", icon: <FlaskConical size={18}/> },
          { label: "En Tareas",        count: countTarea,   color: "var(--chart-3)", bg: "color-mix(in oklch, var(--chart-3) 8%, var(--card))", icon: <ListTodo size={18}/> },
        ].map(stat => (
          <div
            key={stat.label}
            style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--border)", background: stat.bg, display: "flex", alignItems: "center", gap: 12 }}
          >
            <div style={{ color: stat.color, flexShrink: 0 }}>{stat.icon}</div>
            <div>
              <p style={{ fontSize: 24, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.count}</p>
              <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {/* Estado */}
        <div style={{ display: "flex", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden", background: "var(--secondary)" }}>
          {(["activos", "todos", "resueltos"] as FiltroEstado[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              style={{
                padding: "5px 13px", border: "none", cursor: "pointer", fontSize: 12,
                fontWeight: filtroEstado === f ? 700 : 400,
                background: filtroEstado === f ? "var(--primary)" : "transparent",
                color:      filtroEstado === f ? "var(--primary-foreground)" : "var(--muted-foreground)",
                transition: "background 0.15s",
              }}
            >
              {f === "activos" ? "Activos" : f === "todos" ? "Todos" : "Resueltos"}
            </button>
          ))}
        </div>

        {/* Nivel */}
        <div style={{ display: "flex", gap: 4 }}>
          {([
            { v: "todos", label: "Todos los niveles" },
            { v: "hu",    label: "HU" },
            { v: "caso",  label: "Casos" },
            { v: "tarea", label: "Tareas" },
          ] as const).map(opt => (
            <button
              key={opt.v}
              onClick={() => setFiltroNivel(opt.v)}
              style={{
                padding: "4px 11px", borderRadius: 7, fontSize: 11, fontWeight: 600,
                cursor: "pointer",
                border: `1px solid ${filtroNivel === opt.v ? "var(--border)" : "transparent"}`,
                background: filtroNivel === opt.v ? "var(--card)" : "transparent",
                color: filtroNivel === opt.v ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: filtroNivel === opt.v ? "0 1px 3px rgba(0,0,0,0.07)" : "none",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span style={{ fontSize: 12, color: "var(--muted-foreground)", marginLeft: "auto" }}>
          {filtrados.length} resultado{filtrados.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display:"flex", gap:6 }}>
          <button
            onClick={exportarCSV}
            disabled={filtrados.length === 0}
            title="Exportar a CSV"
            style={{
              display:"flex", alignItems:"center", gap:6, height:32, padding:"0 12px",
              borderRadius:7, border:"1px solid var(--border)", background:"var(--card)",
              fontSize:12, color:"var(--foreground)", cursor: filtrados.length === 0 ? "default" : "pointer",
              opacity: filtrados.length === 0 ? 0.4 : 1,
            }}
            className="hover:bg-secondary"
          >
            <Download size={13}/> CSV
          </button>
          <button
            onClick={exportarPDF}
            disabled={filtrados.length === 0}
            title="Exportar a PDF"
            style={{
              display:"flex", alignItems:"center", gap:6, height:32, padding:"0 12px",
              borderRadius:7, border:"1px solid var(--border)", background:"var(--card)",
              fontSize:12, color:"var(--foreground)", cursor: filtrados.length === 0 ? "default" : "pointer",
              opacity: filtrados.length === 0 ? 0.4 : 1,
            }}
            className="hover:bg-secondary"
          >
            <FileText size={13}/> PDF
          </button>
        </div>
      </div>

      {/* ── Lista ── */}
      {filtrados.length === 0 ? (
        <div style={{ padding: 56, textAlign: "center" }}>
          <ShieldCheck size={44} style={{ margin: "0 auto 12px", display: "block", color: "var(--chart-2)", opacity: 0.35 }}/>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)", marginBottom: 4 }}>
            {filtroEstado === "activos"
              ? "Sin bloqueos activos"
              : filtroEstado === "resueltos"
                ? "Sin bloqueos resueltos"
                : "Sin bloqueos registrados"}
          </p>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            {filtroEstado === "activos"
              ? "Todas las historias, casos y tareas funcionan sin impedimentos"
              : "Cambia los filtros para ver otros resultados"}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
