"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/lib/hooks/useToast"
import { useHUModals } from "@/lib/hooks/useHUModals"
import { useHistoriasVisibles } from "@/lib/hooks/useHistoriasVisibles"
import { useAuth } from "@/lib/contexts/auth-context"
import { useConfig } from "@/lib/hooks/useConfig"
import { useNotificaciones } from "@/lib/hooks/useNotificaciones"
import { useDomainData } from "@/lib/hooks/useDomainData"
import { useIsHydrated } from "@/lib/hooks/useIsHydrated"
import { useKeyboardShortcuts } from "@/lib/hooks/useKeyboardShortcuts"

export function useDashboardState() {
  const isHydrated = useIsHydrated()
  const auth = useAuth()
  const { isAuthenticated, sessionLoading, canManageUsers, verSoloPropios, isAdmin, isQALead, isQA, canCreateHU, isOwner, user, users, roles, pendingBlockEvents, clearBlockEvents } = auth

  const qaUsers = useMemo(
    () => users.filter(u => u.activo && (roles.find(r => r.id === u.rol)?.permisos.includes("canEdit") ?? false)).map(u => u.nombre),
    [users, roles]
  )

  const { toasts, addToast, dismissToast } = useToast()

  const config = useConfig({ isAuthenticated })
  const notif  = useNotificaciones()
  const domain = useDomainData({ user, configEtapas: config.configEtapas, configResultados: config.configResultados, addToast, addNotificacion: notif.addNotificacion })

  const {
    tabActiva, setTabActiva,
    busqueda, setBusqueda,
    huFormOpen, setHuFormOpen,
    huDetailOpen,
    huEditar, setHuEditar,
    deleteModal, setDeleteModal,
    importModalOpen, setImportModalOpen,
    configSeccion, setConfigSeccion,
    adminSeccion, setAdminSeccion,
    huSeleccionada,
    abrirHU, cerrarHU,
    handleNuevaHU, handleEditarHU,
    handleEliminarHU, handleBulkEliminar,
  } = useHUModals({
    historias: domain.historias,
    onEliminarConfirmado: domain.handleEliminarHUConfirmado,
    onBulkEliminarConfirmado: domain.handleBulkEliminarConfirmado,
  })

  const [importCasosModalOpen, setImportCasosModalOpen] = useState(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), [])
  useKeyboardShortcuts({
    setTabActiva,
    onNuevaHU: handleNuevaHU,
    focusSearch,
    canCreateHU,
    onOpenCommandPalette: useCallback(() => setCmdPaletteOpen(true), []),
  })

  // Reset tab on user change
  const prevUserIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const currentId = user?.id
    if (prevUserIdRef.current !== currentId) {
      prevUserIdRef.current = currentId
      setTabActiva("inicio")
    }
  }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Owner workspace filter
  const [filtroGrupoOwner, setFiltroGrupoOwner] = useState<string | null>(null)
  const [gruposDisponibles, setGruposDisponibles] = useState<{ id: string; nombre: string }[]>([])
  useEffect(() => {
    if (!isOwner) return
    fetch("/api/grupos")
      .then(r => r.ok ? r.json() : null)
      .then((d: { grupos?: { id: string; nombre: string }[] } | null) => {
        if (d?.grupos) setGruposDisponibles(d.grupos)
      })
      .catch(() => {})
  }, [isOwner])

  const historiasFiltradas = useMemo(
    () => isOwner && filtroGrupoOwner
      ? domain.historias.filter(h => h.grupoId === filtroGrupoOwner)
      : domain.historias,
    [domain.historias, isOwner, filtroGrupoOwner]
  )

  // Visibility filters
  const { filtroNombresCarga, historiasVisibles } = useHistoriasVisibles({
    historias: historiasFiltradas,
    casos: domain.casos,
    busqueda,
    isOwner,
    isAdmin,
    isQALead,
    verSoloPropios,
    user,
    users,
    tiposAplicacion: config.tiposAplicacion,
    ambientes: config.ambientes,
  })

  const visibleHUIds = useMemo(
    () => new Set(historiasVisibles.map(h => h.id)),
    [historiasVisibles]
  )
  const casosVisibles = useMemo(
    () => domain.casos.filter(c => visibleHUIds.has(c.huId)),
    [domain.casos, visibleHUIds]
  )
  const tareasVisibles = useMemo(
    () => domain.tareas.filter(t => visibleHUIds.has(t.huId)),
    [domain.tareas, visibleHUIds]
  )
  const totalBloqueoActivos = useMemo(
    () =>
      historiasVisibles.reduce((n, h) => n + h.bloqueos.filter(b => !b.resuelto).length, 0) +
      casosVisibles.reduce((n, c) => n + c.bloqueos.filter(b => !b.resuelto).length, 0) +
      tareasVisibles.reduce((n, t) => n + t.bloqueos.filter(b => !b.resuelto).length, 0),
    [historiasVisibles, casosVisibles, tareasVisibles]
  )

  // Blocked account notifications
  useEffect(() => {
    if (pendingBlockEvents.length === 0) return
    pendingBlockEvents.forEach(({ nombre }) => {
      notif.addNotificacion(
        "cuenta_bloqueada",
        "Cuenta bloqueada",
        `La cuenta de ${nombre} fue bloqueada por demasiados intentos fallidos.`,
        "admin"
      )
    })
    clearBlockEvents()
  }, [pendingBlockEvents]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Hydration & auth
    isHydrated,
    isAuthenticated,
    sessionLoading,
    isOwner,
    isAdmin,
    isQALead,
    isQA,
    canCreateHU,
    canManageUsers,
    verSoloPropios,
    user,

    // Toasts
    toasts,
    dismissToast,

    // Config
    config,

    // Notifications
    notif,

    // Domain data & handlers
    domain,

    // UI state
    tabActiva, setTabActiva,
    busqueda, setBusqueda,
    huFormOpen, setHuFormOpen,
    huDetailOpen,
    huEditar, setHuEditar,
    deleteModal, setDeleteModal,
    importModalOpen, setImportModalOpen,
    configSeccion, setConfigSeccion,
    adminSeccion, setAdminSeccion,
    huSeleccionada,
    abrirHU, cerrarHU,
    handleNuevaHU, handleEditarHU,
    handleEliminarHU, handleBulkEliminar,
    importCasosModalOpen, setImportCasosModalOpen,
    cmdPaletteOpen, setCmdPaletteOpen,
    searchInputRef,
    focusSearch,

    // Workspace filter (owner)
    filtroGrupoOwner, setFiltroGrupoOwner,
    gruposDisponibles,

    // Filtered/visible data
    qaUsers,
    historiasVisibles,
    casosVisibles,
    tareasVisibles,
    totalBloqueoActivos,
    filtroNombresCarga,

    // Tab count helper
    tabCount: 6 + (canManageUsers ? 1 : 0) + (isOwner ? 1 : 0),
  }
}
