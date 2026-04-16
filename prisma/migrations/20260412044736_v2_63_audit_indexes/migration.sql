-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_grupoId_action_idx" ON "audit_log"("grupoId", "action");
