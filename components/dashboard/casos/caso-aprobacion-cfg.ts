import { CheckCircle, Clock, FileText, XCircle } from "lucide-react"
import type { EstadoAprobacion } from "@/lib/types"
import type { ReactNode } from "react"
import { createElement } from "react"

// ── Configs visuales de aprobación ───────────────────────
// Extraído de casos-table.tsx (v2.75) para compartir entre row, card y filters.
export const APROBACION_CFG: Record<EstadoAprobacion, { label: string; cls: string; icon: ReactNode }> = {
  borrador:              { label: "Borrador",         cls: "bg-muted text-muted-foreground border-border",                                                                                                           icon: createElement(FileText,   { size: 10 }) },
  pendiente_aprobacion:  { label: "Pend. Aprobación", cls: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",                                              icon: createElement(Clock,      { size: 10 }) },
  aprobado:              { label: "Aprobado",         cls: "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800",                                              icon: createElement(CheckCircle,{ size: 10 }) },
  rechazado:             { label: "Rechazado",        cls: "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800",                                                          icon: createElement(XCircle,    { size: 10 }) },
}

export const APROBACION_ORDER: Record<EstadoAprobacion, number> = {
  pendiente_aprobacion: 0,
  rechazado:            1,
  borrador:             2,
  aprobado:             3,
}
