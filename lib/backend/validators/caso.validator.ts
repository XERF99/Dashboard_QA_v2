import { z } from "zod"

const isoDateLike = z.union([z.string().datetime({ offset: true }), z.string().datetime(), z.date()])
  .or(z.string().refine(v => !isNaN(Date.parse(v)), "Fecha inválida"))

const createCasoBase = z.object({
  huId:               z.string(),
  titulo:             z.string().trim().max(500),
  descripcion:        z.string().max(10_000).default(""),
  entorno:            z.enum(["test", "preproduccion"]).default("test"),
  tipoPrueba:         z.string().default(""),
  horasEstimadas:     z.number().min(0).default(0),
  complejidad:        z.enum(["alta", "media", "baja"]).default("media"),
  archivosAnalizados: z.array(z.string().max(500)).max(100).default([]),
  creadoPor:          z.string(),
})

export const createCasoSchema = createCasoBase
export type CreateCasoDTO = z.infer<typeof createCasoSchema>

export const updateCasoSchema = createCasoBase.extend({
  estadoAprobacion:       z.enum(["borrador", "pendiente_aprobacion", "aprobado", "rechazado"]).optional(),
  aprobadoPor:            z.string().nullable().optional(),
  fechaAprobacion:        isoDateLike.nullable().optional(),
  motivoRechazo:          z.string().nullable().optional(),
  modificacionHabilitada: z.boolean().optional(),
  motivoModificacion:     z.string().nullable().optional(),
  modificacionSolicitada: z.boolean().optional(),
  resultadosPorEtapa:     z.array(z.any()).max(100).default([]),
  tareasIds:              z.array(z.string()).max(500).default([]),
  bloqueos:               z.array(z.any()).max(100).default([]),
  comentarios:            z.array(z.any()).max(200).default([]),
})
export type UpdateCasoDTO = z.infer<typeof updateCasoSchema>
