"use client"

import { createContext, useContext, type ReactNode } from "react"
import type {
  CasoPrueba, Tarea, Bloqueo, EtapaEjecucion,
  ConfigEtapas, TipoAplicacionDef, AmbienteDef, TipoPruebaDef,
} from "@/lib/types"

// ── Tipo del contexto ──────────────────────────────────────────
export type HUDetailCtxType = {
  // Permisos del usuario actual
  isAdmin: boolean
  isQALead: boolean
  isQA: boolean
  currentUser?: string

  // Configuración
  configEtapas: ConfigEtapas
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
  tiposPrueba?: TipoPruebaDef[]

  // Handlers — HU
  onIniciarHU: (huId: string) => void
  onCancelarHU: (huId: string, motivo: string) => void
  onEnviarAprobacion: (huId: string) => void
  onAprobarCasos: (huId: string) => void
  onRechazarCasos: (huId: string, motivo: string) => void
  onIniciarEjecucion: (huId: string, etapa: EtapaEjecucion) => void
  onPermitirCasosAdicionales: (huId: string, motivo: string) => void
  onAddBloqueo: (huId: string, b: Bloqueo) => void
  onResolverBloqueo: (huId: string, bId: string, nota: string) => void
  onAddComentarioHU: (huId: string, texto: string) => void

  // Handlers — Caso
  onAddCaso: (caso: CasoPrueba) => void
  onEditarCaso: (caso: CasoPrueba) => void
  onEliminarCaso: (casoId: string, huId: string) => void
  onEnviarCasoAprobacion: (casoId: string, huId: string) => void
  onSolicitarModificacionCaso: (casoId: string, huId: string) => void
  onHabilitarModificacionCaso: (casoId: string, huId: string) => void
  onCompletarCasoEtapa: (casoId: string, etapa: EtapaEjecucion, resultado: "exitoso" | "fallido", comentarioFallo?: string) => void
  onRetestearCaso: (casoId: string, etapa: EtapaEjecucion, comentarioCorreccion: string) => void
  onAddComentarioCaso: (casoId: string, texto: string) => void

  // Handlers — Tarea
  onAddTarea: (tarea: Tarea) => void
  onEditarTarea: (tarea: Tarea) => void
  onEliminarTarea: (tareaId: string, casoId: string) => void
  onCompletarTarea: (tareaId: string, resultado: "exitoso" | "fallido") => void
  onBloquearTarea: (tareaId: string, bloqueo: Bloqueo) => void
  onDesbloquearTarea: (tareaId: string, bloqueoId: string) => void
}

const HUDetailContext = createContext<HUDetailCtxType | null>(null)

// ── Provider ───────────────────────────────────────────────────
export function HUDetailProvider({
  children,
  value,
}: {
  children: ReactNode
  value: HUDetailCtxType
}) {
  return (
    <HUDetailContext.Provider value={value}>
      {children}
    </HUDetailContext.Provider>
  )
}

// ── Hook de consumo ────────────────────────────────────────────
export function useHUDetail(): HUDetailCtxType {
  const ctx = useContext(HUDetailContext)
  if (!ctx) throw new Error("useHUDetail must be used inside HUDetailProvider")
  return ctx
}
