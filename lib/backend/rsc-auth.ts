// ═══════════════════════════════════════════════════════════
//  RSC AUTH HELPER (v2.77)
//
//  Los Server Components no reciben `NextRequest`, leen las
//  cookies del request actual vía `next/headers`. Este helper
//  devuelve el payload JWT o null — no lanza.
//
//  Uso:
//    export default async function Page() {
//      const payload = await getRscAuth()
//      if (!payload) redirect("/")
//      // ...
//    }
// ═══════════════════════════════════════════════════════════

import { cookies } from "next/headers"
import { verifyToken, type JWTPayload } from "./middleware/auth.middleware"

/** Lee y verifica la cookie `tcs_token` del request RSC. */
export async function getRscAuth(): Promise<JWTPayload | null> {
  const store = await cookies()
  const token = store.get("tcs_token")?.value
  if (!token) return null
  return verifyToken(token)
}
