"use client"

import { useState, useRef, useMemo } from "react"
import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import { Header } from "@/components/dashboard/header"
import { HistoriasTable } from "@/components/dashboard/historias-table"
import { HistoriaUsuarioDetail } from "@/components/dashboard/historia-usuario-detail"
import { HUForm } from "@/components/dashboard/hu-form"
import { CargaOcupacional } from "@/components/dashboard/carga-ocupacional"
import { AnalyticsKPIs } from "@/components/dashboard/analytics-kpis"
import { UserManagement } from "@/components/dashboard/user-management"
import { BloqueosPanel } from "@/components/dashboard/bloqueos-panel"
import { AuditoriaPanel } from "@/components/dashboard/auditoria-panel"
import { RolesConfig } from "@/components/dashboard/roles-config"
import { EtapasConfig } from "@/components/dashboard/etapas-config"
import { AplicacionesConfig, APLICACIONES_PREDETERMINADAS } from "@/components/dashboard/aplicaciones-config"
import { TiposAplicacionConfig } from "@/components/dashboard/tipos-aplicacion-config"
import { AmbientesConfig } from "@/components/dashboard/ambientes-config"
import { TiposPruebaConfig } from "@/components/dashboard/tipos-prueba-config"
import { HUStatsCards } from "@/components/dashboard/hu-stats-cards"
import { CasosTable } from "@/components/dashboard/casos-table"
import { HomeDashboard } from "@/components/dashboard/home-dashboard"
import { LoginScreen } from "@/components/auth/login-screen"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, UserCog, Trash2, X, CheckCircle, LogOut, AlertTriangle, BarChart2, Settings, ShieldAlert, History, Layers, Monitor, Globe, Settings2, FlaskConical, ClipboardList, Home } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  historiasEjemplo, casosPruebaEjemplo, tareasEjemplo,
  crearEvento, etapasParaTipo, siguienteEtapa, etapaCompletada,
  ETAPAS_PREDETERMINADAS, TIPOS_APLICACION_PREDETERMINADOS, AMBIENTES_PREDETERMINADOS, TIPOS_PRUEBA_PREDETERMINADOS,
  getTipoAplicacionLabel, getAmbienteLabel,
  type HistoriaUsuario, type CasoPrueba, type Tarea, type Bloqueo,
  type EtapaEjecucion, type EstadoHU, type EstadoAprobacion, type Notificacion, type TipoNotificacion,
  type Comentario, type ConfigEtapas, type TipoAplicacionDef, type AmbienteDef, type TipoPruebaDef,
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
  const { isAuthenticated, canManageUsers, verSoloPropios, isAdmin, isQALead, isQA, canCreateHU, isOwner, user, users, roles } = useAuth()
  const qaUsers = users.filter(u => u.activo && (roles.find(r => r.id === u.rol)?.permisos.includes("canEdit") ?? false)).map(u => u.nombre)

  // ── Visibilidad de Carga Ocupacional por rol ───────────────
  // Admin → todos (con pills) | QA Lead → sus QAs + él mismo | QA → solo él mismo | Viewer → todos
  const filtroNombresCarga = useMemo<string[] | undefined>(() => {
    if (isOwner) return undefined  // owner ve todo
    if (isAdmin && user) {
      if (user.equipoIds && user.equipoIds.length > 0) {
        const teamNombres = users
          .filter(u => user.equipoIds!.includes(u.id) && u.activo)
          .map(u => u.nombre)
        return [...new Set([user.nombre, ...teamNombres])]
      }
      return undefined  // admin sin equipo ve todo
    }
    if (isQALead && user) {
      if (user.equipoIds && user.equipoIds.length > 0) {
        const teamNombres = users
          .filter(u => user.equipoIds!.includes(u.id) && u.activo)
          .map(u => u.nombre)
        return [...new Set([user.nombre, ...teamNombres])]
      }
      // Sin equipo asignado: solo él mismo
      return [user.nombre]
    }
    if (verSoloPropios && user) return [user.nombre]  // QA: solo él mismo
    return undefined  // Viewer y otros: todos
  }, [isOwner, isAdmin, isQALead, verSoloPropios, user, users])

  const [historias, setHistorias]   = usePersistedState<HistoriaUsuario[]>(STORAGE_KEYS.historias, historiasEjemplo)
  const [casos, setCasos]           = usePersistedState<CasoPrueba[]>(STORAGE_KEYS.casos, casosPruebaEjemplo)
  const [tareas, setTareas]         = usePersistedState<Tarea[]>(STORAGE_KEYS.tareas, tareasEjemplo)
  const [configEtapas, setConfigEtapas] = usePersistedState<ConfigEtapas>(STORAGE_KEYS.configEtapas, ETAPAS_PREDETERMINADAS)
  const [aplicaciones, setAplicaciones] = usePersistedState<string[]>(STORAGE_KEYS.aplicaciones, APLICACIONES_PREDETERMINADAS)
  const [tiposAplicacion, setTiposAplicacion] = usePersistedState<TipoAplicacionDef[]>(STORAGE_KEYS.tiposAplicacion, TIPOS_APLICACION_PREDETERMINADOS)
  const [ambientes, setAmbientes]   = usePersistedState<AmbienteDef[]>(STORAGE_KEYS.ambientes, AMBIENTES_PREDETERMINADOS)
  const [tiposPrueba, setTiposPrueba] = usePersistedState<TipoPruebaDef[]>(STORAGE_KEYS.tiposPrueba, TIPOS_PRUEBA_PREDETERMINADOS)
  const [configSeccion, setConfigSeccion] = useState<"roles" | "tipos" | "aplicaciones" | "ambientes" | "tipos_prueba" | "etapas">("roles")
  const [adminSeccion, setAdminSeccion]   = useState<"auditoria" | "usuarios" | "configuracion">("auditoria")

  const handleTiposChange = (newTipos: TipoAplicacionDef[]) => {
    setTiposAplicacion(newTipos)
    setConfigEtapas(prev => {
      const updated = { ...prev }
      // Inicializar entradas para tipos nuevos
      newTipos.forEach(t => { if (!(t.id in updated)) updated[t.id] = [] })
      // Eliminar entradas de tipos borrados
      Object.keys(updated).forEach(k => { if (!newTipos.some(t => t.id === k)) delete updated[k] })
      return updated
    })
  }

  const [tabActiva, setTabActiva]           = useState("inicio")
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

  // ── Notificaciones (persistidas en localStorage) ──
  const _nc = useRef(0)
  const [notificaciones, setNotificaciones] = usePersistedState<Notificacion[]>(STORAGE_KEYS.notificaciones, [])

  const addNotificacion = (
    tipo: TipoNotificacion,
    titulo: string,
    descripcion: string,
    destinatario: "admin" | "qa",
    extra?: Pick<Notificacion, "casoId" | "huId" | "huTitulo" | "casoTitulo">
  ) => {
    const n: Notificacion = {
      id: `notif-${Date.now()}-${++_nc.current}`,
      tipo, titulo, descripcion, destinatario,
      fecha: new Date(), leida: false,
      ...extra,
    }
    setNotificaciones(p => [n, ...p])
  }
  const handleMarcarLeida = (id: string) =>
    setNotificaciones(p => p.map(n => n.id === id ? { ...n, leida: true } : n))
  const handleMarcarTodasLeidas = () =>
    setNotificaciones(p => p.map(n => ({ ...n, leida: true })))

  // ── Filtros por rol + búsqueda global ──
  const historiasVisibles = historias.filter(hu => {
    if (verSoloPropios && user) {
      return hu.responsable.toLowerCase() === user.nombre.toLowerCase()
    }
    if (isAdmin && !isOwner && user && user.equipoIds && user.equipoIds.length > 0) {
      const teamNombres = users
        .filter(u => user.equipoIds!.includes(u.id))
        .map(u => u.nombre.toLowerCase())
      return teamNombres.includes(hu.responsable.toLowerCase()) ||
             hu.responsable.toLowerCase() === user.nombre.toLowerCase()
    }
    if (isQALead && user && user.equipoIds && user.equipoIds.length > 0) {
      const teamNombres = users
        .filter(u => user.equipoIds!.includes(u.id))
        .map(u => u.nombre.toLowerCase())
      return teamNombres.includes(hu.responsable.toLowerCase()) ||
             hu.responsable.toLowerCase() === user.nombre.toLowerCase()
    }
    return true
  }).filter(hu => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
    return (
      hu.titulo.toLowerCase().includes(q) ||
      hu.codigo.toLowerCase().includes(q) ||
      hu.responsable.toLowerCase().includes(q) ||
      (hu.descripcion?.toLowerCase().includes(q) ?? false) ||
      getTipoAplicacionLabel(hu.tipoAplicacion, tiposAplicacion).toLowerCase().includes(q) ||
      getAmbienteLabel(hu.ambiente, ambientes).toLowerCase().includes(q) ||
      casosHU.some(c => c.titulo.toLowerCase().includes(q))
    )
  })

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

  // ── Acciones masivas ──
  const handleBulkCambiarEstado = (ids: string[], estado: EstadoHU) => {
    setHistorias(prev => prev.map(h => ids.includes(h.id) ? { ...h, estado } : h))
    addToast({ type:"success", title:"Estado actualizado", desc:`${ids.length} HU${ids.length!==1?"s":""} actualizadas` })
  }

  const handleBulkCambiarResponsable = (ids: string[], responsable: string) => {
    setHistorias(prev => prev.map(h => ids.includes(h.id) ? { ...h, responsable } : h))
    addToast({ type:"success", title:"Responsable actualizado", desc:`${ids.length} HU${ids.length!==1?"s":""} asignadas a ${responsable}` })
  }

  const handleBulkEliminar = (ids: string[]) => {
    setDeleteModal({
      open:true,
      titulo:`¿Eliminar ${ids.length} Historia${ids.length!==1?"s":""} de Usuario?`,
      subtitulo:`Esta acción también eliminará todos sus casos de prueba asociados`,
      fn:() => {
        setHistorias(p => p.filter(h => !ids.includes(h.id)))
        setCasos(p => p.filter(c => !ids.includes(c.huId)))
        setTareas(p => p.filter(t => !ids.includes(t.huId)))
        setDeleteModal(d => ({...d, open:false}))
        addToast({ type:"error", title:`${ids.length} historia${ids.length!==1?"s":""} eliminada${ids.length!==1?"s":""}` })
      }
    })
  }

  // ── QA inicia HU ──
  const handleIniciarHU = (huId: string) => {
    setHistorias(prev => prev.map(h => {
      if (h.id !== huId || h.estado !== "sin_iniciar") return h
      const primeraEtapa = etapasParaTipo(h.tipoAplicacion, configEtapas)[0]
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
      c.huId === huId && (c.estadoAprobacion === "borrador" || c.estadoAprobacion === "rechazado")
        ? { ...c, estadoAprobacion: "pendiente_aprobacion" as EstadoAprobacion } : c
    ))
    const ev = crearEvento("caso_enviado_aprobacion", "Casos enviados para aprobación", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"info", title:"Casos enviados", desc:"Pendientes de aprobación" })
    const hu = historias.find(h => h.id === huId)
    addNotificacion("aprobacion_enviada", "Casos enviados a aprobación",
      `${user?.nombre || "QA"} envió todos los casos de la HU "${hu?.titulo || huId}" para aprobación`,
      "admin", { huId, huTitulo: hu?.titulo })
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
    const hu = historias.find(h => h.id === huId)
    addNotificacion("caso_aprobado", "Casos aprobados",
      `Admin aprobó todos los casos de la HU "${hu?.titulo || huId}"`,
      "qa", { huId, huTitulo: hu?.titulo })
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
    const hu = historias.find(h => h.id === huId)
    addNotificacion("caso_rechazado", "Casos rechazados",
      `Admin rechazó los casos de la HU "${hu?.titulo || huId}": ${motivo.slice(0,80)}`,
      "qa", { huId, huTitulo: hu?.titulo })
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
        const next = siguienteEtapa(hu.etapa as EtapaEjecucion, hu.tipoAplicacion, configEtapas)
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

  // ── CRUD casos adicionales ──
  const handleEditarCaso = (caso: CasoPrueba) => {
    setCasos(prev => prev.map(c => c.id === caso.id ? caso : c))
    const ev = crearEvento("caso_editado", `Caso editado: ${caso.titulo}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === caso.huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === caso.huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"success", title:"Caso actualizado", desc:caso.titulo })
  }

  const handleEliminarCaso = (casoId: string, huId: string) => {
    setCasos(prev => prev.filter(c => c.id !== casoId))
    setTareas(prev => prev.filter(t => t.casoPruebaId !== casoId))
    const ev = crearEvento("caso_eliminado", "Caso de prueba eliminado", user?.nombre || "Sistema")
    const upd = (h: HistoriaUsuario) => h.id === huId
      ? { ...h, casosIds: h.casosIds.filter(id => id !== casoId), historial: [...h.historial, ev] } : h
    setHistorias(prev => prev.map(upd))
    setHuSeleccionada(prev => prev?.id === huId ? upd(prev) : prev)
    addToast({ type:"warning", title:"Caso eliminado" })
  }

  const handleEnviarCasoAprobacion = (casoId: string, huId: string) => {
    const caso = casos.find(c => c.id === casoId)
    const hu = historias.find(h => h.id === huId)
    setCasos(prev => prev.map(c =>
      c.id === casoId && (c.estadoAprobacion === "borrador" || c.estadoAprobacion === "rechazado")
        ? { ...c, estadoAprobacion: "pendiente_aprobacion" as EstadoAprobacion } : c
    ))
    const ev = crearEvento("caso_enviado_aprobacion", "Caso enviado para aprobación", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"info", title:"Caso enviado", desc:"Pendiente de aprobación" })
    addNotificacion("aprobacion_enviada", "Caso enviado a aprobación",
      `${user?.nombre || "QA"} envió el caso "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}" para aprobación`,
      "admin", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo })
  }

  const handleSolicitarModificacionCaso = (casoId: string, huId: string) => {
    const caso = casos.find(c => c.id === casoId)
    const hu = historias.find(h => h.id === huId)
    setCasos(prev => prev.map(c =>
      c.id === casoId ? { ...c, modificacionSolicitada: true } : c
    ))
    const ev = crearEvento("caso_modificacion_solicitada", "QA solicitó modificación de caso aprobado", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"info", title:"Modificación solicitada", desc:"El admin puede habilitar el cambio" })
    addNotificacion("modificacion_solicitada", "Solicitud de modificación",
      `${user?.nombre || "QA"} solicita modificar el caso aprobado "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}"`,
      "admin", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo })
  }

  const handleHabilitarModificacionCaso = (casoId: string, huId: string) => {
    const caso = casos.find(c => c.id === casoId)
    const hu = historias.find(h => h.id === huId)
    setCasos(prev => prev.map(c =>
      c.id === casoId ? { ...c, modificacionHabilitada: true, modificacionSolicitada: false, estadoAprobacion: "borrador" as EstadoAprobacion } : c
    ))
    const ev = crearEvento("caso_modificacion_habilitada", "Admin habilitó modificación de caso", user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type:"success", title:"Modificación habilitada", desc:"QA puede editar el caso" })
    addNotificacion("modificacion_habilitada", "Modificación habilitada",
      `Admin habilitó la modificación del caso "${caso?.titulo || casoId}" de la HU "${hu?.titulo || huId}"`,
      "qa", { casoId, huId, casoTitulo: caso?.titulo, huTitulo: hu?.titulo })
  }

  // ── Tareas ──
  const handleAddTarea = (tarea: Tarea) => {
    setTareas(prev => [...prev, tarea])
    setCasos(prev => prev.map(c => c.id === tarea.casoPruebaId ? { ...c, tareasIds: [...c.tareasIds, tarea.id] } : c))
    addToast({ type:"success", title:"Tarea creada", desc:tarea.titulo })
  }

  const handleEditarTarea = (tarea: Tarea) => {
    setTareas(prev => prev.map(t => t.id === tarea.id ? tarea : t))
    addToast({ type:"success", title:"Tarea actualizada", desc:tarea.titulo })
  }

  const handleEliminarTarea = (tareaId: string, casoId: string) => {
    setTareas(prev => prev.filter(t => t.id !== tareaId))
    setCasos(prev => prev.map(c => c.id === casoId ? { ...c, tareasIds: c.tareasIds.filter(id => id !== tareaId) } : c))
    addToast({ type:"warning", title:"Tarea eliminada" })
  }

  const handleCompletarTarea = (tareaId: string, resultado: "exitoso" | "fallido") => {
    setTareas(prev => prev.map(t => t.id === tareaId ? { ...t, estado: "completada", resultado, fechaFin: new Date() } : t))
    addToast({ type: resultado === "exitoso" ? "success" : "error", title:`Tarea ${resultado}` })
  }

  const handleBloquearTarea = (tareaId: string, bloqueo: Bloqueo) => {
    let huId = ""
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      huId = t.huId
      return { ...t, estado: "bloqueada", bloqueos: [...t.bloqueos, bloqueo] }
    }))
    setTimeout(() => {
      if (!huId) return
      const ev = crearEvento("tarea_bloqueada", `Tarea bloqueada: ${bloqueo.descripcion.slice(0,80)}`, user?.nombre || "Sistema")
      setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
      setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    }, 50)
    addToast({ type:"warning", title:"Tarea bloqueada", desc:bloqueo.descripcion.slice(0,60) })
  }

  const handleDesbloquearTarea = (tareaId: string, bloqueoId: string) => {
    let huId = ""
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      huId = t.huId
      const bloqueos = t.bloqueos.map(b => b.id === bloqueoId ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre } : b)
      return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" : "en_progreso" }
    }))
    setTimeout(() => {
      if (!huId) return
      const ev = crearEvento("tarea_desbloqueada", "Bloqueo de tarea resuelto", user?.nombre || "Sistema")
      setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
      setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    }, 50)
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

  const handleResolverBloqueo = (huId: string, bId: string, nota: string) => {
    const upd = (h: HistoriaUsuario) => h.id===huId
      ? {...h, bloqueos: h.bloqueos.map(b => b.id===bId ? {...b, resuelto:true, fechaResolucion:new Date(), resueltoPor:user?.nombre, notaResolucion:nota} : b),
          historial: [...h.historial, crearEvento("bloqueo_resuelto", `Bloqueo resuelto: ${nota.slice(0,80)}`, user?.nombre||"Sistema")]} : h
    setHistorias(p => p.map(upd))
    setHuSeleccionada(p => p?.id===huId ? upd(p) : p)
    addToast({ type:"success", title:"Bloqueo resuelto", desc:nota.slice(0,60) })
  }

  const handleResolverBloqueoCaso = (casoId: string, huId: string, bId: string, nota: string) => {
    setCasos(prev => prev.map(c =>
      c.id === casoId
        ? { ...c, bloqueos: c.bloqueos.map(b => b.id === bId ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre, notaResolucion: nota } : b) }
        : c
    ))
    const ev = crearEvento("bloqueo_resuelto", `Bloqueo de caso resuelto: ${nota.slice(0,80)}`, user?.nombre || "Sistema")
    setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
    setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
  }

  const handleResolverBloqueoTarea = (tareaId: string, bId: string, nota: string) => {
    let huId = ""
    setTareas(prev => prev.map(t => {
      if (t.id !== tareaId) return t
      huId = t.huId
      const bloqueos = t.bloqueos.map(b => b.id === bId
        ? { ...b, resuelto: true, fechaResolucion: new Date(), resueltoPor: user?.nombre, notaResolucion: nota }
        : b
      )
      return { ...t, bloqueos, estado: bloqueos.some(b => !b.resuelto) ? "bloqueada" as const : "en_progreso" as const }
    }))
    setTimeout(() => {
      if (!huId) return
      const ev = crearEvento("bloqueo_resuelto", `Bloqueo de tarea resuelto: ${nota.slice(0,80)}`, user?.nombre || "Sistema")
      setHistorias(prev => prev.map(h => h.id === huId ? { ...h, historial: [...h.historial, ev] } : h))
      setHuSeleccionada(prev => prev?.id === huId ? { ...prev, historial: [...prev.historial, ev] } : prev)
    }, 50)
    addToast({ type: "success", title: "Bloqueo resuelto", desc: nota.slice(0, 60) })
  }

  // ── Comentarios ──
  const handleAddComentarioHU = (huId: string, texto: string) => {
    const c: Comentario = { id: `com-${Date.now()}`, texto, autor: user?.nombre || "Sistema", fecha: new Date() }
    const upd = (h: HistoriaUsuario) => h.id === huId ? { ...h, comentarios: [...h.comentarios, c] } : h
    setHistorias(p => p.map(upd))
    setHuSeleccionada(p => p?.id === huId ? upd(p) : p)
  }

  const handleAddComentarioCaso = (casoId: string, texto: string) => {
    const c: Comentario = { id: `com-${Date.now()}`, texto, autor: user?.nombre || "Sistema", fecha: new Date() }
    setCasos(p => p.map(caso => caso.id === casoId ? { ...caso, comentarios: [...caso.comentarios, c] } : caso))
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

  const totalBloqueoActivos =
    historias.reduce((n, h) => n + h.bloqueos.filter(b => !b.resuelto).length, 0) +
    casos.reduce((n, c) => n + c.bloqueos.filter(b => !b.resuelto).length, 0) +
    tareas.reduce((n, t) => n + t.bloqueos.filter(b => !b.resuelto).length, 0)

  const tabCount = 6 + (canManageUsers ? 1 : 0)

  return (
    <div className="min-h-screen bg-background">
      <Header
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        notificaciones={notificaciones.filter(n => n.destinatario === (isAdmin ? "admin" : "qa"))}
        onMarcarLeida={handleMarcarLeida}
        onMarcarTodasLeidas={handleMarcarTodasLeidas}
      />

      <main className="container mx-auto px-6 py-6 space-y-6" style={{ minHeight:"calc(100vh - 64px - 60px)" }}>
        <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full">
          <TabsList className="bg-secondary" style={{ display:"grid", gridTemplateColumns:`repeat(${tabCount},1fr)`, width:"100%", maxWidth: canManageUsers ? 1150 : 1050 }}>
            <TabsTrigger value="inicio" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Home className="h-4 w-4"/> Inicio
            </TabsTrigger>
            <TabsTrigger value="historias" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="h-4 w-4"/> Historias
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart2 className="h-4 w-4"/> Analytics
            </TabsTrigger>
            <TabsTrigger value="carga" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="h-4 w-4"/> Carga
            </TabsTrigger>
            <TabsTrigger value="bloqueos" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
              <ShieldAlert className="h-4 w-4"/> Bloqueos
              {totalBloqueoActivos > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 16, height: 16, borderRadius: 999, fontSize: 9, fontWeight: 700,
                  background: "var(--chart-4)", color: "#fff", padding: "0 4px",
                }}>
                  {totalBloqueoActivos}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="casos" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ClipboardList className="h-4 w-4"/> Casos
            </TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value="admin" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Settings className="h-4 w-4"/> Admin
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="inicio" className="mt-6">
            <HomeDashboard
              historias={historiasVisibles}
              casos={casos}
              tareas={tareas}
              onVerHU={hu => { setHuSeleccionada(hu); setHuDetailOpen(true) }}
              onIrATab={setTabActiva}
            />
          </TabsContent>

          <TabsContent value="historias" className="mt-6 space-y-4">
            <HUStatsCards historias={historiasVisibles} />
            <HistoriasTable
              historias={historiasVisibles}
              casos={casos}
              onVerDetalle={hu => { setHuSeleccionada(hu); setHuDetailOpen(true) }}
              onEditar={handleEditarHU}
              onEliminar={handleEliminarHU}
              onNueva={handleNuevaHU}
              canEdit={canCreateHU}
              configEtapas={configEtapas}
              tiposAplicacion={tiposAplicacion}
              ambientes={ambientes}
              tiposPrueba={tiposPrueba}
              qaUsers={qaUsers}
              onBulkCambiarEstado={handleBulkCambiarEstado}
              onBulkCambiarResponsable={handleBulkCambiarResponsable}
              onBulkEliminar={handleBulkEliminar}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsKPIs historias={historiasVisibles} casos={casos} tareas={tareas} isQA={verSoloPropios} currentUserName={user?.nombre} filtroNombres={filtroNombresCarga} configEtapas={configEtapas} tiposAplicacion={tiposAplicacion} ambientes={ambientes} tiposPrueba={tiposPrueba} />
          </TabsContent>

          <TabsContent value="carga" className="mt-6">
            <CargaOcupacional tareas={tareas} casos={casos} historias={historias} currentUserName={user?.nombre} filtroNombres={filtroNombresCarga} />
          </TabsContent>

          <TabsContent value="bloqueos" className="mt-6">
            <BloqueosPanel
              historias={historiasVisibles}
              casos={casos}
              tareas={tareas}
              onResolverBloqueoHU={handleResolverBloqueo}
              onResolverBloqueoCaso={handleResolverBloqueoCaso}
              onResolverBloqueoTarea={handleResolverBloqueoTarea}
              onVerHU={hu => { setHuSeleccionada(hu); setHuDetailOpen(true) }}
              canEdit={!verSoloPropios || !!user}
            />
          </TabsContent>

          <TabsContent value="casos" className="mt-6">
            <CasosTable
              casos={casos.filter(c => {
                if (!verSoloPropios || !user) return true
                const hu = historias.find(h => h.id === c.huId)
                return hu?.responsable.toLowerCase() === user.nombre.toLowerCase()
              })}
              historias={historiasVisibles}
              onVerHU={hu => { setHuSeleccionada(hu); setHuDetailOpen(true) }}
              tiposPrueba={tiposPrueba}
            />
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="admin" className="mt-6">
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

                {/* ── Sidebar Admin ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 190, flexShrink: 0 }}>

                  {/* Secciones principales */}
                  {(
                    [
                      { id: "auditoria",     label: "Auditoría",     icon: <History size={14} /> },
                      { id: "usuarios",      label: "Usuarios",       icon: <UserCog size={14} /> },
                      { id: "configuracion", label: "Configuración",  icon: <Settings size={14} /> },
                    ] as const
                  ).map(sec => {
                    const active = adminSeccion === sec.id
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setAdminSeccion(sec.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "8px 12px", borderRadius: 8, fontSize: 13,
                          fontWeight: active ? 700 : 400,
                          border: `1px solid ${active ? "color-mix(in oklch, var(--primary) 35%, transparent)" : "transparent"}`,
                          background: active ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent",
                          color: active ? "var(--primary)" : "var(--muted-foreground)",
                          cursor: "pointer", textAlign: "left", width: "100%",
                          transition: "all 0.15s",
                        }}
                        className={active ? "" : "hover:bg-secondary/60 hover:text-foreground"}
                      >
                        {sec.icon}
                        {sec.label}
                      </button>
                    )
                  })}

                  {/* Sub-items de Configuración */}
                  {adminSeccion === "configuracion" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4, paddingLeft: 10 }}>
                      <div style={{ height: 1, background: "var(--border)", marginBottom: 4 }} />
                      {(
                        [
                          { id: "roles",        label: "Roles",               icon: <UserCog size={13} /> },
                          { id: "tipos",        label: "Tipos de Aplicación",  icon: <Layers size={13} /> },
                          { id: "aplicaciones", label: "Aplicaciones",         icon: <Monitor size={13} /> },
                          { id: "ambientes",    label: "Ambientes",            icon: <Globe size={13} /> },
                          { id: "tipos_prueba", label: "Tipos de Prueba",      icon: <FlaskConical size={13} /> },
                          { id: "etapas",       label: "Etapas",               icon: <Settings2 size={13} /> },
                        ] as const
                      ).map(sub => {
                        const active = configSeccion === sub.id
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setConfigSeccion(sub.id)}
                            style={{
                              display: "flex", alignItems: "center", gap: 7,
                              padding: "6px 10px", borderRadius: 7, fontSize: 12,
                              fontWeight: active ? 700 : 400,
                              border: `1px solid ${active ? "color-mix(in oklch, var(--primary) 35%, transparent)" : "transparent"}`,
                              background: active ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent",
                              color: active ? "var(--primary)" : "var(--muted-foreground)",
                              cursor: "pointer", textAlign: "left", width: "100%",
                              transition: "all 0.15s",
                            }}
                            className={active ? "" : "hover:bg-secondary/60 hover:text-foreground"}
                          >
                            {sub.icon}
                            {sub.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Separador */}
                <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch", flexShrink: 0 }} />

                {/* ── Contenido ── */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {adminSeccion === "auditoria" && (
                    <AuditoriaPanel
                      historias={historias}
                      onVerHU={hu => { setHuSeleccionada(hu); setHuDetailOpen(true) }}
                    />
                  )}
                  {adminSeccion === "usuarios" && <UserManagement />}
                  {adminSeccion === "configuracion" && (
                    <>
                      {configSeccion === "roles"        && <RolesConfig />}
                      {configSeccion === "tipos"        && <TiposAplicacionConfig tipos={tiposAplicacion} onChange={handleTiposChange} />}
                      {configSeccion === "aplicaciones" && <AplicacionesConfig aplicaciones={aplicaciones} onChange={setAplicaciones} />}
                      {configSeccion === "ambientes"    && <AmbientesConfig ambientes={ambientes} onChange={setAmbientes} />}
                      {configSeccion === "tipos_prueba" && <TiposPruebaConfig tipos={tiposPrueba} onChange={setTiposPrueba} />}
                      {configSeccion === "etapas"       && <EtapasConfig config={configEtapas} onChange={setConfigEtapas} tipos={tiposAplicacion} />}
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {canCreateHU && (
        <HUForm
          open={huFormOpen}
          onClose={() => { setHuFormOpen(false); setHuEditar(null) }}
          onSubmit={handleSubmitHU}
          huEditar={huEditar}
          currentUser={user?.nombre}
          configEtapas={configEtapas}
          qaUsers={qaUsers}
          aplicaciones={aplicaciones}
          tiposAplicacion={tiposAplicacion}
          ambientes={ambientes}
          tiposPrueba={tiposPrueba}
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
        isQALead={isQALead}
        isQA={isQA}
        configEtapas={configEtapas}
        tiposAplicacion={tiposAplicacion}
        ambientes={ambientes}
        tiposPrueba={tiposPrueba}
        onIniciarHU={handleIniciarHU}
        onCancelarHU={handleCancelarHU}
        onAddCaso={handleAddCaso}
        onEditarCaso={handleEditarCaso}
        onEliminarCaso={handleEliminarCaso}
        onEnviarCasoAprobacion={handleEnviarCasoAprobacion}
        onEnviarAprobacion={handleEnviarAprobacion}
        onSolicitarModificacionCaso={handleSolicitarModificacionCaso}
        onHabilitarModificacionCaso={handleHabilitarModificacionCaso}
        onAprobarCasos={handleAprobarCasos}
        onRechazarCasos={handleRechazarCasos}
        onIniciarEjecucion={handleIniciarEjecucion}
        onCompletarCasoEtapa={handleCompletarCasoEtapa}
        onRetestearCaso={handleRetestearCaso}
        onAddTarea={handleAddTarea}
        onEditarTarea={handleEditarTarea}
        onEliminarTarea={handleEliminarTarea}
        onCompletarTarea={handleCompletarTarea}
        onBloquearTarea={handleBloquearTarea}
        onDesbloquearTarea={handleDesbloquearTarea}
        onAddBloqueo={handleAddBloqueo}
        onResolverBloqueo={handleResolverBloqueo}
        onPermitirCasosAdicionales={handlePermitirCasosAdicionales}
        onAddComentarioHU={handleAddComentarioHU}
        onAddComentarioCaso={handleAddComentarioCaso}
      />

      <ConfirmDeleteModal
        open={deleteModal.open}
        titulo={deleteModal.titulo}
        subtitulo={deleteModal.subtitulo}
        onConfirm={deleteModal.fn}
        onCancel={() => setDeleteModal(d=>({...d,open:false}))}
      />

      <ToastContainer toasts={toasts} onDismiss={id=>setToasts(p=>p.filter(x=>x.id!==id))} />

      <footer style={{ borderTop:"1px solid var(--border)", background:"var(--card)", marginTop:32 }}>
        <div className="container mx-auto px-6" style={{ padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:8, background:"var(--primary)" }}>
              <span style={{ fontSize:11, fontWeight:800, color:"var(--primary-foreground)" }}>QA</span>
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:700, color:"var(--foreground)" }}>QAControl</p>
              <p style={{ fontSize:10, color:"var(--muted-foreground)" }}>Gestión de pruebas y control de calidad</p>
            </div>
          </div>
          <p style={{ fontSize:11, color:"var(--muted-foreground)" }}>
            © {new Date().getFullYear()} Sistema de Control de Calidad
          </p>
        </div>
      </footer>
    </div>
  )
}
