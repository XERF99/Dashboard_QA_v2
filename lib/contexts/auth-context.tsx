"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import { api, ApiError } from "@/lib/services/api/client"
import {
  type PermisoId, type RoleDef, type User, type UserSafe,
  PERMISOS_INFO, ROLES_PREDETERMINADOS, usuariosIniciales, PASSWORD_GENERICA,
} from "./auth-types"
import { useUserCrud, useRoleCrud } from "./auth-crud"

// Re-export types & constants so existing consumers don't break
export {
  type PermisoId, type RoleDef, type User, type UserSafe, type UserRole,
  PERMISOS_INFO, ROLES_PREDETERMINADOS, usuariosIniciales, PASSWORD_GENERICA,
} from "./auth-types"

// ── Interfaz del contexto ────────────────────────────────
interface AuthContextType {
  user: UserSafe | null
  users: User[]
  roles: RoleDef[]
  isAuthenticated: boolean
  sessionLoading: boolean
  sessionExpired: boolean
  pendientePassword: boolean
  pendingBlockEvents: { id: string; nombre: string }[]
  clearBlockEvents: () => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; debeCambiar?: boolean }>
  logout: () => void
  cambiarPassword: (actual: string, nueva: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (nombre: string) => { success: boolean; error?: string }
  refreshUsers: () => Promise<void>
  addUser: (data: { nombre: string; email: string; rol: string; grupoId?: string | null }) => { success: boolean; error?: string }
  updateUser: (user: User) => { success: boolean; error?: string }
  deleteUser: (id: string) => { success: boolean; error?: string }
  toggleUserActive: (id: string) => void
  resetPassword: (userId: string) => { success: boolean; error?: string }
  desbloquearUsuario: (userId: string) => { success: boolean; error?: string }
  addRole: (data: Omit<RoleDef, "id" | "esBase">) => { success: boolean; error?: string }
  updateRole: (role: RoleDef) => { success: boolean; error?: string }
  deleteRole: (id: string) => { success: boolean; error?: string }
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

  // ── Migración: añadir rol owner y usuario owner si no existen ──
  useEffect(() => {
    setRoles(prev => {
      let upd = prev.some(r => r.id === "owner") ? prev : [ROLES_PREDETERMINADOS[0]!, ...prev]
      upd = upd.map(r => {
        if (r.id === "qa_lead" && r.label === "QA Lead") return { ...r, label: "Lead" }
        if (r.id === "qa"      && r.label === "QA")      return { ...r, label: "User" }
        return r
      })
      return upd
    })
    setUsers(prev => prev.some(u => u.email === "owner@empresa.com") ? prev : [usuariosIniciales[0]!, ...prev])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restaurar sesión desde cookie JWT ─────────────────
  useEffect(() => {
    api.get<{ user: UserSafe }>("/api/auth/me")
      .then(data => setUser(data.user))
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          setSessionExpired(true)
        }
      })
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
          try {
            const res = await fetch("/api/auth/refresh", { method: "POST" })
            if (res.ok) {
              const data = await res.json()
              setUser(data.user)
              return
            }
          } catch { /* silent refresh failed */ }
          setUser(null)
          setPendientePassword(false)
          setSessionExpired(true)
        } else if (err instanceof ApiError && err.status === 403) {
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

  const cambiarPassword = useCallback(async (actual: string, nueva: string) => {
    if (!user) return { success: false, error: "No hay sesión activa" }
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nueva }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) return { success: false, error: (data as { error?: string }).error ?? "Error al cambiar contraseña" }
      setUser(prev => prev ? { ...prev, debeCambiarPassword: false } : prev)
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, password: nueva, debeCambiarPassword: false } : u
      ))
      setPendientePassword(false)
      return { success: true }
    } catch {
      return { success: false, error: "Error de conexión con el servidor" }
    }
  }, [user])

  const clearBlockEvents = useCallback(() => setPendingBlockEvents([]), [])

  // ── CRUD delegado a hooks extraídos ─────────────────────
  const userCrud = useUserCrud({ user, users, roles, setUser, setUsers, setRoles, setPendientePassword })
  const roleCrud = useRoleCrud({ users, roles, setRoles })

  // ── Permisos derivados del rol activo ───────────────────
  const roleDef = user ? roles.find(r => r.id === user.rol) : null
  const hasPermiso = (p: PermisoId) => roleDef?.permisos.includes(p) ?? false

  const canView         = user !== null
  const canEdit         = hasPermiso("canEdit")
  const canManageUsers  = hasPermiso("canManageUsers")
  const canApproveCases = hasPermiso("canApproveCases")
  const canCreateHU     = hasPermiso("canCreateHU")
  const verSoloPropios  = hasPermiso("verSoloPropios")
  const isOwner         = hasPermiso("isSuperAdmin")
  const isAdmin         = canManageUsers
  const isQALead        = canCreateHU && canApproveCases && !canManageUsers
  const isQA            = canEdit && !canCreateHU && !canManageUsers

  return (
    <AuthContext.Provider value={{
      user, users, roles, isAuthenticated: user !== null, sessionLoading, sessionExpired,
      pendientePassword,
      pendingBlockEvents, clearBlockEvents,
      login, logout, cambiarPassword,
      ...userCrud,
      ...roleCrud,
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
