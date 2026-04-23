import { z } from "zod"

const isoDateLike = z.union([z.string().datetime({ offset: true }), z.string().datetime(), z.date()])
  .or(z.string().refine(v => !isNaN(Date.parse(v)), "Fecha inválida"))

const createTareaBase = z.object({
  casoPruebaId:   z.string(),
  huId:           z.string(),
  titulo:         z.string().trim().max(500),
  descripcion:    z.string().max(5000).default(""),
  asignado:       z.string().max(200),
  tipo:           z.enum(["ejecucion", "verificacion", "documentacion", "configuracion", "analisis"]).default("ejecucion"),
  prioridad:      z.enum(["alta", "media", "baja"]).default("media"),
  horasEstimadas: z.number().min(0).max(9999).default(0),
  evidencias:     z.string().default(""),
  creadoPor:      z.string().max(200),
})

export const createTareaSchema = createTareaBase
export type CreateTareaDTO = z.infer<typeof createTareaSchema>

export const updateTareaSchema = createTareaBase.extend({
  estado:      z.enum(["pendiente", "en_progreso", "completada", "bloqueada"]).optional(),
  resultado:   z.enum(["pendiente", "exitoso", "fallido"]).optional(),
  horasReales: z.number().min(0).optional(),
  fechaInicio: isoDateLike.nullable().optional(),
  fechaFin:    isoDateLike.nullable().optional(),
  bloqueos:    z.array(z.any()).max(100).default([]),
})
export type UpdateTareaDTO = z.infer<typeof updateTareaSchema>
