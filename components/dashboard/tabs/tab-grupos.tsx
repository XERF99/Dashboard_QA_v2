"use client"

import dynamic from "next/dynamic"
import { TabErrorBoundary, TabSkeleton } from "@/components/dashboard/shared"

const OwnerPanel = dynamic(
  () => import("@/components/dashboard/owner/owner-panel").then(m => ({ default: m.OwnerPanel })),
  { ssr: false, loading: () => <TabSkeleton /> }
)

export function TabGrupos() {
  return (
    <TabErrorBoundary tabName="Grupos">
      <OwnerPanel />
    </TabErrorBoundary>
  )
}
