-- CreateIndex
CREATE INDEX "casos_prueba_huId_deletedAt_idx" ON "casos_prueba"("huId", "deletedAt");

-- CreateIndex
CREATE INDEX "historias_usuario_grupoId_deletedAt_idx" ON "historias_usuario"("grupoId", "deletedAt");

-- CreateIndex
CREATE INDEX "tareas_casoPruebaId_deletedAt_idx" ON "tareas"("casoPruebaId", "deletedAt");
