"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

// Tipos de roles
export type UserRole = "admin" | "editor" | "viewer"

export interface User {
  id: string
  nombre: string
  email: string
  password: string // Contrasena del usuario
  rol: UserRole
  avatar?: string
  activo: boolean // Si el usuario esta activo
  fechaCreacion: Date
}

// Usuario sin contrasena (para mostrar en UI)
export type UserSafe = Omit<User, "password">

// Usuarios iniciales con contrasenas
// En produccion esto vendria de una base de datos con contrasenas hasheadas
export const usuariosIniciales: User[] = [
  {
    id: "usr-001",
    nombre: "Admin Principal",
    email: "admin@empresa.com",
    password: "admin123",
    rol: "admin",
    activo: true,
    fechaCreacion: new Date("2026-01-01")
  },
  {
    id: "usr-002",
    nombre: "Maria Garcia",
    email: "maria.garcia@empresa.com",
    password: "maria123",
    rol: "editor",
    activo: true,
    fechaCreacion: new Date("2026-01-15")
  },
  {
    id: "usr-003",
    nombre: "Carlos Lopez",
    email: "carlos.lopez@empresa.com",
    password: "carlos123",
    rol: "viewer",
    activo: true,
    fechaCreacion: new Date("2026-02-01")
  },
  {
    id: "usr-004",
    nombre: "Ana Martinez",
    email: "ana.martinez@empresa.com",
    password: "ana123",
    rol: "editor",
    activo: true,
    fechaCreacion: new Date("2026-02-10")
  },
  {
    id: "usr-005",
    nombre: "Pedro Sanchez",
    email: "pedro.sanchez@empresa.com",
    password: "pedro123",
    rol: "viewer",
    activo: false,
    fechaCreacion: new Date("2026-02-15")
  }
]

interface AuthContextType {
  user: UserSafe | null
  users: User[]
  isAuthenticated: boolean
  login: (email: string, password: string) => { success: boolean; error?: string }
  logout: () => void
  addUser: (user: Omit<User, "id" | "fechaCreacion">) => { success: boolean; error?: string }
  updateUser: (user: User) => { success: boolean; error?: string }
  deleteUser: (id: string) => { success: boolean; error?: string }
  toggleUserActive: (id: string) => void
  canEdit: boolean
  canManageUsers: boolean
  canView: boolean
  verSoloPropios: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSafe | null>(null)
  const [users, setUsers] = useState<User[]>(usuariosIniciales)

  const login = useCallback((email: string, password: string) => {
    // Buscar usuario por email (case insensitive)
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    
    if (!foundUser) {
      return { success: false, error: "Usuario no encontrado" }
    }

    if (!foundUser.activo) {
      return { success: false, error: "Tu cuenta esta desactivada. Contacta al administrador." }
    }

    // Verificar contrasena
    if (foundUser.password !== password) {
      return { success: false, error: "Contrasena incorrecta" }
    }

    // Login exitoso - guardar usuario sin contrasena
    const { password: _, ...userSafe } = foundUser
    setUser(userSafe)
    return { success: true }
  }, [users])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  const addUser = useCallback((newUser: Omit<User, "id" | "fechaCreacion">) => {
    // Verificar si el email ya existe
    const emailExists = users.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())
    if (emailExists) {
      return { success: false, error: "Ya existe un usuario con este email" }
    }

    // Generar ID unico
    const maxId = Math.max(...users.map(u => parseInt(u.id.split("-")[1])))
    const id = `usr-${String(maxId + 1).padStart(3, "0")}`
    
    const userToAdd: User = {
      ...newUser,
      id,
      fechaCreacion: new Date()
    }
    
    setUsers(prev => [...prev, userToAdd])
    return { success: true }
  }, [users])

  const updateUser = useCallback((updatedUser: User) => {
    // Verificar si el email ya existe en otro usuario
    const emailExists = users.some(
      u => u.email.toLowerCase() === updatedUser.email.toLowerCase() && u.id !== updatedUser.id
    )
    if (emailExists) {
      return { success: false, error: "Ya existe otro usuario con este email" }
    }

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
    
    // Si el usuario actualizado es el usuario actual, actualizar sesion
    if (user?.id === updatedUser.id) {
      const { password: _, ...userSafe } = updatedUser
      setUser(userSafe)
    }
    
    return { success: true }
  }, [user?.id, users])

  const deleteUser = useCallback((id: string) => {
    // No puede eliminarse a si mismo
    if (user?.id === id) {
      return { success: false, error: "No puedes eliminar tu propia cuenta" }
    }

    // Verificar que no sea el ultimo admin
    const userToDelete = users.find(u => u.id === id)
    if (userToDelete?.rol === "admin") {
      const adminCount = users.filter(u => u.rol === "admin").length
      if (adminCount <= 1) {
        return { success: false, error: "No puedes eliminar el ultimo administrador" }
      }
    }

    setUsers(prev => prev.filter(u => u.id !== id))
    return { success: true }
  }, [user?.id, users])

  const toggleUserActive = useCallback((id: string) => {
    // No puede desactivarse a si mismo
    if (user?.id === id) return

    setUsers(prev => prev.map(u => 
      u.id === id ? { ...u, activo: !u.activo } : u
    ))
  }, [user?.id])

    // Permisos basados en rol
  const canView = user !== null
  const canEdit = user?.rol === "admin" || user?.rol === "editor"
  const canManageUsers = user?.rol === "admin"
  // Solo el admin ve TODOS los cambios; editor/QA solo ve los suyos
  const verSoloPropios = user?.rol === "editor"

  return (
    <AuthContext.Provider value={{
      user,
      users,
      isAuthenticated: user !== null,
      login,
      logout,
      addUser,
      updateUser,
      deleteUser,
      toggleUserActive,
      canEdit,
      canManageUsers,
      canView,
      verSoloPropios
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}

// Descripciones de roles para UI
export const roleDescriptions: Record<UserRole, { label: string; description: string }> = {
  admin: {
    label: "Administrador",
    description: "Ve y edita todos los cambios, gestiona usuarios"
  },
  editor: {
    label: "QA",
    description: "Ve y edita solo los cambios asignados a su nombre"
  },
  viewer: {
    label: "Visualizador",
    description: "Ve todos los cambios pero sin poder editarlos"
  }
}
