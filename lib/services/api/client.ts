// ═══════════════════════════════════════════════════════════
//  API CLIENT — helper para fetch con manejo de fechas y errores
//  Reutiliza el revisor de fechas ISO de storage.ts.
// ═══════════════════════════════════════════════════════════

import { revivirFechas } from "@/lib/storage"

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
  })

  const text = await res.text()
  const data = text ? JSON.parse(text, revivirFechas) : {}

  if (!res.ok) {
    throw new ApiError(res.status, data.error ?? `Error ${res.status}`)
  }

  return data as T
}

export const api = {
  get:    <T>(url: string)                   => apiFetch<T>(url),
  post:   <T>(url: string, body: unknown)    => apiFetch<T>(url, { method: "POST",  body: JSON.stringify(body) }),
  put:    <T>(url: string, body: unknown)    => apiFetch<T>(url, { method: "PUT",   body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown)    => apiFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(url: string)                   => apiFetch<T>(url, { method: "DELETE" }),
}
