// ═══════════════════════════════════════════════════════════
//  STARTUP ENV CHECK
//  Valida que las variables de entorno críticas estén presentes
//  antes de que la aplicación intente conectar a la DB o firmar JWTs.
//  Se llama desde lib/backend/prisma.ts para que el error aparezca
//  en el primer import del servidor, no en la primera petición.
// ═══════════════════════════════════════════════════════════

const REQUIRED_ENV: Record<string, string> = {
  DATABASE_URL: "Cadena de conexión a PostgreSQL",
  JWT_SECRET:   "Secreto para firmar tokens JWT (mínimo 32 caracteres)",
}

/**
 * Lanza un Error descriptivo si alguna variable requerida no está definida.
 * Solo se ejecuta en producción; en desarrollo se permite arrancar con
 * valores por defecto (ver auth.middleware.ts) para facilitar el onboarding.
 */
export function assertRequiredEnv(): void {
  if (process.env.NODE_ENV !== "production") return

  const missing = Object.entries(REQUIRED_ENV)
    .filter(([key]) => !process.env[key])
    .map(([key, desc]) => `  ${key} — ${desc}`)

  if (missing.length > 0) {
    throw new Error(
      `[startup-check] Variables de entorno requeridas no definidas:\n${missing.join("\n")}\n` +
      `Consulta .env.example para configurarlas.`
    )
  }

  // Advertencia si JWT_SECRET es demasiado corto
  const secret = process.env.JWT_SECRET ?? ""
  if (secret.length < 32) {
    throw new Error(
      `[startup-check] JWT_SECRET es demasiado corto (${secret.length} chars). ` +
      `Usa al menos 32 caracteres aleatorios.`
    )
  }
}
