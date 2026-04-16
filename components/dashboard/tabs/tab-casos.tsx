"use client"

import { TabErrorBoundary } from "@/components/dashboard/shared"
import { CasosTable } from "@/components/dashboard/casos"
import type { HistoriaUsuario, CasoPrueba, TipoPruebaDef } from "@/lib/types"

interface Props {
  casos: CasoPrueba[]
  historias: HistoriaUsuario[]
  onVerHU: (hu: HistoriaUsuario) => void
  tiposPrueba: TipoPruebaDef[]
  onImportCSV?: () => void
}

export function TabCasos(props: Props) {
  return (
    <TabErrorBoundary tabName="Casos">
      <CasosTable {...props} />
    </TabErrorBoundary>
  )
}
