"use client"

import { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { AlertTriangle, CheckCircle, Clock, User, Zap, BarChart2 } from "lucide-react"
import {
  calcularCriticidad, calcularEsfuerzo, calcularFechaFinEstimada,
  TIPO_TAREA_LABEL,
  type Tarea, type Observacion,
} from "@/lib/types"

interface CargaOcupacionalProps {
  tareas: Tarea[]
  observaciones?: Observacion[]
}

type NivelCarga = "disponible" | "normal" | "alto" | "saturado"

interface PersonaCarga {
  nombre: string
  tareasTotal: number
  tareasActivas: number
  tareasCompletadas: number
  tareasBloqueadas: number
  horasTotales: number
  horasActivas: number
  nivelCarga: NivelCarga
  porcentajeCarga: number
  tareasCriticasAlta: number
  tiposUnicos: string[]
  proximaFechaFin: Date | null
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

export function CargaOcupacional({ tareas, observaciones = [] }: CargaOcupacionalProps) {
  const personas: PersonaCarga[] = useMemo(() => {
    const mapa = new Map<string, Tarea[]>()
    tareas.forEach(t => {
      if (!t.asignado) return
      if (!mapa.has(t.asignado)) mapa.set(t.asignado, [])
      mapa.get(t.asignado)!.push(t)
    })

    return Array.from(mapa.entries()).map(([nombre, tareasP]) => {
      const activas    = tareasP.filter(t => t.estado === "en_progreso" || t.estado === "pendiente")
      const completadas = tareasP.filter(t => t.estado === "completada")
      const bloqueadas  = tareasP.filter(t => t.estado === "bloqueada")
      const criticas    = tareasP.filter(t => calcularCriticidad(t) === "alta")
      const tiposUnicos = [...new Set(tareasP.map(t => t.tipo))]

      // Próxima fecha fin entre tareas activas
      const fechasActivas = activas
        .map(t => calcularFechaFinEstimada(t, observaciones))
        .sort((a,b) => a.getTime()-b.getTime())
      const proximaFechaFin = fechasActivas[0] || null

      const horasTotales = tareasP.reduce((s,t) => s+t.horasEstimadas, 0)
      const horasActivas = activas.reduce((s,t) => s+t.horasEstimadas, 0)

      return {
        nombre,
        tareasTotal: tareasP.length,
        tareasActivas: activas.length,
        tareasCompletadas: completadas.length,
        tareasBloqueadas: bloqueadas.length,
        horasTotales, horasActivas,
        nivelCarga: nivelCarga(activas.length),
        porcentajeCarga: porcentajeCarga(activas.length),
        tareasCriticasAlta: criticas.length,
        tiposUnicos,
        proximaFechaFin,
      }
    }).sort((a,b) => b.tareasActivas - a.tareasActivas)
  }, [tareas, observaciones])

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
        <p>Sin tareas asignadas para mostrar carga</p>
      </div>
    )
  }

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
                {["Recurso","Nivel","Activas","Completadas","Bloqueadas","Horas activas","Crit. Alta","Próx. entrega","Tipos de tarea"].map(h => (
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
                    {/* Horas activas */}
                    <td style={{ padding:"10px 10px" }}>
                      <p style={{ fontFamily:"monospace", fontWeight:600, color:"var(--foreground)" }}>{p.horasActivas}h</p>
                      <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>{p.horasTotales}h total</p>
                    </td>
                    {/* Criticidad alta */}
                    <td style={{ padding:"10px 10px", textAlign:"center" }}>
                      {p.tareasCriticasAlta > 0
                        ? <span style={{ fontSize:14, fontWeight:700, color:"var(--chart-4)" }}>{p.tareasCriticasAlta}</span>
                        : <span style={{ color:"var(--muted-foreground)" }}>—</span>}
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
                        {p.tiposUnicos.slice(0,3).map(tipo => (
                          <Badge key={tipo} variant="outline" className="text-[9px]" style={{ padding:"1px 5px" }}>
                            {TIPO_TAREA_LABEL[tipo as keyof typeof TIPO_TAREA_LABEL]}
                          </Badge>
                        ))}
                        {p.tiposUnicos.length>3 && <Badge variant="outline" className="text-[9px]">+{p.tiposUnicos.length-3}</Badge>}
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
