import type { Bloqueo } from "@/lib/types"

export function d(v: unknown): Date { return v instanceof Date ? v : new Date(v as string) }
export function dOpt(v: unknown): Date | undefined { return v == null ? undefined : d(v) }

export function parseBloqueo(b: Bloqueo): Bloqueo {
  if (b.resuelto) return { ...b, fecha: d(b.fecha), fechaResolucion: d(b.fechaResolucion) }
  return { ...b, fecha: d(b.fecha) }
}
