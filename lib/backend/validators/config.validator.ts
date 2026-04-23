import { z } from "zod"

const etapaDefSchema = z.object({
  id:    z.string(),
  label: z.string(),
  cls:   z.string().default(""),
})

const resultadoDefSchema = z.object({
  id:           z.string(),
  label:        z.string(),
  esAceptado:   z.boolean(),
  esBase:       z.boolean().default(false),
  cls:          z.string().default(""),
  icono:        z.string().optional(),
  maxRetesteos: z.number().int().min(1).nullable().optional(),
})

const tipoDefSchema = z.object({
  id:    z.string(),
  label: z.string(),
})

export const updateConfigSchema = z.object({
  etapas:          z.record(z.string(), z.array(etapaDefSchema)).optional(),
  resultados:      z.array(resultadoDefSchema).optional(),
  tiposAplicacion: z.array(tipoDefSchema).optional(),
  ambientes:       z.array(tipoDefSchema).optional(),
  tiposPrueba:     z.array(tipoDefSchema).optional(),
  aplicaciones:    z.array(z.string()).optional(),
})
export type UpdateConfigDTO = z.infer<typeof updateConfigSchema>
