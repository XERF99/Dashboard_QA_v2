"use client"

import { useState, useMemo, useEffect } from "react"
import { History, Search, User2, BookOpen, ChevronDown, Download, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { fmtCorto, fmtHora } from "@/lib/types"
import type { HistoriaUsuario, EventoHistorial, TipoEvento } from "@/lib/types"
import { Paginador } from "@/components/ui/paginator"

// ── Escape HTML para evitar XSS en exportaciones PDF ──────
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

// ── Config visual por tipo de evento ──────────────────────
const EVENTO_CFG: Partial<Record<TipoEvento, { label: string; color: string }>> = {
  hu_creada:                    { label: "HU Creada",            color: "var(--chart-2)" },
  hu_editada:                   { label: "HU Editada",           color: "var(--chart-1)" },
  hu_iniciada:                  { label: "HU Iniciada",          color: "var(--chart-1)" },
  hu_etapa_avanzada:            { label: "Etapa Avanzada",       color: "var(--chart-1)" },
  hu_completada:                { label: "HU Completada",        color: "var(--chart-2)" },
  hu_cancelada:                 { label: "HU Cancelada",         color: "var(--chart-4)" },
  hu_fallida:                   { label: "HU Fallida",           color: "var(--chart-4)" },
  caso_creado:                  { label: "Caso Creado",          color: "var(--chart-2)" },
  caso_enviado_aprobacion:      { label: "Env. Aprobación",      color: "var(--chart-3)" },
  caso_aprobado:                { label: "Caso Aprobado",        color: "var(--chart-2)" },
  caso_rechazado:               { label: "Caso Rechazado",       color: "var(--chart-4)" },
  caso_ejecucion_iniciada:      { label: "Ejec. Iniciada",       color: "var(--chart-1)" },
  caso_completado:              { label: "Caso Completado",      color: "var(--chart-2)" },
  caso_retesteo_solicitado:     { label: "Retesteo Solic.",      color: "var(--chart-3)" },
  caso_retesteo_ejecutado:      { label: "Retesteo Ejec.",       color: "var(--chart-1)" },
  caso_editado:                 { label: "Caso Editado",         color: "var(--chart-1)" },
  caso_eliminado:               { label: "Caso Eliminado",       color: "var(--chart-4)" },
  caso_modificacion_solicitada: { label: "Modif. Solic.",        color: "var(--chart-3)" },
  caso_modificacion_habilitada: { label: "Modif. Habilitada",    color: "var(--chart-1)" },
  casos_adicionales_habilitados:{ label: "Casos Adicionales",    color: "var(--chart-3)" },
  tarea_creada:                 { label: "Tarea Creada",         color: "var(--chart-2)" },
  tarea_completada:             { label: "Tarea Completada",     color: "var(--chart-2)" },
  tarea_editada:                { label: "Tarea Editada",        color: "var(--chart-1)" },
  tarea_eliminada:              { label: "Tarea Eliminada",      color: "var(--chart-4)" },
  tarea_bloqueada:              { label: "Tarea Bloqueada",      color: "var(--chart-4)" },
  tarea_desbloqueada:           { label: "Tarea Desbloqueada",   color: "var(--chart-2)" },
  bloqueo_reportado:            { label: "Bloqueo Reportado",    color: "var(--chart-4)" },
  bloqueo_resuelto:             { label: "Bloqueo Resuelto",     color: "var(--chart-2)" },
}

function getEventoCfg(tipo: TipoEvento) {
  return EVENTO_CFG[tipo] ?? { label: tipo, color: "var(--muted-foreground)" }
}

// ── Tipo interno: evento con contexto de HU ───────────────
type EventoGlobal = EventoHistorial & {
  huId: string
  huCodigo: string
  huTitulo: string
}

interface Props {
  historias: HistoriaUsuario[]
  onVerHU?: (hu: HistoriaUsuario) => void
}

const PAGE_SIZE = 30

// ── Componente principal ──────────────────────────────────
export function AuditoriaPanel({ historias, onVerHU }: Props) {
  const [buscar,        setBuscar]       = useState("")
  const [filtroTipo,    setFiltroTipo]   = useState<TipoEvento | "todos">("todos")
  const [filtroUsuario, setFiltroUsuario]= useState("todos")
  const [filtroHU,      setFiltroHU]    = useState("todas")
  const [pagina,        setPagina]      = useState(1)

  // ── Aplanar todos los eventos con contexto de HU ──────
  const todos: EventoGlobal[] = useMemo(() => {
    const result: EventoGlobal[] = []
    for (const hu of historias) {
      for (const ev of hu.historial) {
        result.push({ ...ev, huId: hu.id, huCodigo: hu.codigo, huTitulo: hu.titulo })
      }
    }
    return result.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [historias])

  // ── Valores únicos para selects ───────────────────────
  const usuarios = useMemo(() =>
    ["todos", ...Array.from(new Set(todos.map(e => e.usuario))).sort()],
  [todos])

  const tiposUsados = useMemo(() =>
    Array.from(new Set(todos.map(e => e.tipo))).sort() as TipoEvento[],
  [todos])

  // ── Filtrado ──────────────────────────────────────────
  const filtrados = useMemo(() => todos.filter(ev => {
    if (filtroTipo    !== "todos"  && ev.tipo    !== filtroTipo)    return false
    if (filtroUsuario !== "todos"  && ev.usuario !== filtroUsuario) return false
    if (filtroHU      !== "todas"  && ev.huId    !== filtroHU)      return false
    if (buscar) {
      const q = buscar.toLowerCase()
      return (
        ev.descripcion.toLowerCase().includes(q) ||
        ev.usuario.toLowerCase().includes(q) ||
        ev.huTitulo.toLowerCase().includes(q) ||
        ev.huCodigo.toLowerCase().includes(q)
      )
    }
    return true
  }), [todos, filtroTipo, filtroUsuario, filtroHU, buscar])

  useEffect(() => setPagina(1), [filtroTipo, filtroUsuario, filtroHU, buscar])

  const enPagina = useMemo(
    () => filtrados.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE),
    [filtrados, pagina]
  )

  const selectStyle = {
    height: 32, fontSize: 12, paddingLeft: 8, paddingRight: 24,
    border: "1px solid var(--border)", borderRadius: 6, background: "var(--card)",
    color: "var(--foreground)", cursor: "pointer", outline: "none", appearance: "none" as const,
  }

  const exportarPDF = () => {
    const fecha = new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })
    const filas = filtrados.map(ev => `
      <tr>
        <td>${fmtCorto(new Date(ev.fecha))}<br/><span class="sub">${fmtHora(new Date(ev.fecha))}</span></td>
        <td><span class="badge">${esc(getEventoCfg(ev.tipo).label)}</span></td>
        <td>${esc(ev.descripcion)}</td>
        <td>${esc(ev.usuario)}</td>
        <td><strong>${esc(ev.huCodigo)}</strong><br/><span class="sub">${esc(ev.huTitulo)}</span></td>
      </tr>`).join("")
    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/>
      <title>Auditoría ${fecha}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:24px}
        h1{font-size:16px;margin-bottom:4px}
        .meta{font-size:11px;color:#666;margin-bottom:16px}
        table{width:100%;border-collapse:collapse}
        th{background:#1e293b;color:#fff;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
        td{padding:6px 8px;border-bottom:1px solid #e2e8f0;vertical-align:top}
        tr:nth-child(even) td{background:#f8fafc}
        .badge{display:inline-block;font-size:9px;font-weight:700;padding:2px 7px;border-radius:999px;background:#e0e7ff;color:#3730a3}
        .sub{font-size:10px;color:#64748b}
        @media print{body{padding:0}@page{margin:12mm}}
      </style></head><body>
      <h1>Historial de Auditoría</h1>
      <p class="meta">Generado el ${fecha} · ${filtrados.length} evento${filtrados.length !== 1 ? "s" : ""}</p>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Usuario</th><th>Historia</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
      </body></html>`
    const w = window.open("", "_blank", "width=900,height=700")
    if (w) { w.document.write(html); w.document.close() }
  }

  const exportarCSV = () => {
    const headers = ["Fecha", "Hora", "Tipo de Evento", "Descripción", "Usuario", "HU Código", "HU Título"]
    const rows = filtrados.map(ev => [
      fmtCorto(new Date(ev.fecha)),
      fmtHora(new Date(ev.fecha)),
      getEventoCfg(ev.tipo).label,
      ev.descripcion,
      ev.usuario,
      ev.huCodigo,
      ev.huTitulo,
    ])
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const lines = [headers, ...rows].map(r => r.map(escape).join(","))
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

      {/* ── Encabezado ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:"color-mix(in oklch, var(--primary) 12%, transparent)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <History size={18} style={{ color:"var(--primary)" }} />
          </div>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:"var(--foreground)", margin:0 }}>Historial de Auditoría</h2>
            <p style={{ fontSize:12, color:"var(--muted-foreground)", margin:0 }}>
              {todos.length} evento{todos.length !== 1 ? "s" : ""} registrado{todos.length !== 1 ? "s" : ""}
              {filtrados.length !== todos.length && ` · ${filtrados.length} mostrado${filtrados.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
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

      {/* ── Barra de búsqueda + filtros ── */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
        {/* Búsqueda */}
        <div style={{ position:"relative", flex:"1 1 200px", minWidth:180 }}>
          <Search size={13} style={{ position:"absolute", left:9, top:"50%", transform:"translateY(-50%)", color:"var(--muted-foreground)", pointerEvents:"none" }} />
          <Input
            placeholder="Buscar por descripción, usuario, HU…"
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            style={{ paddingLeft:30, height:32, fontSize:12 }}
          />
        </div>

        {/* Tipo de evento */}
        <div style={{ position:"relative" }}>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as TipoEvento | "todos")} style={selectStyle}>
            <option value="todos">Todos los eventos</option>
            {tiposUsados.map(t => (
              <option key={t} value={t}>{getEventoCfg(t).label}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted-foreground)" }} />
        </div>

        {/* Usuario */}
        <div style={{ position:"relative" }}>
          <User2 size={12} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted-foreground)" }} />
          <select value={filtroUsuario} onChange={e => setFiltroUsuario(e.target.value)} style={{ ...selectStyle, paddingLeft:24 }}>
            {usuarios.map(u => (
              <option key={u} value={u}>{u === "todos" ? "Todos los usuarios" : u}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted-foreground)" }} />
        </div>

        {/* HU */}
        <div style={{ position:"relative" }}>
          <BookOpen size={12} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted-foreground)" }} />
          <select value={filtroHU} onChange={e => setFiltroHU(e.target.value)} style={{ ...selectStyle, paddingLeft:24, maxWidth:220 }}>
            <option value="todas">Todas las HUs</option>
            {historias.map(h => (
              <option key={h.id} value={h.id}>{h.codigo} – {h.titulo.slice(0, 40)}{h.titulo.length > 40 ? "…" : ""}</option>
            ))}
          </select>
          <ChevronDown size={12} style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", pointerEvents:"none", color:"var(--muted-foreground)" }} />
        </div>

        {/* Limpiar filtros */}
        {(filtroTipo !== "todos" || filtroUsuario !== "todos" || filtroHU !== "todas" || buscar) && (
          <button
            onClick={() => { setFiltroTipo("todos"); setFiltroUsuario("todos"); setFiltroHU("todas"); setBuscar("") }}
            style={{ height:32, fontSize:12, padding:"0 10px", borderRadius:6, border:"1px solid var(--border)", background:"none", color:"var(--muted-foreground)", cursor:"pointer" }}
          >
            Limpiar
          </button>
        )}
      </div>

      {/* ── Lista de eventos ── */}
      {filtrados.length === 0 ? (
        <div style={{ textAlign:"center", padding:"40px 16px", color:"var(--muted-foreground)" }}>
          <History size={32} style={{ opacity:0.3, margin:"0 auto 10px" }} />
          <p style={{ fontSize:13 }}>No hay eventos que coincidan con los filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
        <div style={{ display:"flex", flexDirection:"column", gap:0, border:"1px solid var(--border)", borderRadius:10, overflow:"hidden", minWidth: 490 }}>
          {/* Cabecera de tabla */}
          <div style={{
            display:"grid", gridTemplateColumns:"130px 1fr 120px 140px",
            gap:0, padding:"6px 14px",
            background:"var(--muted)", borderBottom:"1px solid var(--border)",
            fontSize:11, fontWeight:600, color:"var(--muted-foreground)", textTransform:"uppercase", letterSpacing:"0.04em",
          }}>
            <span>Fecha</span>
            <span>Descripción</span>
            <span>Usuario</span>
            <span>Historia</span>
          </div>

          {enPagina.map((ev, idx) => {
            const cfg = getEventoCfg(ev.tipo)
            const isEven = idx % 2 === 1
            const hu = historias.find(h => h.id === ev.huId)
            return (
              <div
                key={ev.id}
                style={{
                  display:"grid", gridTemplateColumns:"130px 1fr 120px 140px",
                  gap:0, padding:"9px 0px 9px 0",
                  background: isEven ? "color-mix(in oklch, var(--muted) 30%, transparent)" : "var(--card)",
                  borderBottom:"1px solid var(--border)",
                  alignItems:"start",
                  borderLeft:`3px solid ${cfg.color}`,
                }}
              >
                {/* Fecha */}
                <div style={{ paddingLeft:11, display:"flex", flexDirection:"column", gap:1 }}>
                  <span style={{ fontSize:11, fontWeight:600, color:"var(--foreground)" }}>{fmtCorto(new Date(ev.fecha))}</span>
                  <span style={{ fontSize:11, color:"var(--muted-foreground)" }}>{fmtHora(new Date(ev.fecha))}</span>
                </div>

                {/* Descripción + badge tipo */}
                <div style={{ display:"flex", flexDirection:"column", gap:4, paddingRight:12 }}>
                  <span style={{ fontSize:12, color:"var(--foreground)", lineHeight:1.4 }}>{ev.descripcion}</span>
                  <span style={{
                    display:"inline-flex", alignItems:"center", alignSelf:"flex-start",
                    fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:999,
                    background:`color-mix(in oklch, ${cfg.color} 14%, transparent)`,
                    color: cfg.color, border:`1px solid color-mix(in oklch, ${cfg.color} 30%, transparent)`,
                  }}>
                    {cfg.label}
                  </span>
                </div>

                {/* Usuario */}
                <div style={{ fontSize:11, color:"var(--muted-foreground)", paddingRight:8 }}>
                  {ev.usuario}
                </div>

                {/* HU */}
                <div style={{ paddingRight:12 }}>
                  {hu && onVerHU ? (
                    <button
                      onClick={() => onVerHU(hu)}
                      title={hu.titulo}
                      style={{ background:"none", border:"none", padding:0, cursor:"pointer", textAlign:"left" }}
                    >
                      <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:999, background:"color-mix(in oklch, var(--primary) 12%, transparent)", color:"var(--primary)", border:"1px solid color-mix(in oklch, var(--primary) 25%, transparent)" }}>
                        {ev.huCodigo}
                      </span>
                      <span style={{ display:"block", fontSize:10, color:"var(--muted-foreground)", marginTop:2, maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {ev.huTitulo}
                      </span>
                    </button>
                  ) : (
                    <span style={{ fontSize:10, fontWeight:700, padding:"2px 7px", borderRadius:999, background:"color-mix(in oklch, var(--primary) 12%, transparent)", color:"var(--primary)", border:"1px solid color-mix(in oklch, var(--primary) 25%, transparent)" }}>
                      {ev.huCodigo}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}

      <Paginador pagina={pagina} total={filtrados.length} pageSize={PAGE_SIZE} onCambiar={setPagina} />
    </div>
  )
}
