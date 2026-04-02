// ═══════════════════════════════════════════════════════════
//  RATE LIMITER en memoria
//  Limita el número de peticiones por clave (ip:ruta) en una ventana.
//
//  La clave combina IP + ruta para que los contadores sean independientes
//  por endpoint: un usuario no puede agotar el límite de /api/export
//  haciendo peticiones a /api/historias/sync.
//
//  Nota: en entornos serverless con múltiples instancias el contador
//  es por instancia; aun así reduce drásticamente los ataques de
//  fuerza bruta desde una misma IP.
// ═══════════════════════════════════════════════════════════

interface Entry {
  count:   number
  resetAt: number
}

const store = new Map<string, Entry>()

// Umbral a partir del cual se limpia el store (evita O(N) en cada request)
const CLEANUP_THRESHOLD = 500

// Elimina entradas expiradas; solo se ejecuta cuando el store supera el umbral
function maybeCleanup() {
  if (store.size < CLEANUP_THRESHOLD) return
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}

/**
 * Verifica si la clave ha superado el límite de peticiones.
 *
 * @param key      Clave de throttle — usa `\`${ip}:${route}\`` para aislar por endpoint
 * @param limit    Máximo de peticiones permitidas en la ventana (default: 10)
 * @param windowMs Duración de la ventana en ms (default: 15 minutos)
 */
export function checkRateLimit(
  key:     string,
  limit    = 10,
  windowMs = 15 * 60 * 1000,
): { allowed: boolean; remaining: number; resetAt: number } {
  maybeCleanup()

  const now   = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
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

/**
 * Construye la clave de rate-limit combinando IP y ruta.
 * Uso: `checkRateLimit(rlKey(ip, "/api/export"), 20, 60_000)`
 */
export function rlKey(ip: string, route: string): string {
  return `${ip}:${route}`
}
