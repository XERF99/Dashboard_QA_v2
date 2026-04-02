-- CreateIndex
CREATE INDEX "casos_prueba_huId_idx" ON "casos_prueba"("huId");

-- CreateIndex
CREATE INDEX "casos_prueba_estadoAprobacion_idx" ON "casos_prueba"("estadoAprobacion");

-- CreateIndex
CREATE INDEX "historias_usuario_grupoId_idx" ON "historias_usuario"("grupoId");

-- CreateIndex
CREATE INDEX "historias_usuario_estado_idx" ON "historias_usuario"("estado");

-- CreateIndex
CREATE INDEX "historias_usuario_sprint_idx" ON "historias_usuario"("sprint");

-- CreateIndex
CREATE INDEX "historias_usuario_responsable_idx" ON "historias_usuario"("responsable");

-- CreateIndex
CREATE INDEX "notificaciones_destinatario_grupoId_idx" ON "notificaciones"("destinatario", "grupoId");

-- CreateIndex
CREATE INDEX "notificaciones_destinatario_leida_idx" ON "notificaciones"("destinatario", "leida");

-- CreateIndex
CREATE INDEX "notificaciones_grupoId_idx" ON "notificaciones"("grupoId");

-- CreateIndex
CREATE INDEX "sprints_grupoId_idx" ON "sprints"("grupoId");

-- CreateIndex
CREATE INDEX "sprints_grupoId_fechaInicio_fechaFin_idx" ON "sprints"("grupoId", "fechaInicio", "fechaFin");

-- CreateIndex
CREATE INDEX "tareas_casoPruebaId_idx" ON "tareas"("casoPruebaId");

-- CreateIndex
CREATE INDEX "tareas_huId_idx" ON "tareas"("huId");

-- CreateIndex
CREATE INDEX "tareas_asignado_idx" ON "tareas"("asignado");

-- CreateIndex
CREATE INDEX "tareas_estado_idx" ON "tareas"("estado");

-- CreateIndex
CREATE INDEX "users_grupoId_idx" ON "users"("grupoId");

-- CreateIndex
CREATE INDEX "users_rol_idx" ON "users"("rol");
