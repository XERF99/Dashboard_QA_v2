// ═══════════════════════════════════════════════════════════
//  / — React Server Component (v2.80)
//
//  Desde v2.80 esta página es un Server Component que hace el
//  auth check antes de enviar JavaScript al cliente:
//
//  - Sin sesión → renderiza `<LoginScreen />` directamente.
//    El bundle del dashboard (@dnd-kit, recharts, etc.) NO se
//    carga. El usuario ve el form de login instantáneamente.
//
//  - Con sesión válida → renderiza `<DashboardClient />`, que
//    mantiene toda la lógica interactiva con sus contextos
//    (useDashboardState, TanStack Query, etc.).
//
//  El body cliente vive en `_dashboard-client.tsx` (prefijo `_`
//  para que Next no lo sirva como ruta). Todo el estado, tabs y
//  modales siguen intactos — esto es sólo un wrapper.
// ═══════════════════════════════════════════════════════════

import { getRscAuth } from "@/lib/backend/rsc-auth"
import { LoginScreen } from "@/components/auth/login-screen"
import { DashboardClient } from "./_dashboard-client"

// Evita caché agresiva en el wrapper — el auth check debe correr por request.
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const payload = await getRscAuth()

  // Sin sesión válida → LoginScreen directo. Evita cargar el bundle
  // completo del dashboard (modales dinámicos, tabs, etc.) hasta que
  // el usuario se autentique y navegue de vuelta a `/`.
  if (!payload) {
    return <LoginScreen />
  }

  // Con sesión → delegamos al body cliente existente, que consume
  // `useDashboardState` y los contextos (AuthProvider en layout.tsx).
  return <DashboardClient />
}
