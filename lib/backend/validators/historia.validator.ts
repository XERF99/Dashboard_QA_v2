import { z } from "zod"

// ── Campos reutilizables ─────────────────────────────────────
const isoDateLike = z.union([z.string().datetime({ offset: true }), z.string().datetime(), z.date()])
  .or(z.string().refine(v => !isNaN(Date.parse(v)), "Fecha inválida"))

const bloqueoSchema = z.object({
  id:              z.string(),
  descripcion:     z.string(),
  reportadoPor:    z.string(),
  fecha:           isoDateLike,
  resuelto:        z.boolean().default(false),
  fechaResolucion: isoDateLike.optional(),
  resueltoPor:     z.string().optional(),
  notaResolucion:  z.string().optional(),
})

const comentarioSchema = z.object({
  id:    z.string(),
  texto: z.string(),
  autor: z.string(),
  fecha: isoDateLike,
})

// ── Schema base ─────────────────────────────────────────────
const createHistoriaBase = z.object({
  codigo:                   z.string().trim().max(50),
  titulo:                   z.string().trim().max(500),
  descripcion:              z.string().max(10_000).default(""),
  criteriosAceptacion:      z.string().max(5000).default(""),
  responsable:              z.string().max(200),
  prioridad:                z.enum(["critica", "alta", "media", "baja"]).default("media"),
  puntos:                   z.number().int().min(0).default(0),
  sprint:                   z.string().nullable().optional(),
  aplicacion:               z.string().default(""),
  tipoAplicacion:           z.string().max(100),
  requiriente:              z.string().default(""),
  areaSolicitante:          z.string().default(""),
  ambiente:                 z.string().default(""),
  tipoPrueba:               z.string().default(""),
  creadoPor:                z.string().max(200),
  delegadoPor:              z.string().default(""),
  permitirCasosAdicionales: z.boolean().default(false),
  motivoCasosAdicionales:   z.string().nullable().optional(),
  fechaFinEstimada:         isoDateLike.nullable().optional(),
  grupoId:                  z.string().nullable().optional(),
})

export const createHistoriaSchema = createHistoriaBase
export type CreateHistoriaDTO = z.infer<typeof createHistoriaSchema>

export const updateHistoriaSchema = createHistoriaBase.omit({ grupoId: true }).extend({
  estado:            z.enum(["sin_iniciar", "en_progreso", "exitosa", "fallida", "cancelada"]).optional(),
  etapa:             z.string().optional(),
  motivoCancelacion: z.string().nullable().optional(),
  fechaCierre:       isoDateLike.nullable().optional(),
  casosIds:          z.array(z.string()).max(500).default([]),
  bloqueos:          z.array(bloqueoSchema).max(100).default([]),
  historial:         z.array(z.any()).max(1000).default([]),
  comentarios:       z.array(comentarioSchema).max(200).default([]),
})
export type UpdateHistoriaDTO = z.infer<typeof updateHistoriaSchema>
