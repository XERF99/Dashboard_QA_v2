import { useState, useEffect } from "react"

// Devuelve true tras el primer render en el cliente (useEffect ya corrió).
// Usar para evitar flash de datos de fallback durante hidratación SSR.
export function useIsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => { setHydrated(true) }, [])
  return hydrated
}
