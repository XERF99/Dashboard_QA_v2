"use client"

import { TabErrorBoundary } from "@/components/dashboard/shared"
import { HistoriasTable, HUStatsCards } from "@/components/dashboard/historias"
import type { HistoriaUsuario, CasoPrueba, ConfigEtapas, TipoAplicacionDef, AmbienteDef, TipoPruebaDef, Sprint, EstadoHU } from "@/lib/types"

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  onVerDetalle: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
  onNueva: () => void
  canEdit: boolean
  configEtapas: ConfigEtapas
  tiposAplicacion: TipoAplicacionDef[]
  ambientes: AmbienteDef[]
  tiposPrueba: TipoPruebaDef[]
  qaUsers: string[]
  onBulkCambiarEstado: (ids: string[], estado: EstadoHU) => void
  onBulkCambiarResponsable: (ids: string[], responsable: string) => void
  onBulkEliminar: (ids: string[]) => void
  onImportCSV?: () => void
  sprints: Sprint[]
}

export function TabHistorias({
  historias, casos, onVerDetalle, onEditar, onEliminar, onNueva,
  canEdit, configEtapas, tiposAplicacion, ambientes, tiposPrueba,
  qaUsers, onBulkCambiarEstado, onBulkCambiarResponsable,
  onBulkEliminar, onImportCSV, sprints,
}: Props) {
  return (
    <TabErrorBoundary tabName="Historias">
      <HUStatsCards historias={historias} />
      <HistoriasTable
        historias={historias}
        casos={casos}
        onVerDetalle={onVerDetalle}
        onEditar={onEditar}
        onEliminar={onEliminar}
        onNueva={onNueva}
        canEdit={canEdit}
        configEtapas={configEtapas}
        tiposAplicacion={tiposAplicacion}
        ambientes={ambientes}
        tiposPrueba={tiposPrueba}
        qaUsers={qaUsers}
        onBulkCambiarEstado={onBulkCambiarEstado}
        onBulkCambiarResponsable={onBulkCambiarResponsable}
        onBulkEliminar={onBulkEliminar}
        onImportCSV={onImportCSV}
        sprintEntidades={sprints}
      />
    </TabErrorBoundary>
  )
}
