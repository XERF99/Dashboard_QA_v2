"use client"

import { useRef } from "react"
import { usePersistedState, STORAGE_KEYS } from "@/lib/storage"
import type { Notificacion, TipoNotificacion, RolDestinatario } from "@/lib/types/index"

/**
 * Gestiona el estado y las operaciones de notificaciones internas.
 * Totalmente aislado: no depende de otros dominios (HUs, casos, tareas).
 */
export function useNotificaciones() {
  const _nc = useRef(0)
  const [notificaciones, setNotificaciones] = usePersistedState<Notificacion[]>(
    STORAGE_KEYS.notificaciones, []
  )

  const addNotificacion = (
    tipo: TipoNotificacion,
    titulo: string,
    descripcion: string,
    destinatario: RolDestinatario,
    extra?: Pick<Notificacion, "casoId" | "huId" | "huTitulo" | "casoTitulo">
  ) => {
    const n: Notificacion = {
      id: `notif-${Date.now()}-${++_nc.current}`,
      tipo, titulo, descripcion, destinatario,
      fecha: new Date(), leida: false,
      ...extra,
    }
    setNotificaciones(p => [n, ...p])
  }

  const handleMarcarLeida = (id: string) =>
    setNotificaciones(p => p.map(n => n.id === id ? { ...n, leida: true } : n))

  const handleMarcarTodasLeidas = () =>
    setNotificaciones(p => p.map(n => ({ ...n, leida: true })))

  return {
    // Async shape — listos para backend (con localStorage siempre false/null)
    isLoading: false as boolean,
    error: null as string | null,
    refetch: () => { /* noop con localStorage */ },
    // Estado
    notificaciones,
    addNotificacion,
    handleMarcarLeida,
    handleMarcarTodasLeidas,
  }
}
