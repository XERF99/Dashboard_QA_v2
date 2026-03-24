-- ═══════════════════════════════════════════════════════════
--  MIGRACIÓN: add_grupos
--  Añade soporte multi-equipo (grupos/workspaces).
--
--  Estrategia de compatibilidad hacia atrás:
--  1. Crear tabla grupos
--  2. Insertar grupo por defecto "Equipo Principal"
--  3. Añadir columnas grupoId como nullable
--  4. Asignar todos los datos existentes al grupo por defecto
--  5. Convertir NOT NULL las columnas que lo requieren
--  6. Añadir restricciones y foreign keys
--  7. Reemplazar índices unique simples por compuestos
-- ═══════════════════════════════════════════════════════════

-- 1. Crear tabla grupos
CREATE TABLE "grupos" (
    "id"          TEXT        NOT NULL,
    "nombre"      TEXT        NOT NULL,
    "descripcion" TEXT        NOT NULL DEFAULT '',
    "activo"      BOOLEAN     NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grupos_nombre_key" ON "grupos"("nombre");

-- 2. Insertar grupo por defecto (recibe todos los datos existentes)
INSERT INTO "grupos" ("id", "nombre", "descripcion", "activo", "createdAt", "updatedAt")
VALUES (
    'grupo-default',
    'Equipo Principal',
    'Grupo creado automáticamente durante la migración inicial.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. Añadir columnas grupoId (nullable para la migración de datos)
ALTER TABLE "users"              ADD COLUMN "grupoId" TEXT;
ALTER TABLE "historias_usuario"  ADD COLUMN "grupoId" TEXT;
ALTER TABLE "sprints"            ADD COLUMN "grupoId" TEXT;
ALTER TABLE "notificaciones"     ADD COLUMN "grupoId" TEXT;
ALTER TABLE "config"             ADD COLUMN "grupoId" TEXT;

-- 4. Asignar datos existentes al grupo por defecto
--    Usuarios: owner queda con NULL (acceso a todos los grupos)
UPDATE "users"             SET "grupoId" = 'grupo-default' WHERE "rol" != 'owner';
UPDATE "historias_usuario" SET "grupoId" = 'grupo-default';
UPDATE "sprints"           SET "grupoId" = 'grupo-default';
UPDATE "notificaciones"    SET "grupoId" = 'grupo-default';
UPDATE "config"            SET "grupoId" = 'grupo-default';

-- 5. Hacer NOT NULL las columnas de contenido (historial, sprints, notificaciones, config)
ALTER TABLE "historias_usuario" ALTER COLUMN "grupoId" SET NOT NULL;
ALTER TABLE "sprints"           ALTER COLUMN "grupoId" SET NOT NULL;
ALTER TABLE "notificaciones"    ALTER COLUMN "grupoId" SET NOT NULL;
ALTER TABLE "config"            ALTER COLUMN "grupoId" SET NOT NULL;

-- 6. Índice único en config.grupoId (una config por grupo)
CREATE UNIQUE INDEX "config_grupoId_key" ON "config"("grupoId");

-- 7. Reemplazar índices unique simples por compuestos (dentro de grupo)
DROP INDEX "historias_usuario_codigo_key";
CREATE UNIQUE INDEX "historias_usuario_codigo_grupoId_key"
    ON "historias_usuario"("codigo", "grupoId");

DROP INDEX "sprints_nombre_key";
CREATE UNIQUE INDEX "sprints_nombre_grupoId_key"
    ON "sprints"("nombre", "grupoId");

-- 8. Foreign keys
ALTER TABLE "users" ADD CONSTRAINT "users_grupoId_fkey"
    FOREIGN KEY ("grupoId") REFERENCES "grupos"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "historias_usuario" ADD CONSTRAINT "historias_usuario_grupoId_fkey"
    FOREIGN KEY ("grupoId") REFERENCES "grupos"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sprints" ADD CONSTRAINT "sprints_grupoId_fkey"
    FOREIGN KEY ("grupoId") REFERENCES "grupos"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_grupoId_fkey"
    FOREIGN KEY ("grupoId") REFERENCES "grupos"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "config" ADD CONSTRAINT "config_grupoId_fkey"
    FOREIGN KEY ("grupoId") REFERENCES "grupos"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
