// ── Notificaciones ──────────────────────────────────────────
export type TipoNotificacion =
  | "aprobacion_enviada"
  | "modificacion_solicitada"
  | "caso_aprobado"
  | "caso_rechazado"
  | "modificacion_habilitada"
  | "cuenta_bloqueada"
  | "bloqueo_reportado"
  | "bloqueo_resuelto"

export type RolDestinatario = "admin" | "qa"

export interface Notificacion {
  id: string
  tipo: TipoNotificacion
  titulo: string
  descripcion: string
  fecha: Date
  leida: boolean
  destinatario: RolDestinatario
  grupoId?: string
  casoId?: string
  huId?: string
  huTitulo?: string
  casoTitulo?: string
}
