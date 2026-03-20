"use client"
import { useMemo } from "react"
import { getTipoAplicacionLabel, getAmbienteLabel } from "@/lib/types"
import type { HistoriaUsuario, CasoPrueba, TipoAplicacionDef, AmbienteDef } from "@/lib/types"

interface VisibilityUser {
  id: string
  nombre: string
  activo?: boolean
  equipoIds?: string[]
}

interface UseHistoriasVisiblesOptions {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  busqueda: string
  isOwner: boolean
  isAdmin: boolean
  isQALead: boolean
  verSoloPropios: boolean
  user: VisibilityUser | null | undefined
  users: VisibilityUser[]
  tiposAplicacion?: TipoAplicacionDef[]
  ambientes?: AmbienteDef[]
}

export function useHistoriasVisibles({
  historias, casos, busqueda,
  isOwner, isAdmin, isQALead, verSoloPropios,
  user, users,
  tiposAplicacion, ambientes,
}: UseHistoriasVisiblesOptions) {
  const filtroNombresCarga = useMemo<string[] | undefined>(() => {
    if (isOwner) return undefined
    if (isAdmin && user) {
      if (user.equipoIds && user.equipoIds.length > 0) {
        const teamNombres = users.filter(u => user.equipoIds!.includes(u.id) && u.activo).map(u => u.nombre)
        return [...new Set([user.nombre, ...teamNombres])]
      }
      return [user.nombre]
    }
    if (isQALead && user) {
      if (user.equipoIds && user.equipoIds.length > 0) {
        const teamNombres = users.filter(u => user.equipoIds!.includes(u.id) && u.activo).map(u => u.nombre)
        return [...new Set([user.nombre, ...teamNombres])]
      }
      return [user.nombre]
    }
    if (verSoloPropios && user) return [user.nombre]
    return undefined
  }, [isOwner, isAdmin, isQALead, verSoloPropios, user, users])

  const historiasVisibles = useMemo(() =>
    historias.filter(hu => {
      if (verSoloPropios && user) return hu.responsable.toLowerCase() === user.nombre.toLowerCase()
      if (isAdmin && !isOwner && user) {
        if (user.equipoIds && user.equipoIds.length > 0) {
          const teamNombres = users.filter(u => user.equipoIds!.includes(u.id)).map(u => u.nombre.toLowerCase())
          return teamNombres.includes(hu.responsable.toLowerCase()) || hu.responsable.toLowerCase() === user.nombre.toLowerCase()
        }
        return hu.responsable.toLowerCase() === user.nombre.toLowerCase()
      }
      if (isQALead && user && user.equipoIds && user.equipoIds.length > 0) {
        const teamNombres = users.filter(u => user.equipoIds!.includes(u.id)).map(u => u.nombre.toLowerCase())
        return teamNombres.includes(hu.responsable.toLowerCase()) || hu.responsable.toLowerCase() === user.nombre.toLowerCase()
      }
      return true
    }).filter(hu => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
      return (
        hu.titulo.toLowerCase().includes(q) ||
        hu.codigo.toLowerCase().includes(q) ||
        hu.responsable.toLowerCase().includes(q) ||
        (hu.descripcion?.toLowerCase().includes(q) ?? false) ||
        getTipoAplicacionLabel(hu.tipoAplicacion, tiposAplicacion).toLowerCase().includes(q) ||
        getAmbienteLabel(hu.ambiente, ambientes).toLowerCase().includes(q) ||
        casosHU.some(c => c.titulo.toLowerCase().includes(q))
      )
    }),
  [historias, casos, busqueda, isOwner, isAdmin, isQALead, verSoloPropios, user, users, tiposAplicacion, ambientes])

  return { filtroNombresCarga, historiasVisibles }
}
