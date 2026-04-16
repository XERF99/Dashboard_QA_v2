import { Shield, Crown, FlaskConical, Eye } from "lucide-react"
import { createElement } from "react"

export interface Grupo {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
  createdAt: string
}

export interface MetricasGrupo {
  totalHUs: number
  totalCasos: number
  totalTareas: number
  totalUsuarios: number
  husPorEstado:    { estado: string; total: number }[]
  casosPorEstado:  { estado: string; total: number }[]
  tareasPorEstado: { estado: string; total: number }[]
}

export interface GrupoConMetricas {
  grupo: Grupo
  metricas: MetricasGrupo
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  grupoId: string | null
  activo: boolean
  debeCambiarPassword: boolean
  bloqueado?: boolean
}

export const ROLES_MIEMBRO = [
  { id: "admin",   label: "Administrador",   icon: createElement(Shield, { className: "h-3.5 w-3.5" }), cls: "bg-chart-4/15 text-chart-4 border-chart-4/30" },
  { id: "qa_lead", label: "Lead",             icon: createElement(Crown, { className: "h-3.5 w-3.5" }), cls: "bg-purple-500/15 text-purple-500 border-purple-500/30" },
  { id: "qa",      label: "User",             icon: createElement(FlaskConical, { className: "h-3.5 w-3.5" }), cls: "bg-chart-1/15 text-chart-1 border-chart-1/30" },
  { id: "viewer",  label: "Visualizador",     icon: createElement(Eye, { className: "h-3.5 w-3.5" }), cls: "bg-chart-2/15 text-chart-2 border-chart-2/30" },
]

export function getRolDef(rolId: string) {
  return ROLES_MIEMBRO.find(r => r.id === rolId)
}

export function getInitials(nombre: string) {
  return nombre.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

export function getAvatarCls(rolId: string) {
  switch (rolId) {
    case "admin":   return "bg-chart-4/20 text-chart-4"
    case "qa_lead": return "bg-purple-500/20 text-purple-500"
    case "qa":      return "bg-chart-1/20 text-chart-1"
    case "viewer":  return "bg-chart-2/20 text-chart-2"
    default:        return "bg-muted text-muted-foreground"
  }
}
