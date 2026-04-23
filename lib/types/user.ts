// ── Usuarios y grupos ───────────────────────────────────────
export interface User {
  id: string
  nombre: string
  email: string
  rol: string
  grupoId: string | null
  activo: boolean
  debeCambiarPassword: boolean
  bloqueado: boolean
  fechaCreacion: Date
  historialConexiones: unknown[]
}

export interface Grupo {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
  createdAt: Date
}
