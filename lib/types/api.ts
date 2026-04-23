// ── Rutas de API tipadas ────────────────────────────────────
export const API_ROUTES = {
  HISTORIAS:      "/api/historias",
  CASOS:          "/api/casos",
  TAREAS:         "/api/tareas",
  CONFIG:         "/api/config",
  METRICAS:       "/api/metricas",
  HEALTH:         "/api/health",
  EXPORT:         "/api/export",
  EXPORT_PDF:     "/api/export/pdf",
  AUTH_LOGIN:     "/api/auth/login",
  AUTH_LOGOUT:    "/api/auth/logout",
  AUTH_ME:        "/api/auth/me",
  AUTH_PASSWORD:  "/api/auth/password",
  USERS:          "/api/users",
  GRUPOS:         "/api/grupos",
  SPRINTS:        "/api/sprints",
  NOTIFICACIONES: "/api/notificaciones",
  AUDIT:          "/api/audit",
} as const

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES]
