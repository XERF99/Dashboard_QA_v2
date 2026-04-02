import Joi from "joi"

export const createCasoSchema = Joi.object({
  huId:                  Joi.string().required(),
  titulo:                Joi.string().trim().max(500).required(),
  descripcion:           Joi.string().allow("").max(10000).default(""),
  entorno:               Joi.string().valid("test", "preproduccion").default("test"),
  tipoPrueba:            Joi.string().allow("").default(""),
  horasEstimadas:        Joi.number().min(0).default(0),
  complejidad:           Joi.string().valid("alta", "media", "baja").default("media"),
  archivosAnalizados:    Joi.array().items(Joi.string().max(500)).max(100).default([]),
  creadoPor:             Joi.string().required(),
})

export const updateCasoSchema = createCasoSchema.keys({
  estadoAprobacion:       Joi.string().valid("borrador", "pendiente_aprobacion", "aprobado", "rechazado").optional(),
  aprobadoPor:            Joi.string().optional().allow(null, ""),
  fechaAprobacion:        Joi.alternatives(Joi.date(), Joi.string().isoDate()).optional().allow(null),
  motivoRechazo:          Joi.string().optional().allow(null, ""),
  modificacionHabilitada: Joi.boolean().optional(),
  motivoModificacion:     Joi.string().optional().allow(null, ""),
  modificacionSolicitada: Joi.boolean().optional(),
  resultadosPorEtapa:     Joi.array().max(100).default([]),
  tareasIds:              Joi.array().items(Joi.string()).max(500).default([]),
  bloqueos:               Joi.array().max(100).default([]),
  comentarios:            Joi.array().max(200).default([]),
})
