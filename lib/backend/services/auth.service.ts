// ═══════════════════════════════════════════════════════════
//  AUTH SERVICE
//  Lógica de negocio: login, registro, cambio de password.
//  Los controllers solo llaman a estas funciones.
// ═══════════════════════════════════════════════════════════

import bcrypt from "bcryptjs"
import { prisma } from "@/lib/backend/prisma"
import { signToken } from "@/lib/backend/middleware/auth.middleware"
import { PASSWORD_GENERICA } from "@/lib/constants"

const MAX_INTENTOS = 5
const SALT_ROUNDS  = 10

// ── Login ─────────────────────────────────────────────────
export async function loginService(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { grupo: true } })

  // Mensaje genérico para usuario no encontrado: no revelar si el email existe
  if (!user)        return { success: false, error: "Credenciales inválidas." } as const
  if (!user.activo) return { success: false, error: "Tu cuenta está desactivada. Contacta al administrador." } as const
  if (user.bloqueado) return { success: false, error: "Tu cuenta está bloqueada por demasiados intentos fallidos." } as const
  if (user.grupo && !user.grupo.activo) return { success: false, error: "Tu grupo de trabajo está desactivado. Contacta al Owner." } as const
  if (user.rol !== "owner" && !user.grupoId) return { success: false, error: "Tu cuenta no tiene workspace asignado. Contacta al administrador.", code: "SIN_WORKSPACE" } as const

  const valid = await bcrypt.compare(password, user.passwordHash)

  if (!valid) {
    const intentos = user.intentosFallidos + 1
    const bloqueado = intentos >= MAX_INTENTOS
    await prisma.user.update({
      where: { id: user.id },
      data: { intentosFallidos: intentos, bloqueado },
    })
    if (bloqueado) return { success: false, error: "Cuenta bloqueada por demasiados intentos fallidos.", bloqueadoAhora: true, userId: user.id, nombre: user.nombre } as const
    const restantes = MAX_INTENTOS - intentos
    // Mensaje genérico: no confirmar que el email existe, solo indicar intentos restantes
    return { success: false, error: `Credenciales inválidas. ${restantes} intento${restantes !== 1 ? "s" : ""} restante${restantes !== 1 ? "s" : ""}.` } as const
  }

  // Login exitoso: resetear intentos y registrar sesión
  const historial = (user.historialConexiones as { entrada: string; salida?: string }[]) ?? []
  historial.push({ entrada: new Date().toISOString() })
  if (historial.length > 50) historial.splice(0, historial.length - 50)

  await prisma.user.update({
    where: { id: user.id },
    data: { intentosFallidos: 0, bloqueado: false, historialConexiones: historial },
  })

  const token = await signToken({
    sub:     user.id,
    email:   user.email,
    nombre:  user.nombre,
    rol:     user.rol,
    ...(user.grupoId ? { grupoId: user.grupoId } : {}),
  })

  return {
    success: true,
    token,
    debeCambiar: user.debeCambiarPassword,
    user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, grupoId: user.grupoId ?? null, activo: user.activo, debeCambiarPassword: user.debeCambiarPassword },
  } as const
}

// ── Logout: registrar salida de sesión ────────────────────
export async function logoutService(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const historial = (user.historialConexiones as { entrada: string; salida?: string }[]) ?? []
  if (historial.length > 0 && !historial[historial.length - 1]!.salida) {
    historial[historial.length - 1]!.salida = new Date().toISOString()
  }
  await prisma.user.update({ where: { id: userId }, data: { historialConexiones: historial } })
}

// ── Cambiar password ──────────────────────────────────────
export async function cambiarPasswordService(userId: string, actual: string, nueva: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { success: false, error: "Usuario no encontrado" }

  const valid = await bcrypt.compare(actual, user.passwordHash)
  if (!valid)        return { success: false, error: "Contraseña actual incorrecta" }
  if (nueva === actual) return { success: false, error: "La nueva contraseña debe ser diferente" }

  const hash = await bcrypt.hash(nueva, SALT_ROUNDS)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash, debeCambiarPassword: false } })
  return { success: true }
}

// ── Crear usuario ─────────────────────────────────────────
export async function createUserService(data: { nombre: string; email: string; rol: string; grupoId?: string | null }) {
  const exists = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
  if (exists) return { success: false, error: "Ya existe un usuario con este email" }

  const hash = await bcrypt.hash(PASSWORD_GENERICA, SALT_ROUNDS)
  const user = await prisma.user.create({
    data: {
      nombre:  data.nombre,
      email:   data.email.toLowerCase(),
      passwordHash: hash,
      rol:     data.rol,
      grupoId: data.grupoId ?? null,
      debeCambiarPassword: true,
    },
  })
  return { success: true, user }
}

// ── Reset password ────────────────────────────────────────
export async function resetPasswordService(userId: string) {
  const hash = await bcrypt.hash(PASSWORD_GENERICA, SALT_ROUNDS)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash, debeCambiarPassword: true, intentosFallidos: 0, bloqueado: false },
  })
  return { success: true }
}

// ── Desbloquear usuario ───────────────────────────────────
export async function desbloquearUsuarioService(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { intentosFallidos: 0, bloqueado: false },
  })
  return { success: true }
}

// ── Interface (v2.78) ─────────────────────────────────────────
export interface AuthService {
  login:              typeof loginService
  logout:             typeof logoutService
  cambiarPassword:    typeof cambiarPasswordService
  createUser:         typeof createUserService
  resetPassword:      typeof resetPasswordService
  desbloquearUsuario: typeof desbloquearUsuarioService
}

export const authService: AuthService = {
  login:              loginService,
  logout:             logoutService,
  cambiarPassword:    cambiarPasswordService,
  createUser:         createUserService,
  resetPassword:      resetPasswordService,
  desbloquearUsuario: desbloquearUsuarioService,
}
