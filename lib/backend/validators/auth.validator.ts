import { z } from "zod"

export const loginSchema = z.object({
  email:    z.string().email("Email inválido").max(254, "El email no puede superar 254 caracteres"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede superar 128 caracteres"),
})
export type LoginDTO = z.infer<typeof loginSchema>

// Regex de complejidad: mínimo 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/

export const cambiarPasswordSchema = z.object({
  actual: z.string().max(128),
  nueva:  z.string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña no puede superar 128 caracteres")
    .regex(PASSWORD_COMPLEXITY, "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial"),
})
export type CambiarPasswordDTO = z.infer<typeof cambiarPasswordSchema>

const ROLES_VALIDOS = ["owner", "admin", "qa_lead", "qa", "viewer"] as const
const rolEnum = z.enum(ROLES_VALIDOS, {
  errorMap: () => ({ message: `El rol debe ser uno de: ${ROLES_VALIDOS.join(", ")}` }),
})

export const createUserSchema = z.object({
  nombre:  z.string().trim().min(2).max(200),
  email:   z.string().email().max(254),
  rol:     rolEnum,
  grupoId: z.string().nullable().optional(),
})
export type CreateUserDTO = z.infer<typeof createUserSchema>

export const updateUserSchema = z.object({
  id:                  z.string(),
  nombre:              z.string().trim().min(2).max(200).optional(),
  email:               z.string().email().max(254).optional(),
  rol:                 rolEnum.optional(),
  activo:              z.boolean().optional(),
  debeCambiarPassword: z.boolean().optional(),
  grupoId:             z.string().nullable().optional(),
})
export type UpdateUserDTO = z.infer<typeof updateUserSchema>
