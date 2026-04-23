// ═══════════════════════════════════════════════════════════════
//  Guards de ruta — funciones reutilizables que lanzan HttpError
//
//  En vez de escribir en cada ruta:
//    const rl = checkRateLimit(rlKey(ip, "..."), 120, 60_000)
//    if (!rl.allowed) return NextResponse.json({ error: "..." }, { status: 429 })
//
//  Usa:
//    requireRateLimit(request, "POST /api/casos", 120, 60_000)
//
//  Si falla, lanza un HttpError que `withAuth` captura y serializa.
// ═══════════════════════════════════════════════════════════════

import type { NextRequest } from "next/server"
import { z, type ZodTypeAny } from "zod"
import { getClientIp, rlKey } from "./rate-limit"
import { getRateLimitStore } from "./rate-limit-store"
import { checkHUAccess, checkCasoAccess, checkTareaAccess } from "./with-auth"
import { RateLimitError, ValidationError, NotFoundError, UnprocessableEntityError } from "@/lib/backend/errors"

// Cuando un endpoint CREATE referencia un recurso padre (ej. POST /api/casos con huId),
// el cliente espera 422 (entidad no procesable), no 404. Con `{ asUnprocessable: true }`
// los guards lanzan UnprocessableEntityError en vez de NotFoundError.
type GuardOptions = { asUnprocessable?: boolean }

/**
 * Verifica rate-limit por IP + ruta. Lanza `RateLimitError` si excede el cupo.
 *
 * @param request  NextRequest entrante
 * @param route    Identificador de ruta (ej. "POST /api/casos")
 * @param limit    Máximo de peticiones en la ventana
 * @param windowMs Duración de la ventana en ms
 * @param keyExtra Sufijo opcional para escopar por usuario (ej. payload.sub)
 *
 * Async desde v2.73 — el backend puede ser Redis (Upstash) cuando
 * `RATE_LIMIT_BACKEND=redis`. Los call-sites deben añadir `await`.
 */
export async function requireRateLimit(
  request:  NextRequest,
  route:    string,
  limit:    number,
  windowMs: number,
  keyExtra?: string,
): Promise<void> {
  const ip    = getClientIp(request.headers)
  const key   = keyExtra ? rlKey(ip, `${route}:${keyExtra}`) : rlKey(ip, route)
  const store = await getRateLimitStore()
  const rl    = await store.check(key, limit, windowMs)
  if (!rl.allowed) throw new RateLimitError(rl.resetAt, limit)
}

/**
 * Parsea el body JSON y valida con el schema Zod provisto.
 * Lanza `ValidationError` si el JSON es inválido o el schema rechaza.
 *
 * Por defecto rechaza claves desconocidas (equivalente al `allowUnknown: false`
 * de Joi en v2.73). Con `{ allowUnknown: true }` usa `passthrough()` y las
 * deja pasar al resultado.
 *
 * Devuelve el `data` tipado vía `z.infer<T>`, con defaults aplicados.
 */
export async function requireBody<T extends ZodTypeAny>(
  request: NextRequest,
  schema:  T,
  options: { allowUnknown?: boolean } = {},
): Promise<z.infer<T>> {
  const raw = await request.json().catch(() => null)
  if (raw === null) throw new ValidationError("Body JSON inválido")

  const effective = schema instanceof z.ZodObject
    ? (options.allowUnknown ? schema.passthrough() : schema.strict())
    : schema

  const result = effective.safeParse(raw)
  if (!result.success) {
    const messages = result.error.issues.map(i => {
      const path = i.path.join(".")
      return path ? `${path}: ${i.message}` : i.message
    })
    throw new ValidationError(messages.join(", "), messages)
  }
  return result.data
}

/** Carga la HU y valida workspace. Lanza `NotFoundError` (o `UnprocessableEntityError` con `asUnprocessable`). */
export async function requireHU(huId: string, grupoId: string | undefined, options?: GuardOptions) {
  const hu = await checkHUAccess(huId, grupoId)
  if (!hu) {
    if (options?.asUnprocessable)
      throw new UnprocessableEntityError("La Historia de Usuario no existe o no pertenece a tu workspace")
    throw new NotFoundError("Historia")
  }
  return hu
}

/** Carga el Caso de Prueba y valida workspace. Lanza `NotFoundError` (o `UnprocessableEntityError` con `asUnprocessable`). */
export async function requireCaso(casoId: string, grupoId: string | undefined, options?: GuardOptions) {
  const caso = await checkCasoAccess(casoId, grupoId)
  if (!caso) {
    if (options?.asUnprocessable)
      throw new UnprocessableEntityError("El Caso de Prueba no existe o no pertenece a tu workspace")
    throw new NotFoundError("Caso")
  }
  return caso
}

/** Carga la Tarea y valida workspace. Lanza `NotFoundError` (o `UnprocessableEntityError` con `asUnprocessable`). */
export async function requireTarea(tareaId: string, grupoId: string | undefined, options?: GuardOptions) {
  const tarea = await checkTareaAccess(tareaId, grupoId)
  if (!tarea) {
    if (options?.asUnprocessable)
      throw new UnprocessableEntityError("La Tarea no existe o no pertenece a tu workspace")
    throw new NotFoundError("Tarea")
  }
  return tarea
}
