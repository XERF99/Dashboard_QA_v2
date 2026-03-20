"use client"

import { Shield, FlaskConical, Eye } from "lucide-react"
import type { ReactNode } from "react"

/** Devuelve las iniciales de un nombre completo (máx. 2 caracteres) */
export function getInitials(nombre: string): string {
  return nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

/** Devuelve el ícono correspondiente al rol. `size` por defecto 12. */
export function getRoleIcon(rol: string, size = 12): ReactNode {
  switch (rol) {
    case "admin":  return <Shield size={size} />
    case "qa":     return <FlaskConical size={size} />
    case "viewer": return <Eye size={size} />
    default:       return null
  }
}
