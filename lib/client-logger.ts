"use client"

// ═══════════════════════════════════════════════════════════
//  CLIENT-SIDE LOGGER
//  Versión cliente del logger estructurado.
//  En producción emite JSON a console.error para que herramientas
//  como Sentry, Datadog Browser o Vercel Web Analytics puedan
//  capturarlo si se integran con el objeto console.
//  Punto de extensión: reemplazar console.error por
//  Sentry.captureException(err) cuando se configure la telemetría.
// ═══════════════════════════════════════════════════════════

type ClientLogLevel = "error" | "warn"

interface ClientLogEntry {
  level:     ClientLogLevel
  context:   string
  message:   string
  timestamp: string
  error?:    string
  stack?:    string
}

function emit(level: ClientLogLevel, context: string, message: string, err?: unknown): void {
  const entry: ClientLogEntry = {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...(err instanceof Error && { error: err.message, stack: err.stack }),
    ...(err != null && !(err instanceof Error) && { error: String(err) }),
  }

  const sink = level === "error" ? console.error : console.warn

  if (process.env.NODE_ENV === "production") {
    sink(JSON.stringify(entry))
  } else {
    sink(`[${entry.timestamp}] ${level.toUpperCase()} [${context}] ${message}`, err ?? "")
  }
}

export function clientError(context: string, message: string, err?: unknown): void {
  emit("error", context, message, err)
}

export function clientWarn(context: string, message: string, err?: unknown): void {
  emit("warn", context, message, err)
}
