-- v2.65: Additional composite indexes for common query patterns
-- These optimize the most frequent queries in the dashboard

-- Historias: estado + fechaCreacion (sorting filtered results)
CREATE INDEX IF NOT EXISTS "historias_usuario_estado_fecha_idx"
  ON "historias_usuario" ("estado", "fechaCreacion" DESC)
  WHERE "deletedAt" IS NULL;

-- Historias: sprint + estado (velocidad por sprint query in metricas)
CREATE INDEX IF NOT EXISTS "historias_usuario_sprint_estado_idx"
  ON "historias_usuario" ("sprint", "estado")
  WHERE "deletedAt" IS NULL AND "sprint" IS NOT NULL;

-- Casos: huId + estadoAprobacion (filtered caso queries)
CREATE INDEX IF NOT EXISTS "casos_prueba_hu_estado_idx"
  ON "casos_prueba" ("huId", "estadoAprobacion")
  WHERE "deletedAt" IS NULL;

-- Tareas: estado + asignado (tareas pendientes por asignado in metricas)
CREATE INDEX IF NOT EXISTS "tareas_estado_asignado_idx"
  ON "tareas" ("estado", "asignado")
  WHERE "deletedAt" IS NULL;

-- Tareas: huId + estado (filtered tarea queries)
CREATE INDEX IF NOT EXISTS "tareas_hu_estado_idx"
  ON "tareas" ("huId", "estado")
  WHERE "deletedAt" IS NULL;

-- Notificaciones: leida + fecha (unread notifications sorted by date)
CREATE INDEX IF NOT EXISTS "notificaciones_leida_fecha_idx"
  ON "notificaciones" ("leida", "fecha" DESC)
  WHERE "leida" = false;
