import Joi from "joi"

const etapaDefSchema = Joi.object({
  id:    Joi.string().required(),
  label: Joi.string().required(),
  cls:   Joi.string().allow("").default(""),
})

const resultadoDefSchema = Joi.object({
  id:            Joi.string().required(),
  label:         Joi.string().required(),
  esAceptado:    Joi.boolean().required(),
  esBase:        Joi.boolean().default(false),
  cls:           Joi.string().allow("").default(""),
  icono:         Joi.string().optional().allow(""),
  maxRetesteos:  Joi.number().integer().min(1).optional().allow(null),
})

const tipoDefSchema = Joi.object({
  id:    Joi.string().required(),
  label: Joi.string().required(),
})

export const updateConfigSchema = Joi.object({
  etapas:          Joi.object().pattern(Joi.string(), Joi.array().items(etapaDefSchema)).optional(),
  resultados:      Joi.array().items(resultadoDefSchema).optional(),
  tiposAplicacion: Joi.array().items(tipoDefSchema).optional(),
  ambientes:       Joi.array().items(tipoDefSchema).optional(),
  tiposPrueba:     Joi.array().items(tipoDefSchema).optional(),
  aplicaciones:    Joi.array().items(Joi.string()).optional(),
})
