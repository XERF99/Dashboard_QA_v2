"use client"
import { useMemo } from "react"
import { getTipoAplicacionLabel, getAmbienteLabel } from "@/lib/types"
import type { HistoriaUsuario, CasoPrueba, TipoAplicacionDef, AmbienteDef } from "@/lib/types"

// ── Tipos ─────────────────────────────────────────────────
interface VisibilityUser {
  id: string
  nombre: string
  rol?: string
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

export function useHistoriasVisibles({
  historias, casos, busqueda,
  isOwner, isAdmin, isQALead, verSoloPropios,
  user, users,
  tiposAplicacion, ambientes,
}: UseHistoriasVisiblesOptions) {
  // ── Memoized qa names set (avoids recomputation per HU) ──
  const qaNombresSet = useMemo(() => {
    if (!isQALead) return null
    return new Set(
      users.filter(u => u.activo && u.rol === "qa").map(u => u.nombre.toLowerCase())
    )
  }, [isQALead, users])

  // ── Memoized caso lookup index (O(1) instead of O(n) per HU) ──
  const casosByHuId = useMemo(() => {
    const map = new Map<string, CasoPrueba[]>()
    for (const c of casos) {
      const list = map.get(c.huId)
      if (list) list.push(c)
      else map.set(c.huId, [c])
    }
    return map
  }, [casos])

  // ── filtroNombresCarga ────────────────────────────────────
  const filtroNombresCarga = useMemo<string[] | undefined>(() => {
    if (isOwner || isAdmin) return undefined
    if (isQALead && user) {
      const qaNombres = users
        .filter(u => u.activo && u.rol === "qa")
        .map(u => u.nombre)
      return [...new Set([user.nombre, ...qaNombres])]
    }
    if (verSoloPropios && user) return [user.nombre]
    return undefined
  }, [isOwner, isAdmin, isQALead, verSoloPropios, user, users])

  // ── historiasVisibles ─────────────────────────────────────
  const historiasVisibles = useMemo(() => {
    const userNameLower = user?.nombre.toLowerCase()

    // Step 1: filter by role visibility
    const byRole = historias.filter(hu => {
      if (verSoloPropios && user) {
        return hu.responsable.toLowerCase() === userNameLower
      }
      if (isOwner || isAdmin) return true
      if (isQALead && user) {
        if (hu.responsable.toLowerCase() === userNameLower) return true
        return qaNombresSet?.has(hu.responsable.toLowerCase()) ?? false
      }
      return true
    })

    // Step 2: filter by search query (uses indexed lookup)
    if (!busqueda) return byRole

    const q = busqueda.toLowerCase()
    return byRole.filter(hu => {
      if (hu.titulo.toLowerCase().includes(q)) return true
      if (hu.codigo.toLowerCase().includes(q)) return true
      if (hu.responsable.toLowerCase().includes(q)) return true
      if (hu.descripcion?.toLowerCase().includes(q)) return true
      if (getTipoAplicacionLabel(hu.tipoAplicacion, tiposAplicacion).toLowerCase().includes(q)) return true
      if (getAmbienteLabel(hu.ambiente, ambientes).toLowerCase().includes(q)) return true
      // Use indexed lookup instead of filtering all casos
      const casosHU = casosByHuId.get(hu.id)
      if (casosHU?.some(c => c.titulo.toLowerCase().includes(q))) return true
      return false
    })
  }, [historias, busqueda, isOwner, isAdmin, isQALead, verSoloPropios, user, qaNombresSet, casosByHuId, tiposAplicacion, ambientes])

  return { filtroNombresCarga, historiasVisibles }
}
