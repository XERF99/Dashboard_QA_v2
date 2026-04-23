-- v2.73: Performance indexes adicionales tras auditoría de queries
-- del dashboard. Complementan los de v2.62 / v2.63 / v2.65.
--
-- Nota: índices parciales — no se reflejan en schema.prisma (Prisma
-- no los soporta en la DSL). Se aplican vía raw SQL y se documentan aquí.
--
-- Rollback:
--   DROP INDEX IF EXISTS "audit_log_grupo_timestamp_idx";
--   DROP INDEX IF EXISTS "historias_usuario_grupo_fecha_idx";
--   DROP INDEX IF EXISTS "tareas_asignado_estado_idx";

-- AuditLog: admin viewer (GET /api/audit) pagina por grupoId + ORDER BY timestamp DESC.
-- Los índices previos `[grupoId]` y `[timestamp]` por separado obligaban a sort adicional.
CREATE INDEX IF NOT EXISTS "audit_log_grupo_timestamp_idx"
  ON "audit_log" ("grupoId", "timestamp" DESC);

-- Historias: query principal del dashboard filtra por grupoId y ordena por fechaCreacion DESC.
-- El índice parcial elimina filas soft-deleted del scan.
CREATE INDEX IF NOT EXISTS "historias_usuario_grupo_fecha_idx"
  ON "historias_usuario" ("grupoId", "fechaCreacion" DESC)
  WHERE "deletedAt" IS NULL;

-- Tareas: "mis tareas pendientes" — filtra por asignado y estado.
CREATE INDEX IF NOT EXISTS "tareas_asignado_estado_idx"
  ON "tareas" ("asignado", "estado")
  WHERE "deletedAt" IS NULL;
