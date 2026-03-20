/**
 * Formatea una fecha como tiempo relativo (ej: "Hace 5 min", "Hace 2h")
 * o como fecha corta si supera las 24h.
 */
export function fmtFecha(d: Date): string {
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return d.toLocaleDateString("es", { day: "2-digit", month: "short" })
}
