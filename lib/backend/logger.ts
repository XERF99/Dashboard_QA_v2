// ═══════════════════════════════════════════════════════════
//  LOGGER ESTRUCTURADO
//  Emite JSON en producción para facilitar filtrado en Vercel
//  Logs y sistemas de alertas. En desarrollo usa texto legible.
//  Soporta requestId vía AsyncLocalStorage (thread-safe para
//  requests concurrentes — cada request tiene su propio contexto).
// ═══════════════════════════════════════════════════════════

import { AsyncLocalStorage } from "node:async_hooks"

type Level = "info" | "warn" | "error"

interface LogEntry {
  level: Level
  context: string
  message: string
  timestamp: string
  requestId?: string
  error?: string
  stack?: string
}

// ── AsyncLocalStorage para requestId thread-safe ──────────
const requestIdStorage = new AsyncLocalStorage<string>()

/** Ejecuta `fn` con un requestId vinculado al contexto async actual. */
export function runWithRequestId<T>(id: string, fn: () => T): T {
  return requestIdStorage.run(id, fn)
}

/** Lee el requestId del contexto async actual (undefined si no hay). */
export function getRequestId(): string | undefined {
  return requestIdStorage.getStore()
}

// Compat aliases — migración gradual desde la versión global
export function setRequestId(_id: string): void { /* no-op: usar runWithRequestId */ }
export function clearRequestId(): void { /* no-op */ }

function emit(level: Level, context: string, message: string, err?: unknown): void {
  const requestId = getRequestId()
  const entry: LogEntry = {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...(requestId && { requestId }),
    ...(err != null && {
      error: err instanceof Error ? err.message : String(err),
      ...(err instanceof Error && err.stack && { stack: err.stack }),
    }),
  }

  const output = process.env.NODE_ENV === "production"
    ? JSON.stringify(entry)
    : `[${entry.timestamp}] ${level.toUpperCase()} [${context}]${entry.requestId ? ` [${entry.requestId}]` : ""} ${message}${entry.error ? ` — ${entry.error}` : ""}`

  if (level === "error") console.error(output)
  else if (level === "warn")  console.warn(output)
  else console.log(output)
}

export const logger = {
  info:  (context: string, message: string)              => emit("info",  context, message),
  warn:  (context: string, message: string)              => emit("warn",  context, message),
  error: (context: string, message: string, err?: unknown) => emit("error", context, message, err),
}
