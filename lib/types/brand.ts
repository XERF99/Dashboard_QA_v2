// ── Branded types for nominal type safety ───────────────────
// Previenen pasar un string crudo donde se espera un identificador
// de dominio específico. En runtime son strings; la diferencia
// vive sólo en compile-time.
declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

export type EntityId<T extends string = string> = Brand<string, T>
export type HUId = EntityId<"HU">
export type CasoId = EntityId<"Caso">
export type TareaId = EntityId<"Tarea">
