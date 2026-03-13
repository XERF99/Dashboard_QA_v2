"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { HistoriasTable } from "@/components/dashboard/historias-table"
import { HistoriaUsuarioDetail } from "@/components/dashboard/historia-usuario-detail"
import { HUForm } from "@/components/dashboard/hu-form"
import { CargaOcupacional } from "@/components/dashboard/carga-ocupacional"
import { UserManagement } from "@/components/dashboard/user-management"
import { HUStatsCards } from "@/components/dashboard/hu-stats-cards"
import { LoginScreen } from "@/components/auth/login-screen"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, UserCog, Trash2, X, CheckCircle, LogOut, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  historiasEjemplo, casosPruebaEjemplo, tareasEjemplo,
  crearEvento, etapasParaTipo, siguienteEtapa, etapaCompletada,
  type HistoriaUsuario, type CasoPrueba, type Tarea, type Bloqueo,
  type EtapaEjecucion, type EstadoAprobacion,
} from "@/lib/types"

// ── Toast ──────────────────────────────────────────────────
type ToastType = "success" | "warning" | "error" | "info"
interface ToastItem { id: number; type: ToastType; title: string; desc?: string }
let _tc = 0

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss:(id:number)=>void }) {
  if (!toasts.length) return null
  const cfg: Record<ToastType,{border:string;icon:React.ReactNode}> = {
    success: { border:"var(--chart-2)", icon:<CheckCircle size={15} style={{ color:"var(--chart-2)", flexShrink:0 }}/> },
    warning: { border:"var(--chart-3)", icon:<AlertTriangle size={15} style={{ color:"var(--chart-3)", flexShrink:0 }}/> },
    error:   { border:"var(--chart-4)", icon:<Trash2 size={15} style={{ color:"var(--chart-4)", flexShrink:0 }}/> },
    info:    { border:"var(--primary)",  icon:<LogOut size={15} style={{ color:"var(--primary)", flexShrink:0 }}/> },
  }
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:200, display:"flex", flexDirection:"column", gap:10, maxWidth:340 }}>
      {toasts.map(t => {
        const c = cfg[t.type]
        return (
          <div key={t.id} style={{ display:"flex", alignItems:"flex-start", gap:12, padding:"13px 15px",
            background:"var(--card)", border:"1px solid var(--border)",
            borderLeft:`4px solid ${c.border}`, borderRadius:12, boxShadow:"0 8px 32px rgba(0,0,0,0.18)" }}>
            {c.icon}
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)" }}>{t.title}</p>
              {t.desc && <p style={{ fontSize:12, color:"var(--muted-foreground)", marginTop:2 }}>{t.desc}</p>}
            </div>
            <button onClick={()=>onDismiss(t.id)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted-foreground)", padding:2 }}>
              <X size={13}/>
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ── Modal confirmación eliminar ────────────────────────────
function ConfirmDeleteModal({ open, titulo, subtitulo, onConfirm, onCancel }: {
  open:boolean; titulo:string; subtitulo?:string; onConfirm:()=>void; onCancel:()=>void
}) {
  if (!open) return null
  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:14, maxWidth:400, width:"calc(100% - 32px)", boxShadow:"0 20px 60px rgba(0,0,0,0.25)", overflow:"hidden" }}>
        <div style={{ height:4, background:"var(--chart-4)" }}/>
        <div style={{ padding:"20px 22px 18px" }}>
          <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
            <div style={{ width:38, height:38, borderRadius:"50%", background:"color-mix(in oklch, var(--chart-4) 12%, transparent)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Trash2 size={16} style={{ color:"var(--chart-4)" }}/>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:"var(--foreground)" }}>{titulo}</p>
              {subtitulo && <p style={{ fontSize:12, color:"var(--muted-foreground)", marginTop:2 }}>{subtitulo}</p>}
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <Button variant="outline" onClick={onCancel}>Cancelar</Button>
            <Button onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 size={13} className="mr-1.5"/> Eliminar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { isAuthenticated, canManageUsers, verSoloPropios, isAdmin, isQA, user } = useAuth()

  const [historias, setHistorias]   = useState<HistoriaUsuario[]>(historiasEjemplo)
  const [casos, setCasos]           = useState<CasoPrueba[]>(casosPruebaEjemplo)
  const [tareas, setTareas]         = useState<Tarea[]>(tareasEjemplo)

  const [busqueda, setBusqueda]             = useState("")
  const [huFormOpen, setHuFormOpen]         = useState(false)
  const [huDetailOpen, setHuDetailOpen]     = useState(false)
  const [huSeleccionada, setHuSeleccionada] = useState<HistoriaUsuario | null>(null)
  const [huEditar, setHuEditar]             = useState<HistoriaUsuario | null>(null)
  const [deleteModal, setDeleteModal]       = useState<{ open:boolean; titulo:string; subtitulo?:string; fn:()=>void }>({ open:false, titulo:"", fn:()=>{} })

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const addToast = (t: Omit<ToastItem,"id">) => {
    const id = ++_tc
    setToasts(p => [...p, { ...t, id }])
    setTimeout(() => setToasts(p => p.filter(x => x.id!==id)), 4500)
  }

  // ── Filtros por rol ──
  const historiasVisibles = historias.filter(hu => {
    if (verSoloPropios && user) {
      return hu.responsable.toLowerCase() === user.nombre.toLowerCase()
    }
    return true
  }).filter(hu =>
    !busqueda ||
    hu.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    hu.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    hu.responsable.toLowerCase().includes(busqueda.toLowerCase())
  )

  // ── CRUD HU (solo admin) ──
  const handleNuevaHU  = () => { setHuEditar(null); setHuFormOpen(true) }
  const handleEditarHU = (hu: HistoriaUsuario) => { setHuEditar(hu); setHuFormOpen(true) }

  const handleSubmitHU = (hu: HistoriaUsuario) => {
    setHistorias(prev => prev.find(h=>h.id===hu.id) ? prev.map(h=>h.id===hu.id?hu:h) : [...prev, hu])
    addToast({ type:"success", title:hu.titulo, desc: huEditar ? "Historia actualizada" : "Historia creada" })
  }

  const handleEliminarHU = (hu: HistoriaUsuario) => {
    setDeleteModal({
      open:true, titulo:"¿Eliminar Historia de Usuario?",
      subtitulo:`"${hu.titulo}" y sus ${hu.casosIds.length} caso(s) de prueba`,
      fn:() => {
        setHistorias(p => p.filter(h => h.id !== hu.id))
        setCasos(p => p.filter(c => c.huId !== hu.id))
        setTareas(p => p.filter(t => t.huId !== hu.id))
        setDeleteModal(d => ({...d, open:false}))
        addToast({ type:"error", title:"Historia eliminada", desc:hu.titulo })
      }
    })
  }

  // ── QA inicia HU ──
  const handleIniciarHU = (huId: string) => {
    setHistorias(prev => prev.map(h => {
      if (h.id !== huId || h.estado !== "sin_iniciar") return h
      const primeraEtapa = etapasParaTipo(h.tipoAplicacion)[0]
      return {
        ...h, estado: "en_progreso", etapa: primeraEtapa,
        historial: [...h.historial, crearEvento("hu_iniciada",
          `QA inició la historia — etapa: ${primeraEtapa.charAt(0).toUpperCase()+primeraEtapa.slice(1)}`,
          user?.nombre || "Sistema"
        )],
      }
    }))
    addToast({ type:"info", title:"HU iniciada", desc:"Etapa de despliegue activa" })
  }

  // ── Admin cancela HU ──
  const handleCancelarHU = (huId: string, motivo: string) => {
    setHistorias(prev => prev.map(h => {
      if (h.id !== huId) return h
      return { ...h, estado: "cancelada", etapa: "cambio_cancelado", motivoCancelacion: motivo, fechaCierre: new Date(),
        historial: [...h.historial, crearEvento("hu_cancelada", `HU cancelada: ${motivo}`, user?.nombre || "Sistema")],
      }
    }))
    addToast({ type:"error", title:"HU cancelada", desc:motivo.slice(0,60) })
  }

  // ── Casos de prueba ──
  const handleAddCaso = (caso: CasoPrueba) => {
    setCasos(prev => [...prev, caso])
    const updHU = (h: HistoriaUsuario) => h.id === caso.huId
      ? { ...h, casosIds: [...h.casosIds, caso.id],
          historial: [...h.historial, crearEvento("caso_creado", `Caso creado: ${caso.titulo}`, user?.nombre || "Sistema")] }
      : h
    setHistorias(p => p.map(updHU))
    setHuSeleccionada(p => p?.id === caso.huId ? updHU(p) : p)
    addToast({ type:"success", title:"Caso de prueba creado", desc:caso.titulo })
  }

  const handleEnviarAprobacion = (huId: string) => {
    setCasos(prev => prev.map(c =>
      c.huId === huId && c.estadoAprobacion === "borrador"
        ? { ...c, estadoAprobacion: "pendiente_aprobacion" as EstadoAprobacion } : c
    ))
    const ev = crearEvento("caso_enviado_aprobacion", "Casos enviados para aprobación", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"info", title:"Casos enviados", desc:"Pendientes de aprobación" })
  }

  const handleAprobarCasos = (huId: string) => {
    setCasos(prev => prev.map(c =>
      c.huId === huId && c.estadoAprobacion === "pendiente_aprobacion"
        ? { ...c, estadoAprobacion: "aprobado" as EstadoAprobacion, aprobadoPor: user?.nombre, fechaAprobacion: new Date() } : c
    ))
    const ev = crearEvento("caso_aprobado", `Casos aprobados por ${user?.nombre}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"success", title:"Casos aprobados" })
  }

  const handleRechazarCasos = (huId: string, motivo: string) => {
    setCasos(prev => prev.map(c =>
      c.huId === huId && c.estadoAprobacion === "pendiente_aprobacion"
        ? { ...c, estadoAprobacion: "rechazado" as EstadoAprobacion, motivoRechazo: motivo } : c
    ))
    const ev = crearEvento("caso_rechazado", `Casos rechazados: ${motivo}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"warning", title:"Casos rechazados", desc:motivo.slice(0,60) })
  }

  const handleCompletarCasoEtapa = (casoId: string, etapa: EtapaEjecucion, resultado: "exitoso" | "fallido", comentarioFallo?: string) => {
    let huIdAfectada = ""
    setCasos(prev => prev.map(c => {
      if (c.id !== casoId) return c
      huIdAfectada = c.huId
      return { ...c, resultadosPorEtapa: c.resultadosPorEtapa.map(r => {
        if (r.etapa !== etapa) return r
        const intento = {
          numero: (r.intentos?.length || 0) + 1,
          resultado,
          comentarioFallo: resultado === "fallido" ? comentarioFallo : undefined,
          fecha: new Date(),
          ejecutadoPor: user?.nombre || "Sistema",
        }
        return { ...r, estado: "completado" as const, resultado, fechaFin: new Date(), intentos: [...(r.intentos || []), intento] }
      })}
    }))

    // Verificar avance de etapa
    setTimeout(() => {
      if (!huIdAfectada) return
      const hu = historias.find(h => h.id === huIdAfectada)
      if (!hu || hu.etapa === "completada" || hu.etapa === "cambio_cancelado" || hu.etapa === "sin_iniciar") return

      const casosHU = casos.filter(c => c.huId === huIdAfectada).map(c =>
        c.id === casoId ? { ...c, resultadosPorEtapa: c.resultadosPorEtapa.map(r => r.etapa === etapa ? { ...r, estado: "completado" as const, resultado, fechaFin: new Date(), intentos: r.intentos || [] } : r) } : c
      )
      const check = etapaCompletada(casosHU, hu.etapa as EtapaEjecucion)
      if (!check.completa) return

      if (check.exitosa) {
        const next = siguienteEtapa(hu.etapa as EtapaEjecucion, hu.tipoAplicacion)
        if (next) {
          setCasos(prevC => prevC.map(c => {
            if (c.huId !== huIdAfectada) return c
            const yaExiste = c.resultadosPorEtapa.some(r => r.etapa === next)
            return yaExiste ? c : { ...c, resultadosPorEtapa: [...c.resultadosPorEtapa, { etapa: next, estado: "pendiente" as const, resultado: "pendiente" as const, intentos: [] }] }
          }))
          const ev = crearEvento("hu_etapa_avanzada", `Etapa avanzó a ${next.charAt(0).toUpperCase()+next.slice(1)}`, "Sistema")
          setHistorias(prev => prev.map(h => h.id === huIdAfectada ? { ...h, etapa: next, historial: [...h.historial, ev] } : h))
          setHuSeleccionada(prev => prev?.id === huIdAfectada ? { ...prev, etapa: next, historial: [...prev.historial, ev] } : prev)
          addToast({ type:"success", title:"Etapa completada", desc:`Avanzando a ${next}` })
        } else {
          const ev = crearEvento("hu_completada", "Todas las etapas completadas exitosamente", "Sistema")
          setHistorias(prev => prev.map(h => h.id === huIdAfectada ? { ...h, estado: "exitosa", etapa: "completada", fechaCierre: new Date(), historial: [...h.historial, ev] } : h))
          setHuSeleccionada(prev => prev?.id === huIdAfectada ? { ...prev, estado: "exitosa", etapa: "completada", fechaCierre: new Date(), historial: [...prev.historial, ev] } : prev)
          addToast({ type:"success", title:"HU completada", desc:"Todas las etapas exitosas" })
        }
      }
    }, 100)

    addToast({ type: resultado === "exitoso" ? "success" : "error", title:`Caso ${resultado}`, desc:`Etapa ${etapa}` })
  }

  // ── Retesteo de caso fallido ──
  const handleRetestearCaso = (casoId: string, etapa: EtapaEjecucion, comentarioCorreccion: string) => {
    let huIdAfectada = ""
    setCasos(prev => prev.map(c => {
      if (c.id !== casoId) return c
      huIdAfectada = c.huId
      return { ...c, resultadosPorEtapa: c.resultadosPorEtapa.map(r => {
        if (r.etapa !== etapa || r.resultado !== "fallido") return r
        // Agregar comentario de corrección al último intento fallido
        const intentosUpd = [...(r.intentos || [])]
        if (intentosUpd.length > 0) {
          const ultimo = intentosUpd[intentosUpd.length - 1]
          intentosUpd[intentosUpd.length - 1] = { ...ultimo, comentarioCorreccion }
        }
        return { ...r, estado: "en_ejecucion" as const, resultado: "pendiente" as const, fechaFin: undefined, intentos: intentosUpd }
      })}
    }))
    const ev = crearEvento("caso_retesteo_solicitado", `Retesteo solicitado — ${comentarioCorreccion.slice(0,80)}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huIdAfectada ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huIdAfectada ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"info", title:"Retesteo solicitado", desc:`Caso listo para re-ejecutar` })
  }

  const handleIniciarEjecucion = (huId: string, etapa: EtapaEjecucion) => {
    setCasos(prev => prev.map(c => {
      if (c.huId !== huId || c.estadoAprobacion !== "aprobado") return c
      const yaExiste = c.resultadosPorEtapa.some(r => r.etapa === etapa)
      return {
        ...c, resultadosPorEtapa: yaExiste
          ? c.resultadosPorEtapa.map(r => r.etapa === etapa && r.estado === "pendiente" ? { ...r, estado: "en_ejecucion" as const, fechaInicio: new Date() } : r)
          : [...c.resultadosPorEtapa, { etapa, estado: "en_ejecucion" as const, resultado: "pendiente" as const, fechaInicio: new Date(), intentos: [] }],
      }
    }))
    const ev = crearEvento("caso_ejecucion_iniciada", `Ejecución iniciada — etapa ${etapa}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"info", title:"Ejecución iniciada", desc:`Etapa: ${etapa}` })
  }

  // ── Tareas ──
  const handleAddTarea = (tarea: Tarea) => {
    setTareas(prev => [...prev, tarea])
    setCasos(prev => prev.map(c => c.id === tarea.casoPruebaId ? { ...c, tareasIds: [...c.tareasIds, tarea.id] } : c))
    addToast({ type:"success", title:"Tarea creada", desc:tarea.titulo })
  }

  const handleCompletarTarea = (tareaId: string, resultado: "exitoso" | "fallido") => {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: "completada", resultado, fechaFin: new Date() } : t))
    addToast({ type: resultado === "exitoso" ? "success" : "error", title:`Tarea ${resultado}` })
  }

  const handleBloquearTarea = (tareaId: string, bloqueo: Bloqueo) => {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: "bloqueada", bloqueos: [...t.bloqueos, bloqueo] } : t))
    addToast({ type:"warning", title:"Tarea bloqueada", desc:bloqueo.descripcion.slice(0,60) })
  }

  const handleDesbloquearTarea = (tareaId: string, bloqueoId: string) => {
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      const bloqueos = t.bloqueos.map(b => b.id === bloqueoId ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre } : b)
      return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" : "en_progreso" }
    }))
    addToast({ type:"success", title:"Bloqueo resuelto" })
  }

  // ── Bloqueos HU ──
  const handleAddBloqueo = (huId: string, b: Bloqueo) => {
    const upd = (h: HistoriaUsuario) => h.id===huId
      ? {...h, bloqueos:[...h.bloqueos,b], historial:[...h.historial, crearEvento("bloqueo_reportado", `Bloqueo: ${b.descripcion.slice(0,80)}`, user?.nombre||"Sistema")]} : h
    setHistorias(p => p.map(upd))
    setHuSeleccionada(p => p?.id===huId ? upd(p) : p)
    addToast({ type:"warning", title:"Bloqueo registrado", desc:b.descripcion.slice(0,60) })
  }

  const handleResolverBloqueo = (huId: string, bId: string) => {
    const upd = (h: HistoriaUsuario) => h.id===huId
      ? {...h, bloqueos: h.bloqueos.map(b => b.id===bId ? {...b, resuelto:true, fechaResolucion:new Date(), resueltoPor:user?.nombre} : b),
          historial: [...h.historial, crearEvento("bloqueo_resuelto", "Bloqueo resuelto", user?.nombre||"Sistema")]} : h
    setHistorias(p => p.map(upd))
    setHuSeleccionada(p => p?.id===huId ? upd(p) : p)
    addToast({ type:"success", title:"Bloqueo resuelto" })
  }

  const handlePermitirCasosAdicionales = (huId: string, motivo: string) => {
    const ev = crearEvento("casos_adicionales_habilitados", `Admin habilitó agregar casos: ${motivo}`, user?.nombre || "Sistema")
    const upd = (h: HistoriaUsuario) => h.id === huId
      ? { ...h, permitirCasosAdicionales: true, motivoCasosAdicionales: motivo, historial: [...h.historial, ev] } : h
    setHistorias(prev => prev.map(upd))
    setHuSeleccionada(prev => prev?.id === huId ? upd(prev) : prev)
    addToast({ type:"info", title:"Modificación habilitada", desc:"QA puede agregar más casos" })
  }

  if (!isAuthenticated) return <LoginScreen />

  const tabCount = 2 + (canManageUsers ? 1 : 0)

  return (
    <div className="min-h-screen bg-background">
      <Header busqueda={busqueda} onBusquedaChange={setBusqueda} />

      <main className="container mx-auto px-6 py-6 space-y-6">
        <Tabs defaultValue="historias" className="w-full">
          <TabsList className="bg-secondary" style={{ display:"grid", gridTemplateColumns:`repeat(${tabCount},1fr)`, width:"100%", maxWidth:520 }}>
            <TabsTrigger value="historias" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4"/> Historias de Usuario
            </TabsTrigger>
            <TabsTrigger value="carga" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4"/> Carga Ocupacional
            </TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="usuarios" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <UserCog className="h-4 w-4"/> Usuarios
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="historias" className="mt-6 space-y-4">
            <HUStatsCards historias={historiasVisibles} />
            <HistoriasTable
              historias={historiasVisibles}
              casos={casos}
              onVerDetalle={hu => { setHuSeleccionada(hu); setHuDetailOpen(true) }}
              onEditar={handleEditarHU}
              onEliminar={handleEliminarHU}
              onNueva={handleNuevaHU}
              canEdit={isAdmin}
            />
          </TabsContent>

          <TabsContent value="carga" className="mt-6">
            <CargaOcupacional tareas={tareas} casos={casos} historias={historias} />
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="usuarios" className="mt-6">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {isAdmin && (
        <HUForm
          open={huFormOpen}
          onClose={() => { setHuFormOpen(false); setHuEditar(null) }}
          onSubmit={handleSubmitHU}
          huEditar={huEditar}
          currentUser={user?.nombre}
        />
      )}

      <HistoriaUsuarioDetail
        open={huDetailOpen}
        onClose={() => { setHuDetailOpen(false); setHuSeleccionada(null) }}
        hu={huSeleccionada}
        casos={casos}
        tareas={tareas}
        currentUser={user?.nombre}
        isAdmin={isAdmin}
        isQA={isQA}
        onIniciarHU={handleIniciarHU}
        onCancelarHU={handleCancelarHU}
        onAddCaso={handleAddCaso}
        onEnviarAprobacion={handleEnviarAprobacion}
        onAprobarCasos={handleAprobarCasos}
        onRechazarCasos={handleRechazarCasos}
        onIniciarEjecucion={handleIniciarEjecucion}
        onCompletarCasoEtapa={handleCompletarCasoEtapa}
        onRetestearCaso={handleRetestearCaso}
        onAddTarea={handleAddTarea}
        onCompletarTarea={handleCompletarTarea}
        onBloquearTarea={handleBloquearTarea}
        onDesbloquearTarea={handleDesbloquearTarea}
        onAddBloqueo={handleAddBloqueo}
        onResolverBloqueo={handleResolverBloqueo}
        onPermitirCasosAdicionales={handlePermitirCasosAdicionales}
      />

      <ConfirmDeleteModal
        open={deleteModal.open}
        titulo={deleteModal.titulo}
        subtitulo={deleteModal.subtitulo}
        onConfirm={deleteModal.fn}
        onCancel={() => setDeleteModal(d=>({...d,open:false}))}
      />

      <ToastContainer toasts={toasts} onDismiss={id=>setToasts(p=>p.filter(x=>x.id!==id))} />
    </div>
  )
}
