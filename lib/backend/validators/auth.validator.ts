import Joi from "joi"

export const loginSchema = Joi.object({
  email:    Joi.string().email().required().messages({
    "string.email": "Email inválido",
    "any.required": "El email es obligatorio",
  }),
  password: Joi.string().min(1).required().messages({
    "any.required": "La contraseña es obligatoria",
  }),
})

export const cambiarPasswordSchema = Joi.object({
  actual: Joi.string().required(),
  nueva:  Joi.string().min(8).required().messages({
    "string.min": "La nueva contraseña debe tener al menos 8 caracteres",
  }),
})

const ROLES_VALIDOS = ["owner", "admin", "qa_lead", "qa", "viewer"] as const

export const createUserSchema = Joi.object({
  nombre:   Joi.string().trim().min(2).required(),
  email:    Joi.string().email().required(),
  rol:      Joi.string().valid(...ROLES_VALIDOS).required().messages({
    "any.only": `El rol debe ser uno de: ${ROLES_VALIDOS.join(", ")}`,
  }),
})

export const updateUserSchema = Joi.object({
  id:                   Joi.string().required(),
  nombre:               Joi.string().trim().min(2).required(),
  email:                Joi.string().email().required(),
  rol:                  Joi.string().valid(...ROLES_VALIDOS).required().messages({
    "any.only": `El rol debe ser uno de: ${ROLES_VALIDOS.join(", ")}`,
  }),
  activo:               Joi.boolean(),
  debeCambiarPassword:  Joi.boolean(),
})
