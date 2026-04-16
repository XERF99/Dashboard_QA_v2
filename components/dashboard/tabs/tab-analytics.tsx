"use client"

import dynamic from "next/dynamic"
import { TabErrorBoundary, TabSkeleton } from "@/components/dashboard/shared"
import type { HistoriaUsuario, CasoPrueba, Tarea, ConfigEtapas, TipoAplicacionDef, AmbienteDef, TipoPruebaDef } from "@/lib/types"

const AnalyticsKPIs = dynamic(
  () => import("@/components/dashboard/analytics").then(m => ({ default: m.AnalyticsKPIs })),
  { ssr: false, loading: () => <TabSkeleton /> }
)

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  tareas: Tarea[]
  isQA: boolean
  currentUserName?: string
  filtroNombres?: string[]
  configEtapas: ConfigEtapas
  tiposAplicacion: TipoAplicacionDef[]
  ambientes: AmbienteDef[]
  tiposPrueba: TipoPruebaDef[]
}

export function TabAnalytics(props: Props) {
  return (
    <TabErrorBoundary tabName="Analytics">
      <AnalyticsKPIs {...props} />
    </TabErrorBoundary>
  )
}
