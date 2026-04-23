// ── Tipos transversales ──────────────────────────────────────
export interface Comentario {
  id: string
  texto: string
  autor: string
  fecha: Date
}

// Bloqueo como unión discriminada — activo vs resuelto.
interface BloqueoBase {
  id: string
  descripcion: string
  reportadoPor: string
  fecha: Date
}

export interface BloqueoActivo extends BloqueoBase {
  resuelto: false
}

export interface BloqueoResuelto extends BloqueoBase {
  resuelto: true
  fechaResolucion: Date
  resueltoPor: string
  notaResolucion?: string
}

export type Bloqueo = BloqueoActivo | BloqueoResuelto

export interface PaginatedResult<T> {
  total: number
  page: number
  limit: number
  pages: number
  data?: T[]
}
