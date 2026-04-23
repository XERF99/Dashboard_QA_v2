// ═══════════════════════════════════════════════════════════
//  SERVER ACTIONS — Auth (v2.79)
//
//  Server actions son funciones "use server" invocables desde
//  HTML (forms sin JS) o desde componentes cliente. Viven en el
//  servidor, reciben FormData / args tipados y pueden mutar DB
//  + redirigir + invalidar cache.
//
//  Ventaja sobre /api/*: cero JS cliente necesario para invocarlas
//  (el navegador envía un POST nativo al endpoint auto-generado).
// ═══════════════════════════════════════════════════════════

"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getRscAuth } from "@/lib/backend/rsc-auth"
import { logoutService } from "@/lib/backend/services/auth.service"
import { audit } from "@/lib/backend/services/audit.service"

/**
 * Cierra la sesión: limpia cookies, invalida el refresh token en DB
 * y registra el evento de audit. Redirige a / (la página de login).
 *
 * Uso desde un <form> en RSC:
 *   <form action={logoutAction}><button>Cerrar sesión</button></form>
 *
 * Uso desde cliente:
 *   const onClick = () => logoutAction()
 */
export async function logoutAction(): Promise<void> {
  const payload = await getRscAuth()

  if (payload) {
    // Invalidación del refresh-token en DB. `logoutService` es no-op si el
    // usuario ya no existe, así que es seguro llamarlo fuera del happy path.
    await logoutService(payload.sub).catch(() => {})
    void audit({
      actor:      payload,
      action:     "LOGOUT",
      resource:   "auth",
      resourceId: payload.sub,
    })
  }

  const store = await cookies()
  store.delete("tcs_token")
  // El refresh cookie está scoped a /api/auth/refresh — hay que matchear
  // el path original al eliminar, o el browser no lo remueve.
  store.delete({ name: "tcs_refresh", path: "/api/auth/refresh" })

  redirect("/")
}
