"use client"

import { Header, ToastContainer, ConfirmDeleteModal } from "@/components/dashboard/shared"
import { HistoriaUsuarioDetail, HUForm, CSVImportModal } from "@/components/dashboard/historias"
import { CSVImportCasosModal } from "@/components/dashboard/casos"
import { TabInicio, TabHistorias, TabAnalytics, TabCarga, TabBloqueos, TabCasos, TabAdmin, TabGrupos } from "@/components/dashboard/tabs"
import { LoginScreen } from "@/components/auth/login-screen"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  BookOpen, Users,
  BarChart2, Settings, ShieldAlert, Layers, Globe,
  ClipboardList, Home,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { HUDetailProvider } from "@/lib/contexts/hu-detail-context"
import { CommandPalette } from "@/components/dashboard/shared/command-palette"
import { useDashboardState } from "@/lib/hooks/useDashboardState"

// ═══════════════════════════════════════════════════════════
//  PÁGINA PRINCIPAL
// ═══════════════════════════════════════════════════════════
function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-5 w-36 rounded" />
          <Skeleton className="h-4 w-52 rounded" />
        </div>
        <div className="space-y-4 border border-border rounded-2xl p-8 bg-card">
          <Skeleton className="h-3 w-14 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-3 w-20 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg mt-2" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const s = useDashboardState()

  if (!s.isHydrated || s.sessionLoading) return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-3 sm:px-6">
        <DashboardSkeleton />
      </main>
    </div>
  )

  if (!s.isAuthenticated) return <LoginScreen />

  return (
    <div className="min-h-screen bg-background">
      <Header
        busqueda={s.busqueda}
        onBusquedaChange={s.setBusqueda}
        notificaciones={s.notif.notificaciones.filter(n => n.destinatario === (s.isAdmin ? "admin" : "qa"))}
        onMarcarLeida={s.notif.handleMarcarLeida}
        onMarcarTodasLeidas={s.notif.handleMarcarTodasLeidas}
        searchInputRef={s.searchInputRef}
        onOpenCommandPalette={() => s.setCmdPaletteOpen(true)}
      />

      <CommandPalette
        open={s.cmdPaletteOpen}
        onOpenChange={s.setCmdPaletteOpen}
        onNavigateTab={s.setTabActiva}
        onNuevaHU={s.handleNuevaHU}
        onFocusSearch={s.focusSearch}
        canCreateHU={s.canCreateHU}
        canManageUsers={s.canManageUsers}
        isOwner={s.isOwner}
      />

      <main className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 min-h-[calc(100vh-124px)]">
        {s.isOwner && s.gruposDisponibles.length > 0 && (
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground">Workspace:</span>
            <Select value={s.filtroGrupoOwner ?? "__all__"} onValueChange={v => s.setFiltroGrupoOwner(v === "__all__" ? null : v)}>
              <SelectTrigger className="h-8 w-auto min-w-45 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los workspaces</SelectItem>
                {s.gruposDisponibles.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {s.filtroGrupoOwner && (
              <span className="text-xs bg-yellow-500/20 text-yellow-600 border border-yellow-500/30 rounded px-2 py-0.5">
                {s.gruposDisponibles.find(g => g.id === s.filtroGrupoOwner)?.nombre}
              </span>
            )}
          </div>
        )}

        <Tabs value={s.tabActiva} onValueChange={s.setTabActiva} className="w-full">
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-0.5 no-scrollbar">
            <TabsList className="bg-secondary grid w-full" style={{ gridTemplateColumns:`repeat(${s.tabCount},1fr)`, maxWidth: s.canManageUsers ? 1150 : 1050 }}>
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
                {s.totalBloqueoActivos > 0 && (
                  <span className="inline-flex items-center justify-center min-w-4 h-4 rounded-full text-[9px] font-bold bg-chart-4 text-white px-1">
                    {s.totalBloqueoActivos}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="casos" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <ClipboardList className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Casos</span>
              </TabsTrigger>
              {s.canManageUsers && (
                <TabsTrigger value="admin" className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <Settings className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Admin</span>
                </TabsTrigger>
              )}
              {s.isOwner && (
                <TabsTrigger value="grupos" className="flex items-center gap-1.5 data-[state=active]:bg-amber-600 data-[state=active]:text-white">
                  <Layers className="h-4 w-4 shrink-0"/> <span className="hidden sm:inline">Grupos</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="inicio" className="mt-6">
            <TabInicio historias={s.historiasVisibles} casos={s.casosVisibles} tareas={s.tareasVisibles} onVerHU={s.abrirHU} onIrATab={s.setTabActiva} />
          </TabsContent>

          <TabsContent value="historias" className="mt-6 space-y-4">
            <TabHistorias
              historias={s.historiasVisibles} casos={s.domain.casos}
              onVerDetalle={s.abrirHU} onEditar={s.handleEditarHU} onEliminar={s.handleEliminarHU} onNueva={s.handleNuevaHU}
              canEdit={s.canCreateHU} configEtapas={s.config.configEtapas}
              tiposAplicacion={s.config.tiposAplicacion} ambientes={s.config.ambientes} tiposPrueba={s.config.tiposPrueba}
              qaUsers={s.qaUsers}
              onBulkCambiarEstado={s.domain.handleBulkCambiarEstado} onBulkCambiarResponsable={s.domain.handleBulkCambiarResponsable}
              onBulkEliminar={s.handleBulkEliminar}
              onImportCSV={s.canCreateHU ? () => s.setImportModalOpen(true) : undefined}
              sprints={s.config.sprints}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <TabAnalytics
              historias={s.historiasVisibles} casos={s.casosVisibles} tareas={s.tareasVisibles}
              isQA={s.verSoloPropios} currentUserName={s.user?.nombre} filtroNombres={s.filtroNombresCarga}
              configEtapas={s.config.configEtapas} tiposAplicacion={s.config.tiposAplicacion}
              ambientes={s.config.ambientes} tiposPrueba={s.config.tiposPrueba}
            />
          </TabsContent>

          <TabsContent value="carga" className="mt-6">
            <TabCarga tareas={s.domain.tareas} casos={s.domain.casos} historias={s.domain.historias} currentUserName={s.user?.nombre} filtroNombres={s.filtroNombresCarga} />
          </TabsContent>

          <TabsContent value="bloqueos" className="mt-6">
            <TabBloqueos
              historias={s.historiasVisibles} casos={s.casosVisibles} tareas={s.tareasVisibles}
              onResolverBloqueoHU={s.domain.handleResolverBloqueo} onResolverBloqueoCaso={s.domain.handleResolverBloqueoCaso}
              onResolverBloqueoTarea={s.domain.handleResolverBloqueoTarea}
              onVerHU={s.abrirHU} canEdit={!s.verSoloPropios || !!s.user}
            />
          </TabsContent>

          <TabsContent value="casos" className="mt-6">
            <TabCasos casos={s.casosVisibles} historias={s.historiasVisibles} onVerHU={s.abrirHU} tiposPrueba={s.config.tiposPrueba} onImportCSV={s.canCreateHU ? () => s.setImportCasosModalOpen(true) : undefined} />
          </TabsContent>

          {s.canManageUsers && (
            <TabsContent value="admin" className="mt-4 sm:mt-6">
              <TabAdmin
                adminSeccion={s.adminSeccion} setAdminSeccion={s.setAdminSeccion}
                configSeccion={s.configSeccion} setConfigSeccion={s.setConfigSeccion}
                historiasVisibles={s.historiasVisibles} onVerHU={s.abrirHU}
                tiposAplicacion={s.config.tiposAplicacion} aplicaciones={s.config.aplicaciones}
                ambientes={s.config.ambientes} tiposPrueba={s.config.tiposPrueba}
                configEtapas={s.config.configEtapas} configResultados={s.config.configResultados}
                sprints={s.config.sprints} historias={s.domain.historias}
                handleTiposChange={s.config.handleTiposChange} setAplicaciones={s.config.setAplicaciones}
                setAmbientes={s.config.setAmbientes} setTiposPrueba={s.config.setTiposPrueba}
                setConfigEtapas={s.config.setConfigEtapas} setConfigResultados={s.config.setConfigResultados}
                addSprint={s.config.addSprint} updateSprint={s.config.updateSprint} deleteSprint={s.config.deleteSprint}
              />
            </TabsContent>
          )}
          {s.isOwner && (
            <TabsContent value="grupos" className="mt-6">
              <TabGrupos />
            </TabsContent>
          )}
        </Tabs>
      </main>

      {s.canCreateHU && (
        <HUForm
          open={s.huFormOpen}
          onClose={() => { s.setHuFormOpen(false); s.setHuEditar(null) }}
          onSubmit={hu => { s.domain.handleSubmitHU(hu, s.huEditar !== null); s.setHuFormOpen(false); s.setHuEditar(null) }}
          huEditar={s.huEditar}
          currentUser={s.user?.nombre}
          configEtapas={s.config.configEtapas}
          qaUsers={s.qaUsers}
          aplicaciones={s.config.aplicaciones}
          tiposAplicacion={s.config.tiposAplicacion}
          ambientes={s.config.ambientes}
          tiposPrueba={s.config.tiposPrueba}
          sprints={s.config.sprints}
        />
      )}

      <CSVImportModal
        open={s.importModalOpen}
        onClose={() => s.setImportModalOpen(false)}
        onImport={s.domain.handleImportarHUs}
        tiposAplicacion={s.config.tiposAplicacion}
        ambientes={s.config.ambientes}
        currentUser={s.user?.nombre}
        codigosExistentes={s.domain.historias.map(h => h.codigo)}
      />

      <CSVImportCasosModal
        open={s.importCasosModalOpen}
        onClose={() => s.setImportCasosModalOpen(false)}
        onImport={s.domain.handleImportarCasos}
        historias={s.domain.historias}
        tiposPrueba={s.config.tiposPrueba}
        currentUser={s.user?.nombre}
      />

      <HUDetailProvider value={{
        isAdmin: s.isAdmin,
        isQALead: s.isQALead ?? false,
        isQA: s.isQA,
        currentUser: s.user?.nombre,
        configEtapas: s.config.configEtapas,
        configResultados: s.config.configResultados,
        tiposAplicacion: s.config.tiposAplicacion,
        ambientes: s.config.ambientes,
        tiposPrueba: s.config.tiposPrueba,
        onIniciarHU: s.domain.handleIniciarHU,
        onCancelarHU: s.domain.handleCancelarHU,
        onEnviarAprobacion: s.domain.handleEnviarAprobacion,
        onAprobarCasos: s.domain.handleAprobarCasos,
        onRechazarCasos: s.domain.handleRechazarCasos,
        onIniciarEjecucion: s.domain.handleIniciarEjecucion,
        onAvanzarEtapa: s.domain.handleAvanzarEtapa,
        onFallarHU: s.domain.handleFallarHU,
        onPermitirCasosAdicionales: s.domain.handlePermitirCasosAdicionales,
        onAddBloqueo: s.domain.handleAddBloqueo,
        onResolverBloqueo: s.domain.handleResolverBloqueo,
        onAddComentarioHU: s.domain.handleAddComentarioHU,
        onAddCaso: s.domain.handleAddCaso,
        onEditarCaso: s.domain.handleEditarCaso,
        onEliminarCaso: s.domain.handleEliminarCaso,
        onEnviarCasoAprobacion: s.domain.handleEnviarCasoAprobacion,
        onSolicitarModificacionCaso: s.domain.handleSolicitarModificacionCaso,
        onHabilitarModificacionCaso: s.domain.handleHabilitarModificacionCaso,
        onCompletarCasoEtapa: s.domain.handleCompletarCasoEtapa,
        onRetestearCaso: s.domain.handleRetestearCaso,
        onAddComentarioCaso: s.domain.handleAddComentarioCaso,
        onAddTarea: s.domain.handleAddTarea,
        onEditarTarea: s.domain.handleEditarTarea,
        onEliminarTarea: s.domain.handleEliminarTarea,
        onCompletarTarea: s.domain.handleCompletarTarea,
        onBloquearTarea: s.domain.handleBloquearTarea,
        onDesbloquearTarea: s.domain.handleDesbloquearTarea,
      }}>
        <HistoriaUsuarioDetail
          open={s.huDetailOpen}
          onClose={s.cerrarHU}
          hu={s.huSeleccionada}
          casos={s.domain.casos}
          tareas={s.domain.tareas}
        />
      </HUDetailProvider>

      <ConfirmDeleteModal
        open={s.deleteModal.open}
        titulo={s.deleteModal.titulo}
        subtitulo={s.deleteModal.subtitulo}
        onConfirm={s.deleteModal.fn}
        onCancel={() => s.setDeleteModal(d => ({ ...d, open: false }))}
      />

      <ToastContainer toasts={s.toasts} onDismiss={s.dismissToast} />

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
