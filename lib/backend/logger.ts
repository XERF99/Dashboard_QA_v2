// ═══════════════════════════════════════════════════════════
//  LOGGER ESTRUCTURADO
//  Emite JSON en producción para facilitar filtrado en Vercel
//  Logs y sistemas de alertas. En desarrollo usa texto legible.
// ═══════════════════════════════════════════════════════════

type Level = "info" | "warn" | "error"

interface LogEntry {
  level: Level
  context: string
  message: string
  timestamp: string
  error?: string
}

function emit(level: Level, context: string, message: string, err?: unknown): void {
  const entry: LogEntry = {
    level,
    context,
    message,
    timestamp: new Date().toISOString(),
    ...(err != null && {
      error: err instanceof Error ? err.message : String(err),
    }),
  }

  const output = process.env.NODE_ENV === "production"
    ? JSON.stringify(entry)
    : `[${entry.timestamp}] ${level.toUpperCase()} [${context}] ${message}${entry.error ? ` — ${entry.error}` : ""}`

  if (level === "error") console.error(output)
  else if (level === "warn")  console.warn(output)
  else console.log(output)
}

export const logger = {
  info:  (context: string, message: string)              => emit("info",  context, message),
  warn:  (context: string, message: string)              => emit("warn",  context, message),
  error: (context: string, message: string, err?: unknown) => emit("error", context, message, err),
}
