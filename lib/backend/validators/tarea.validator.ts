import Joi from "joi"

export const createTareaSchema = Joi.object({
  casoPruebaId:   Joi.string().required(),
  huId:           Joi.string().required(),
  titulo:         Joi.string().trim().required(),
  descripcion:    Joi.string().allow("").default(""),
  asignado:       Joi.string().required(),
  tipo:           Joi.string().valid("ejecucion", "verificacion", "documentacion", "configuracion", "analisis").default("ejecucion"),
  prioridad:      Joi.string().valid("alta", "media", "baja").default("media"),
  horasEstimadas: Joi.number().min(0).default(0),
  evidencias:     Joi.string().allow("").default(""),
  creadoPor:      Joi.string().required(),
})

export const updateTareaSchema = createTareaSchema.keys({
  estado:         Joi.string().valid("pendiente", "en_progreso", "completada", "bloqueada").optional(),
  resultado:      Joi.string().valid("pendiente", "exitoso", "fallido").optional(),
  horasReales:    Joi.number().min(0).optional(),
  fechaInicio:    Joi.alternatives(Joi.date(), Joi.string().isoDate()).optional().allow(null),
  fechaFin:       Joi.alternatives(Joi.date(), Joi.string().isoDate()).optional().allow(null),
  bloqueos:       Joi.array().default([]),
})
