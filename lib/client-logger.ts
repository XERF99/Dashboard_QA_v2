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

interface ClientLogEntry {
  level:     "error"
  context:   string
  message:   string
  timestamp: string
  error?:    string
  stack?:    string
}

export function clientError(context: string, message: string, err?: unknown): void {
  const entry: ClientLogEntry = {
    level:     "error",
    context,
    message,
    timestamp: new Date().toISOString(),
    ...(err instanceof Error && { error: err.message, stack: err.stack }),
    ...(err != null && !(err instanceof Error) && { error: String(err) }),
  }

  if (process.env.NODE_ENV === "production") {
    // JSON estructurado → capturable por Sentry / Datadog Browser SDK
    console.error(JSON.stringify(entry))
  } else {
    console.error(`[${entry.timestamp}] ERROR [${context}] ${message}`, err ?? "")
  }
}
