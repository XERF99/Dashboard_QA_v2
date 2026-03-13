"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

// ── Roles ────────────────────────────────────────────────
export type UserRole = "admin" | "qa" | "viewer"

// ── Modelo de usuario ────────────────────────────────────
export interface User {
  id: string
  nombre: string
  email: string
  password: string
  rol: UserRole
  avatar?: string
  activo: boolean
  fechaCreacion: Date
  debeCambiarPassword: boolean  // true = debe cambiar en próximo login
}

export type UserSafe = Omit<User, "password">

// ── Contraseña genérica para nuevos usuarios ─────────────
export const PASSWORD_GENERICA = "TCS2024"

// ── Usuarios iniciales ───────────────────────────────────
export const usuariosIniciales: User[] = [
  {
    id: "usr-001", nombre: "Admin Principal",
    email: "admin@empresa.com", password: "admin123",
    rol: "admin", activo: true,
    fechaCreacion: new Date("2026-01-01"),
    debeCambiarPassword: false,
  },
  {
    id: "usr-002", nombre: "Maria Garcia",
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
  isAuthenticated: boolean
  pendientePassword: boolean        // true = debe cambiar contraseña antes de usar el app
  login: (email: string, password: string) => { success: boolean; error?: string; debeCambiar?: boolean }
  logout: () => void
  cambiarPassword: (actual: string, nueva: string) => { success: boolean; error?: string }
  addUser: (data: { nombre: string; email: string; rol: UserRole }) => { success: boolean; error?: string }
  updateUser: (user: User) => { success: boolean; error?: string }
  deleteUser: (id: string) => { success: boolean; error?: string }
  toggleUserActive: (id: string) => void
  resetPassword: (userId: string) => { success: boolean; error?: string }
  // Permisos
  canEdit: boolean           // admin puede hacer todo, QA puede crear casos/tareas
  canManageUsers: boolean    // solo admin
  canView: boolean           // todos
  isAdmin: boolean
  isQA: boolean
  verSoloPropios: boolean    // QA solo ve lo asignado a él
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSafe | null>(null)
  const [users, setUsers] = useState<User[]>(usuariosIniciales)
  const [pendientePassword, setPendientePassword] = useState(false)

  const login = useCallback((email: string, password: string) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (!found) return { success: false, error: "Usuario no encontrado" }
    if (!found.activo) return { success: false, error: "Tu cuenta está desactivada. Contacta al administrador." }
    if (found.password !== password) return { success: false, error: "Contraseña incorrecta" }

    const { password: _, ...safe } = found
    setUser(safe)

    if (found.debeCambiarPassword) {
      setPendientePassword(true)
      return { success: true, debeCambiar: true }
    }

    setPendientePassword(false)
    return { success: true }
  }, [users])

  const logout = useCallback(() => {
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

  const addUser = useCallback((data: { nombre: string; email: string; rol: UserRole }) => {
    const emailExists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase())
    if (emailExists) return { success: false, error: "Ya existe un usuario con este email" }

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
  }, [users])

  const updateUser = useCallback((updatedUser: User) => {
    const emailExists = users.some(
      u => u.email.toLowerCase() === updatedUser.email.toLowerCase() && u.id !== updatedUser.id
    )
    if (emailExists) return { success: false, error: "Ya existe otro usuario con este email" }

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))

    if (user?.id === updatedUser.id) {
      const { password: _, ...safe } = updatedUser
      setUser(safe)
    }

    return { success: true }
  }, [user?.id, users])

  const deleteUser = useCallback((id: string) => {
    if (user?.id === id) return { success: false, error: "No puedes eliminar tu propia cuenta" }

    const target = users.find(u => u.id === id)
    if (target?.rol === "admin") {
      const adminCount = users.filter(u => u.rol === "admin").length
      if (adminCount <= 1) return { success: false, error: "No puedes eliminar el último administrador" }
    }

    setUsers(prev => prev.filter(u => u.id !== id))
    return { success: true }
  }, [user?.id, users])

  const toggleUserActive = useCallback((id: string) => {
    if (user?.id === id) return
    setUsers(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u))
  }, [user?.id])

  const resetPassword = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return { success: false, error: "Usuario no encontrado" }

    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, password: PASSWORD_GENERICA, debeCambiarPassword: true } : u
    ))
    return { success: true }
  }, [users])

  // ── Permisos basados en rol ──
  const canView = user !== null
  const isAdmin = user?.rol === "admin"
  const isQA = user?.rol === "qa"
  const canEdit = isAdmin || isQA
  const canManageUsers = isAdmin
  const verSoloPropios = isQA

  return (
    <AuthContext.Provider value={{
      user, users, isAuthenticated: user !== null,
      pendientePassword,
      login, logout, cambiarPassword,
      addUser, updateUser, deleteUser, toggleUserActive, resetPassword,
      canEdit, canManageUsers, canView, isAdmin, isQA, verSoloPropios,
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

// ── Descripciones de roles para UI ───────────────────────
export const roleDescriptions: Record<UserRole, { label: string; description: string }> = {
  admin: {
    label: "Administrador",
    description: "Gestiona todo: HUs, usuarios, aprobaciones y configuración",
  },
  qa: {
    label: "QA",
    description: "Crea y ejecuta casos de prueba sobre las HU asignadas",
  },
  viewer: {
    label: "Visualizador",
    description: "Ve todos los cambios pero sin poder editarlos",
  },
}
