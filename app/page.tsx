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
  historiasEjemplo, tareasEjemplo,
  type HistoriaUsuario, type Tarea, type Bloqueo, type Observacion,
  type FaseTarea, type EstadoTarea, type ResultadoTarea,
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

// ── Página principal ───────────────────────────────────────
export default function DashboardPage() {
  const { isAuthenticated, canEdit, canManageUsers, verSoloPropios, user } = useAuth()

  const [historias, setHistorias]         = useState<HistoriaUsuario[]>(historiasEjemplo)
  const [tareas, setTareas]               = useState<Tarea[]>(tareasEjemplo)
  const [observaciones, setObservaciones] = useState<Observacion[]>([])

  const [busqueda, setBusqueda]               = useState("")
  const [huFormOpen, setHuFormOpen]           = useState(false)
  const [huDetailOpen, setHuDetailOpen]       = useState(false)
  const [huSeleccionada, setHuSeleccionada]   = useState<HistoriaUsuario | null>(null)
  const [huEditar, setHuEditar]               = useState<HistoriaUsuario | null>(null)
  const [deleteModal, setDeleteModal]         = useState<{ open:boolean; titulo:string; subtitulo?:string; fn:()=>void }>({ open:false, titulo:"", fn:()=>{} })

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const addToast = (t: Omit<ToastItem,"id">) => {
    const id = ++_tc
    setToasts(p => [...p, { ...t, id }])
    setTimeout(() => setToasts(p => p.filter(x => x.id!==id)), 4500)
  }

  // ── Filtros por rol ───────────────────────────────────────
  const historiasVisibles = historias.filter(hu => {
    if (verSoloPropios && user) {
      const tareasHU   = tareas.filter(t => hu.tareas.includes(t.id))
      const esSuya     = hu.asignado.toLowerCase() === user.nombre.toLowerCase()
      const tieneTarea = tareasHU.some(t => t.asignado.toLowerCase() === user.nombre.toLowerCase())
      return esSuya || tieneTarea
    }
    return true
  }).filter(hu =>
    !busqueda ||
    hu.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    hu.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    hu.asignado.toLowerCase().includes(busqueda.toLowerCase())
  )

  const tareasVisibles = tareas.filter(t =>
    !verSoloPropios || !user || t.asignado.toLowerCase() === user.nombre.toLowerCase()
  )

  // ── CRUD HU ───────────────────────────────────────────────
  const handleNuevaHU  = () => { setHuEditar(null); setHuFormOpen(true) }
  const handleEditarHU = (hu: HistoriaUsuario) => { setHuEditar(hu); setHuFormOpen(true) }

  const handleSubmitHU = (hu: HistoriaUsuario, nuevasTareas: Tarea[]) => {
    setHistorias(prev => prev.find(h=>h.id===hu.id) ? prev.map(h=>h.id===hu.id?hu:h) : [...prev, hu])
    setTareas(prev => [...prev.filter(t=>t.huId!==hu.id), ...nuevasTareas])
    addToast({ type:"success", title:hu.titulo, desc:huEditar?"Historia actualizada":`Creada con ${nuevasTareas.length} tarea(s)` })
  }

  const handleEliminarHU = (hu: HistoriaUsuario) => {
    setDeleteModal({
      open:true, titulo:"¿Eliminar Historia de Usuario?",
      subtitulo:`"${hu.titulo}" y sus ${hu.tareas.length} tarea(s)`,
      fn:() => {
        setHistorias(p=>p.filter(h=>h.id!==hu.id))
        setTareas(p=>p.filter(t=>t.huId!==hu.id))
        setDeleteModal(d=>({...d,open:false}))
        addToast({ type:"error", title:"Historia eliminada", desc:hu.titulo })
      }
    })
  }

  // ── Bloqueos ──────────────────────────────────────────────
  const handleAddBloqueo = (huId: string, b: Bloqueo) => {
    const upd = (h: HistoriaUsuario) => h.id===huId ? {...h, bloqueos:[...h.bloqueos,b]} : h
    setHistorias(p=>p.map(upd))
    setHuSeleccionada(p=>p?.id===huId ? {...p,bloqueos:[...p.bloqueos,b]} : p)
    addToast({ type:"warning", title:"Bloqueo registrado", desc:b.descripcion.slice(0,60) })
  }
  const handleResolverBloqueo = (huId: string, bId: string) => {
    const ahora = new Date()
    const upd = (h: HistoriaUsuario) => h.id===huId
      ? {...h, bloqueos:h.bloqueos.map(b=>b.id===bId?{...b,resuelto:true,fechaResolucion:ahora}:b)}
      : h
    setHistorias(p=>p.map(upd))
    setHuSeleccionada(p=>p?.id===huId
      ? {...p, bloqueos:p.bloqueos.map(b=>b.id===bId?{...b,resuelto:true,fechaResolucion:ahora}:b)}
      : p)
    addToast({ type:"success", title:"Bloqueo resuelto" })
  }

  // ── Avance de fase de tarea ───────────────────────────────
  const handleCambiarFaseTarea = (tareaId:string, fase:FaseTarea, estado:EstadoTarea, resultado:ResultadoTarea, nota?:string) => {
    setTareas(prev => prev.map(t => {
      if (t.id!==tareaId) return t
      const evento = {
        id:`ef-${Date.now()}`, tareaId, tareaTitulo:t.titulo,
        faseAnterior:t.faseActual, faseNueva:fase,
        estadoNuevo: estado, resultadoNuevo: resultado,
        fecha:new Date(), usuario:user?.nombre||"Sistema", nota,
      }
      return { ...t, faseActual:fase, estado, resultado, historialFases:[...t.historialFases, evento] }
    }))
    addToast({ type:"info", title:"Fase actualizada", desc:`→ ${fase}` })
  }

  // ── Observaciones ─────────────────────────────────────────
  const handleAddObservacion = (obs: Observacion) => {
    setObservaciones(p => [...p, obs])
    addToast({ type:"info", title:"Observación registrada",
      desc:obs.diasExtra>0?`+${obs.diasExtra}d a la fecha fin`:"Sin impacto en fecha" })
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
              tareas={tareas}
              onVerDetalle={hu => { setHuSeleccionada(hu); setHuDetailOpen(true) }}
              onEditar={handleEditarHU}
              onEliminar={handleEliminarHU}
              onNueva={handleNuevaHU}
              canEdit={canEdit}
            />
          </TabsContent>

          <TabsContent value="carga" className="mt-6">
            <CargaOcupacional tareas={tareasVisibles} observaciones={observaciones} />
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="usuarios" className="mt-6">
              <UserManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {canEdit && (
        <HUForm
          open={huFormOpen}
          onClose={() => { setHuFormOpen(false); setHuEditar(null) }}
          onSubmit={handleSubmitHU}
          huEditar={huEditar}
          tareasExistentes={tareas}
          currentUser={user?.nombre}
        />
      )}

      <HistoriaUsuarioDetail
        open={huDetailOpen}
        onClose={() => { setHuDetailOpen(false); setHuSeleccionada(null) }}
        hu={huSeleccionada}
        tareas={tareas}
        observaciones={observaciones}
        currentUser={user?.nombre}
        canEdit={canEdit}
        onAddBloqueo={handleAddBloqueo}
        onResolverBloqueo={handleResolverBloqueo}
        onCambiarFaseTarea={handleCambiarFaseTarea}
        onAddObservacion={handleAddObservacion}
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
