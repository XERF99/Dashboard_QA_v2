"use client"
import { useMemo } from "react"
import { getTipoAplicacionLabel, getAmbienteLabel } from "@/lib/types"
import type { HistoriaUsuario, CasoPrueba, TipoAplicacionDef, AmbienteDef } from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────
// El workspace filtering ocurre en la API; aquí solo filtramos por rol.
interface VisibilityUser {
  id: string
  nombre: string
  rol?: string    // necesario para que Lead identifique a los qa del workspace
  activo?: boolean
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

// ── Reglas de visibilidad (post-API, dentro del workspace) ──
//
//  Owner    → ve todo (sin restricción)
//  Admin    → ve todas las HUs del workspace (la API ya filtró por grupoId)
//  Lead     → ve sus propias HUs + las de todos los usuarios con rol "qa" del workspace
//  User(qa) → ve solo sus propias HUs (verSoloPropios)
//  Viewer   → ve todas las HUs del workspace (solo lectura; la API ya filtró)
//
// filtroNombresCarga controla la vista de Carga Ocupacional:
//  Owner/Admin/Viewer → undefined (todos los miembros del workspace)
//  Lead               → [lead.nombre, ...nombres de usuarios qa]
//  User               → [user.nombre]

export function useHistoriasVisibles({
  historias, casos, busqueda,
  isOwner, isAdmin, isQALead, verSoloPropios,
  user, users,
  tiposAplicacion, ambientes,
}: UseHistoriasVisiblesOptions) {
  // ── filtroNombresCarga ────────────────────────────────────
  const filtroNombresCarga = useMemo<string[] | undefined>(() => {
    // Owner y Admin ven la carga de todo el workspace
    if (isOwner || isAdmin) return undefined

    // Lead ve su propia carga + la de todos los users con rol "qa"
    if (isQALead && user) {
      const qaNombres = users
        .filter(u => u.activo && u.rol === "qa")
        .map(u => u.nombre)
      return [...new Set([user.nombre, ...qaNombres])]
    }

    // User (verSoloPropios): solo su propia carga
    if (verSoloPropios && user) return [user.nombre]

    // Viewer y otros: todo el workspace
    return undefined
  }, [isOwner, isAdmin, isQALead, verSoloPropios, user, users])

  // ── historiasVisibles ─────────────────────────────────────
  const historiasVisibles = useMemo(() =>
    historias.filter(hu => {
      // User (qa): solo sus propias HUs — verificar antes de isAdmin/isQALead
      if (verSoloPropios && user) {
        return hu.responsable.toLowerCase() === user.nombre.toLowerCase()
      }

      // Owner: ve todo
      if (isOwner) return true

      // Admin: ve todo el workspace (la API ya filtró por grupoId)
      if (isAdmin) return true

      // Lead: ve sus propias HUs + las de todos los usuarios con rol "qa"
      if (isQALead && user) {
        if (hu.responsable.toLowerCase() === user.nombre.toLowerCase()) return true
        const qaNombres = users
          .filter(u => u.rol === "qa")
          .map(u => u.nombre.toLowerCase())
        return qaNombres.includes(hu.responsable.toLowerCase())
      }

      // Viewer y otros: ven todo el workspace
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
