import { PASSWORD_GENERICA } from "@/lib/constants"

// ── Permisos disponibles ──────────────────────────────────
export type PermisoId =
  | "isSuperAdmin"
  | "canEdit"
  | "canManageUsers"
  | "canApproveCases"
  | "canCreateHU"
  | "verSoloPropios"

export const PERMISOS_INFO: Record<PermisoId, { label: string; description: string }> = {
  isSuperAdmin:    { label: "Owner (Super Admin)", description: "Acceso total: puede gestionar admins y ver historial de conexiones" },
  canEdit:         { label: "Editar contenido",    description: "Crear y editar casos de prueba y tareas" },
  canManageUsers:  { label: "Gestionar usuarios",  description: "Crear, editar y eliminar usuarios y roles" },
  canApproveCases: { label: "Aprobar casos",        description: "Aprobar o rechazar casos de prueba" },
  canCreateHU:     { label: "Gestionar HUs",        description: "Crear y editar Historias de Usuario" },
  verSoloPropios:  { label: "Ver solo propios",     description: "Restringe la vista a las HUs asignadas al usuario" },
}

// ── Definición de rol configurable ───────────────────────
export interface RoleDef {
  id: string
  label: string
  description: string
  cls: string
  permisos: PermisoId[]
  esBase: boolean
}

// ── Roles predeterminados ─────────────────────────────────
export const ROLES_PREDETERMINADOS: RoleDef[] = [
  {
    id: "owner",
    label: "Owner",
    description: "Acceso total por encima del Admin: gestiona todos los usuarios incluyendo admins y ve historial de conexiones",
    cls: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
    permisos: ["isSuperAdmin", "canEdit", "canManageUsers", "canApproveCases", "canCreateHU"],
    esBase: true,
  },
  {
    id: "admin",
    label: "Administrador",
    description: "Gestiona todo: HUs, usuarios, aprobaciones y configuración",
    cls: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    permisos: ["canEdit", "canManageUsers", "canApproveCases", "canCreateHU"],
    esBase: true,
  },
  {
    id: "qa_lead",
    label: "Lead",
    description: "Crea HUs, gestiona todo el equipo QA y aprueba casos de prueba",
    cls: "bg-purple-500/20 text-purple-500 border-purple-500/30",
    permisos: ["canEdit", "canApproveCases", "canCreateHU"],
    esBase: true,
  },
  {
    id: "qa",
    label: "User",
    description: "Crea y ejecuta casos de prueba sobre las HU asignadas",
    cls: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    permisos: ["canEdit", "verSoloPropios"],
    esBase: true,
  },
  {
    id: "viewer",
    label: "Visualizador",
    description: "Ve todos los cambios pero sin poder editarlos",
    cls: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    permisos: [],
    esBase: true,
  },
]

// ── Tipo de rol — string para soportar roles personalizados ─
export type UserRole = string

// ── Modelo de usuario ─────────────────────────────────────
export interface User {
  id: string
  nombre: string
  email: string
  password: string
  rol: string
  grupoId?: string | null
  avatar?: string
  activo: boolean
  fechaCreacion: Date
  debeCambiarPassword: boolean
  historialConexiones?: { entrada: Date; salida?: Date }[]
  intentosFallidos?: number
  bloqueado?: boolean
}

export type UserSafe = Omit<User, "password">

export { PASSWORD_GENERICA }

// ── Usuarios iniciales ───────────────────────────────────
export const usuariosIniciales: User[] = [
  {
    id: "usr-000", nombre: "Owner Principal",
    email: "owner@empresa.com", password: "owner123",
    rol: "owner", activo: true,
    fechaCreacion: new Date("2025-12-01"),
    debeCambiarPassword: false,
  },
  {
    id: "usr-001", nombre: "Admin Principal",
    email: "admin@empresa.com", password: "admin123",
    rol: "admin", activo: true,
    fechaCreacion: new Date("2026-01-01"),
    debeCambiarPassword: false,
  },
  {
    id: "usr-002", nombre: "Laura Mendez",
    email: "laura.mendez@empresa.com", password: "laura123",
    rol: "qa_lead", activo: true,
    fechaCreacion: new Date("2026-01-10"),
    debeCambiarPassword: false,
  },
  {
    id: "usr-006", nombre: "Maria Garcia",
    email: "maria.garcia@empresa.com", password: "maria123",
    rol: "qa", activo: true,
    fechaCreacion: new Date("2026-01-15"),
    debeCambiarPassword: false,
  },
  {
    id: "usr-003", nombre: "Carlos Lopez",
    email: "carlos.lopez@empresa.com", password: "carlos123",
    rol: "viewer", activo: true,
    fechaCreacion: new Date("2026-02-01"),
    debeCambiarPassword: false,
  },
  {
    id: "usr-004", nombre: "Ana Martinez",
    email: "ana.martinez@empresa.com", password: "ana123",
    rol: "qa", activo: true,
    fechaCreacion: new Date("2026-02-10"),
    debeCambiarPassword: false,
  },
  {
    id: "usr-005", nombre: "Pedro Sanchez",
    email: "pedro.sanchez@empresa.com", password: "pedro123",
    rol: "viewer", activo: false,
    fechaCreacion: new Date("2026-02-15"),
    debeCambiarPassword: false,
  },
]
