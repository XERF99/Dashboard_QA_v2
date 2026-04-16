"use client"

import { TabErrorBoundary, BloqueosPanel } from "@/components/dashboard/shared"
import type { HistoriaUsuario, CasoPrueba, Tarea } from "@/lib/types"

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  tareas: Tarea[]
  onResolverBloqueoHU: (huId: string, bloqueoId: string, nota: string) => void
  onResolverBloqueoCaso: (casoId: string, huId: string, bloqueoId: string, nota: string) => void
  onResolverBloqueoTarea: (tareaId: string, bloqueoId: string, nota: string) => void
  onVerHU: (hu: HistoriaUsuario) => void
  canEdit: boolean
}

export function TabBloqueos(props: Props) {
  return (
    <TabErrorBoundary tabName="Bloqueos">
      <BloqueosPanel {...props} />
    </TabErrorBoundary>
  )
}
