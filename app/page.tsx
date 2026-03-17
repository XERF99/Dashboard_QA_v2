"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/dashboard/header"
import { HistoriasTable } from "@/components/dashboard/historias-table"
import { HistoriaUsuarioDetail } from "@/components/dashboard/historia-usuario-detail"
import { HUForm } from "@/components/dashboard/hu-form"
import { CSVImportModal } from "@/components/dashboard/csv-import-modal"
import { CargaOcupacional } from "@/components/dashboard/carga-ocupacional"
import { AnalyticsKPIs } from "@/components/dashboard/analytics-kpis"
import { UserManagement } from "@/components/dashboard/user-management"
import { BloqueosPanel } from "@/components/dashboard/bloqueos-panel"
import { AuditoriaPanel } from "@/components/dashboard/auditoria-panel"
import { RolesConfig } from "@/components/dashboard/roles-config"
import { EtapasConfig } from "@/components/dashboard/etapas-config"
import { AplicacionesConfig } from "@/components/dashboard/aplicaciones-config"
import { TiposAplicacionConfig } from "@/components/dashboard/tipos-aplicacion-config"
import { AmbientesConfig } from "@/components/dashboard/ambientes-config"
import { TiposPruebaConfig } from "@/components/dashboard/tipos-prueba-config"
import { HUStatsCards } from "@/components/dashboard/hu-stats-cards"
import { CasosTable } from "@/components/dashboard/casos-table"
import { HomeDashboard } from "@/components/dashboard/home-dashboard"
import { LoginScreen } from "@/components/auth/login-screen"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  BookOpen, Users, UserCog, Trash2, X, CheckCircle, LogOut, AlertTriangle,
  BarChart2, Settings, ShieldAlert, History, Layers, Monitor, Globe,
  Settings2, FlaskConical, ClipboardList, Home,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getTipoAplicacionLabel, getAmbienteLabel } from "@/lib/types"
import type { HistoriaUsuario } from "@/lib/types"
import { useConfig } from "@/lib/hooks/useConfig"
import { useNotificaciones } from "@/lib/hooks/useNotificaciones"
import { useDomainData } from "@/lib/hooks/useDomainData"

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

  // ── Toasts ────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const addToast = (t: Omit<ToastItem,"id">) => {
    const id = ++_tc
    setToasts(p => [...p, { ...t, id }])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4500)
  }

  // ── Hooks de dominio ──────────────────────────────────────
  const config = useConfig()
  const notif  = useNotificaciones()
  const domain = useDomainData({ user, configEtapas: config.configEtapas, addToast, addNotificacion: notif.addNotificacion })

  // ── UI state ──────────────────────────────────────────────
  const [tabActiva, setTabActiva]               = useState("inicio")
  const [busqueda, setBusqueda]                 = useState("")
  const [huFormOpen, setHuFormOpen]             = useState(false)
  const [huDetailOpen, setHuDetailOpen]         = useState(false)
  const [huSeleccionadaId, setHuSeleccionadaId] = useState<string | null>(null)
  const [huEditar, setHuEditar]                 = useState<HistoriaUsuario | null>(null)
  const [deleteModal, setDeleteModal]           = useState<{ open:boolean; titulo:string; subtitulo?:string; fn:()=>void }>({ open:false, titulo:"", fn:()=>{} })
  const [importModalOpen, setImportModalOpen]   = useState(false)
  const [configSeccion, setConfigSeccion]       = useState<"roles"|"tipos"|"aplicaciones"|"ambientes"|"tipos_prueba"|"etapas">("roles")
  const [adminSeccion, setAdminSeccion]         = useState<"auditoria"|"usuarios"|"configuracion">("auditoria")

  // huSeleccionada siempre refleja el estado más reciente de historias (no necesita sincronización manual)
  const huSeleccionada = huSeleccionadaId ? (domain.historias.find(h => h.id === huSeleccionadaId) ?? null) : null

  const abrirHU  = (hu: HistoriaUsuario) => { setHuSeleccionadaId(hu.id); setHuDetailOpen(true) }
  const cerrarHU = () => { setHuDetailOpen(false); setHuSeleccionadaId(null) }

  // ── Filtros de visibilidad ────────────────────────────────
  const filtroNombresCarga = useMemo<string[] | undefined>(() => {
    if (isOwner) return undefined
    if (isAdmin && user) {
      if (user.equipoIds && user.equipoIds.length > 0) {
        const teamNombres = users.filter(u => user.equipoIds!.includes(u.id) && u.activo).map(u => u.nombre)
        return [...new Set([user.nombre, ...teamNombres])]
      }
      return undefined
    }
    if (isQALead && user) {
      if (user.equipoIds && user.equipoIds.length > 0) {
        const teamNombres = users.filter(u => user.equipoIds!.includes(u.id) && u.activo).map(u => u.nombre)
        return [...new Set([user.nombre, ...teamNombres])]
      }
      return [user.nombre]
    }
    if (verSoloPropios && user) return [user.nombre]
    return undefined
  }, [isOwner, isAdmin, isQALead, verSoloPropios, user, users])

  const historiasVisibles = domain.historias.filter(hu => {
    if (verSoloPropios && user) return hu.responsable.toLowerCase() === user.nombre.toLowerCase()
    if (isAdmin && !isOwner && user && user.equipoIds && user.equipoIds.length > 0) {
      const teamNombres = users.filter(u => user.equipoIds!.includes(u.id)).map(u => u.nombre.toLowerCase())
      return teamNombres.includes(hu.responsable.toLowerCase()) || hu.responsable.toLowerCase() === user.nombre.toLowerCase()
    }
    if (isQALead && user && user.equipoIds && user.equipoIds.length > 0) {
      const teamNombres = users.filter(u => user.equipoIds!.includes(u.id)).map(u => u.nombre.toLowerCase())
      return teamNombres.includes(hu.responsable.toLowerCase()) || hu.responsable.toLowerCase() === user.nombre.toLowerCase()
    }
    return true
  }).filter(hu => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    const casosHU = domain.casos.filter(c => hu.casosIds.includes(c.id))
    return (
      hu.titulo.toLowerCase().includes(q) ||
      hu.codigo.toLowerCase().includes(q) ||
      hu.responsable.toLowerCase().includes(q) ||
      (hu.descripcion?.toLowerCase().includes(q) ?? false) ||
      getTipoAplicacionLabel(hu.tipoAplicacion, config.tiposAplicacion).toLowerCase().includes(q) ||
      getAmbienteLabel(hu.ambiente, config.ambientes).toLowerCase().includes(q) ||
      casosHU.some(c => c.titulo.toLowerCase().includes(q))
    )
  })

  // ── Handlers de UI que abren modales ─────────────────────
  const handleNuevaHU  = () => { setHuEditar(null); setHuFormOpen(true) }
  const handleEditarHU = (hu: HistoriaUsuario) => { setHuEditar(hu); setHuFormOpen(true) }

  const handleEliminarHU = (hu: HistoriaUsuario) => {
    setDeleteModal({
      open: true,
      titulo: "¿Eliminar Historia de Usuario?",
      subtitulo: `"${hu.titulo}" y sus ${hu.casosIds.length} caso(s) de prueba`,
      fn: () => {
        domain.handleEliminarHUConfirmado(hu)
        setDeleteModal(d => ({ ...d, open: false }))
      },
    })
  }

  const handleBulkEliminar = (ids: string[]) => {
    setDeleteModal({
      open: true,
      titulo: `¿Eliminar ${ids.length} Historia${ids.length !== 1 ? "s" : ""} de Usuario?`,
      subtitulo: "Esta acción también eliminará todos sus casos de prueba asociados",
      fn: () => {
        domain.handleBulkEliminarConfirmado(ids)
        setDeleteModal(d => ({ ...d, open: false }))
      },
    })
  }

  if (!isAuthenticated) return <LoginScreen />

  const totalBloqueoActivos =
    domain.historias.reduce((n, h) => n + h.bloqueos.filter(b => !b.resuelto).length, 0) +
    domain.casos.reduce((n, c)    => n + c.bloqueos.filter(b => !b.resuelto).length, 0) +
    domain.tareas.reduce((n, t)   => n + t.bloqueos.filter(b => !b.resuelto).length, 0)

  const tabCount = 6 + (canManageUsers ? 1 : 0)

  return (
    <div className="min-h-screen bg-background">
      <Header
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        notificaciones={notif.notificaciones.filter(n => n.destinatario === (isAdmin ? "admin" : "qa"))}
        onMarcarLeida={notif.handleMarcarLeida}
        onMarcarTodasLeidas={notif.handleMarcarTodasLeidas}
      />

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6" style={{ minHeight:"calc(100vh - 64px - 60px)" }}>
        <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-0.5 no-scrollbar">
            <TabsList className="bg-secondary" style={{ display:"grid", gridTemplateColumns:`repeat(${tabCount},1fr)`, width:"100%", maxWidth: canManageUsers ? 1150 : 1050 }}>
              <TabsTrigger value="inicio" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Home className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Inicio</span>
              </TabsTrigger>
              <TabsTrigger value="historias" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BookOpen className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Historias</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart2 className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="carga" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Carga</span>
              </TabsTrigger>
              <TabsTrigger value="bloqueos" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground relative">
                <ShieldAlert className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Bloqueos</span>
                {totalBloqueoActivos > 0 && (
                  <span style={{
                    display:"inline-flex", alignItems:"center", justifyContent:"center",
                    minWidth:16, height:16, borderRadius:999, fontSize:9, fontWeight:700,
                    background:"var(--chart-4)", color:"#fff", padding:"0 4px",
                  }}>
                    {totalBloqueoActivos}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="casos" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ClipboardList className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Casos</span>
              </TabsTrigger>
              {canManageUsers && (
                <TabsTrigger value="admin" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Settings className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="inicio" className="mt-6">
            <HomeDashboard
              historias={historiasVisibles}
              casos={domain.casos}
              tareas={domain.tareas}
              onVerHU={abrirHU}
              onIrATab={setTabActiva}
            />
          </TabsContent>

          <TabsContent value="historias" className="mt-6 space-y-4">
            <HUStatsCards historias={historiasVisibles} />
            <HistoriasTable
              historias={historiasVisibles}
              casos={domain.casos}
              onVerDetalle={abrirHU}
              onEditar={handleEditarHU}
              onEliminar={handleEliminarHU}
              onNueva={handleNuevaHU}
              canEdit={canCreateHU}
              configEtapas={config.configEtapas}
              tiposAplicacion={config.tiposAplicacion}
              ambientes={config.ambientes}
              tiposPrueba={config.tiposPrueba}
              qaUsers={qaUsers}
              onBulkCambiarEstado={domain.handleBulkCambiarEstado}
              onBulkCambiarResponsable={domain.handleBulkCambiarResponsable}
              onBulkEliminar={handleBulkEliminar}
              onImportCSV={canCreateHU ? () => setImportModalOpen(true) : undefined}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsKPIs
              historias={historiasVisibles}
              casos={domain.casos}
              tareas={domain.tareas}
              isQA={verSoloPropios}
              currentUserName={user?.nombre}
              filtroNombres={filtroNombresCarga}
              configEtapas={config.configEtapas}
              tiposAplicacion={config.tiposAplicacion}
              ambientes={config.ambientes}
              tiposPrueba={config.tiposPrueba}
            />
          </TabsContent>

          <TabsContent value="carga" className="mt-6">
            <CargaOcupacional
              tareas={domain.tareas}
              casos={domain.casos}
              historias={domain.historias}
              currentUserName={user?.nombre}
              filtroNombres={filtroNombresCarga}
            />
          </TabsContent>

          <TabsContent value="bloqueos" className="mt-6">
            <BloqueosPanel
              historias={historiasVisibles}
              casos={domain.casos}
              tareas={domain.tareas}
              onResolverBloqueoHU={domain.handleResolverBloqueo}
              onResolverBloqueoCaso={domain.handleResolverBloqueoCaso}
              onResolverBloqueoTarea={domain.handleResolverBloqueoTarea}
              onVerHU={abrirHU}
              canEdit={!verSoloPropios || !!user}
            />
          </TabsContent>

          <TabsContent value="casos" className="mt-6">
            <CasosTable
              casos={domain.casos.filter(c => {
                if (!verSoloPropios || !user) return true
                const hu = domain.historias.find(h => h.id === c.huId)
                return hu?.responsable.toLowerCase() === user.nombre.toLowerCase()
              })}
              historias={historiasVisibles}
              onVerHU={abrirHU}
              tiposPrueba={config.tiposPrueba}
            />
          </TabsContent>

          {canManageUsers && (
            <TabsContent value="admin" className="mt-4 sm:mt-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">

                {/* ── Sidebar Admin ── */}
                <div className="flex flex-row flex-wrap sm:flex-col gap-1 w-full sm:w-auto sm:min-w-47.5 shrink-0">
                  {(
                    [
                      { id: "auditoria",     label: "Auditoría",    icon: <History size={14} /> },
                      { id: "usuarios",      label: "Usuarios",      icon: <UserCog size={14} /> },
                      { id: "configuracion", label: "Configuración", icon: <Settings size={14} /> },
                    ] as const
                  ).map(sec => {
                    const active = adminSeccion === sec.id
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setAdminSeccion(sec.id)}
                        style={{
                          display:"flex", alignItems:"center", gap:8,
                          padding:"8px 12px", borderRadius:8, fontSize:13,
                          fontWeight: active ? 700 : 400,
                          border:`1px solid ${active ? "color-mix(in oklch, var(--primary) 35%, transparent)" : "transparent"}`,
                          background: active ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent",
                          color: active ? "var(--primary)" : "var(--muted-foreground)",
                          cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                        }}
                        className={active ? "" : "hover:bg-secondary/60 hover:text-foreground"}
                      >
                        {sec.icon}{sec.label}
                      </button>
                    )
                  })}

                  {adminSeccion === "configuracion" && (
                    <div className="flex flex-row flex-wrap sm:flex-col gap-1 w-full sm:mt-1 sm:pl-2.5 mt-1 pt-1 border-t border-border sm:border-t-0 sm:pt-0">
                      {(
                        [
                          { id: "roles",        label: "Roles",              icon: <UserCog size={13} /> },
                          { id: "tipos",        label: "Tipos de Aplic.",     icon: <Layers size={13} /> },
                          { id: "aplicaciones", label: "Aplicaciones",        icon: <Monitor size={13} /> },
                          { id: "ambientes",    label: "Ambientes",           icon: <Globe size={13} /> },
                          { id: "tipos_prueba", label: "Tipos de Prueba",     icon: <FlaskConical size={13} /> },
                          { id: "etapas",       label: "Etapas",              icon: <Settings2 size={13} /> },
                        ] as const
                      ).map(sub => {
                        const active = configSeccion === sub.id
                        return (
                          <button
                            key={sub.id}
                            onClick={() => setConfigSeccion(sub.id)}
                            style={{
                              display:"flex", alignItems:"center", gap:7,
                              padding:"6px 10px", borderRadius:7, fontSize:12,
                              fontWeight: active ? 700 : 400,
                              border:`1px solid ${active ? "color-mix(in oklch, var(--primary) 35%, transparent)" : "transparent"}`,
                              background: active ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent",
                              color: active ? "var(--primary)" : "var(--muted-foreground)",
                              cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                            }}
                            className={active ? "" : "hover:bg-secondary/60 hover:text-foreground"}
                          >
                            {sub.icon}{sub.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className="hidden sm:block w-px self-stretch shrink-0" style={{ background:"var(--border)" }} />
                <div className="sm:hidden h-px w-full" style={{ background:"var(--border)" }} />

                <div className="flex-1 min-w-0 w-full">
                  {adminSeccion === "auditoria" && (
                    <AuditoriaPanel historias={domain.historias} onVerHU={abrirHU} />
                  )}
                  {adminSeccion === "usuarios" && <UserManagement />}
                  {adminSeccion === "configuracion" && (
                    <>
                      {configSeccion === "roles"        && <RolesConfig />}
                      {configSeccion === "tipos"        && <TiposAplicacionConfig tipos={config.tiposAplicacion} onChange={config.handleTiposChange} />}
                      {configSeccion === "aplicaciones" && <AplicacionesConfig aplicaciones={config.aplicaciones} onChange={config.setAplicaciones} />}
                      {configSeccion === "ambientes"    && <AmbientesConfig ambientes={config.ambientes} onChange={config.setAmbientes} />}
                      {configSeccion === "tipos_prueba" && <TiposPruebaConfig tipos={config.tiposPrueba} onChange={config.setTiposPrueba} />}
                      {configSeccion === "etapas"       && <EtapasConfig config={config.configEtapas} onChange={config.setConfigEtapas} tipos={config.tiposAplicacion} />}
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
          onSubmit={hu => { domain.handleSubmitHU(hu, huEditar !== null); setHuFormOpen(false); setHuEditar(null) }}
          huEditar={huEditar}
          currentUser={user?.nombre}
          configEtapas={config.configEtapas}
          qaUsers={qaUsers}
          aplicaciones={config.aplicaciones}
          tiposAplicacion={config.tiposAplicacion}
          ambientes={config.ambientes}
          tiposPrueba={config.tiposPrueba}
        />
      )}

      <CSVImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={domain.handleImportarHUs}
        tiposAplicacion={config.tiposAplicacion}
        ambientes={config.ambientes}
        currentUser={user?.nombre}
        codigosExistentes={domain.historias.map(h => h.codigo)}
      />

      <HistoriaUsuarioDetail
        open={huDetailOpen}
        onClose={cerrarHU}
        hu={huSeleccionada}
        casos={domain.casos}
        tareas={domain.tareas}
        currentUser={user?.nombre}
        isAdmin={isAdmin}
        isQALead={isQALead}
        isQA={isQA}
        configEtapas={config.configEtapas}
        tiposAplicacion={config.tiposAplicacion}
        ambientes={config.ambientes}
        tiposPrueba={config.tiposPrueba}
        onIniciarHU={domain.handleIniciarHU}
        onCancelarHU={domain.handleCancelarHU}
        onAddCaso={domain.handleAddCaso}
        onEditarCaso={domain.handleEditarCaso}
        onEliminarCaso={domain.handleEliminarCaso}
        onEnviarCasoAprobacion={domain.handleEnviarCasoAprobacion}
        onEnviarAprobacion={domain.handleEnviarAprobacion}
        onSolicitarModificacionCaso={domain.handleSolicitarModificacionCaso}
        onHabilitarModificacionCaso={domain.handleHabilitarModificacionCaso}
        onAprobarCasos={domain.handleAprobarCasos}
        onRechazarCasos={domain.handleRechazarCasos}
        onIniciarEjecucion={domain.handleIniciarEjecucion}
        onCompletarCasoEtapa={domain.handleCompletarCasoEtapa}
        onRetestearCaso={domain.handleRetestearCaso}
        onAddTarea={domain.handleAddTarea}
        onEditarTarea={domain.handleEditarTarea}
        onEliminarTarea={domain.handleEliminarTarea}
        onCompletarTarea={domain.handleCompletarTarea}
        onBloquearTarea={domain.handleBloquearTarea}
        onDesbloquearTarea={domain.handleDesbloquearTarea}
        onAddBloqueo={domain.handleAddBloqueo}
        onResolverBloqueo={domain.handleResolverBloqueo}
        onPermitirCasosAdicionales={domain.handlePermitirCasosAdicionales}
        onAddComentarioHU={domain.handleAddComentarioHU}
        onAddComentarioCaso={domain.handleAddComentarioCaso}
      />

      <ConfirmDeleteModal
        open={deleteModal.open}
        titulo={deleteModal.titulo}
        subtitulo={deleteModal.subtitulo}
        onConfirm={deleteModal.fn}
        onCancel={() => setDeleteModal(d => ({ ...d, open: false }))}
      />

      <ToastContainer toasts={toasts} onDismiss={id => setToasts(p => p.filter(x => x.id !== id))} />

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
