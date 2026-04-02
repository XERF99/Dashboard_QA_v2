import Joi from "joi"

export const loginSchema = Joi.object({
  email:    Joi.string().email().max(254).required().messages({
    "string.email": "Email inválido",
    "string.max":   "El email no puede superar 254 caracteres",
    "any.required": "El email es obligatorio",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "any.required": "La contraseña es obligatoria",
    "string.min":   "La contraseña debe tener al menos 8 caracteres",
    "string.max":   "La contraseña no puede superar 128 caracteres",
  }),
})

// Regex de complejidad: mínimo 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/

export const cambiarPasswordSchema = Joi.object({
  actual: Joi.string().max(128).required(),
  nueva:  Joi.string().min(8).max(128).pattern(PASSWORD_COMPLEXITY).required().messages({
    "string.min":     "La nueva contraseña debe tener al menos 8 caracteres",
    "string.max":     "La contraseña no puede superar 128 caracteres",
    "string.pattern.base": "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial",
  }),
})

const ROLES_VALIDOS = ["owner", "admin", "qa_lead", "qa", "viewer"] as const

export const createUserSchema = Joi.object({
  nombre:   Joi.string().trim().min(2).max(200).required(),
  email:    Joi.string().email().max(254).required(),
  rol:      Joi.string().valid(...ROLES_VALIDOS).required().messages({
    "any.only": `El rol debe ser uno de: ${ROLES_VALIDOS.join(", ")}`,
  }),
  grupoId:  Joi.string().optional().allow(null, ""),
})

export const updateUserSchema = Joi.object({
  id:                   Joi.string().required(),
  nombre:               Joi.string().trim().min(2).max(200),
  email:                Joi.string().email().max(254),
  rol:                  Joi.string().valid(...ROLES_VALIDOS).messages({
    "any.only": `El rol debe ser uno de: ${ROLES_VALIDOS.join(", ")}`,
  }),
  activo:               Joi.boolean(),
  debeCambiarPassword:  Joi.boolean(),
  grupoId:              Joi.string().optional().allow(null, ""),
})
