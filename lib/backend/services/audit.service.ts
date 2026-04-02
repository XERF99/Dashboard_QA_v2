// ═══════════════════════════════════════════════════════════
//  AUDIT SERVICE
//  Escribe entradas en la tabla audit_log.
//  Regla: NUNCA lanza excepción — si falla el log, la acción
//  principal no debe revertirse. El error se registra en el logger.
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"
import { logger } from "@/lib/backend/logger"
import type { JWTPayload } from "@/lib/backend/middleware/auth.middleware"

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "LOGIN"
  | "LOGOUT"
  | "RESET_PASSWORD"
  | "UNLOCK"

export type AuditResource =
  | "historias"
  | "casos"
  | "tareas"
  | "users"
  | "grupos"
  | "config"
  | "sprints"
  | "notificaciones"
  | "auth"

export interface AuditParams {
  actor:      JWTPayload
  action:     AuditAction
  resource:   AuditResource
  resourceId?: string
  meta?:      Record<string, unknown>
}

/**
 * Escribe un registro en audit_log de forma fire-and-forget.
 * Los errores no se propagan al llamante — solo se loguean.
 */
export async function audit(params: AuditParams): Promise<void> {
  const { actor, action, resource, resourceId, meta } = params
  try {
    await prisma.auditLog.create({
      data: {
        userId:     actor.sub,
        userEmail:  actor.email,
        userRol:    actor.rol,
        grupoId:    actor.grupoId ?? null,
        action,
        resource,
        resourceId: resourceId ?? null,
        meta:       (meta ?? {}) as object,
      },
    })
  } catch (e) {
    // El audit nunca debe romper la operación principal
    logger.error("audit.service", `Error al escribir audit log: ${action} ${resource}`, e)
  }
}
