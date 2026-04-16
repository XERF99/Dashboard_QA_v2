"use client"

import { TabErrorBoundary, AuditoriaPanel, NavTabGroup } from "@/components/dashboard/shared"
import { AuditLogViewer } from "@/components/dashboard/shared/audit-log-viewer"
import { UserManagement } from "@/components/dashboard/usuarios"
import { RolesConfig, EtapasConfig, ResultadosConfig, AplicacionesConfig, TiposAplicacionConfig, AmbientesConfig, TiposPruebaConfig, SprintsConfig } from "@/components/dashboard/config"
import { UserCog, History, Settings, Layers, Monitor, Globe, FlaskConical, Settings2, ClipboardList, CalendarRange } from "lucide-react"
import type { HistoriaUsuario, ConfigEtapas, ResultadoDef, TipoAplicacionDef, AmbienteDef, TipoPruebaDef, Sprint } from "@/lib/types"
import type { AdminSeccion, ConfigSeccion } from "@/lib/hooks/useHUModals"

interface Props {
  adminSeccion: AdminSeccion
  setAdminSeccion: (id: AdminSeccion) => void
  configSeccion: ConfigSeccion
  setConfigSeccion: (id: ConfigSeccion) => void
  historiasVisibles: HistoriaUsuario[]
  onVerHU: (hu: HistoriaUsuario) => void
  // config
  tiposAplicacion: TipoAplicacionDef[]
  aplicaciones: string[]
  ambientes: AmbienteDef[]
  tiposPrueba: TipoPruebaDef[]
  configEtapas: ConfigEtapas
  configResultados: ResultadoDef[]
  sprints: Sprint[]
  historias: HistoriaUsuario[]
  // config handlers
  handleTiposChange: (tipos: TipoAplicacionDef[]) => void
  setAplicaciones: (apps: string[]) => void
  setAmbientes: (ambs: AmbienteDef[]) => void
  setTiposPrueba: (tipos: TipoPruebaDef[]) => void
  setConfigEtapas: (cfg: ConfigEtapas) => void
  setConfigResultados: (res: ResultadoDef[]) => void
  addSprint: (data: Omit<Sprint, "id">) => { success: boolean; error?: string }
  updateSprint: (s: Sprint) => { success: boolean; error?: string }
  deleteSprint: (id: string) => { success: boolean; error?: string }
}

export function TabAdmin({
  adminSeccion, setAdminSeccion, configSeccion, setConfigSeccion,
  historiasVisibles, onVerHU,
  tiposAplicacion, aplicaciones, ambientes, tiposPrueba,
  configEtapas, configResultados, sprints, historias,
  handleTiposChange, setAplicaciones, setAmbientes,
  setTiposPrueba, setConfigEtapas, setConfigResultados,
  addSprint, updateSprint, deleteSprint,
}: Props) {
  return (
    <TabErrorBoundary tabName="Admin">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
        {/* ── Sidebar Admin ── */}
        <div className="flex flex-row flex-wrap sm:flex-col gap-1 w-full sm:w-auto sm:min-w-47.5 shrink-0">
          <NavTabGroup
            items={[
              { id: "auditoria",     label: "Auditoría",    icon: <History size={14} /> },
              { id: "audit-log",     label: "Audit Log",    icon: <History size={14} /> },
              { id: "usuarios",      label: "Usuarios",      icon: <UserCog size={14} /> },
              { id: "configuracion", label: "Configuración", icon: <Settings size={14} /> },
            ]}
            activeId={adminSeccion}
            onSelect={id => setAdminSeccion(id as AdminSeccion)}
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
                  { id: "resultados",   label: "Resultados",          icon: <ClipboardList size={13} /> },
                  { id: "sprints",      label: "Sprints",             icon: <CalendarRange size={13} /> },
                ]}
                activeId={configSeccion}
                onSelect={id => setConfigSeccion(id as ConfigSeccion)}
                size="small"
              />
            </div>
          )}
        </div>

        <div className="hidden sm:block w-px self-stretch shrink-0 bg-border" />
        <div className="sm:hidden h-px w-full bg-border" />

        <div className="flex-1 min-w-0 w-full">
          {adminSeccion === "auditoria" && (
            <AuditoriaPanel historias={historiasVisibles} onVerHU={onVerHU} />
          )}
          {adminSeccion === "audit-log" && (
            <AuditLogViewer />
          )}
          {adminSeccion === "usuarios" && <UserManagement />}
          {adminSeccion === "configuracion" && (
            <>
              {configSeccion === "roles"        && <RolesConfig />}
              {configSeccion === "tipos"        && <TiposAplicacionConfig tipos={tiposAplicacion} onChange={handleTiposChange} />}
              {configSeccion === "aplicaciones" && <AplicacionesConfig aplicaciones={aplicaciones} onChange={setAplicaciones} />}
              {configSeccion === "ambientes"    && <AmbientesConfig ambientes={ambientes} onChange={setAmbientes} />}
              {configSeccion === "tipos_prueba" && <TiposPruebaConfig tipos={tiposPrueba} onChange={setTiposPrueba} />}
              {configSeccion === "etapas"       && <EtapasConfig config={configEtapas} onChange={setConfigEtapas} tipos={tiposAplicacion} historias={historias} />}
              {configSeccion === "resultados"   && <ResultadosConfig resultados={configResultados} onChange={setConfigResultados} />}
              {configSeccion === "sprints"      && <SprintsConfig sprints={sprints} onAdd={addSprint} onUpdate={updateSprint} onDelete={deleteSprint} />}
            </>
          )}
        </div>
      </div>
    </TabErrorBoundary>
  )
}
