"use client"

import { useState, useEffect, useRef } from "react"
import { cargarDeStorage, guardarEnStorage, STORAGE_KEYS } from "@/lib/storage"
import { api } from "@/lib/services/api/client"
import type { Notificacion, TipoNotificacion, RolDestinatario } from "@/lib/types/index"

/**
 * Gestiona el estado y las operaciones de notificaciones.
 * Carga desde localStorage al instante, luego sincroniza con la API.
 * Las mutaciones (crear, marcar leída) se aplican de forma optimista
 * y se persisten en la BD en segundo plano.
 */
export function useNotificaciones() {
  const _nc = useRef(0)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(
    () => cargarDeStorage(STORAGE_KEYS.notificaciones, [])
  )
  const [isLoading, setIsLoading] = useState(true)

  // ── Carga inicial desde la API ────────────────────────────
  useEffect(() => {
    api.get<{ notificaciones: Notificacion[] }>("/api/notificaciones")
      .then(r => {
        setNotificaciones(r.notificaciones)
        guardarEnStorage(STORAGE_KEYS.notificaciones, r.notificaciones)
      })
      .catch(() => { /* API no disponible — usar localStorage */ })
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = () => {
    api.get<{ notificaciones: Notificacion[] }>("/api/notificaciones")
      .then(r => {
        setNotificaciones(r.notificaciones)
        guardarEnStorage(STORAGE_KEYS.notificaciones, r.notificaciones)
      })
      .catch(() => {})
  }

  // ── Crear notificación ────────────────────────────────────
  const addNotificacion = (
    tipo: TipoNotificacion,
    titulo: string,
    descripcion: string,
    destinatario: RolDestinatario,
    extra?: Pick<Notificacion, "casoId" | "huId" | "huTitulo" | "casoTitulo">
  ) => {
    // Actualización optimista inmediata con id temporal
    const tempId = `notif-${Date.now()}-${++_nc.current}`
    const optimista: Notificacion = {
      id: tempId, tipo, titulo, descripcion, destinatario,
      fecha: new Date(), leida: false, ...extra,
    }
    setNotificaciones(p => [optimista, ...p])

    api.post<{ notificacion: Notificacion }>("/api/notificaciones", {
      tipo, titulo, descripcion, destinatario, ...extra,
    })
      .then(r => {
        // Reemplazar el id temporal con el id real de la BD
        setNotificaciones(p => p.map(n => n.id === tempId ? r.notificacion : n))
        guardarEnStorage(STORAGE_KEYS.notificaciones,
          notificaciones.map(n => n.id === tempId ? r.notificacion : n)
        )
      })
      .catch(() => { /* queda el optimista en localStorage */ })
  }

  // ── Marcar una como leída ─────────────────────────────────
  const handleMarcarLeida = (id: string) => {
    setNotificaciones(p => p.map(n => n.id === id ? { ...n, leida: true } : n))
    api.patch(`/api/notificaciones/${id}`, {})
      .catch(() => {})
  }

  // ── Marcar todas como leídas ──────────────────────────────
  const handleMarcarTodasLeidas = () => {
    setNotificaciones(p => p.map(n => ({ ...n, leida: true })))
    api.patch("/api/notificaciones/marcar-todas", {})
      .catch(() => {})
  }

  return {
    isLoading,
    error: null as string | null,
    refetch,
    notificaciones,
    addNotificacion,
    handleMarcarLeida,
    handleMarcarTodasLeidas,
  }
}
