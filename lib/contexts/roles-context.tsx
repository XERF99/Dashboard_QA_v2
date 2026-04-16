"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import { ROLES_PREDETERMINADOS, type RoleDef } from "./auth-context"

interface RolesContextType {
  roles: RoleDef[]
  addRole: (data: Omit<RoleDef, "id" | "esBase">) => { success: boolean; error?: string }
  updateRole: (role: RoleDef) => { success: boolean; error?: string }
  deleteRole: (id: string) => { success: boolean; error?: string }
}

const RolesContext = createContext<RolesContextType | undefined>(undefined)

export function RolesProvider({ children, users }: { children: ReactNode; users: { rol: string }[] }) {
  const [roles, setRoles] = usePersistedState<RoleDef[]>(STORAGE_KEYS.roles, ROLES_PREDETERMINADOS)

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

  return (
    <RolesContext.Provider value={{ roles, addRole, updateRole, deleteRole }}>
      {children}
    </RolesContext.Provider>
  )
}

export function useRoles() {
  const context = useContext(RolesContext)
  if (context === undefined) throw new Error("useRoles debe usarse dentro de un RolesProvider")
  return context
}
