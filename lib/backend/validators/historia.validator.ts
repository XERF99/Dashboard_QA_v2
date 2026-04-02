import Joi from "joi"

const bloqueoSchema = Joi.object({
  id:               Joi.string().required(),
  descripcion:      Joi.string().required(),
  reportadoPor:     Joi.string().required(),
  fecha:            Joi.alternatives(Joi.date(), Joi.string().isoDate()).required(),
  resuelto:         Joi.boolean().default(false),
  fechaResolucion:  Joi.alternatives(Joi.date(), Joi.string().isoDate()).optional(),
  resueltoPor:      Joi.string().optional(),
  notaResolucion:   Joi.string().optional(),
})

const comentarioSchema = Joi.object({
  id:     Joi.string().required(),
  texto:  Joi.string().required(),
  autor:  Joi.string().required(),
  fecha:  Joi.alternatives(Joi.date(), Joi.string().isoDate()).required(),
})

export const createHistoriaSchema = Joi.object({
  codigo:                  Joi.string().trim().max(50).required(),
  titulo:                  Joi.string().trim().max(500).required(),
  descripcion:             Joi.string().allow("").max(10000).default(""),
  criteriosAceptacion:     Joi.string().allow("").max(5000).default(""),
  responsable:             Joi.string().max(200).required(),
  prioridad:               Joi.string().valid("critica", "alta", "media", "baja").default("media"),
  puntos:                  Joi.number().integer().min(0).default(0),
  sprint:                  Joi.string().optional().allow(null, ""),
  aplicacion:              Joi.string().allow("").default(""),
  tipoAplicacion:          Joi.string().max(100).required(),
  requiriente:             Joi.string().allow("").default(""),
  areaSolicitante:         Joi.string().allow("").default(""),
  ambiente:                Joi.string().allow("").default(""),
  tipoPrueba:              Joi.string().allow("").default(""),
  creadoPor:               Joi.string().max(200).required(),
  delegadoPor:             Joi.string().allow("").default(""),
  permitirCasosAdicionales: Joi.boolean().default(false),
  motivoCasosAdicionales:  Joi.string().optional().allow(null, ""),
  fechaFinEstimada:        Joi.alternatives(Joi.date(), Joi.string().isoDate()).optional().allow(null),
})

export const updateHistoriaSchema = createHistoriaSchema.keys({
  estado:           Joi.string().valid("sin_iniciar", "en_progreso", "exitosa", "fallida", "cancelada").optional(),
  etapa:            Joi.string().optional(),
  motivoCancelacion: Joi.string().optional().allow(null, ""),
  fechaCierre:      Joi.alternatives(Joi.date(), Joi.string().isoDate()).optional().allow(null),
  casosIds:         Joi.array().items(Joi.string()).max(500).default([]),
  bloqueos:         Joi.array().items(bloqueoSchema).max(100).default([]),
  historial:        Joi.array().max(1000).default([]),
  comentarios:      Joi.array().items(comentarioSchema).max(200).default([]),
})
