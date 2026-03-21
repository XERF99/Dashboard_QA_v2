"use client"

import { useEffect } from "react"
import { useToast } from "@/lib/hooks/useToast"
import { useHUModals } from "@/lib/hooks/useHUModals"
import { useHistoriasVisibles } from "@/lib/hooks/useHistoriasVisibles"
import { Header, ToastContainer, ConfirmDeleteModal, BloqueosPanel, AuditoriaPanel, NavTabGroup } from "@/components/dashboard/shared"
import { HistoriasTable, HistoriaUsuarioDetail, HUForm, CSVImportModal, HUStatsCards } from "@/components/dashboard/historias"
import { CasosTable } from "@/components/dashboard/casos"
import { HomeDashboard, CargaOcupacional, AnalyticsKPIs } from "@/components/dashboard/analytics"
import { UserManagement } from "@/components/dashboard/usuarios"
import { RolesConfig, EtapasConfig, AplicacionesConfig, TiposAplicacionConfig, AmbientesConfig, TiposPruebaConfig, SprintsConfig } from "@/components/dashboard/config"
import { LoginScreen } from "@/components/auth/login-screen"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookOpen, Users, UserCog,
  BarChart2, Settings, ShieldAlert, History, Layers, Monitor, Globe,
  Settings2, FlaskConical, ClipboardList, Home, CalendarRange,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { HistoriaUsuario } from "@/lib/types"
import { useConfig } from "@/lib/hooks/useConfig"
import { useNotificaciones } from "@/lib/hooks/useNotificaciones"
import { useDomainData } from "@/lib/hooks/useDomainData"
import { useIsHydrated } from "@/lib/storage"
import { Skeleton } from "@/components/ui/skeleton"
import { HUDetailProvider } from "@/lib/contexts/hu-detail-context"

// ═══════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
function DashboardSkeleton() {
  return (
    <div className="space-y-6 py-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}

export default function DashboardPage() {
  const isHydrated = useIsHydrated()
  const { isAuthenticated, canManageUsers, verSoloPropios, isAdmin, isQALead, isQA, canCreateHU, isOwner, user, users, roles, pendingBlockEvents, clearBlockEvents } = useAuth()
  const qaUsers = users.filter(u => u.activo && (roles.find(r => r.id === u.rol)?.permisos.includes("canEdit") ?? false)).map(u => u.nombre)

  // ── Toasts ────────────────────────────────────────────────
  const { toasts, addToast, dismissToast } = useToast()

  // ── Hooks de dominio ──────────────────────────────────────
  const config = useConfig()
  const notif  = useNotificaciones()
  const domain = useDomainData({ user, configEtapas: config.configEtapas, addToast, addNotificacion: notif.addNotificacion })

  // ── UI state ──────────────────────────────────────────────
  const {
    tabActiva, setTabActiva,
    busqueda, setBusqueda,
    huFormOpen, setHuFormOpen,
    huDetailOpen,
    huEditar, setHuEditar,
    deleteModal, setDeleteModal,
    importModalOpen, setImportModalOpen,
    configSeccion, setConfigSeccion,
    adminSeccion, setAdminSeccion,
    huSeleccionada,
    abrirHU, cerrarHU,
    handleNuevaHU, handleEditarHU,
    handleEliminarHU, handleBulkEliminar,
  } = useHUModals({
    historias: domain.historias,
    onEliminarConfirmado: domain.handleEliminarHUConfirmado,
    onBulkEliminarConfirmado: domain.handleBulkEliminarConfirmado,
  })

  // ── Filtros de visibilidad ────────────────────────────────
  const { filtroNombresCarga, historiasVisibles } = useHistoriasVisibles({
    historias: domain.historias,
    casos: domain.casos,
    busqueda,
    isOwner,
    isAdmin,
    isQALead,
    verSoloPropios,
    user,
    users,
    tiposAplicacion: config.tiposAplicacion,
    ambientes: config.ambientes,
  })

  // ── Datos con scope de visibilidad ───────────────────────
  const casosVisibles  = domain.casos.filter(c  => historiasVisibles.some(h => h.id === c.huId))
  const tareasVisibles = domain.tareas.filter(t => historiasVisibles.some(h => h.id === t.huId))

  // ── Notificación cuando una cuenta queda bloqueada ───────
  useEffect(() => {
    if (pendingBlockEvents.length === 0) return
    pendingBlockEvents.forEach(({ nombre }) => {
      notif.addNotificacion(
        "cuenta_bloqueada",
        "Cuenta bloqueada",
        `La cuenta de ${nombre} fue bloqueada por demasiados intentos fallidos.`,
        "admin"
      )
    })
    clearBlockEvents()
  }, [pendingBlockEvents]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isHydrated) return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-3 sm:px-6">
        <DashboardSkeleton />
      </main>
    </div>
  )

  if (!isAuthenticated) return <LoginScreen />

  const totalBloqueoActivos =
    historiasVisibles.reduce((n, h) => n + h.bloqueos.filter(b => !b.resuelto).length, 0) +
    casosVisibles.reduce((n, c)    => n + c.bloqueos.filter(b => !b.resuelto).length, 0) +
    tareasVisibles.reduce((n, t)   => n + t.bloqueos.filter(b => !b.resuelto).length, 0)

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

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 min-h-[calc(100vh-124px)]">
        <Tabs value={tabActiva} onValueChange={setTabActiva} className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-0.5 no-scrollbar">
            <TabsList className="bg-secondary grid w-full" style={{ gridTemplateColumns:`repeat(${tabCount},1fr)`, maxWidth: canManageUsers ? 1150 : 1050 }}>
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
                  <span className="inline-flex items-center justify-center min-w-4 h-4 rounded-full text-[9px] font-bold bg-chart-4 text-white px-1">
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
              casos={casosVisibles}
              tareas={tareasVisibles}
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
              sprintEntidades={config.sprints}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AnalyticsKPIs
              historias={historiasVisibles}
              casos={casosVisibles}
              tareas={tareasVisibles}
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
              casos={casosVisibles}
              tareas={tareasVisibles}
              onResolverBloqueoHU={domain.handleResolverBloqueo}
              onResolverBloqueoCaso={domain.handleResolverBloqueoCaso}
              onResolverBloqueoTarea={domain.handleResolverBloqueoTarea}
              onVerHU={abrirHU}
              canEdit={!verSoloPropios || !!user}
            />
          </TabsContent>

          <TabsContent value="casos" className="mt-6">
            <CasosTable
              casos={domain.casos.filter(c => historiasVisibles.some(h => h.id === c.huId))}
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
                  <NavTabGroup
                    items={[
                      { id: "auditoria",     label: "Auditoría",    icon: <History size={14} /> },
                      { id: "usuarios",      label: "Usuarios",      icon: <UserCog size={14} /> },
                      { id: "configuracion", label: "Configuración", icon: <Settings size={14} /> },
                    ]}
                    activeId={adminSeccion}
                    onSelect={id => setAdminSeccion(id as typeof adminSeccion)}
                  />

                  {adminSeccion === "configuracion" && (
                    <div className="flex flex-row flex-wrap sm:flex-col gap-1 w-full sm:mt-1 sm:pl-2.5 mt-1 pt-1 border-t border-border sm:border-t-0 sm:pt-0">
                      <NavTabGroup
                        items={[
                          { id: "roles",        label: "Roles",              icon: <UserCog size={13} /> },
                          { id: "tipos",        label: "Tipos de Aplic.",     icon: <Layers size={13} /> },
                          { id: "aplicaciones", label: "Aplicaciones",        icon: <Monitor size={13} /> },
                          { id: "ambientes",    label: "Ambientes",           icon: <Globe size={13} /> },
                          { id: "tipos_prueba", label: "Tipos de Prueba",     icon: <FlaskConical size={13} /> },
                          { id: "etapas",       label: "Etapas",              icon: <Settings2 size={13} /> },
                          { id: "sprints",      label: "Sprints",             icon: <CalendarRange size={13} /> },
                        ]}
                        activeId={configSeccion}
                        onSelect={id => setConfigSeccion(id as typeof configSeccion)}
                        size="small"
                      />
                    </div>
                  )}
                </div>

                <div className="hidden sm:block w-px self-stretch shrink-0 bg-border" />
                <div className="sm:hidden h-px w-full bg-border" />

                <div className="flex-1 min-w-0 w-full">
                  {adminSeccion === "auditoria" && (
                    <AuditoriaPanel historias={historiasVisibles} onVerHU={abrirHU} />
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
                      {configSeccion === "sprints"      && <SprintsConfig sprints={config.sprints} onAdd={config.addSprint} onUpdate={config.updateSprint} onDelete={config.deleteSprint} />}
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
          sprints={config.sprints}
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

      <HUDetailProvider value={{
        isAdmin,
        isQALead: isQALead ?? false,
        isQA,
        currentUser: user?.nombre,
        configEtapas: config.configEtapas,
        tiposAplicacion: config.tiposAplicacion,
        ambientes: config.ambientes,
        tiposPrueba: config.tiposPrueba,
        onIniciarHU: domain.handleIniciarHU,
        onCancelarHU: domain.handleCancelarHU,
        onEnviarAprobacion: domain.handleEnviarAprobacion,
        onAprobarCasos: domain.handleAprobarCasos,
        onRechazarCasos: domain.handleRechazarCasos,
        onIniciarEjecucion: domain.handleIniciarEjecucion,
        onPermitirCasosAdicionales: domain.handlePermitirCasosAdicionales,
        onAddBloqueo: domain.handleAddBloqueo,
        onResolverBloqueo: domain.handleResolverBloqueo,
        onAddComentarioHU: domain.handleAddComentarioHU,
        onAddCaso: domain.handleAddCaso,
        onEditarCaso: domain.handleEditarCaso,
        onEliminarCaso: domain.handleEliminarCaso,
        onEnviarCasoAprobacion: domain.handleEnviarCasoAprobacion,
        onSolicitarModificacionCaso: domain.handleSolicitarModificacionCaso,
        onHabilitarModificacionCaso: domain.handleHabilitarModificacionCaso,
        onCompletarCasoEtapa: domain.handleCompletarCasoEtapa,
        onRetestearCaso: domain.handleRetestearCaso,
        onAddComentarioCaso: domain.handleAddComentarioCaso,
        onAddTarea: domain.handleAddTarea,
        onEditarTarea: domain.handleEditarTarea,
        onEliminarTarea: domain.handleEliminarTarea,
        onCompletarTarea: domain.handleCompletarTarea,
        onBloquearTarea: domain.handleBloquearTarea,
        onDesbloquearTarea: domain.handleDesbloquearTarea,
      }}>
        <HistoriaUsuarioDetail
          open={huDetailOpen}
          onClose={cerrarHU}
          hu={huSeleccionada}
          casos={domain.casos}
          tareas={domain.tareas}
        />
      </HUDetailProvider>

      <ConfirmDeleteModal
        open={deleteModal.open}
        titulo={deleteModal.titulo}
        subtitulo={deleteModal.subtitulo}
        onConfirm={deleteModal.fn}
        onCancel={() => setDeleteModal(d => ({ ...d, open: false }))}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <footer className="border-t border-border bg-card mt-8">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary">
              <span className="text-[11px] font-extrabold text-primary-foreground">QA</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground">QAControl</p>
              <p className="text-[10px] text-muted-foreground">Gestión de pruebas y control de calidad</p>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} Sistema de Control de Calidad
          </p>
        </div>
      </footer>
    </div>
  )
}
