"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { AlertTriangle, CheckCircle, Clock, User, BarChart2 } from "lucide-react"
import {
  TIPO_TAREA_LABEL, calcularFechaFinEstimada,
  type Tarea, type CasoPrueba, type HistoriaUsuario,
} from "@/lib/types"

interface CargaOcupacionalProps {
  tareas: Tarea[]
  casos: CasoPrueba[]
  historias: HistoriaUsuario[]
  currentUserName?: string
  isQA?: boolean
}

type NivelCarga = "disponible" | "normal" | "alto" | "saturado"

interface PersonaCarga {
  nombre: string
  husAsignadas: number
  casosTotal: number
  casosAprobados: number
  tareasTotal: number
  tareasActivas: number
  tareasCompletadas: number
  tareasBloqueadas: number
  horasTotales: number
  horasActivas: number
  nivelCarga: NivelCarga
  porcentajeCarga: number
  proximaFechaFin: Date | null
  tiposTarea: string[]
}

function nivelCarga(activas: number): NivelCarga {
  if (activas <= 2) return "disponible"
  if (activas <= 4) return "normal"
  if (activas <= 6) return "alto"
  return "saturado"
}
function porcentajeCarga(activas: number): number {
  return Math.min(Math.round((activas / 6) * 100), 100)
}

const NIVEL_CFG: Record<NivelCarga, { label: string; color: string; bg: string; barColor: string }> = {
  disponible: { label:"Disponible", color:"var(--chart-2)",  bg:"color-mix(in oklch,var(--chart-2) 12%,transparent)",  barColor:"#22c55e" },
  normal:     { label:"Normal",     color:"var(--primary)",  bg:"color-mix(in oklch,var(--primary) 12%,transparent)",  barColor:"#3b82f6" },
  alto:       { label:"Alto",       color:"var(--chart-3)",  bg:"color-mix(in oklch,var(--chart-3) 12%,transparent)",  barColor:"#f59e0b" },
  saturado:   { label:"Saturado",   color:"var(--chart-4)",  bg:"color-mix(in oklch,var(--chart-4) 12%,transparent)",  barColor:"#ef4444" },
}

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
function fmt(d: Date) { return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]}` }

export function CargaOcupacional({ tareas, casos, historias, currentUserName, isQA }: CargaOcupacionalProps) {
  const historiasVistas = isQA && currentUserName
    ? historias.filter(h => h.responsable.toLowerCase() === currentUserName.toLowerCase())
    : historias

  const personas: PersonaCarga[] = useMemo(() => {
    // Agrupar por responsable de HU
    const mapa = new Map<string, { hus: HistoriaUsuario[]; casos: CasoPrueba[]; tareas: Tarea[] }>()

    historiasVistas.forEach(hu => {
      if (!hu.responsable) return
      if (!mapa.has(hu.responsable)) mapa.set(hu.responsable, { hus: [], casos: [], tareas: [] })
      const entry = mapa.get(hu.responsable)!
      entry.hus.push(hu)

      const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
      entry.casos.push(...casosHU)

      const tareasHU = tareas.filter(t => t.huId === hu.id)
      entry.tareas.push(...tareasHU)
    })

    return Array.from(mapa.entries()).map(([nombre, data]) => {
      const activas     = data.tareas.filter(t => t.estado === "en_progreso" || t.estado === "pendiente")
      const completadas = data.tareas.filter(t => t.estado === "completada")
      const bloqueadas  = data.tareas.filter(t => t.estado === "bloqueada")
      const tiposTarea  = [...new Set(data.tareas.map(t => t.tipo))]

      const casosAprobados = data.casos.filter(c => c.estadoAprobacion === "aprobado")

      // Próxima fecha fin entre HUs activas
      const husActivas = data.hus.filter(h => h.estado === "en_progreso")
      const fechas = husActivas
        .map(h => calcularFechaFinEstimada(h, casos))
        .sort((a,b) => a.getTime()-b.getTime())
      const proximaFechaFin = fechas[0] || null

      const horasTotales = data.casos.reduce((s,c) => s+c.horasEstimadas, 0)
      const horasActivas = data.casos
        .filter(c => c.resultadosPorEtapa.some(r => r.estado === "en_ejecucion"))
        .reduce((s,c) => s+c.horasEstimadas, 0)

      return {
        nombre,
        husAsignadas: data.hus.length,
        casosTotal: data.casos.length,
        casosAprobados: casosAprobados.length,
        tareasTotal: data.tareas.length,
        tareasActivas: activas.length,
        tareasCompletadas: completadas.length,
        tareasBloqueadas: bloqueadas.length,
        horasTotales, horasActivas,
        nivelCarga: nivelCarga(activas.length),
        porcentajeCarga: porcentajeCarga(activas.length),
        proximaFechaFin,
        tiposTarea,
      }
    }).sort((a,b) => b.tareasActivas - a.tareasActivas)
  }, [tareas, casos, historiasVistas])

  const chartData = personas.map(p => ({
    nombre: p.nombre.split(" ")[0],
    activas: p.tareasActivas,
    completadas: p.tareasCompletadas,
    bloqueadas: p.tareasBloqueadas,
    horas: p.horasActivas,
  }))

  const totalActivas     = personas.reduce((s,p) => s+p.tareasActivas, 0)
  const totalCompletadas = personas.reduce((s,p) => s+p.tareasCompletadas, 0)
  const saturados        = personas.filter(p => p.nivelCarga === "saturado").length
  const disponibles      = personas.filter(p => p.nivelCarga === "disponible").length

  if (personas.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:48, color:"var(--muted-foreground)" }}>
        <BarChart2 size={32} style={{ margin:"0 auto 12px", opacity:0.4 }}/>
        <p>{isQA && currentUserName ? `Sin HUs asignadas a ${currentUserName}` : "Sin HUs asignadas para mostrar carga"}</p>
      </div>
    )
  }

  // ── Vista personal (rol QA) ──
  if (isQA && personas.length > 0) {
    const p = personas[0]
    const ncfg = NIVEL_CFG[p.nivelCarga]
    const husActivas = historiasVistas.filter(h => h.estado === "en_progreso")
    const totalCasosAprobados = p.casosAprobados
    const pct = p.tareasTotal > 0 ? Math.round((p.tareasCompletadas / p.tareasTotal) * 100) : 0

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:16, maxWidth:720, margin:"0 auto" }}>

        {/* Tarjeta hero personal */}
        <div style={{ padding:"20px 24px", borderRadius:14, border:`1px solid ${ncfg.color}`, background:ncfg.bg, display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ width:52, height:52, borderRadius:"50%", background:ncfg.color, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <User size={22} style={{ color:"#fff" }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:ncfg.color, fontWeight:700, marginBottom:2 }}>Tu carga de trabajo</p>
            <p style={{ fontSize:18, fontWeight:700, color:"var(--foreground)", marginBottom:6 }}>{p.nombre}</p>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <Progress value={p.porcentajeCarga} className="h-2" style={{ flex:1, background:`color-mix(in oklch, ${ncfg.color} 20%, transparent)` }}/>
              <span style={{ fontSize:12, fontWeight:700, color:ncfg.color, flexShrink:0 }}>{p.porcentajeCarga}%</span>
            </div>
          </div>
          <div style={{ textAlign:"center", flexShrink:0 }}>
            <span style={{ display:"inline-block", padding:"4px 14px", borderRadius:8, fontSize:12, fontWeight:700, background:`color-mix(in oklch, ${ncfg.color} 20%, transparent)`, color:ncfg.color, border:`1px solid ${ncfg.color}` }}>
              {ncfg.label}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
          {[
            { label:"HUs Asignadas", value:p.husAsignadas, sub:`${husActivas.length} en progreso`, color:"var(--primary)", icon:<User size={15}/> },
            { label:"Casos de Prueba", value:p.casosTotal, sub:`${totalCasosAprobados} aprobados`, color:"var(--chart-1)", icon:<CheckCircle size={15}/> },
            { label:"Tareas Activas", value:p.tareasActivas, sub:"en progreso o pendientes", color:ncfg.color, icon:<Clock size={15}/> },
          ].map((m,i) => (
            <div key={i} style={{ padding:"16px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted-foreground)", fontWeight:700 }}>{m.label}</p>
                <div style={{ color:m.color, opacity:0.6 }}>{m.icon}</div>
              </div>
              <p style={{ fontSize:30, fontWeight:700, color:m.color, lineHeight:1, marginBottom:4 }}>{m.value}</p>
              <p style={{ fontSize:11, color:"var(--muted-foreground)" }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Progreso de tareas */}
        <div style={{ padding:"18px 20px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--foreground)", marginBottom:14 }}>Progreso de tareas</p>
          <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:11, color:"var(--muted-foreground)" }}>Completadas</span>
                <span style={{ fontSize:11, fontWeight:700, color:"var(--foreground)" }}>{p.tareasCompletadas} / {p.tareasTotal}</span>
              </div>
              <Progress value={pct} className="h-2.5" style={{ background:"var(--secondary)" }}/>
            </div>
            <p style={{ fontSize:22, fontWeight:700, color:"var(--chart-2)", flexShrink:0 }}>{pct}%</p>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            {[
              { label:"Completadas", value:p.tareasCompletadas, color:"var(--chart-2)" },
              { label:"Activas", value:p.tareasActivas, color:ncfg.color },
              { label:"Bloqueadas", value:p.tareasBloqueadas, color:"var(--chart-4)" },
            ].map((s,i) => (
              <div key={i} style={{ flex:1, padding:"10px 14px", borderRadius:8, border:"1px solid var(--border)", textAlign:"center" }}>
                <p style={{ fontSize:20, fontWeight:700, color:s.color, lineHeight:1, marginBottom:3 }}>{s.value}</p>
                <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Horas + próxima entrega + tipos */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div style={{ padding:"16px 18px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)" }}>
            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted-foreground)", fontWeight:700, marginBottom:10 }}>Horas estimadas</p>
            <p style={{ fontSize:28, fontWeight:700, color:"var(--foreground)", lineHeight:1 }}>{p.horasTotales}<span style={{ fontSize:14, fontWeight:400, color:"var(--muted-foreground)" }}>h</span></p>
            <p style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:4 }}>{p.horasActivas}h en ejecución activa</p>
          </div>
          <div style={{ padding:"16px 18px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)" }}>
            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted-foreground)", fontWeight:700, marginBottom:10 }}>Próxima entrega</p>
            {p.proximaFechaFin ? (() => {
              const dias = Math.ceil((p.proximaFechaFin.getTime()-Date.now())/86400000)
              const color = dias<=2?"var(--chart-4)":dias<=5?"var(--chart-3)":"var(--chart-2)"
              return (
                <>
                  <p style={{ fontSize:22, fontWeight:700, color:"var(--foreground)", lineHeight:1, marginBottom:4 }}>{fmt(p.proximaFechaFin)}</p>
                  <p style={{ fontSize:12, fontWeight:600, color }}>{dias<=0?"Vencido":dias===1?"Mañana":`En ${dias} día${dias!==1?"s":""}`}</p>
                </>
              )
            })() : <p style={{ fontSize:13, color:"var(--muted-foreground)", fontStyle:"italic", marginTop:6 }}>Sin entregas programadas</p>}
          </div>
        </div>

        {/* Tipos de tarea */}
        {p.tiposTarea.length > 0 && (
          <div style={{ padding:"14px 18px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted-foreground)", fontWeight:700 }}>Tipos de tarea</p>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {p.tiposTarea.map(tipo => (
                <Badge key={tipo} variant="outline" style={{ fontSize:11, padding:"2px 10px" }}>
                  {TIPO_TAREA_LABEL[tipo as keyof typeof TIPO_TAREA_LABEL]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Vista general (admin / viewer) ──
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

      {/* ── Resumen ejecutivo ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Recursos", value:personas.length, sub:"personas asignadas", icon:<User size={16}/>, color:"var(--primary)" },
          { label:"Tareas Activas", value:totalActivas, sub:"en progreso o pendientes", icon:<Clock size={16}/>, color:"var(--chart-1)" },
          { label:"Completadas", value:totalCompletadas, sub:"finalizadas", icon:<CheckCircle size={16}/>, color:"var(--chart-2)" },
          { label:"Saturados", value:saturados, sub:`${disponibles} disponibles`, icon:<AlertTriangle size={16}/>, color:saturados>0?"var(--chart-4)":"var(--chart-2)" },
        ].map((m,i) => (
          <div key={i} style={{ padding:"14px 16px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--muted-foreground)", marginBottom:6 }}>{m.label}</p>
                <p style={{ fontSize:28, fontWeight:700, color:m.color, lineHeight:1 }}>{m.value}</p>
                <p style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:4 }}>{m.sub}</p>
              </div>
              <div style={{ color:m.color, opacity:0.6 }}>{m.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Gráfica de barras ── */}
      <div style={{ padding:"18px 20px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)" }}>
        <p style={{ fontSize:13, fontWeight:700, color:"var(--foreground)", marginBottom:16 }}>Tareas activas por persona</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top:0, right:8, left:-16, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
            <XAxis dataKey="nombre" tick={{ fontSize:11, fill:"var(--muted-foreground)" }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fontSize:11, fill:"var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false}/>
            <Tooltip
              contentStyle={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:8, fontSize:12 }}
              labelStyle={{ color:"var(--foreground)", fontWeight:600 }}
              formatter={(v: number, name: string) => [v, name === "activas" ? "Activas" : name === "completadas" ? "Completadas" : "Bloqueadas"]}
            />
            <Bar dataKey="activas" radius={[4,4,0,0]}>
              {chartData.map((d,i) => {
                const nivel = nivelCarga(d.activas)
                return <Cell key={i} fill={NIVEL_CFG[nivel].barColor}/>
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Tabla de carga por persona ── */}
      <div style={{ padding:"16px 20px", borderRadius:12, border:"1px solid var(--border)", background:"var(--card)" }}>
        <p style={{ fontSize:13, fontWeight:700, color:"var(--foreground)", marginBottom:14 }}>Detalle por recurso</p>
        <div style={{ overflow:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {["Recurso","Nivel","HUs","Casos","Activas","Completadas","Bloqueadas","Horas","Próx. entrega","Tipos de tarea"].map(h => (
                  <th key={h} style={{ padding:"8px 10px", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", color:"var(--muted-foreground)", textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personas.map(p => {
                const ncfg = NIVEL_CFG[p.nivelCarga]
                return (
                  <tr key={p.nombre} style={{ borderBottom:"1px solid var(--border)" }} className="hover:bg-secondary/30">
                    {/* Recurso */}
                    <td style={{ padding:"10px 10px" }}>
                      <p style={{ fontWeight:600, color:"var(--foreground)" }}>{p.nombre}</p>
                      <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{p.tareasTotal} tarea(s) total</p>
                    </td>
                    {/* Nivel */}
                    <td style={{ padding:"10px 10px" }}>
                      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:6, fontSize:10, fontWeight:700, background:ncfg.bg, color:ncfg.color, width:"fit-content" }}>
                          {ncfg.label}
                        </span>
                        <Progress value={p.porcentajeCarga} className="h-1.5 w-24"
                          style={{ background:`color-mix(in oklch, ${ncfg.color} 20%, transparent)` }}/>
                        <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{p.porcentajeCarga}% capacidad</p>
                      </div>
                    </td>
                    {/* HUs */}
                    <td style={{ padding:"10px 10px", textAlign:"center" }}>
                      <span style={{ fontSize:16, fontWeight:700, color:"var(--primary)" }}>{p.husAsignadas}</span>
                    </td>
                    {/* Casos */}
                    <td style={{ padding:"10px 10px", textAlign:"center" }}>
                      <span style={{ fontSize:16, fontWeight:700, color:"var(--foreground)" }}>{p.casosTotal}</span>
                      <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{p.casosAprobados} aprob.</p>
                    </td>
                    {/* Activas */}
                    <td style={{ padding:"10px 10px", textAlign:"center" }}>
                      <span style={{ fontSize:16, fontWeight:700, color:ncfg.color }}>{p.tareasActivas}</span>
                    </td>
                    {/* Completadas */}
                    <td style={{ padding:"10px 10px", textAlign:"center" }}>
                      <span style={{ fontSize:16, fontWeight:700, color:"var(--chart-2)" }}>{p.tareasCompletadas}</span>
                    </td>
                    {/* Bloqueadas */}
                    <td style={{ padding:"10px 10px", textAlign:"center" }}>
                      <span style={{ fontSize:16, fontWeight:700, color:p.tareasBloqueadas>0?"var(--chart-4)":"var(--muted-foreground)" }}>{p.tareasBloqueadas}</span>
                    </td>
                    {/* Horas */}
                    <td style={{ padding:"10px 10px" }}>
                      <p style={{ fontFamily:"monospace", fontWeight:600, color:"var(--foreground)" }}>{p.horasActivas}h</p>
                      <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{p.horasTotales}h total</p>
                    </td>
                    {/* Próxima entrega */}
                    <td style={{ padding:"10px 10px" }}>
                      {p.proximaFechaFin
                        ? <div>
                            <p style={{ fontSize:12, fontWeight:600, color:"var(--foreground)" }}>{fmt(p.proximaFechaFin)}</p>
                            {(() => {
                              const dias = Math.ceil((p.proximaFechaFin.getTime()-Date.now())/86400000)
                              const color = dias<=2?"var(--chart-4)":dias<=5?"var(--chart-3)":"var(--chart-2)"
                              return <p style={{ fontSize:10, color }}>{dias<=0?"Vencido":dias===1?"Mañana":`En ${dias}d`}</p>
                            })()}
                          </div>
                        : <span style={{ color:"var(--muted-foreground)" }}>—</span>}
                    </td>
                    {/* Tipos */}
                    <td style={{ padding:"10px 10px" }}>
                      <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                        {p.tiposTarea.slice(0,3).map(tipo => (
                          <Badge key={tipo} variant="outline" className="text-[9px]" style={{ padding:"1px 5px" }}>
                            {TIPO_TAREA_LABEL[tipo as keyof typeof TIPO_TAREA_LABEL]}
                          </Badge>
                        ))}
                        {p.tiposTarea.length>3 && <Badge variant="outline" className="text-[9px]">+{p.tiposTarea.length-3}</Badge>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
