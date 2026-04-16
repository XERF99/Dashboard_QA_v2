"use client"

import dynamic from "next/dynamic"
import { TabErrorBoundary, TabSkeleton } from "@/components/dashboard/shared"
import type { HistoriaUsuario, CasoPrueba, Tarea } from "@/lib/types"

const CargaOcupacional = dynamic(
  () => import("@/components/dashboard/analytics").then(m => ({ default: m.CargaOcupacional })),
  { ssr: false, loading: () => <TabSkeleton /> }
)

interface Props {
  tareas: Tarea[]
  casos: CasoPrueba[]
  historias: HistoriaUsuario[]
  currentUserName?: string
  filtroNombres?: string[]
}

export function TabCarga(props: Props) {
  return (
    <TabErrorBoundary tabName="Carga Ocupacional">
      <CargaOcupacional {...props} />
    </TabErrorBoundary>
  )
}
