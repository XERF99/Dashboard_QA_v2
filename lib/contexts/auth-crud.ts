"use client"

import { useCallback } from "react"
import type { User, UserSafe, RoleDef } from "./auth-types"
import { PASSWORD_GENERICA } from "./auth-types"

interface CrudDeps {
  user: UserSafe | null
  users: User[]
  roles: RoleDef[]
  setUser: React.Dispatch<React.SetStateAction<UserSafe | null>>
  setUsers: (fn: (prev: User[]) => User[]) => void
  setRoles: (fn: (prev: RoleDef[]) => RoleDef[]) => void
  setPendientePassword: React.Dispatch<React.SetStateAction<boolean>>
}

export function useUserCrud({ user, users, roles, setUser, setUsers, setPendientePassword }: CrudDeps) {
  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) return
      const data = await res.json()
      if (data.users) setUsers(() => data.users)
    } catch { /* silencioso */ }
  }, [])

  const addUser = useCallback((data: { nombre: string; email: string; rol: string; grupoId?: string | null }) => {
    const emailExists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase())
    if (emailExists) return { success: false, error: "Ya existe un usuario con este email" }

    const targetRolDef   = roles.find(r => r.id === data.rol)
    const currentIsOwner = user ? (roles.find(r => r.id === user.rol)?.permisos.includes("isSuperAdmin") ?? false) : false
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
  }, [user, users, roles])

  const updateUser = useCallback((updatedUser: User) => {
    const emailExists = users.some(
      u => u.email.toLowerCase() === updatedUser.email.toLowerCase() && u.id !== updatedUser.id
    )
    if (emailExists) return { success: false, error: "Ya existe otro usuario con este email" }

    const targetRolDef   = roles.find(r => r.id === updatedUser.rol)
    const currentIsOwner = user ? (roles.find(r => r.id === user.rol)?.permisos.includes("isSuperAdmin") ?? false) : false
    const existingUser   = users.find(u => u.id === updatedUser.id)

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

    if (user?.id === updatedUser.id) {
      if (!updatedUser.activo) {
        setUser(null)
        setPendientePassword(false)
      } else {
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

  const desbloquearUsuario = useCallback((userId: string) => {
    const target = users.find(u => u.id === userId)
    if (!target) return { success: false, error: "Usuario no encontrado" }
    setUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, intentosFallidos: 0, bloqueado: false } : u
    ))
    return { success: true }
  }, [users])

  return { refreshUsers, addUser, updateUser, deleteUser, toggleUserActive, updateProfile, resetPassword, desbloquearUsuario }
}

export function useRoleCrud({ users, roles, setRoles }: Pick<CrudDeps, "users" | "roles" | "setRoles">) {
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

  return { addRole, updateRole, deleteRole }
}
