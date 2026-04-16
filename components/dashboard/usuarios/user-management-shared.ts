import { createElement } from "react"
import { Star, Shield, Crown, FlaskConical, Eye, Users } from "lucide-react"

export function formatFechaConexion(raw: Date | string): string {
  const d   = new Date(raw)
  const hoy  = new Date()
  const ayer = new Date(hoy); ayer.setDate(hoy.getDate() - 1)
  const hora = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
  if (d.toDateString() === hoy.toDateString())  return `Hoy ${hora}`
  if (d.toDateString() === ayer.toDateString()) return `Ayer ${hora}`
  return d.toLocaleDateString("es", { day: "2-digit", month: "2-digit" }) + " " + hora
}

export function formatDuracion(ms: number): string {
  const min = Math.round(ms / 60000)
  if (min < 1) return "< 1 min"
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getRoleIcon(rolId: string) {
  switch (rolId) {
    case "owner":   return createElement(Star, { className: "h-3.5 w-3.5" })
    case "admin":   return createElement(Shield, { className: "h-3.5 w-3.5" })
    case "qa_lead": return createElement(Crown, { className: "h-3.5 w-3.5" })
    case "qa":      return createElement(FlaskConical, { className: "h-3.5 w-3.5" })
    case "viewer":  return createElement(Eye, { className: "h-3.5 w-3.5" })
    default:        return createElement(Users, { className: "h-3.5 w-3.5" })
  }
}

export function getRoleAccentColor(rolId: string) {
  switch (rolId) {
    case "owner":   return "#eab308"
    case "admin":   return "var(--chart-4)"
    case "qa_lead": return "rgb(168 85 247)"
    case "qa":      return "var(--chart-1)"
    case "viewer":  return "var(--chart-2)"
    default:        return "var(--primary)"
  }
}
