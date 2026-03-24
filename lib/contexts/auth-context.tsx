"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import { api, ApiError } from "@/lib/services/api/client"

// ── Permisos disponibles ──────────────────────────────────
export type PermisoId =
  | "isSuperAdmin"     // Owner: acceso total por encima del admin
  | "canEdit"          // crear y editar casos de prueba y tareas
  | "canManageUsers"   // gestionar usuarios y roles
  | "canApproveCases"  // aprobar o rechazar casos de prueba
  | "canCreateHU"      // crear y editar Historias de Usuario
  | "verSoloPropios"   // restringe la vista a las HUs asignadas al usuario

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
  cls: string           // clases CSS para el badge
  permisos: PermisoId[]
  esBase: boolean       // true = rol del sistema, no se puede eliminar
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
  grupoId?: string | null       // null para el owner (acceso a todos los grupos)
  avatar?: string
  activo: boolean
  fechaCreacion: Date
  debeCambiarPassword: boolean  // true = debe cambiar en próximo login
  equipoIds?: string[]          // IDs de usuarios asignados a este líder
  historialConexiones?: { entrada: Date; salida?: Date }[]  // últimas 50 sesiones
  intentosFallidos?: number     // contador de intentos de login incorrectos consecutivos
  bloqueado?: boolean           // true = bloqueado por exceder intentos (requiere desbloqueo admin)
}

export type UserSafe = Omit<User, "password">

// ── Contraseña genérica para nuevos usuarios ─────────────
export const PASSWORD_GENERICA = "Qatesting1"

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

// ── Interfaz del contexto ────────────────────────────────
interface AuthContextType {
  user: UserSafe | null
  users: User[]
  roles: RoleDef[]
  isAuthenticated: boolean
  sessionLoading: boolean
  sessionExpired: boolean           // true = JWT expiró durante la sesión activa
  pendientePassword: boolean        // true = debe cambiar contraseña antes de usar el app
  pendingBlockEvents: { id: string; nombre: string }[]
  clearBlockEvents: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; debeCambiar?: boolean }>
  logout: () => void
  cambiarPassword: (actual: string, nueva: string) => { success: boolean; error?: string }
  updateProfile: (nombre: string) => { success: boolean; error?: string }
  addUser: (data: { nombre: string; email: string; rol: string }) => { success: boolean; error?: string }
  updateUser: (user: User) => { success: boolean; error?: string }
  deleteUser: (id: string) => { success: boolean; error?: string }
  toggleUserActive: (id: string) => void
  resetPassword: (userId: string) => { success: boolean; error?: string }
  desbloquearUsuario: (userId: string) => { success: boolean; error?: string }
  addRole: (data: Omit<RoleDef, "id" | "esBase">) => { success: boolean; error?: string }
  updateRole: (role: RoleDef) => { success: boolean; error?: string }
  deleteRole: (id: string) => { success: boolean; error?: string }
  // Permisos derivados del rol activo
  canEdit: boolean
  canManageUsers: boolean
  canView: boolean
  isAdmin: boolean
  isQALead: boolean
  isQA: boolean
  canApproveCases: boolean
  canCreateHU: boolean
  verSoloPropios: boolean
  isOwner: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSafe | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [users, setUsers] = usePersistedState<User[]>(STORAGE_KEYS.users, usuariosIniciales)
  const [roles, setRoles] = usePersistedState<RoleDef[]>(STORAGE_KEYS.roles, ROLES_PREDETERMINADOS)
  const [pendientePassword, setPendientePassword] = useState(false)
  const [pendingBlockEvents, setPendingBlockEvents] = useState<{ id: string; nombre: string }[]>([])

  // ── Migración: añadir rol owner y usuario owner si no existen en localStorage ──
  useEffect(() => {
    setRoles(prev => {
      let upd = prev.some(r => r.id === "owner") ? prev : [ROLES_PREDETERMINADOS[0], ...prev]
      upd = upd.map(r => {
        if (r.id === "qa_lead" && r.label === "QA Lead") return { ...r, label: "Lead" }
        if (r.id === "qa"      && r.label === "QA")      return { ...r, label: "User" }
        return r
      })
      return upd
    })
    setUsers(prev => prev.some(u => u.email === "owner@empresa.com") ? prev : [usuariosIniciales[0], ...prev])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restaurar sesión desde cookie JWT al recargar ─────
  useEffect(() => {
    api.get<{ user: UserSafe }>("/api/auth/me")
      .then(data => setUser(data.user))
      .catch(() => {})
      .finally(() => setSessionLoading(false))
  }, [])

  // ── Verificación periódica de sesión (cada 5 min) ─────
  useEffect(() => {
    if (!user) return
    const id = setInterval(async () => {
      try {
        await api.get<{ user: UserSafe }>("/api/auth/me")
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          setUser(null)
          setPendientePassword(false)
          setSessionExpired(true)
        }
      }
    }, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [user])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.bloqueadoAhora) {
          setPendingBlockEvents(prev => [...prev, { id: data.userId, nombre: data.nombre }])
        }
        return { success: false, error: data.error ?? "Error al iniciar sesión" }
      }

      setUser(data.user)
      setSessionExpired(false)
      if (data.debeCambiar) {
        setPendientePassword(true)
        return { success: true, debeCambiar: true }
      }
      setPendientePassword(false)
      return { success: true }
    } catch {
      return { success: false, error: "Error de conexión con el servidor" }
    }
  }, [])

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setUser(null)
    setPendientePassword(false)
  }, [])

  const cambiarPassword = useCallback((actual: string, nueva: string) => {
    if (!user) return { success: false, error: "No hay sesión activa" }
    const found = users.find(u => u.id === user.id)
    if (!found) return { success: false, error: "Usuario no encontrado" }
    if (found.password !== actual) return { success: false, error: "Contraseña actual incorrecta" }
    if (nueva.length < 6) return { success: false, error: "La contraseña debe tener al menos 6 caracteres" }
    if (nueva === actual) return { success: false, error: "La nueva contraseña debe ser diferente a la actual" }

    setUsers(prev => prev.map(u =>
      u.id === user.id ? { ...u, password: nueva, debeCambiarPassword: false } : u
    ))
    setUser(prev => prev ? { ...prev, debeCambiarPassword: false } : prev)
    setPendientePassword(false)
    return { success: true }
  }, [user, users])

  const addUser = useCallback((data: { nombre: string; email: string; rol: string }) => {
    const emailExists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase())
    if (emailExists) return { success: false, error: "Ya existe un usuario con este email" }

    // Solo Owner puede crear usuarios con rol Admin u Owner
    const targetRolDef   = roles.find(r => r.id === data.rol)
    const currentIsOwner = user ? (roles.find(r => r.id === user.rol)?.permisos.includes("isSuperAdmin") ?? false) : false
    if (targetRolDef?.permisos.includes("canManageUsers") && !currentIsOwner)
      return { success: false, error: "Solo un Owner puede crear usuarios con rol de Administrador" }

    // Solo puede existir un Owner en el sistema
    if (targetRolDef?.permisos.includes("isSuperAdmin")) {
      const ownerCount = users.filter(u => roles.find(r => r.id === u.rol)?.permisos.includes("isSuperAdmin")).length
      if (ownerCount >= 1) return { success: false, error: "Solo puede existir un Owner en el sistema" }
    }

    const maxId = Math.max(...users.map(u => parseInt(u.id.split("-")[1])))
    const id = `usr-${String(maxId + 1).padStart(3, "0")}`

    const newUser: User = {
      ...data,
      id,
      password: PASSWORD_GENERICA,
      activo: true,
      fechaCreacion: new Date(),
      debeCambiarPassword: true,
    }

    setUsers(prev => [...prev, newUser])
    return { success: true }
  }, [user, users, roles])

  const updateUser = useCallback((updatedUser: User) => {
    const emailExists = users.some(
      u => u.email.toLowerCase() === updatedUser.email.toLowerCase() && u.id !== updatedUser.id
    )
    if (emailExists) return { success: false, error: "Ya existe otro usuario con este email" }

    // Solo Owner puede cambiar el rol de alguien a Admin u Owner
    const targetRolDef   = roles.find(r => r.id === updatedUser.rol)
    const currentIsOwner = user ? (roles.find(r => r.id === user.rol)?.permisos.includes("isSuperAdmin") ?? false) : false
    const existingUser   = users.find(u => u.id === updatedUser.id)

    // No-owners no pueden editar al usuario Owner
    const targetIsOwnerUser = roles.find(r => r.id === (existingUser?.rol ?? ""))?.permisos.includes("isSuperAdmin") ?? false
    if (targetIsOwnerUser && !currentIsOwner) return { success: false, error: "No encontrado" }
    if (
      targetRolDef?.permisos.includes("canManageUsers") &&
      !currentIsOwner &&
      existingUser?.rol !== updatedUser.rol
    ) return { success: false, error: "Solo un Owner puede asignar el rol de Administrador" }

    // Prevenir promover a un segundo Owner
    if (
      targetRolDef?.permisos.includes("isSuperAdmin") &&
      existingUser?.rol !== updatedUser.rol
    ) {
      const ownerCount = users.filter(u => roles.find(r => r.id === u.rol)?.permisos.includes("isSuperAdmin")).length
      if (ownerCount >= 1) return { success: false, error: "Solo puede existir un Owner en el sistema" }
    }

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))

    if (user?.id === updatedUser.id) {
      if (!updatedUser.activo) {
        // La cuenta del usuario activo fue desactivada → cerrar sesión inmediatamente
        setUser(null)
        setPendientePassword(false)
      } else {
        // Rol u otros datos cambiaron → refrescar sesión para recalcular permisos
        const { password: _, ...safe } = updatedUser
        setUser(safe)
      }
    }

    return { success: true }
  }, [user, users, roles])

  const deleteUser = useCallback((id: string) => {
    if (user?.id === id) return { success: false, error: "No puedes eliminar tu propia cuenta" }

    const target = users.find(u => u.id === id)
    if (!target) return { success: false, error: "Usuario no encontrado" }

    const targetRolDef  = roles.find(r => r.id === target.rol)
    const currentRolDef = user ? roles.find(r => r.id === user.rol) : null
    const currentIsOwner = currentRolDef?.permisos.includes("isSuperAdmin") ?? false
    const targetIsOwner  = targetRolDef?.permisos.includes("isSuperAdmin") ?? false

    // Proteger owners: solo otro owner puede eliminarlos y debe quedar al menos 1
    if (targetIsOwner) {
      if (!currentIsOwner) return { success: false, error: "Solo un Owner puede eliminar a otro Owner" }
      const ownerCount = users.filter(u => {
        const rd = roles.find(r => r.id === u.rol)
        return rd?.permisos.includes("isSuperAdmin")
      }).length
      if (ownerCount <= 1) return { success: false, error: "No puedes eliminar el último Owner" }
    }

    // Proteger admins: si el actual no es owner, no puede eliminar el último admin
    if (!targetIsOwner && !currentIsOwner && targetRolDef?.permisos.includes("canManageUsers")) {
      const adminCount = users.filter(u => {
        const rd = roles.find(r => r.id === u.rol)
        return rd?.permisos.includes("canManageUsers") && !rd?.permisos.includes("isSuperAdmin")
      }).length
      if (adminCount <= 1) return { success: false, error: "No puedes eliminar el último administrador" }
    }

    setUsers(prev => prev.filter(u => u.id !== id))
    return { success: true }
  }, [user, users, roles])

  const toggleUserActive = useCallback((id: string) => {
    if (user?.id === id) return
    setUsers(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u))
  }, [user?.id])

  const updateProfile = useCallback((nombre: string) => {
    if (!user) return { success: false, error: "No hay sesión activa" }
    const trimmed = nombre.trim()
    if (!trimmed) return { success: false, error: "El nombre no puede estar vacío" }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, nombre: trimmed } : u))
    setUser(prev => prev ? { ...prev, nombre: trimmed } : prev)
    return { success: true }
  }, [user])

  const resetPassword = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return { success: false, error: "Usuario no encontrado" }

    setUsers(prev => prev.map(u =>
      u.id === userId
        ? { ...u, password: PASSWORD_GENERICA, debeCambiarPassword: true, intentosFallidos: 0, bloqueado: false }
        : u
    ))
    return { success: true }
  }, [users])

  const clearBlockEvents = useCallback(() => setPendingBlockEvents([]), [])

  const desbloquearUsuario = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return { success: false, error: "Usuario no encontrado" }
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, intentosFallidos: 0, bloqueado: false } : u
    ))
    return { success: true }
  }, [users])

  // ── CRUD Roles ──────────────────────────────────────────
  const addRole = useCallback((data: Omit<RoleDef, "id" | "esBase">) => {
    const id = data.label
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
    if (!id || roles.some(r => r.id === id))
      return { success: false, error: "Ya existe un rol con ese nombre" }
    setRoles(prev => [...prev, { ...data, id, esBase: false }])
    return { success: true }
  }, [roles])

  const updateRole = useCallback((updatedRole: RoleDef) => {
    const orig = roles.find(r => r.id === updatedRole.id)
    if (!orig) return { success: false, error: "Rol no encontrado" }
    if (updatedRole.id === "owner" && !updatedRole.permisos.includes("isSuperAdmin"))
      return { success: false, error: "El rol Owner debe mantener el permiso de Super Admin" }
    if (updatedRole.id === "admin" && !updatedRole.permisos.includes("canManageUsers"))
      return { success: false, error: "El rol Administrador debe mantener el permiso de gestión de usuarios" }
    setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r))
    return { success: true }
  }, [roles])

  const deleteRole = useCallback((id: string) => {
    const role = roles.find(r => r.id === id)
    if (!role) return { success: false, error: "Rol no encontrado" }
    if (role.esBase) return { success: false, error: "No se puede eliminar un rol base del sistema" }
    if (users.some(u => u.rol === id))
      return { success: false, error: "No se puede eliminar un rol con usuarios asignados" }
    setRoles(prev => prev.filter(r => r.id !== id))
    return { success: true }
  }, [roles, users])

  // ── Permisos derivados del rol activo ───────────────────
  const roleDef = user ? roles.find(r => r.id === user.rol) : null
  const hasPermiso = (p: PermisoId) => roleDef?.permisos.includes(p) ?? false

  const canView         = user !== null
  const canEdit         = hasPermiso("canEdit")
  const canManageUsers  = hasPermiso("canManageUsers")
  const canApproveCases = hasPermiso("canApproveCases")
  const canCreateHU     = hasPermiso("canCreateHU")
  const verSoloPropios  = hasPermiso("verSoloPropios")

  const isOwner  = hasPermiso("isSuperAdmin")

  // Compatibilidad con componentes que reciben isAdmin/isQALead/isQA
  const isAdmin  = canManageUsers
  const isQALead = canCreateHU && canApproveCases && !canManageUsers
  const isQA     = canEdit && !canCreateHU && !canManageUsers

  return (
    <AuthContext.Provider value={{
      user, users, roles, isAuthenticated: user !== null, sessionLoading, sessionExpired,
      pendientePassword,
      pendingBlockEvents, clearBlockEvents,
      login, logout, cambiarPassword, updateProfile,
      addUser, updateUser, deleteUser, toggleUserActive, resetPassword, desbloquearUsuario,
      addRole, updateRole, deleteRole,
      canEdit, canManageUsers, canView, isAdmin, isQALead, isQA,
      canApproveCases, canCreateHU, verSoloPropios, isOwner,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) throw new Error("useAuth debe usarse dentro de un AuthProvider")
  return context
}
