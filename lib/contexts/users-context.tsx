"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import { PASSWORD_GENERICA } from "@/lib/constants"
import { usuariosIniciales, type User, type UserSafe, type RoleDef } from "./auth-context"

interface UsersContextType {
  users: User[]
  refreshUsers: () => Promise<void>
  addUser: (data: { nombre: string; email: string; rol: string; grupoId?: string | null }) => { success: boolean; error?: string }
  updateUser: (user: User) => { success: boolean; error?: string }
  deleteUser: (id: string) => { success: boolean; error?: string }
  toggleUserActive: (id: string) => void
  resetPassword: (userId: string) => { success: boolean; error?: string }
  desbloquearUsuario: (userId: string) => { success: boolean; error?: string }
}

const UsersContext = createContext<UsersContextType | undefined>(undefined)

interface UsersProviderProps {
  children: ReactNode
  currentUser: UserSafe | null
  roles: RoleDef[]
  onCurrentUserDeactivated: () => void
  onCurrentUserUpdated: (safe: UserSafe) => void
}

export function UsersProvider({ children, currentUser, roles, onCurrentUserDeactivated, onCurrentUserUpdated }: UsersProviderProps) {
  const [users, setUsers] = usePersistedState<User[]>(STORAGE_KEYS.users, usuariosIniciales)

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) return
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch {
      // silencioso
    }
  }, [])

  const addUser = useCallback((data: { nombre: string; email: string; rol: string; grupoId?: string | null }) => {
    const emailExists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase())
    if (emailExists) return { success: false, error: "Ya existe un usuario con este email" }

    const targetRolDef = roles.find(r => r.id === data.rol)
    const currentIsOwner = currentUser ? (roles.find(r => r.id === currentUser.rol)?.permisos.includes("isSuperAdmin") ?? false) : false
    if (targetRolDef?.permisos.includes("canManageUsers") && !currentIsOwner)
      return { success: false, error: "Solo un Owner puede crear usuarios con rol de Administrador" }

    if (targetRolDef?.permisos.includes("isSuperAdmin")) {
      const ownerCount = users.filter(u => roles.find(r => r.id === u.rol)?.permisos.includes("isSuperAdmin")).length
      if (ownerCount >= 1) return { success: false, error: "Solo puede existir un Owner en el sistema" }
    }

    const maxId = Math.max(...users.map(u => parseInt(u.id.split("-")[1] ?? "0")))
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
  }, [currentUser, users, roles])

  const updateUser = useCallback((updatedUser: User) => {
    const emailExists = users.some(
      u => u.email.toLowerCase() === updatedUser.email.toLowerCase() && u.id !== updatedUser.id
    )
    if (emailExists) return { success: false, error: "Ya existe otro usuario con este email" }

    const targetRolDef = roles.find(r => r.id === updatedUser.rol)
    const currentIsOwner = currentUser ? (roles.find(r => r.id === currentUser.rol)?.permisos.includes("isSuperAdmin") ?? false) : false
    const existingUser = users.find(u => u.id === updatedUser.id)

    const targetIsOwnerUser = roles.find(r => r.id === (existingUser?.rol ?? ""))?.permisos.includes("isSuperAdmin") ?? false
    if (targetIsOwnerUser && !currentIsOwner) return { success: false, error: "No encontrado" }
    if (
      targetRolDef?.permisos.includes("canManageUsers") &&
      !currentIsOwner &&
      existingUser?.rol !== updatedUser.rol
    ) return { success: false, error: "Solo un Owner puede asignar el rol de Administrador" }

    if (
      targetRolDef?.permisos.includes("isSuperAdmin") &&
      existingUser?.rol !== updatedUser.rol
    ) {
      const ownerCount = users.filter(u => roles.find(r => r.id === u.rol)?.permisos.includes("isSuperAdmin")).length
      if (ownerCount >= 1) return { success: false, error: "Solo puede existir un Owner en el sistema" }
    }

    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))

    if (currentUser?.id === updatedUser.id) {
      if (!updatedUser.activo) {
        onCurrentUserDeactivated()
      } else {
        const { password: _, ...safe } = updatedUser
        onCurrentUserUpdated(safe)
      }
    }

    return { success: true }
  }, [currentUser, users, roles, onCurrentUserDeactivated, onCurrentUserUpdated])

  const deleteUser = useCallback((id: string) => {
    if (currentUser?.id === id) return { success: false, error: "No puedes eliminar tu propia cuenta" }

    const target = users.find(u => u.id === id)
    if (!target) return { success: false, error: "Usuario no encontrado" }

    const targetRolDef = roles.find(r => r.id === target.rol)
    const currentRolDef = currentUser ? roles.find(r => r.id === currentUser.rol) : null
    const currentIsOwner = currentRolDef?.permisos.includes("isSuperAdmin") ?? false
    const targetIsOwner = targetRolDef?.permisos.includes("isSuperAdmin") ?? false

    if (targetIsOwner) {
      if (!currentIsOwner) return { success: false, error: "Solo un Owner puede eliminar a otro Owner" }
      const ownerCount = users.filter(u => {
        const rd = roles.find(r => r.id === u.rol)
        return rd?.permisos.includes("isSuperAdmin")
      }).length
      if (ownerCount <= 1) return { success: false, error: "No puedes eliminar el último Owner" }
    }

    if (!targetIsOwner && !currentIsOwner && targetRolDef?.permisos.includes("canManageUsers")) {
      const adminCount = users.filter(u => {
        const rd = roles.find(r => r.id === u.rol)
        return rd?.permisos.includes("canManageUsers") && !rd?.permisos.includes("isSuperAdmin")
      }).length
      if (adminCount <= 1) return { success: false, error: "No puedes eliminar el último administrador" }
    }

    setUsers(prev => prev.filter(u => u.id !== id))
    return { success: true }
  }, [currentUser, users, roles])

  const toggleUserActive = useCallback((id: string) => {
    if (currentUser?.id === id) return
    setUsers(prev => prev.map(u => u.id === id ? { ...u, activo: !u.activo } : u))
  }, [currentUser?.id])

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

  const desbloquearUsuario = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return { success: false, error: "Usuario no encontrado" }
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, intentosFallidos: 0, bloqueado: false } : u
    ))
    return { success: true }
  }, [users])

  return (
    <UsersContext.Provider value={{
      users, refreshUsers, addUser, updateUser, deleteUser,
      toggleUserActive, resetPassword, desbloquearUsuario,
    }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UsersContext)
  if (context === undefined) throw new Error("useUsers debe usarse dentro de un UsersProvider")
  return context
}
