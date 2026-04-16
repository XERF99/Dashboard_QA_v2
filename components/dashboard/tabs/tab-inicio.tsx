"use client"

import dynamic from "next/dynamic"
import { TabErrorBoundary, TabSkeleton } from "@/components/dashboard/shared"
import type { HistoriaUsuario, CasoPrueba, Tarea } from "@/lib/types"

const HomeDashboard = dynamic(
  () => import("@/components/dashboard/analytics").then(m => ({ default: m.HomeDashboard })),
  { ssr: false, loading: () => <TabSkeleton /> }
)

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  tareas: Tarea[]
  onVerHU: (hu: HistoriaUsuario) => void
  onIrATab: (tab: string) => void
}

export function TabInicio({ historias, casos, tareas, onVerHU, onIrATab }: Props) {
  return (
    <TabErrorBoundary tabName="Inicio">
      <HomeDashboard
        historias={historias}
        casos={casos}
        tareas={tareas}
        onVerHU={onVerHU}
        onIrATab={onIrATab}
      />
    </TabErrorBoundary>
  )
}
