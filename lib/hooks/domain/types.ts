import type { HistoriaUsuario, CasoPrueba, Tarea, ConfigEtapas, ResultadoDef, TipoNotificacion, RolDestinatario, Notificacion } from "@/lib/types"
import type { UserSafe } from "@/lib/auth-context"

export type ToastPayload = { type: "success" | "warning" | "error" | "info"; title: string; desc?: string }

export type AddNotificacionFn = (
  tipo: TipoNotificacion,
  titulo: string,
  descripcion: string,
  destinatario: RolDestinatario,
  extra?: Pick<Notificacion, "casoId" | "huId" | "huTitulo" | "casoTitulo">
) => void

/**
 * Contexto compartido que reciben todos los módulos de handlers de dominio.
 * Al conectar un backend, solo cambian los setters (de localStorage a llamadas API).
 */
export interface DomainCtx {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  setHistorias: (updater: (prev: HistoriaUsuario[]) => HistoriaUsuario[]) => void
  setCasos: (updater: (prev: CasoPrueba[]) => CasoPrueba[]) => void
  setTareas: (updater: (prev: Tarea[]) => Tarea[]) => void
  user: UserSafe | null
  configEtapas: ConfigEtapas
  configResultados: ResultadoDef[]
  addToast: (t: ToastPayload) => void
  addNotificacion: AddNotificacionFn
}
