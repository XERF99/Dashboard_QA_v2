// ═══════════════════════════════════════════════════════════
//  RATE LIMITER en memoria
//  Limita el número de peticiones por IP en una ventana de tiempo.
//  Nota: en entornos serverless con múltiples instancias el contador
//  es por instancia; aun así reduce drásticamente los ataques de
//  fuerza bruta desde una misma IP.
// ═══════════════════════════════════════════════════════════

interface Entry {
  count:   number
  resetAt: number
}

const store = new Map<string, Entry>()

// Elimina entradas expiradas para evitar que el Map crezca sin límite
function cleanup() {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * Verifica si la IP ha superado el límite de peticiones.
 * @param ip       Dirección IP del cliente
 * @param limit    Máximo de peticiones permitidas en la ventana (default: 10)
 * @param windowMs Duración de la ventana en ms (default: 15 minutos)
 */
export function checkRateLimit(
  ip: string,
  limit    = 10,
  windowMs = 15 * 60 * 1000,
): { allowed: boolean; remaining: number; resetAt: number } {
  cleanup()

  const now   = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  return {
    allowed:   entry.count <= limit,
    remaining,
    resetAt:   entry.resetAt,
  }
}

/** Extrae la IP real del request (compatible con Vercel / proxies) */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  )
}
