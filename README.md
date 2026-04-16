# QAControl — Dashboard de Gestión de Pruebas · v2.68

Sistema integral de gestión de calidad para equipos QA. Permite administrar Historias de Usuario, casos de prueba, flujos de aprobación, bloqueos y carga ocupacional del equipo, con control de acceso basado en roles.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.2 (App Router) |
| UI | React 19 + TypeScript 5.7 |
| Estilos | Tailwind CSS v4 + OKLCH color system |
| Componentes | shadcn/ui + Radix UI |
| Iconos | Lucide React |
| Gráficos | Recharts 2.15 |
| Persistencia | PostgreSQL + Prisma ORM (fuente de verdad) / localStorage (caché de UI) |
| Data fetching | TanStack Query (React Query) v5 |
| PDF server-side | jsPDF 4 |
| Keyboard shortcuts | react-hotkeys-hook 5 |
| Tests unitarios | Vitest 3 + React Testing Library 16 |
| Tests accesibilidad | axe-core 4 |
| Tests E2E | Playwright 1.58 |
| Pre-commit hooks | Husky 9 + lint-staged 16 |
| Bundle analysis | @next/bundle-analyzer |
| Package manager | pnpm |
| Drag & Drop | @dnd-kit 6 |
| Despliegue | Vercel / Docker |

---

## Funcionalidades

### Inicio (Home Dashboard)
- KPIs generales: total de HUs, en progreso, exitosas, fallidas y canceladas
- **Panel de Riesgos** automático: HUs vencidas, por vencer en 3/7 días, bloqueadas y casos sin ejecutar *(nuevo en v2.2)*
- Distribución de HUs por estado con barra de progreso visual
- Top responsables por carga de trabajo
- Feed de actividad reciente con íconos por tipo de evento
- **Mini calendario de entregas** con navegación mensual, indicadores de urgencia por color y detalle al hacer clic en cada día
- Panel de entregas del mes actual ordenado por fecha
- Accesos rápidos a las secciones principales

### Historias de Usuario (HU)
- Tarjetas de estadísticas con porcentajes de progreso
- Tabla completa con filtros por estado, prioridad, tipo de aplicación, ambiente y responsable
- **Vista por Sprint**: tabs de selección de sprint con cards de progreso y distribución de estados *(nuevo en v2.2)*
- **Importación CSV**: carga de HUs desde archivo CSV compatible con la exportación del sistema *(nuevo en v2.2)*
- **Acciones masivas**: cambio de estado, reasignación de responsable y eliminación en lote
- Búsqueda global que abarca título, código, responsable, descripción y casos de prueba (full-text search en API con parámetro `?q=`)
- **Atajos de teclado**: `Alt+1..8` navega tabs, `Alt+N` nueva HU, `/` o `Alt+B` enfoca búsqueda *(nuevo en v2.64)*
- Creación y edición con formulario completo: prioridad, tipo de aplicación, ambiente, tipo de prueba, fecha estimada, story points, descripción
- **Plantillas de HU**: autocompletado de campos técnicos al crear una nueva HU con 5 plantillas predefinidas *(nuevo en v2.2)*

### Detalle de Historia de Usuario
- Seguimiento de etapas de ejecución configurables por tipo de aplicación
- Gestión de **casos de prueba** dentro de la HU
- Gestión de **tareas** con estados: pendiente, en progreso, completada, bloqueada
- **Bloqueos** a nivel de HU con descripción, prioridad y notas de resolución
- Historial completo de eventos con timestamp y autor
- Comentarios internos
- Flujo de aprobación de casos: Borrador → Pendiente → Aprobado / Rechazado
- Habilitación de modificaciones en casos ya aprobados
- Retesteo de casos fallidos con comentario de corrección
- Cancelación de HU con motivo

### Analytics
- KPIs detallados con tendencias
- Gráficos de distribución por estado, prioridad, tipo de aplicación y ambiente
- Tasa de aprobación de casos de prueba
- Métricas de ejecución por etapa
- Filtrado automático según el rol del usuario (Owner ve todo; Admin ve todo el workspace; QA Lead ve sus HUs y las de todos los usuarios qa del workspace; QA solo ve sus HUs)

### Carga Ocupacional
- Visualización de la distribución de trabajo por miembro del equipo
- Filtrado automático por rol: Owner y Admin ven a todos los miembros del workspace; QA Lead ve su propia carga y la de los usuarios qa; QA solo se ve a sí mismo; Viewer ve a todos (solo lectura)

### Bloqueos
- Panel unificado de bloqueos activos en HUs, casos de prueba y tareas
- Resolución de bloqueos con nota de resolución
- Contador de bloqueos activos visible en la pestaña de navegación

### Casos de Prueba
- Vista global de todos los casos de prueba con filtros
- Agrupación por Historia de Usuario
- Visualización del estado de aprobación y ejecución por etapa

### Panel de Administración

#### Auditoría
- Historial completo de eventos de todas las HUs
- Filtrado por tipo de evento y responsable
- **Audit Log** *(nuevo en v2.67)*: visor de audit log con React Query, filtros por acción y recurso, búsqueda por usuario/detalle/ID, paginación y skeleton loading. Accesible para Owner (ve todo) y Admin (scoped a su workspace)

#### Gestión de Usuarios
- CRUD completo de usuarios (Owner y Admin)
- Asignación de roles con descripción de permisos
- **Aislamiento por workspace**: Admin solo ve y gestiona usuarios de su propio workspace
- **Usuarios sin workspace**: sección especial para que admins incorporen usuarios creados por el Owner aún sin workspace asignado
- Activación / desactivación de cuentas
- Reseteo de contraseña a la genérica (con cambio obligatorio en próximo login)
- **Bloqueo automático** tras 5 intentos fallidos; desbloqueo manual disponible en el menú de acciones
- **Notificación automática** al Admin/Owner cuando una cuenta queda bloqueada
- **Visibilidad role-based**: Admin ve todos los usuarios de su workspace; QA Lead ve sus HUs + las de usuarios qa; QA solo ve las propias; Viewer ve todo en modo lectura
- Protección: solo el Owner puede crear o asignar roles de Admin u Owner
- **Conteo de asignaciones en diálogo de quitar del workspace**: antes de confirmar, el diálogo muestra cuántas HUs y tareas tiene asignadas el usuario *(nuevo en v2.52)*
- **Indicador visual de responsable/asignado sin workspace**: ícono `UserX` naranja en tarjetas de HU (kanban y tabla), detalle de HU y tarjetas de tarea cuando el responsable o asignado ya no está activo en el workspace *(nuevo en v2.52)*
- **Eliminación de notificaciones**: botón eliminar en cada notificación *(nuevo en v2.53)*
- **Aprobación/rechazo masivo de casos**: `PATCH /api/casos/batch` permite aprobar o rechazar múltiples casos en una sola operación *(nuevo en v2.53)*

#### Configuración
- **Roles**: creación y edición de roles personalizados con permisos granulares
- **Tipos de Aplicación**: gestión de los tipos disponibles (Web, Mobile, API, etc.)
- **Aplicaciones**: lista de aplicaciones del proyecto
- **Ambientes**: entornos de prueba disponibles (Dev, QA, Staging, Prod, etc.)
- **Tipos de Prueba**: categorías de prueba disponibles (Funcional, Regresión, Smoke, etc.)
- **Etapas**: configuración de las etapas de ejecución por tipo de aplicación; al agregar nuevas etapas se muestran sugerencias de etapas ya existentes en otros tipos para poder reutilizarlas con un clic
- **Sprints**: gestión de sprints con nombre, fechas de inicio/fin y objetivo; las HUs se asignan a un sprint desde un selector (no texto libre)

---

## Estructura del proyecto

```
dashboard_v22/
├── app/                              ← Next.js App Router (rutas y API)
│   ├── api/                          ← API Routes
│   │   ├── auth/                     ← login, logout, me, password
│   │   ├── users/                    ← CRUD usuarios + asignaciones
│   │   ├── historias/                ← CRUD HU + sync + historial
│   │   ├── casos/                    ← CRUD casos + sync + batch
│   │   ├── tareas/                   ← CRUD tareas + sync
│   │   ├── sprints/                  ← CRUD sprints
│   │   ├── grupos/                   ← CRUD grupos (owner)
│   │   ├── notificaciones/           ← GET/POST/PATCH/DELETE notificaciones
│   │   ├── metricas/                 ← GET métricas agregadas
│   │   ├── config/                   ← GET/PUT config por grupo
│   │   ├── export/                   ← GET export CSV
│   │   │   └── pdf/                  ← GET export PDF (server-side jsPDF)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      ← SPA principal (login + dashboard)
│
├── components/
│   ├── layout/                       ← Componentes de layout global
│   │   ├── error-boundary.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-switcher.tsx
│   ├── auth/
│   │   └── login-screen.tsx
│   ├── dashboard/
│   │   ├── analytics/                ← HomeDashboard, KPIs, CargaOcupacional
│   │   ├── casos/                    ← CasosTable, CasoPruebaCard, CSVImportCasosModal
│   │   ├── config/                   ← Roles, Etapas, Resultados, Sprints, Ambientes, etc.
│   │   ├── historias/                ← HistoriasTable, HUDetail, HUForm, CSVImportModal
│   │   ├── owner/                    ← OwnerPanel + shared/dialogs/members/detail ← v2.68
│   │   ├── shared/                   ← Header, NavTabGroup, BloqueosPanel, AuditoriaPanel,
│   │   │                               AuditLogViewer, CommandPalette, CommentThread,
│   │   │                               PanelRiesgos, SprintPanel, ToastContainer
│   │   └── usuarios/                 ← UserManagement, UserFormModal, PerfilDialog
│   └── ui/                           ← shadcn/ui primitives (Button, Dialog, Select, etc.)
│
├── lib/
│   ├── backend/                      ← Código server-side exclusivo (no importar desde cliente)
│   │   ├── middleware/               ← auth.middleware.ts, rate-limit.ts
│   │   ├── services/                 ← base-crud, auth, historia, caso, tarea, config,
│   │   │                               notificacion, sprint, metricas, grupo, audit
│   │   ├── validators/               ← Joi: auth, historia, caso, tarea, config
│   │   ├── metricas-cache.ts         ← Caché en memoria por workspace
│   │   └── prisma.ts                 ← Singleton Prisma Client
│   ├── contexts/                     ← React Contexts
│   │   ├── auth-context.tsx          ← AuthProvider, useAuth, permisos, PASSWORD_GENERICA
│   │   ├── theme-context.tsx         ← ThemeProvider, useTheme
│   │   └── hu-detail-context.tsx     ← HUDetailProvider (estado del panel de detalle)
│   ├── providers/
│   │   └── query-provider.tsx        ← TanStack Query provider (staleTime 2min, gcTime 5min)
│   ├── hooks/                        ← Hooks de dominio y UI
│   │   ├── domain/                   ← Handlers: huHandlers, casoHandlers, tareaHandlers,
│   │   │                               bloqueoHandlers, comentarioHandlers, types
│   │   ├── useDomainData.ts          ← Facade que compone useHistoriasData + useCasosData + useTareasData
│   │   ├── useHistoriasData.ts       ← Hook independiente: fetch + parse de historias
│   │   ├── useCasosData.ts           ← Hook independiente: fetch + parse de casos
│   │   ├── useTareasData.ts          ← Hook independiente: fetch + parse de tareas
│   │   ├── useAuditLog.ts            ← React Query hook para GET /api/audit
│   │   ├── useKeyboardShortcuts.ts   ← Atajos de teclado globales (Alt+1..8, Alt+N, Ctrl+K)
│   │   ├── useHistoriasVisibles.ts   ← Scoping de HUs por rol
│   │   ├── useHistoriasFilters.ts    ← Filtros, búsqueda y ordenamiento
│   │   ├── useConfig.ts              ← Config del workspace (roles, etapas, sprints, etc.)
│   │   ├── useHUModals.ts            ← Estado de modales de HU
│   │   ├── useNotificaciones.ts      ← Polling de notificaciones
│   │   ├── useApiMirroredState.ts    ← Estado optimista sincronizado con la API
│   │   ├── useListConfig.ts          ← Gestión de listas de config editables
│   │   ├── useTareaForm.ts           ← Formulario de tarea inline
│   │   ├── useIsHydrated.ts          ← Guard de hidratación SSR
│   │   ├── useToast.ts               ← Sistema de notificaciones toast
│   │   └── use-mobile.ts             ← Detección de viewport mobile
│   ├── services/
│   │   └── api/                      ← client.ts (apiFetch helper con manejo de errores)
│   ├── data/                         ← Datos de seed y fixtures estáticas
│   ├── types/                        ← Tipos TypeScript del dominio (index.ts)
│   ├── utils/                        ← date-utils, domain, user-utils, asignaciones, parsers
│   ├── constants/                    ← badge-paleta, constantes de dominio, api-routes
│   ├── export/                       ← Exportación a CSV/PDF (hu-export, analytics-export)
│   └── storage.ts                    ← localStorage helpers + STORAGE_KEYS
│
├── prisma/
│   ├── schema.prisma                 ← Modelos + índices de rendimiento
│   ├── seed.ts                       ← Datos iniciales (usuarios, roles, config base)
│   └── migrations/                   ← Historial de migraciones SQL
│
├── public/                           ← Assets estáticos (favicon, iconos)
├── playwright.config.ts              ← Configuración Playwright (E2E)
├── vitest.config.ts                  ← Configuración Vitest (unit tests)
├── .husky/
│   └── pre-commit                    ← Husky pre-commit hook (lint-staged)
└── tests/                            ← Tests Vitest + 14 tests E2E Playwright
    ├── helpers/axe-helper.ts         ← axe-core wrapper para tests de accesibilidad
    ├── accessibility.test.tsx        ← Tests WCAG con axe-core
    └── e2e/                          ← flujo-completo.spec.ts (Playwright)
```

## Backend (PostgreSQL + Prisma + MVC + Joi/Zod)

El backend corre como **API Routes de Next.js** dentro del mismo proyecto, siguiendo una arquitectura MVC.
El sistema está **completamente conectado a PostgreSQL** — login, datos y configuración se sincronizan con la DB en tiempo real.

### Rutas API

```
app/api/
  auth/login/route.ts              ← POST  /api/auth/login
  auth/logout/route.ts             ← POST  /api/auth/logout
  auth/me/route.ts                 ← GET   /api/auth/me
  auth/password/route.ts           ← PUT   /api/auth/password
  auth/refresh/route.ts            ← POST  /api/auth/refresh
  audit/route.ts                   ← GET   /api/audit  (owner: todo, admin: su workspace)
  users/route.ts                   ← GET   /api/users  · POST  /api/users
  users/[id]/route.ts              ← PUT   /api/users/[id] · DELETE /api/users/[id]
  historias/route.ts               ← GET   /api/historias  · POST  /api/historias
  historias/[id]/route.ts          ← GET · PUT · DELETE  /api/historias/[id]
  casos/route.ts                   ← GET   /api/casos  · POST  /api/casos
  casos/[id]/route.ts              ← GET · PUT · DELETE  /api/casos/[id]
  tareas/route.ts                  ← GET   /api/tareas  · POST  /api/tareas
  tareas/[id]/route.ts             ← GET · PUT · DELETE  /api/tareas/[id]
  config/route.ts                  ← GET   /api/config  · PUT  /api/config
  notificaciones/route.ts          ← GET   /api/notificaciones  · POST /api/notificaciones
  notificaciones/[id]/route.ts     ← PATCH /api/notificaciones/[id]  (marcar leída) · DELETE /api/notificaciones/[id]
  notificaciones/marcar-todas/route.ts ← PATCH /api/notificaciones/marcar-todas
  metricas/route.ts                ← GET   /api/metricas
  sprints/route.ts                 ← GET   /api/sprints  · POST  /api/sprints
  sprints/[id]/route.ts            ← GET · PUT · DELETE  /api/sprints/[id]
  export/route.ts                  ← GET   /api/export?tipo=historias|casos[&sprint=...][&estado=...]
  export/pdf/route.ts              ← GET   /api/export/pdf?tipo=historias|casos[&sprint=...][&estado=...]
  historias/[id]/historial/route.ts ← GET  /api/historias/[id]/historial[?page=1&limit=20]
  grupos/route.ts                  ← GET   /api/grupos  · POST  /api/grupos          (owner)
  grupos/[id]/route.ts             ← GET · PUT · DELETE  /api/grupos/[id]             (owner)
  grupos/[id]/metricas/route.ts    ← GET   /api/grupos/[id]/metricas                 (owner)
  users/[id]/asignaciones/route.ts ← GET   /api/users/[id]/asignaciones               (admin/owner)
  casos/batch/route.ts             ← PATCH /api/casos/batch                            (admin/owner)
  historias/sync/route.ts          ← POST  /api/historias/sync                          (sync batch)
  casos/sync/route.ts              ← POST  /api/casos/sync                              (sync batch)
  tareas/sync/route.ts             ← POST  /api/tareas/sync                             (sync batch)
  audit/route.ts                   ← GET   /api/audit                                   (owner: todo, admin: workspace)
  health/route.ts                  ← GET   /api/health                                  (public)
```

### Schema Prisma

Modelos: `Grupo`, `User`, `Role`, `HistoriaUsuario`, `CasoPrueba`, `Tarea`, `Sprint`, `Notificacion`, `Config`, `AuditLog`.

Los campos con arrays complejos (`bloqueos`, `historial`, `comentarios`, `resultadosPorEtapa`) se almacenan como `Json` para preservar los tipos TypeScript sin cambios en el frontend.

Cada tabla tiene índices de rendimiento definidos con `@@index` en el schema. **Para aplicarlos en la DB hay que ejecutar una migración** (ver Setup).

### Setup inicial (requiere PostgreSQL)

```bash
# 1. Ajustar credenciales en .env
#    DATABASE_URL="postgresql://usuario:password@localhost:5432/tcs_dashboard"
#    JWT_SECRET="un-string-aleatorio-largo"
#    JWT_SECRET_PREVIOUS=""  ← (opcional) para rotación de secreto sin downtime

# 2. Aplicar migraciones (tablas + índices de rendimiento)
npx prisma migrate dev

# 3. Generar el cliente Prisma (tipos TypeScript)
npx prisma generate

# 4. Cargar datos iniciales (usuarios, roles, config base)
pnpm db:seed
```

> **Para instalaciones existentes** (DB ya creada sin los índices): ejecuta `npx prisma migrate dev --name add_performance_indexes` para aplicar los `@@index` que se añadieron desde v2.56/v2.58 y que no estaban en las migraciones anteriores.

### Datos demo (opcionales)

El script `scripts/demo-data.ts` crea un conjunto realista de datos de prueba para explorar la aplicación sin tener que cargar datos manualmente.

```bash
pnpm demo:seed    # Crea los datos demo
pnpm demo:clean   # Borra todos los datos demo de una vez
```

**Qué crea `demo:seed`:**

| Tipo | Cantidad | Detalle |
|---|---|---|
| Usuarios | 4 | Sofía Romero (qa), Daniel Vega (qa), Rosa Ibáñez (qa_lead), Pedro Alves (viewer) — contraseña: `Demo1234!` |
| Sprint | 1 | "[DEMO] Sprint Demo Q2-2026" (abril 2026) |
| Historias de Usuario | 5 | Distintos estados (sin iniciar, en progreso, completada), prioridades y tipos (web, api, mobile) |
| Casos de prueba | ~10 | 1-3 por HU, con estados coherentes al de la HU |
| Tareas | ~20 | 1-3 por caso, con horas estimadas y asignados |

Todo queda marcado con el prefijo `[DEMO]` en títulos y dominio `@demo.tcs` en emails — `demo:clean` los elimina en cascada sin tocar los datos reales del seed.

---

## Seguridad

El sistema implementa múltiples capas de defensa en los endpoints de la API.

### Mecanismos activos

| Capa | Implementación |
|---|---|
| Autenticación | JWT HS256 firmado con `jose`, expiración 8h, cookie `httpOnly` |
| Protección de cookies | `httpOnly`, `secure` (producción), `sameSite: lax` |
| Hashing de contraseñas | bcryptjs con 10 rondas de salt |
| Bloqueo por intentos | Cuenta bloqueada automáticamente tras 5 intentos fallidos |
| Rate limiting | Login: 10 req/IP / 15 min → 429. Password: 10 req/usuario / 15 min → 429. Sync/export/batch: 20–30 req/IP·endpoint / 1 min → 429. Todos los 429 incluyen `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` |
| Control de acceso | Guards `requireAuth` y `requireAdmin` en todos los endpoints |
| Validación de entrada | Joi en POST/PUT de auth/CRUD; Zod en rutas `/sync` — rechazan payloads inválidos con HTTP 400. Límites `.max()` en email (254), password (128) y nombre (200) |
| Whitelist de roles | El campo `rol` solo acepta: `owner`, `admin`, `qa_lead`, `qa`, `viewer` |
| Prevención de enumeración | El login devuelve "Credenciales inválidas" tanto para email inexistente como para contraseña incorrecta |
| Seguridad HTTP | Headers configurados en `next.config.mjs`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Content-Security-Policy`, `Referrer-Policy`, `Permissions-Policy` |
| Inyección SQL | Prisma ORM con queries parametrizadas — sin SQL raw |
| Secreto JWT | `JWT_SECRET` obligatorio en producción — lanza error al arrancar si no está definido |

### Variables de entorno requeridas en producción

```bash
JWT_SECRET="string-aleatorio-largo-min-32-caracteres"
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."   # solo necesario con Neon / connection pooler
```

> En desarrollo local el servidor arranca con un secret de fallback y muestra una advertencia. En producción (`NODE_ENV=production`) el arranque falla explícitamente si `JWT_SECRET` no está configurado.

### Archivos clave

```
lib/backend/middleware/
  auth.middleware.ts    ← JWT: signToken, verifyToken, requireAuth, requireAdmin
  rate-limit.ts         ← Rate limiter en memoria por IP (10 req / 15 min)
lib/backend/validators/
  auth.validator.ts     ← Whitelist de roles, mínimo 8 chars en contraseña
lib/backend/services/
  auth.service.ts       ← Mensaje genérico para evitar enumeración de usuarios
next.config.mjs         ← Headers de seguridad HTTP
```

---

## Tests

El proyecto cuenta con **905 tests automatizados** en 55 archivos usando Vitest 3 + React Testing Library 16. Los tests de API routes corren en entorno `node`; los de UI/hooks en `jsdom`.

### Comandos

```bash
# Tests unitarios (Vitest)
pnpm test        # Modo watch (desarrollo)
pnpm test:run    # Ejecución única (CI)
pnpm test:ui     # Interfaz visual de Vitest

# Tests E2E (Playwright) — requiere servidor en localhost:3000 y DB con seed
npx playwright test              # Ejecutar todos los E2E
npx playwright test --ui         # Interfaz visual de Playwright
npx playwright test --headed     # Con ventana del navegador visible
```

### Cobertura

| Archivo | Entorno | Tests | Qué cubre |
|---|---|---|---|
| `tests/auth-login.test.ts` | jsdom | 12 | Login, bloqueo por intentos, guards de addUser/deleteUser |
| `tests/casoHandlers.test.ts` | jsdom | 20 | Flujo de aprobación, retesteo, notificaciones por rol; `handleCompletarCasoEtapa` (guard bloqueos, historial síncrono) |
| `tests/useHistoriasVisibles.test.ts` | jsdom | 15 | Scoping por rol: Owner (todo), Admin (todo workspace), QA Lead (propias + qa del workspace), QA (verSoloPropios), Viewer (todo); filtroNombresCarga por rol |
| `tests/api-auth-endpoints.test.ts` | node | 9 | GET /me · POST /logout · PUT /password |
| `tests/api-historias.test.ts` | node | 10 | CRUD + sync de historias de usuario |
| `tests/api-casos.test.ts` | node | 15 | CRUD + filtros + sync de casos de prueba + aislamiento workspace `?huId` |
| `tests/api-tareas.test.ts` | node | 19 | CRUD + filtros + sync de tareas + aislamiento workspace `?casoPruebaId`/`?huId`/sync |
| `tests/api-users.test.ts` | node | 30 | CRUD usuarios + reset-password + desbloquear + workspace filter GET + role restriction POST + workspace isolation PUT/DELETE + grupoId herencia |
| `tests/user-form-modal.test.tsx` | jsdom | 15 | Renderizado, POST/PUT vía API, grupoId heredado del servidor, errores inline, sincronización estado local, sin equipoIds |
| `tests/api-config.test.ts` | node | 6 | GET/PUT config con guards de rol |
| `tests/api-metricas.test.ts` | node | 5 | Agregaciones del dashboard QA |
| `tests/api-sprints.test.ts` | node | 15 | CRUD sprints + sprint activo + validaciones |
| `tests/api-notificaciones.test.ts` | node | 11 | GET/POST/PATCH notificaciones, scoping por rol |
| `tests/api-export.test.ts` | node | 14 | Export CSV historias/casos + filtros + cabecera + aislamiento workspace (grupoId en `where`) |
| `tests/api-historial.test.ts` | node | 12 | GET historial paginado: 401, 404, orden desc, paginación, límites + aislamiento workspace |
| `tests/bloqueo-guards.test.ts` | jsdom | 12 | Guardias: tarea bloqueada impide completar caso; caso bloqueado impide avanzar HU |
| `tests/useConfig-sprints.test.ts` | jsdom | 10 | Carga inicial desde API, addSprint (duplicado, optimista, reemplazo ID), updateSprint, deleteSprint |
| `tests/tareaHandlers.test.ts` | jsdom | 11 | `handleBloquearTarea` y `handleDesbloquearTarea`: historial síncrono, guard de tarea inexistente, estado tras desbloqueo parcial |
| `tests/bloqueoHandlers.test.ts` | jsdom | 7 | `handleResolverBloqueoTarea`: historial síncrono, guard, estado residual con múltiples bloqueos activos |
| `tests/metricas-cache.test.ts` | node | 12 | Módulo de caché (get/set/invalidate) + partición por workspace + aislamiento grupo-A/B en `GET /api/metricas` |
| `tests/huHandlers.test.ts` | jsdom | 21 | `handleIniciarHU`, `handleCancelarHU`, `handleFallarHU`, `handleBulkCambiarEstado/Responsable`, `handleImportarHUs`, `handleAvanzarEtapa` |
| `tests/comentarioHandlers.test.ts` | jsdom | 7 | `handleAddComentarioHU` y `handleAddComentarioCaso`: autor, fecha, unicidad de IDs, aislamiento entre entidades |
| `tests/notificacion-service.test.ts` | node | 5 | `rolToDestinatario`: mapeo de cada rol posible a su destinatario |
| `tests/crearEvento.test.ts` | jsdom | 4 | `crearEvento`: tipo/descripción/usuario, fecha `Date`, formato de ID, unicidad de 100 IDs |
| `tests/auth-session-expiry.test.ts` | jsdom | 5 | `sessionExpired` inicial false; polling 401 → logout; login post-expiración → resetea; sin usuario el intervalo no arranca; polling ok → sin cambio |
| `tests/etapas-reuse.test.tsx` | jsdom | 5 | Sin etapas en otros tipos → sin sugerencias; etapa ausente → badge visible; etapa presente → badge oculto; deduplicación entre tipos; clic en sugerencia → `onChange` con etapa añadida |
| `tests/useConfig-sync.test.ts` | jsdom | 3 | `tiposAplicacion` vacío no se envía al PUT; `ambientes` vacío no se envía; labels válidos se envían completos |
| `tests/labelToId.test.ts` | jsdom | 15 | `labelToId`: lowercase, tildes, espacios, especiales, vacío, combinado · `useListConfig`: agregar, duplicado, vacío, eliminar, mover, límites, `hayDiferencias`, restaurar |
| `tests/useHistoriasFilters.test.ts` | jsdom | 16 | Filtros por estado/prioridad/responsable/tipo/sprint/ambiente + combinados + `__sin_sprint__` + `limpiarFiltros` + `filtrosActivos`; ordenamiento asc/desc/campo; valores únicos (responsables, sprints) |
| `tests/rate-limit.test.ts` | node | 10 | `checkRateLimit`: primera petición, conteo hasta límite, bloqueo al superar, IPs independientes, `resetAt`, expiración de ventana con fake timers · `getClientIp`: `x-forwarded-for`, `x-real-ip`, fallback `unknown`, precedencia |
| `tests/resultados-config.test.tsx` | jsdom | 10 | Renderizado labels; `Máx. ret.` solo para no aceptados; sin botón Eliminar en base; botón + confirmación en personalizados; toggle aceptado (↓ y ↑); agregar estado custom; restaurar con diferencias; sin botón Restaurar cuando lista es igual |
| `tests/csv-import-casos.test.tsx` | jsdom | 26 | Renderizado (open=false, título, formato, onClose); parseo CSV: fila válida → OK, HU no encontrada, título vacío, código vacío, conteo múltiples; importación: onImport con casos válidos, sin botón cuando no hay válidos, "Cambiar archivo", IDs únicos; defaults: complejidad/entorno/horas/estadoAprobacion |
| `tests/grupos.test.ts` | node | 20 | `getAllGrupos`, `getGrupoById` (existe/null), `createGrupo` (nombre único + config creada, duplicado, descripción vacía), `updateGrupo` (nombre, activo), `deleteGrupo` (vacío, con usuarios, con historias), `getMetricasGrupo` (totales, husPorEstado, casosPorEstado) |
| `tests/owner-panel.test.tsx` | jsdom | 26 | Renderizado (título, tarjetas Alpha/Beta, badge INACTIVO, botón nuevo); métricas (totales globales, barra progreso 70%, sin barra para grupos sin HUs); formulario (abrir, disabled sin nombre, habilitado con nombre, cancelar, POST al crear); eliminación (confirmación modal, cancelar); estado vacío; error de API |
| `tests/grupo-activo.test.ts` | node | 12 | `loginService`: permite login con grupo activo, rechaza si inactivo (error específico), owner sin grupo nunca bloqueado, error antes de verificar contraseña, cuenta desactivada prioritaria sobre grupo · `requireAuth`: permite con grupo activo, rechaza 403 + `GRUPO_INACTIVO` si inactivo, rechaza si grupo null/eliminado, owner sin grupoId no consulta DB, sin token → 401, token inválido → 401, reactivar grupo permite peticiones nuevamente |
| `tests/api-users-asignaciones.test.ts` | node | 8 | `GET /api/users/[id]/asignaciones`: 401 sin token, 403 para QA, usuario sin workspace → `{historias:0,tareas:0}`, usuario inexistente → `{historias:0,tareas:0}`, conteos correctos de HUs y tareas, argumentos de filtro correctos a Prisma |
| `tests/asignaciones-utils.test.ts` | jsdom | 7 | `isResponsableActivo`: activo → true, inactivo → false, desconocido → false, string vacío → false, array vacío → false, case-sensitive, múltiples activos → true |
| `tests/api-pagination.test.ts` | node | 9 | Paginación en GET `/api/historias`, `/api/casos`, `/api/tareas`: metadatos `total/page/limit/pages`, parámetros correctos al servicio, límite máximo 200, defaults page=1/limit=50, filtro `?asignado` |
| `tests/api-notificaciones-delete.test.ts` | node | 6 | `DELETE /api/notificaciones/[id]`: 401, notif no encontrada → 404, otro workspace → 404, destinatario incorrecto → 404, admin elimina la suya → 200, qa elimina la suya → 200 |
| `tests/v254-features.test.ts` | node | 23 | Caché selectiva por workspace (`invalidateMetricasCache(grupoId)`); filtros `?sprint=` y `?responsable=` en GET `/api/historias`; cross-entity validation 422 en POST `/api/casos` y POST `/api/tareas`; rate limiting 429 en export / sync routes |
| `tests/api-casos-batch.test.ts` | node | 9 | `PATCH /api/casos/batch`: 401, 403 para QA, ids vacío → 400, accion inválida → 400, aprobar lote → count, rechazar con motivo, aprobadoPor/fechaAprobacion, filtro workspace, owner sin grupoId |
| `tests/services-pagination.test.ts` | node | 17 | Servicios: `getAllHistorias/Casos/Tareas` paginados (skip, take, pages, where); filtro `asignado` en tareas; `create/update` de historia/caso/tarea llaman Prisma con tipos sin `as any` |
| `tests/v255-features.test.ts` | node | 34 | Paginación en notificaciones/sprints/grupos/users (metadatos, parámetros al servicio, límites); límites de tamaño en validators (historia, caso, tarea); loginSchema ≥8 chars; batch máx 1000 IDs; export límite 5000 |
| `tests/v256-features.test.ts` | node | 24 | `rlKey`: unicidad de clave ip:ruta, independencia de contadores por endpoint; sync historias/casos/tareas: 401, 403, 429, límites de array (501→400, 1001→400, 2001→400), payload válido→200, workspace isolation→500 |
| `tests/v257-features.test.ts` | node | 45 | Retry-After + X-RateLimit-* en 429 de sync/export/batch; rate limit en PUT /api/auth/password con clave por usuario; bug fix fechas parciales en PUT /api/sprints/[id]; límites `.max()` en validators de auth; try/catch 500 en GET/PUT /api/config; fusión double-query en GET/DELETE /api/historias/[id]; resolveNotif helper en PATCH/DELETE /api/notificaciones/[id] |
| `tests/v258-features.test.ts` | node | 43 | Fusión double-query en GET/DELETE /api/casos/[id] y GET/DELETE /api/tareas/[id]; requireAuth 1 query (include grupo); rate limit POST /api/users (20/h) + POST /api/historias (60/h) con Retry-After; try/catch 500 en GET/PUT/DELETE /api/users y GET /api/export |
| `tests/v265-refactoring.test.ts` | node | 48 | withAuth/withAuthAdmin wrapper, checkHUAccess/checkCasoAccess/checkTareaAccess, rate limiting en PUT/DELETE, split de page.tsx en tab components, split de analytics-kpis, tipos nominales |
| `tests/v266-features.test.ts` | node | 38 | Command palette, refresh token endpoint, CSRF middleware, Docker config, CI E2E workflow, Kanban DnD |
| `tests/v267-features.test.ts` | node | 26 | base-crud exports (notDeleted, paginatedQuery, softDelete, createRecord, updateRecord), services usando base-crud, split hooks (useHistoriasData, useCasosData, useTareasData), useDomainData composición, audit API admin access, AuditLogViewer component, useAuditLog React Query hook, PaginatedResult type |
| `tests/e2e/flujo-completo.spec.ts` | **Playwright** | 14 | Login, navegación entre tabs, crear HU, crear caso de prueba, agregar tarea, agregar comentario, tab Casos, Analytics, crear usuario, eliminar usuario, Bloqueos, Carga Ocupacional, Logout, credenciales incorrectas |

Los tests de API usan **Prisma y servicios mockeados** con `vi.mock` y generan JWTs reales con `signToken` — no requieren base de datos activa.

Los tests E2E **sí requieren** el servidor en `localhost:3000` y la base de datos con el seed aplicado.

---

## Changelog

### v2.68 — Type Safety, Centralized Parsers, API Route Constants, Refactoring Roadmap

#### Cambios completados

| Area | Archivo | Descripcion |
|---|---|---|
| **Parsers centralizados** | `lib/utils/parsers.ts` | Nuevo archivo con `d()`, `dOpt()`, `parseBloqueo()` — elimina duplicacion en 3 hooks |
| **Parsers** | `lib/hooks/useHistoriasData.ts`, `useCasosData.ts`, `useTareasData.ts` | Importan parsers centralizados en vez de definirlos localmente |
| **TS Fix** | `lib/hooks/domain/bloqueoHandlers.ts` | Helper `resolveBloqueo()` con `satisfies BloqueoResuelto` — elimina 3 errores TS |
| **TS Fix** | `lib/hooks/domain/tareaHandlers.ts` | `as const` + coerce `string` en `handleDesbloquearTarea` |
| **TS Fix** | `components/dashboard/shared/bloqueos-panel.tsx` | Guards `b.resuelto ?` antes de acceder a `fechaResolucion`/`resueltoPor`/`notaResolucion` — elimina 9 errores TS |
| **TS Fix** | `components/dashboard/historias/historia-usuario-detail.tsx` | Type predicates en `.filter()`: `b is BloqueoResuelto` / `b is BloqueoActivo` — elimina 4 errores TS |
| **TS Fix** | `components/dashboard/shared/command-palette.tsx` | `TAB_ITEMS` con tipo explicito `{ tab: string }` en vez de `as const` — elimina 4 errores TS |
| **TS Fix** | `app/api/auth/refresh/route.ts` | Typed cast de payload con `& { type?: string }` — elimina 1 error TS |
| **API Routes** | `lib/constants/api-routes.ts` | Constantes type-safe para todas las rutas API (35 rutas, estaticas y dinamicas) |
| **API Routes** | `lib/hooks/domain/*.ts`, `lib/hooks/use*Data.ts`, `lib/hooks/useAuditLog.ts` | String literals `/api/...` reemplazados por `API.xxx` |
| **Testing** | `tests/v267-features.test.ts` | Actualizado: tests verifican import de parsers centralizados y constantes API |

#### Phase 3 — Component splits completados

| Area | Archivos creados | Descripcion |
|---|---|---|
| **HU Detail split** | `hu-detail-shared.ts`, `hu-bloqueos.tsx`, `hu-historial.tsx`, `hu-casos-panel.tsx` | `historia-usuario-detail.tsx` de 812→344 LOC. Sub-componentes autocontenidos con shared constants |
| **Owner Panel split** | `owner-panel-shared.ts`, `owner-panel-dialogs.tsx`, `owner-panel-members.tsx`, `owner-panel-detail.tsx` | `owner-panel.tsx` de 903→200 LOC. Tipos, helpers, dialogs, tabla de miembros y detalle extraidos |
| **User Management split** | `user-management-shared.ts`, `user-stats-cards.tsx`, `user-connections-panel.tsx` | `user-management.tsx` de 774→530 LOC. Stats cards, connections panel y helpers extraidos |
| **Testing** | `tests/v268-phase3-splits.test.ts` | 17 tests verifican estructura de archivos extraidos e imports correctos |

#### Phase 4 — Architecture

| Area | Archivo | Descripcion |
|---|---|---|
| **Facade Hook** | `lib/hooks/useDashboardState.ts` | Extrae TODA la composicion de hooks de page.tsx: auth, config, domain, modals, visibility, keyboard shortcuts |
| **Facade Hook** | `app/page.tsx` | Reducido a thin render layer — usa `useDashboardState()`, sin useState/useEffect/useMemo directos |
| **Auth Split** | `lib/contexts/auth-types.ts` | Tipos, constantes, roles predeterminados, usuarios iniciales (~100 LOC extraidos) |
| **Auth Split** | `lib/contexts/auth-crud.ts` | `useUserCrud` + `useRoleCrud` — toda la logica CRUD de usuarios y roles (~170 LOC) |
| **Auth Split** | `lib/contexts/auth-context.tsx` | Reducido de 553 a ~180 LOC — solo session management + provider |
| **React Query** | `lib/hooks/useApiQuery.ts` | Reemplaza `useApiMirroredState` — useQuery para fetch, useMutation para sync, misma interfaz |
| **React Query** | `lib/hooks/useHistoriasData.ts` | Migrado a `useApiQuery` |
| **React Query** | `lib/hooks/useCasosData.ts` | Migrado a `useApiQuery` |
| **React Query** | `lib/hooks/useTareasData.ts` | Migrado a `useApiQuery` |
| **Testing** | `tests/v268-phase4-architecture.test.ts` | 15 tests verifican facade hook, auth split, y migracion React Query |

**Resultado: 0 errores TypeScript en produccion. 937 tests pasando.**

#### Phase 5 — Quality

| Area | Archivo | Descripcion |
|---|---|---|
| **Tailwind** | `components/dashboard/shared/audit-log-viewer.tsx` | Reescrito con utilidades Tailwind — dynamic colors (ACTION_STYLES) permanecen inline |
| **Tailwind** | `components/dashboard/shared/bloqueos-panel.tsx` | Reescrito con utilidades Tailwind — NIVEL_CFG colors y `color-mix(in oklch)` inline |
| **Tailwind** | `components/dashboard/analytics/home-dashboard.tsx` | Reescrito con `CARD_CLS`, `border-l-chart-*` utilities — datos dinamicos inline |
| **Test Factories** | `tests/factories/index.ts` | Factories compartidas: `makeBloqueoActivo`, `makeBloqueoResuelto`, `makeTarea`, `makeHU`, `makeCaso` |
| **Test Hygiene** | 30+ archivos `tests/*` | 210 TS errors corregidos — non-null assertions para `noUncheckedIndexedAccess`, factories tipadas para discriminated unions |
| **Testing** | `tests/v268-phase5-quality.test.ts` | 9 tests verifican conversion Tailwind y estructura de factories |

**Resultado: 0 errores TypeScript (produccion + tests). 946 tests pasando.**

#### Roadmap v2.68 — Refactors completados

| # | Phase | Task | Estado | Descripcion |
|---|---|---|---|---|
| 7 | 1 | Centralizar parsers | ✅ Completado | `lib/utils/parsers.ts` con `d()`, `dOpt()`, `parseBloqueo()` |
| 12 | 1 | Eliminar `as any` en prod | ✅ N/A | Ya no habia ocurrencias en produccion |
| 1 | 2 | Fix 22 TS errors en prod | ✅ Completado | 0 errores TS en produccion |
| 8 | 2 | API route constants | ✅ Completado | `lib/constants/api-routes.ts` |
| 2 | 3 | Split `historia-usuario-detail.tsx` (812→344 LOC) | ✅ Completado | `hu-detail-shared.ts`, `hu-bloqueos.tsx`, `hu-historial.tsx`, `hu-casos-panel.tsx` |
| 3 | 3 | Split `owner-panel.tsx` (903→200 LOC) | ✅ Completado | `owner-panel-shared.ts`, `owner-panel-dialogs.tsx`, `owner-panel-members.tsx`, `owner-panel-detail.tsx` |
| 4 | 3 | Split `user-management.tsx` (774→530 LOC) | ✅ Completado | `user-management-shared.ts`, `user-stats-cards.tsx`, `user-connections-panel.tsx` |
| 5 | 4 | Extraer `useDashboardState` de `page.tsx` | ✅ Completado | `lib/hooks/useDashboardState.ts` — facade hook, page.tsx es thin render layer |
| 10 | 4 | Split `auth-context.tsx` (553→180 LOC) | ✅ Completado | `auth-types.ts` + `auth-crud.ts` — tipos/CRUD extraidos |
| 6 | 4 | Migrar a React Query completo | ✅ Completado | `useApiQuery` con useQuery + useMutation reemplaza useApiMirroredState |
| 9 | 5 | Inline styles → Tailwind | ✅ Completado | audit-log-viewer, bloqueos-panel, home-dashboard migrados |
| 11 | 5 | Fix 210 TS errors en tests | ✅ Completado | `tests/factories/` con discriminated unions + non-null assertions |

#### Decisiones de diseno

- **`resolveBloqueo` helper en bloqueoHandlers**: elimina duplicacion del patron `{ ...b, resuelto: true, ... }` y garantiza type safety con `satisfies BloqueoResuelto`.
- **Type predicates en filters**: `filter((b): b is BloqueoResuelto => b.resuelto)` propaga el narrowing del discriminated union a traves del `.filter()`, eliminando la necesidad de casts.
- **API constants como objeto con funciones**: rutas dinamicas como `API.tarea(id)` son type-safe y autocompletan en el IDE. Rutas estaticas como `API.historias` son strings constantes.
- **`TAB_ITEMS` sin `as const`**: el array necesita ser mutable para `.push()` condicional de tabs admin/grupos. Tipar explicitamente `{ tab: string }` es mas limpio que widening con casts.

---

### v2.67 — Base CRUD Service, Split Domain Hooks, Admin Audit Log, React Query

#### Cambios

| Area | Archivo | Descripcion |
|---|---|---|
| **Base CRUD** | `lib/backend/services/base-crud.service.ts` | Nuevo servicio generico: `notDeleted`, `paginatedQuery`, `softDelete`, `createRecord`, `updateRecord` — elimina duplicacion en 3 services |
| **Base CRUD** | `lib/backend/services/historia.service.ts` | Refactorizado para usar `notDeleted`, `paginatedQuery`, `createRecord`, `updateRecord` de base-crud |
| **Base CRUD** | `lib/backend/services/caso.service.ts` | Refactorizado para usar `softDelete`, `paginatedQuery` de base-crud |
| **Base CRUD** | `lib/backend/services/tarea.service.ts` | Refactorizado para usar `softDelete`, `paginatedQuery` de base-crud |
| **Split Hooks** | `lib/hooks/useHistoriasData.ts` | Hook independiente extraido de useDomainData — fetch + parse de historias |
| **Split Hooks** | `lib/hooks/useCasosData.ts` | Hook independiente extraido de useDomainData — fetch + parse de casos |
| **Split Hooks** | `lib/hooks/useTareasData.ts` | Hook independiente extraido de useDomainData — fetch + parse de tareas |
| **Split Hooks** | `lib/hooks/useDomainData.ts` | Refactorizado: compone los 3 hooks independientes, ~60 LOC en vez de ~145 |
| **Audit Admin** | `app/api/audit/route.ts` | Admin puede consultar audit log (scoped a su workspace); antes era solo owner |
| **Audit UI** | `components/dashboard/shared/audit-log-viewer.tsx` | Visor de audit log con filtros por accion/recurso, busqueda, paginacion, skeletons |
| **Audit UI** | `components/dashboard/tabs/tab-admin.tsx` | Nueva seccion "Audit Log" en sidebar de admin |
| **React Query** | `lib/hooks/useAuditLog.ts` | Hook con `useQuery` de TanStack — query keys, `keepPreviousData`, `staleTime: 30s` |
| **Testing** | `tests/v267-features.test.ts` | 26 tests cubriendo base-crud, split hooks, audit admin, React Query hook |
| **Testing** | `tests/v262-features.test.ts` | Actualizado para refactoring de soft delete (ahora en base-crud) |
| **Testing** | `tests/v261-features.test.ts` | Actualizado: admin ahora tiene acceso a audit log (200 en vez de 403) |

#### Decisiones de diseno

- **base-crud como funciones, no clase**: funciones exportadas son mas tree-shakeable y no requieren instanciacion. Cada servicio importa solo lo que necesita.
- **Historia cascading delete queda fuera de softDelete generico**: la eliminacion de HU hace cascade a casos y tareas en una transaccion — caso especial que no encaja en un helper generico.
- **Hooks de dominio autocontenidos**: cada hook tiene sus propias funciones de parseo y normalizacion de fechas. La duplicacion es intencional para que cada hook sea independiente y testeable en aislamiento.
- **React Query para audit log, no para dominio**: `useApiMirroredState` esta profundamente integrado en el flujo de datos. Migrar a React Query mutations seria disruptivo. Se introduce React Query en paths de solo lectura como primer paso.
- **Admin scoped por workspace**: el admin ve solo los registros de su `grupoId`. El owner puede ver todo o filtrar por grupo.

---

### v2.66 — Command Palette, Refresh Token, CSRF, Docker Production, E2E CI, Kanban DnD

#### Cambios

| Area | Archivo | Descripcion |
|---|---|---|
| **Command Palette** | `components/dashboard/shared/command-palette.tsx` | Paleta de comandos (Ctrl+K / Cmd+K) con navegacion por tabs, acciones rapidas y cambio de tema — usa cmdk ya instalado |
| **Command Palette** | `lib/hooks/useKeyboardShortcuts.ts` | Nuevo binding `mod+k` para abrir paleta |
| **Command Palette** | `components/dashboard/shared/header.tsx` | Boton trigger visible en header (icono Command + K) |
| **Refresh Token** | `lib/backend/middleware/auth.middleware.ts` | `signRefreshToken()` con expiracion 7d y `type: "refresh"` en payload |
| **Refresh Token** | `app/api/auth/refresh/route.ts` | Nuevo endpoint POST — valida refresh cookie, verifica usuario activo, rota ambos tokens |
| **Refresh Token** | `app/api/auth/login/route.ts` | Login ahora emite cookie `tcs_refresh` (httpOnly, strict, scoped a `/api/auth/refresh`) |
| **Refresh Token** | `lib/contexts/auth-context.tsx` | Silent refresh: polling 401 intenta refresh antes de marcar `sessionExpired` |
| **Refresh Token** | `app/api/auth/logout/route.ts` | Logout limpia cookie `tcs_refresh` |
| **CSRF** | `middleware.ts` | Validacion Origin/Referer en requests mutantes (POST/PUT/PATCH/DELETE) — 403 si origen no coincide con host |
| **Docker** | `Dockerfile` | Multi-stage build (deps → builder → runner) con standalone output, non-root user, migrations en startup |
| **Docker** | `docker-compose.yml` | Produccion: app + PostgreSQL con healthcheck, variables requeridas via `${VAR:?error}` |
| **Docker** | `.dockerignore` | Excluye node_modules, .next, tests, .git del contexto de build |
| **Docker** | `next.config.mjs` | `output: "standalone"` condicional via `DOCKER_BUILD=1` |
| **CI/CD** | `.github/workflows/ci.yml` | Nuevo job `e2e`: PostgreSQL service container, migrate + seed, Playwright con upload de reporte en fallo |
| **Kanban DnD** | `components/dashboard/historias/historias-kanban.tsx` | Drag-and-drop con @dnd-kit: arrastrar cards entre columnas cambia el estado de la HU |
| **Kanban DnD** | `components/dashboard/historias/historias-table.tsx` | `onMoverHU` conectado a `onBulkCambiarEstado` para persistir cambios |
| **Testing** | `tests/v266-features.test.ts` | 38 tests cubriendo todas las features de v2.66 |
| **Testing** | `tests/auth-session-expiry.test.ts` | Actualizado para mock de refresh endpoint |

#### Decisiones de diseno

- **CSRF por Origin/Referer** en vez de double-submit cookie: mas simple, sin estado del lado del servidor, y funciona nativamente con cookies `sameSite: lax`. En produccion bloquea requests sin Origin/Referer; en dev permite herramientas como curl/Postman.
- **Refresh token rotation**: cada uso del refresh token emite uno nuevo. Esto limita la ventana de explotacion si un refresh token es comprometido.
- **Refresh cookie scoped a `/api/auth/refresh`**: el browser solo la envia a ese unico endpoint, minimizando la superficie de ataque.
- **`output: "standalone"` condicional**: solo se activa con `DOCKER_BUILD=1` para no afectar el deploy en Vercel que usa su propio build pipeline.
- **E2E como job separado en CI**: depende de `lint-typecheck-test`, no bloquea el feedback rapido de linting/types/unit tests.
- **Kanban DnD con `defaultEstado` por columna**: la columna "Fallida/Cancelada" mapea a `cancelada` por defecto al soltar. El usuario puede cambiar despues si necesita `fallida`.

---

### v2.65 — Refactoring de escalabilidad: auth centralizado, split de componentes, tipos nominales, paginación cursor

#### Cambios

| Area | Archivo | Descripcion |
|---|---|---|
| **Auth centralizado** | `lib/backend/middleware/with-auth.ts` | Nuevo wrapper `withAuth()` / `withAuthAdmin()` elimina patrón repetido `requireAuth` + `instanceof NextResponse` en 24+ rutas API |
| **Auth centralizado** | `lib/backend/middleware/with-auth.ts` | Helpers `checkHUAccess`, `checkCasoAccess`, `checkTareaAccess` para validación de workspace en una sola query |
| **Auth centralizado** | Todas las rutas API (`app/api/**`) | Refactorizadas a `export const METHOD = withAuth(...)` — try/catch centralizado, rate limiting consistente |
| **Rate limiting** | Rutas PUT/DELETE (historias, casos, tareas, users, config, sprints) | Rate limiting agregado a operaciones de escritura que no lo tenían; sync routes reducidos a 10/min |
| **Split page.tsx** | `components/dashboard/tabs/` | 8 tab components extraídos (`TabInicio`, `TabHistorias`, `TabAnalytics`, `TabCarga`, `TabBloqueos`, `TabCasos`, `TabAdmin`, `TabGrupos`) — page.tsx reducido de 560 a 459 LOC |
| **Split analytics** | `components/dashboard/analytics/` | `analytics-kpis.tsx` (602 LOC) dividido en `kpi-card.tsx`, `estado-hu-chart.tsx`, `velocidad-sprint-chart.tsx`, `tasa-defectos-chart.tsx` — reducido a 329 LOC |
| **Split contextos** | `lib/contexts/roles-context.tsx`, `users-context.tsx` | `RolesProvider` y `UsersProvider` extraídos de `AuthProvider` — separación de responsabilidades |
| **Tipos nominales** | `lib/types/index.ts` | Branded types (`HUId`, `CasoId`, `TareaId`) para prevenir mezcla de IDs; `Bloqueo` como discriminated union; `API_ROUTES` const assertion |
| **Memoización** | `lib/hooks/useHistoriasVisibles.ts` | Set/Map memoizados para lookups O(1) en filtrado de HUs visibles (antes era O(n^2)) |
| **Paginación cursor** | `lib/backend/services/historia.service.ts`, `app/api/historias/route.ts` | Soporte de paginación basada en cursor (`?cursor=`) como alternativa a offset para datasets grandes |
| **Resiliencia** | `lib/backend/services/metricas.service.ts` | `Promise.allSettled` reemplaza `Promise.all` — un fallo en una agregación no bloquea las demás |
| **Indices DB** | `prisma/migrations/20260413000000_v2_65_query_optimizations/` | 6 indices compuestos parciales (`WHERE deletedAt IS NULL`) para queries frecuentes en historias, casos, tareas y notificaciones |
| **Testing** | `tests/v265-refactoring.test.ts` | Tests para rate limiting, API_ROUTES, branded types, Bloqueo union, withAuth structure |

#### Decisiones de diseno

- **`withAuth` como HOF (higher-order function)** en vez de middleware Next.js: permite acceso tipado al payload JWT dentro del handler sin casting ni globals. El try/catch centralizado captura errores no manejados y loguea con `logger.error`.
- **`checkCasoAccess` incluye `huId` en el select**: elimina la necesidad de una segunda query en POST /api/tareas para validar coherencia huId-caso.
- **Indices parciales con `WHERE deletedAt IS NULL`**: solo indexan registros activos, reduciendo tamaño del indice y mejorando performance en soft-delete queries.
- **Cursor-based pagination** como opcion (no reemplazo): offset pagination sigue siendo el default. Cursor es mas eficiente para paginar datasets grandes donde el offset se vuelve costoso.
- **Branded types con interseccion `& { __brand: T }`**: patron zero-runtime que previene pasar un `CasoId` donde se espera un `HUId` en tiempo de compilacion.

---

### v2.64 — Transacciones, rotación JWT, búsqueda full-text, atajos de teclado, PDF server-side, DX y accesibilidad

#### Cambios

| Área | Archivo | Descripción |
|---|---|---|
| **Integridad de datos** | `lib/backend/services/historia.service.ts` | `deleteHistoria()` ahora usa `$transaction()` para soft-delete en cascada: HU + todos sus casos + todas sus tareas en una operación atómica |
| **Seguridad** | `middleware.ts` | Límite de body size (1 MB) — requests con `Content-Length` > 1 MB reciben 413 antes de procesarse |
| **Seguridad** | `middleware.ts`, `lib/backend/middleware/auth.middleware.ts` | Rotación de JWT: soporta `JWT_SECRET_PREVIOUS` para verificar tokens firmados con el secreto anterior durante ventana de rotación |
| **Observabilidad** | `app/api/health/route.ts` | Health check profundo: valida conectividad DB (`SELECT 1`), accesibilidad de tablas (`user.count`), variables de entorno, versión de Node. Status `degraded` (503) si algún check falla |
| **Búsqueda** | `app/api/historias/route.ts`, `lib/backend/services/historia.service.ts` | Full-text search: parámetro `?q=` busca en `codigo`, `titulo`, `descripcion`, `responsable`, `aplicacion` (case-insensitive, multi-término) |
| **Export** | `app/api/export/pdf/route.ts` | Nuevo endpoint `GET /api/export/pdf?tipo=historias\|casos` — genera PDF server-side con jsPDF (paginado, con footer, rate limited) |
| **Data fetching** | `lib/providers/query-provider.tsx`, `app/layout.tsx` | TanStack Query provider configurado (staleTime 2min, gcTime 5min). Listo para migrar hooks progresivamente |
| **UX** | `lib/hooks/useKeyboardShortcuts.ts`, `app/page.tsx` | Atajos de teclado globales: `Alt+1..8` navega tabs, `Alt+N` nueva HU, `/` o `Alt+B` enfoca búsqueda |
| **UX** | `components/dashboard/shared/header.tsx` | Search input con ref y placeholder actualizado mostrando hint de atajo `/` |
| **Accesibilidad** | `components/dashboard/historias/historias-table.tsx`, `casos/casos-table.tsx` | ARIA `role="table"`, `role="row"`, `aria-label` en tablas de datos principales |
| **Accesibilidad** | Múltiples componentes | Lucide icons: `title` reemplazado por `aria-label` (compatible con Lucide v0.564+) |
| **DX** | `.husky/pre-commit`, `package.json` | Husky 9 + lint-staged: pre-commit hook ejecuta ESLint con `--max-warnings 0` en archivos staged |
| **DX** | `next.config.mjs`, `package.json` | `@next/bundle-analyzer` configurado — `pnpm analyze` genera reporte visual de tamaño de bundle |
| **Testing** | `tests/accessibility.test.tsx`, `tests/helpers/axe-helper.ts` | Tests de accesibilidad con axe-core: validan WCAG en LoginScreen, TabSkeleton y ConfirmDeleteModal |
| **Type safety** | Múltiples archivos (sync routes, componentes, hooks) | Corregidos todos los errores TS pre-existentes en código de aplicación (0 errores fuera de tests) |

#### Decisiones de diseño

- **`JWT_SECRET_PREVIOUS`** como variable separada (no array): más simple de configurar en Vercel/Docker. El flujo de rotación es: 1) copiar `JWT_SECRET` a `JWT_SECRET_PREVIOUS`, 2) cambiar `JWT_SECRET` al nuevo valor, 3) después de 2h (TTL del token) eliminar `JWT_SECRET_PREVIOUS`.
- **Full-text search con Prisma `contains`** en vez de `tsvector`: funciona sin migración de schema ni columnas generadas. Para volúmenes grandes (>100K HUs), se puede migrar a `tsvector` con un índice GIN sin cambiar la API.
- **TanStack Query como provider sin migrar hooks**: se instala el provider globalmente y se pueden migrar hooks individuales progresivamente sin romper nada.
- **Body size limit en Edge Middleware**: se valida antes de que el request llegue al handler, protegiendo todas las rutas sin repetir código.
- **axe-core con `color-contrast: disabled`**: jsdom no renderiza CSS real, así que los tests de contraste darían falsos positivos. Se validan estructura, roles y labels.

---

### v2.63 — Seguridad centralizada, observabilidad thread-safe, resiliencia, DX y rendimiento

#### Cambios

| Área | Archivo | Descripción |
|---|---|---|
| **Seguridad** | `middleware.ts` | Nuevo Next.js Edge Middleware centralizado — verifica JWT antes de llegar a cualquier handler; rutas públicas `/api/auth/login` y `/api/health` exentas |
| **Seguridad** | `app/api/historias/route.ts`, `casos/route.ts`, `auth/password/route.ts`, `config/route.ts` | `request.json()` protegido con `.catch(() => null)` — body malformado retorna 400 en vez de 500 |
| **Seguridad** | `app/api/export/route.ts` | `sanitizeFilename()` — parámetros `sprint`/`estado` sanitizados con regex `[^a-zA-Z0-9_-]` antes de inyectar en `Content-Disposition` |
| **Observabilidad** | `lib/backend/logger.ts` | `AsyncLocalStorage` reemplaza variable global mutable — el `requestId` es thread-safe para requests concurrentes |
| **Soft delete** | `lib/backend/services/historia.service.ts` | `getHistoriaById` ahora usa `findFirst` con `deletedAt: null` y filtra casos incluidos |
| **Resiliencia** | `components/dashboard/shared/tab-error-boundary.tsx` | `TabErrorBoundary` por tab — un error en Analytics no tumba el dashboard completo |
| **Resiliencia** | `lib/backend/services/grupo.service.ts` | `getMetricasGlobales` usa `Promise.allSettled` — un grupo con error no bloquea las métricas de los demás |
| **Type safety** | `lib/backend/services/config.service.ts` | Eliminados `as any` — usa `ConfigUpdateData` con `Prisma.InputJsonValue` tipado |
| **Type safety** | `tsconfig.json` | `noUncheckedIndexedAccess: true` — `arr[0]` retorna `T \| undefined` |
| **Rendimiento** | `app/page.tsx` | `next/dynamic` lazy-load para `HomeDashboard`, `AnalyticsKPIs`, `CargaOcupacional`, `OwnerPanel` con `TabSkeleton` como fallback |
| **Rendimiento** | `app/api/metricas/route.ts` | `Cache-Control: max-age=300` (alineado con `CACHE_TTL_MS = 300_000` del server) |
| **DB** | `prisma/schema.prisma` | Nuevos índices en `AuditLog`: `@@index([action])`, `@@index([grupoId, action])` |
| **DX** | `docker-compose.dev.yml` | PostgreSQL 16 local listo para `prisma migrate dev` |
| **DX** | `.github/workflows/ci.yml` | Nuevo step `pnpm build` + `prisma migrate diff --exit-code` para detectar schema drift |
| **DX** | `vitest.config.ts` | Coverage con `@vitest/coverage-v8` — reporter `text` + `lcov` |
| **Infra** | `lib/backend/prisma.ts` | Handler `SIGINT` + `SIGTERM` — `Ctrl-C` local cierra la conexión DB correctamente |
| **Code quality** | `lib/types.ts` | Barrel marcado `@deprecated` — nuevos imports deben ir directo al origen |
| **Code quality** | Todas las rutas con rate limit | Keys normalizadas a formato `METHOD /path` consistente |
| **UX** | `components/dashboard/shared/tab-skeleton.tsx` | Skeleton de carga por tab (cards + rows) como loading fallback para dynamic imports |
| **Tests** | `tests/v263-features.test.ts` | 49 tests cubriendo las 24 mejoras: logger AsyncLocalStorage, middleware, request.json safety, coverage config, soft delete byId, ErrorBoundary, sanitize filename, CI, config types, lazy load, TTL, indexes, docker, tsconfig, SIGINT, allSettled, types deprecation, rate-limit keys, skeletons, service exports |

#### Decisiones de diseño

- **AsyncLocalStorage vs variable global**: en Node.js con requests concurrentes, una variable mutable `let _requestId` mezcla IDs entre requests. `AsyncLocalStorage` vincula el ID al call-chain async específico sin overhead medible.
- **Edge Middleware como primera línea**: el middleware verifica el JWT antes de que el handler se ejecute. Esto elimina la posibilidad de que un desarrollador olvide llamar `requireAuth()` en una nueva ruta.
- **`request.json().catch()`**: sin protección, un body no-JSON causa un `SyntaxError` que Next.js convierte en 500. El `.catch(() => null)` permite retornar un 400 limpio.
- **TabErrorBoundary**: React class component con `getDerivedStateFromError` + botón "Reintentar". Cada tab es independiente — un crash en el chart de Recharts no afecta la tabla de HUs.
- **`next/dynamic` con `{ ssr: false }`**: las tabs de Analytics y CargaOcupacional importan Recharts (~200KB). Lazy-load evita cargar ese peso en el bundle inicial.
- **TTL alineado**: server cache 5min + HTTP `max-age=300` evita que el browser re-pida datos que el server ya tiene en caché.
- **`noUncheckedIndexedAccess`**: previene bugs silenciosos como `const first = arr[0]; first.name` cuando el array podría estar vacío.

**789 tests unitarios · 51 suites · 0 fallos + 14 tests E2E Playwright**

---

### v2.61 — Observabilidad completa: audit log, soft delete, startup check, CSP endurecido, rate limiting GET-by-ID

#### Cambios

| Área | Archivo | Descripción |
|---|---|---|
| Observabilidad | `lib/backend/logger.ts` | `logger.error` sustituye los 9 `console.error` restantes en `casos/[id]`, `casos/sync`, `casos/batch`, `historias/[id]`, `historias/sync`, `tareas/[id]`, `tareas/sync`, `config`, `notificaciones/[id]` |
| Rate limiting | `app/api/historias/[id]/route.ts` | GET protegido con 200 req/min por IP |
| Rate limiting | `app/api/casos/[id]/route.ts` | GET protegido con 200 req/min por IP |
| Rate limiting | `app/api/tareas/[id]/route.ts` | GET protegido con 200 req/min por IP |
| Rate limiting | `app/api/metricas/route.ts` | GET protegido con 60 req/min por IP |
| Infraestructura | `lib/backend/startup-check.ts` | `assertRequiredEnv()` — lanza en producción si `DATABASE_URL` falta o `JWT_SECRET` < 32 chars; llamado al importar `prisma.ts` |
| Seguridad | `next.config.mjs` | CSP: `'unsafe-eval'` solo se incluye en desarrollo (`isDev = NODE_ENV !== "production"`) |
| Frontend | `components/layout/error-boundary.tsx` | `console.error` reemplazado por `clientError()` desde `lib/client-logger.ts` |
| Frontend | `lib/client-logger.ts` | Nuevo logger cliente: JSON en prod, texto en dev; nunca propaga errores |
| Soft delete | `prisma/schema.prisma` | `deletedAt DateTime?` + `@@index([deletedAt])` en `HistoriaUsuario`, `CasoPrueba` y `Tarea` |
| Audit | `prisma/schema.prisma` | Nuevo modelo `AuditLog` (`@@map("audit_log")`) con campos `action`, `resource`, `resourceId`, `meta`, `userEmail`, `userRol`, `grupoId` e índices en `userId`, `grupoId`, `resource/resourceId` y `timestamp` |
| Audit | `lib/backend/services/audit.service.ts` | `audit()` fire-and-forget: escribe en `audit_log`; captura errores de DB con `logger.error` y nunca lanza |
| Audit | `app/api/audit/route.ts` | `GET /api/audit` solo para owner; paginado, filtrable por `grupoId/resource/action/userId`; rate limit 30 req/min |
| Audit | `app/api/historias/route.ts`, `app/api/historias/[id]/route.ts` | `void audit(...)` en CREATE, UPDATE y DELETE de historias |
| Audit | `app/api/casos/route.ts`, `app/api/casos/[id]/route.ts`, `app/api/casos/batch/route.ts` | `void audit(...)` en CREATE, APPROVE y REJECT de casos |
| Audit | `app/api/users/route.ts`, `app/api/users/[id]/route.ts` | `void audit(...)` en CREATE, UPDATE, DELETE, RESET_PASSWORD y UNLOCK de usuarios |
| Audit | `app/api/auth/logout/route.ts` | `void audit(...)` en LOGOUT |
| Tests | `tests/v261-features.test.ts` | 14 tests: `assertRequiredEnv` (4), rate limiting historias/metricas (2), CSP producción (1), soft delete + AuditLog en schema (2), audit fire-and-forget (1), `GET /api/audit` control de acceso (2), audit DB write correctness (2) |

#### Decisiones de diseño

- **fire-and-forget en audit**: un fallo de escritura en el log nunca debe bloquear la petición principal. El patrón `void audit(...)` + try/catch interno garantiza esto sin complejidad adicional.
- **assertRequiredEnv en prisma.ts**: al ser importado en el arranque del servidor, cualquier variable faltante falla rápido y con mensaje claro, antes de que llegue la primera petición real.
- **deletedAt nullable sin migración de datos**: los campos son opcionales, por lo que el deployment puede hacerse en cero downtime; los servicios pueden adoptar el filtro `deletedAt: null` de forma incremental.
- **CSP unsafe-eval solo en dev**: Next.js usa `eval` durante el hot-reload de desarrollo pero no en producción. Separar los dos contextos reduce la superficie XSS en prod sin romper el DX local.
- **GET /api/audit owner+admin**: el owner tiene visibilidad global; los admins pueden ver el audit log scoped a su propio workspace *(actualizado en v2.67)*.

**700 tests unitarios · 49 suites · 0 fallos + 14 tests E2E Playwright**

---

### v2.62 — Soft delete activo, logger mejorado, accesibilidad, ESLint, CI/CD, validación frontend

#### Cambios

| Área | Archivo | Descripción |
|---|---|---|
| Soft delete | `lib/backend/services/historia.service.ts` | Todas las queries filtran `deletedAt: null`; `deleteHistoria` hace UPDATE en vez de DELETE |
| Soft delete | `lib/backend/services/caso.service.ts` | `getAllCasos`, `getCasosByHU` filtran `deletedAt: null`; `deleteCaso` → soft delete |
| Soft delete | `lib/backend/services/tarea.service.ts` | `getAllTareas`, `getTareasByCaso`, `getTareasByHU` filtran `deletedAt: null`; `deleteTarea` → soft delete |
| Soft delete | `lib/backend/services/metricas.service.ts` | Las 7 agregaciones (groupBy) excluyen registros soft-deleted |
| Soft delete | `app/api/export/route.ts` | Export CSV filtra `deletedAt: null` en ambas ramas (historias y casos) |
| DB indexes | `prisma/schema.prisma` | Nuevos índices compuestos: `[grupoId, deletedAt]` en HU, `[huId, deletedAt]` en Casos, `[casoPruebaId, deletedAt]` en Tareas |
| Logger | `lib/backend/logger.ts` | Soporte `requestId` para correlacionar logs; incluye `stack` de errores en JSON de producción |
| Health | `app/api/health/route.ts` | Respuesta incluye `memory` (rss, heapUsed, heapTotal, external) + `Cache-Control: no-store` |
| Cache | `app/api/metricas/route.ts` | Header `Cache-Control: private, max-age=30, stale-while-revalidate=30` |
| Cache | `app/api/config/route.ts` | Header `Cache-Control: private, max-age=60` en GET |
| Type safety | `app/api/export/route.ts` | `Record<string, any>` → `Record<string, unknown>`; eliminados comentarios eslint-disable |
| Frontend | `components/dashboard/historias/hu-form.tsx` | Estado `submitting` + botón "Guardando..." + `aria-label` en form |
| Frontend | `components/dashboard/usuarios/user-form-modal.tsx` | Validación email en tiempo real + `aria-label` en form + botón disabled si email inválido |
| Accesibilidad | `components/dashboard/shared/confirm-delete-modal.tsx` | `role="alertdialog"`, `aria-modal`, `aria-label` |
| Accesibilidad | `components/dashboard/historias/csv-import-modal.tsx` | `role="dialog"`, `aria-modal`, `aria-label="Cerrar importación"` |
| Accesibilidad | `components/dashboard/casos/csv-import-casos-modal.tsx` | `role="dialog"`, `aria-modal`, `aria-label="Cerrar importación"` |
| Refactor | `lib/csv-utils.ts` | `parsearCSV`, `invertirCfg`, `parsearFechaCSV` extraídos de los 2 CSV importers |
| Refactor | `csv-import-modal.tsx`, `csv-import-casos-modal.tsx` | Usan `lib/csv-utils.ts` en vez de funciones duplicadas |
| ESLint | `eslint.config.mjs` | Flat config con typescript-eslint, reglas no-unused-vars y no-explicit-any como warn |
| CI/CD | `.github/workflows/ci.yml` | Pipeline: pnpm install → prisma generate → lint → tsc --noEmit → vitest run |
| Tests | `tests/v262-features.test.ts` | 40 tests: soft delete filters (5), composite indexes (3), logger requestId (3), health memory (3), Cache-Control (2), CSV utils (7), ESLint (2), CI (3), a11y (5), loading states (2), CSV shared (3), type safety (1), CSP (1) |

#### Decisiones de diseño

- **Soft delete UPDATE en vez de DELETE**: los registros marcados con `deletedAt` se pueden recuperar. Las queries agregan `deletedAt: null` mediante una constante `notDeleted` compartida para consistencia.
- **Índices compuestos**: las queries más frecuentes son `WHERE grupoId = X AND deletedAt IS NULL`. Sin un índice compuesto, PostgreSQL haría un index merge costoso.
- **CSV utils extraído**: la función `parsearCSV` era idéntica en ambos importers (HU y Casos). Moverla a `lib/csv-utils.ts` elimina ~50 líneas duplicadas y centraliza el mantenimiento.
- **ESLint flat config**: ESLint 9 requiere flat config. Se optó por typescript-eslint directo en vez de `eslint-config-next` (problemas de compatibilidad con ESLint 9 + FlatCompat).
- **CI pipeline mínimo**: lint + typecheck + tests cubren el 80% de regresiones. Se ejecuta en push a main/dev_1 y en PRs.

**740 tests unitarios · 50 suites · 0 fallos + 14 tests E2E Playwright**

---

### v2.60 — Observabilidad y resiliencia: health endpoint, logger estructurado, try/catch completo, Prisma SIGTERM, imágenes condicionales

#### Cambios

| Área | Archivo | Descripción |
|---|---|---|
| Observabilidad | `app/api/health/route.ts` | Nuevo endpoint `GET /api/health` sin auth; retorna `200 ok` o `503 degraded` según estado de la DB |
| Observabilidad | `lib/backend/logger.ts` | `logger.error` reemplaza los 18 `console.error` en 7 rutas API — JSON en prod, texto en dev |
| Resiliencia | `app/api/grupos/[id]/route.ts` | GET, PUT y DELETE envueltos en try/catch → 500 estructurado |
| Resiliencia | `app/api/auth/me/route.ts` | Consulta Prisma envuelta en try/catch → 500 estructurado |
| Resiliencia | `app/api/auth/logout/route.ts` | `logoutService` envuelto en try/catch → 500 estructurado |
| Resiliencia | `app/api/sprints/route.ts` | GET envuelto en try/catch → 500 estructurado |
| Resiliencia | `app/api/notificaciones/route.ts` | GET y POST envueltos en try/catch → 500 estructurado |
| Infraestructura | `lib/backend/prisma.ts` | `process.on("SIGTERM")` llama `$disconnect` en producción para cierre limpio |
| Infraestructura | `next.config.mjs` | `images.unoptimized` es `true` solo fuera de producción |
| Tests | `tests/v260-features.test.ts` | 13 tests: health 200/503, 7 rutas → 500 on DB/service failure, logger structured output (3 casos) |

#### Decisiones de diseño

- **Health sin auth**: un monitor externo o load balancer no tiene token JWT — el endpoint debe responder siempre, incluso si el sistema de auth está caído.
- **Logger dual mode**: en desarrollo el texto plano facilita la lectura; en producción el JSON permite que herramientas como Datadog/CloudWatch parseen automáticamente campos estructurados.
- **SIGTERM solo en producción**: en desarrollo con hot reload, desconectar el cliente Prisma en cada reinicio causaría errores innecesarios.

**686 tests unitarios · 48 suites · 0 fallos + 14 tests E2E Playwright**

---

### v2.59 — Robustez de producción: try/catch sprints, paginación NaN, complejidad contraseña, JWT 2h, caché 5min, logger, retry sync, .env.example

#### Cambios

| Área | Archivo | Cambio |
|---|---|---|
| **try/catch** | `app/api/sprints/route.ts` | POST envuelto en try/catch → 500 estructurado en vez de crash; era la única ruta CRUD sin este guard |
| **Paginación NaN** | 8 rutas (`historias`, `casos`, `tareas`, `sprints`, `users`, `grupos`, `notificaciones`, `export`) | `parseInt(x)` sin guardia devolvía `NaN` si el parámetro era no numérico (`?page=abc`); corregido con `Math.max(1, parseInt(x) \|\| default)` — nunca más llega `NaN` a Prisma |
| **Complejidad contraseña** | `lib/backend/validators/auth.validator.ts` | `cambiarPasswordSchema.nueva` añade regex `(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])` — requiere mayúscula, minúscula, número y símbolo; mensaje claro en el 400 |
| **JWT expiry** | `lib/backend/middleware/auth.middleware.ts` | `JWT_EXPIRY` reducido de `"8h"` a `"2h"` — ventana de exposición ante token robado pasa de 8 a 2 horas |
| **Caché métricas** | `lib/backend/metricas-cache.ts` | `CACHE_TTL_MS` sube de `60_000` (1 min) a `300_000` (5 min) — las métricas no cambian en segundos; reduce carga en DB del endpoint Owner |
| **Logger estructurado** | `lib/backend/logger.ts` | Nuevo módulo `logger.info/warn/error(context, msg, err?)` — emite JSON en producción (para Vercel Logs / alertas), texto legible en desarrollo. Reemplaza `console.error` en rutas críticas |
| **Retry + syncError** | `lib/hooks/useApiMirroredState.ts` | El sync a la API reintenta hasta 3 veces con backoff exponencial (1s/2s/4s) antes de fallar; nuevo 5.º valor de retorno `syncError` expone el último fallo |
| **Toast sync fallo** | `lib/hooks/useDomainData.ts` | `useEffect` sobre `syncError` de los tres recursos → muestra toast `"Error al guardar"` al usuario cuando el sync falla tras todos los reintentos |
| **`.env.example`** | `.env.example` | Nuevo archivo plantilla con todas las variables requeridas, instrucción para generar JWT_SECRET seguro y nota sobre `connection_limit=1` para serverless |
| **Tests** | `tests/v259-features.test.ts` | 19 nuevos tests: try/catch sprint DB error, paginación NaN (3 casos), complejidad contraseña (6 casos), JWT_EXPIRY=2h, CACHE_TTL 5min, logger JSON/texto (3 casos), syncWithRetry (3 casos) |
| **Tests fix** | `tests/api-auth-endpoints.test.ts` | Actualiza fixtures de contraseña (`"nueva123"` → `"Nueva@123"`) para cumplir la nueva política de complejidad |

#### Decisiones de diseño documentadas

- **`Math.max(1, parseInt(x) || default)`**: el patrón `|| default` convierte `NaN` (y `0`) al valor por defecto antes de que `Math.max` lo procese; `Math.max(1, …)` garantiza que nunca llegue un valor ≤ 0 a Prisma `skip`/`take`. No se usó un helper compartido porque el valor por defecto varía por ruta (50/100/200/5000).
- **JWT 2h sin refresh token**: bajar de 8h a 2h es la mejora de menor costo sin cambiar la arquitectura. El siguiente paso ideal es un refresh token rotativo (cookie `HttpOnly`, 7 días), pero implica un endpoint nuevo y cambios en el cliente — se documenta en el backlog.
- **Logger con detección de entorno en runtime**: `process.env.NODE_ENV` se evalúa en cada llamada (no al importar el módulo) para que los tests puedan cambiar el entorno sin re-importar. Esto también permite que el mismo bundle funcione en dev y producción.
- **Retry 3 × backoff exponencial**: los fallos de sync suelen ser transitorios (timeout de red, pod reiniciando). 3 reintentos cubren la mayoría sin bloquear la UI. El backoff evita que todos los tabs abren simultáneamente hagan thundering herd.

**673 tests unitarios · 47 suites · 0 fallos + 14 tests E2E Playwright**

---

### v2.58 — Rendimiento y robustez: query fusion global, requireAuth en 1 query, rate limiting ampliado, try/catch en users/export, índice Sprint, E2E Playwright, bugfixes de fechas

#### Cambios

| Área | Archivo | Cambio |
|---|---|---|
| **N+1 fix** | `app/api/casos/[id]/route.ts` | `getCasoIfAllowed()`: fusiona access check + fetch en una sola `findUnique({ include: { tareas, hu: { select: { grupoId } } } })`. Ahorra 1 query por GET; PUT/DELETE usan select ligero inline |
| **N+1 fix** | `app/api/tareas/[id]/route.ts` | `getTareaIfAllowed()`: fusiona acceso + fetch en `findUnique({ include: { caso: { select: { hu: { select: { grupoId } } } } } })`. Misma reducción de queries |
| **Auth optimization** | `lib/backend/middleware/auth.middleware.ts` | `requireAuth` ahora usa **1 sola query** con `select: { activo, grupo: { select: { activo } } }` — antes eran 2 queries separadas (user + grupo). Afecta cada llamada autenticada |
| **Rate limiting** | `app/api/users/route.ts` | POST: límite de 20 usuarios creados/hora por admin (clave `ip:ruta:userId`). Responde con `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` en 429 |
| **Rate limiting** | `app/api/historias/route.ts` | POST: límite de 60 historias creadas/hora por usuario. Mismos headers en 429 |
| **try/catch** | `app/api/users/route.ts` | GET: `$transaction` envuelto en try/catch → 500 estructurado en vez de crash |
| **try/catch** | `app/api/users/[id]/route.ts` | PUT y DELETE envueltos en try/catch → 500 estructurado con `{ error }` |
| **try/catch** | `app/api/export/route.ts` | Ambas ramas (`historias`/`casos`) envueltas en un único try/catch → 500 estructurado |
| **DB index** | `prisma/schema.prisma` | `Sprint @@index([grupoId, fechaInicio, fechaFin])` — acelera la query de `getSprintActivo` que filtra por rango de fechas |
| **Tests** | `tests/v258-features.test.ts` | 43 nuevos tests cubriendo todas las funcionalidades anteriores |
| **Tests fix** | 10 archivos de test | Actualiza mocks de `prisma.user.findUnique` para devolver `{ activo, grupo: { activo } }` — necesario tras la fusión de `requireAuth` |
| **E2E** | `tests/e2e/flujo-completo.spec.ts` | 14 tests Playwright: login → HU → caso → tarea → comentario → usuarios → navegación completa → logout |
| **Config** | `playwright.config.ts` | Configuración Playwright: `webServer` para levantar `pnpm dev`, timeout 60s, capturas en fallo, video en reintento |
| **Bugfix runtime** | `components/dashboard/usuarios/user-management.tsx` | `formatFechaConexion` ahora acepta `Date \| string` y envuelve con `new Date(raw)` — las fechas de `historialConexiones` llegaban como strings ISO desde la API (JSON serializa `Date` → string) causando crash en `.toLocaleTimeString()`. Mismo ajuste en cálculo de duración |
| **Bugfix sistémico** | `lib/hooks/useDomainData.ts` + 5 componentes | Las fechas (`fechaFinEstimada`, `fecha`, `proximaFechaFin`) llegan como strings ISO desde la API. Se añaden `parseHistorias()`, `parseCasos()` y `parseTareas()` en `useDomainData.ts` para normalizar las entidades a `Date` reales en el punto de entrada, eliminando crashes de `.getTime()` en `home-dashboard`, `carga-ocupacional`, `mini-calendario`, `panel-riesgos`, `bloqueos-panel` y `useHistoriasFilters` |

#### Decisiones de diseño documentadas

- **`requireAuth` 1 query**: Prisma soporta `include`/`select` anidado — al incluir `grupo: { select: { activo: true } }` en el `select` de `user.findUnique` se obtiene el estado del grupo en el mismo roundtrip. La lógica de verificación usa el campo cargado en lugar de hacer un segundo `grupo.findUnique`.
- **Rate limit separado por creación de usuarios**: el límite de 20/h para POST `/api/users` usa `ip:ruta:userId` (no solo IP) para no penalizar a otros admins en la misma red corporativa. El límite es conservador porque crear usuarios es una operación administrativa, no de datos de negocio.
- **try/catch en users/export**: antes un error de DB en GET `/api/users` causaba un crash sin respuesta HTTP al cliente. El try/catch garantiza un 500 JSON bien estructurado que el frontend puede manejar.
- **Normalización de fechas en el boundary**: la API serializa `Date` a string ISO en JSON. En lugar de parchear cada `.getTime()` / `.toLocaleTimeString()` con `new Date()` en cada componente, `parseHistorias()` / `parseCasos()` / `parseTareas()` en `useDomainData.ts` convierten las fechas una sola vez al llegar los datos — todos los consumidores reciben `Date` reales.

**649 tests unitarios · 46 suites · 0 fallos + 14 tests E2E Playwright**

---

### v2.57 — Robustez y seguridad: Retry-After, rate limit en password, bug fechas parciales, fusión de queries y límites en validadores

#### Cambios

| Área | Archivo | Cambio |
|---|---|---|
| **Rate limiting** | `app/api/auth/password/route.ts` | Añade `checkRateLimit` con clave `ip:ruta:userId` — 10 intentos / 15 min por usuario. Un usuario bloqueado no afecta a otros aunque vengan de la misma IP (NAT corporativo) |
| **Retry-After** | `app/api/casos/sync/route.ts`, `historias/sync`, `tareas/sync`, `export`, `casos/batch` | Todos los 429 incluyen ahora `Retry-After: <secs>`, `X-RateLimit-Limit`, `X-RateLimit-Remaining` — el cliente puede respetar el backoff sin polling ciego |
| **Retry-After** | `app/api/auth/password/route.ts` | El 429 de cambio de contraseña también incluye los tres headers |
| **Bug fix** | `app/api/sprints/[id]/route.ts` | Corrección en validación de fechas para actualizaciones parciales: enviar solo `fechaInicio` usaba `undefined` como `fechaFin` y saltaba el chequeo. Ahora usa `fechaFin ?? existing.fechaFin` para comparar contra el valor actual |
| **N+1 fix** | `app/api/historias/[id]/route.ts` | Elimina double-query (access check + fetch): `getHistoriaIfAllowed()` hace una sola `findUnique` con `include: { casos }` y valida `grupoId` sobre el resultado — ahorra 1 query por GET/PUT |
| **Validators** | `lib/backend/validators/auth.validator.ts` | Añade `.max()` a todos los campos de texto: `email` ≤254 (RFC 5321), `password` ≤128, `nombre` ≤200 en `createUserSchema` y `updateUserSchema` |
| **try/catch** | `app/api/config/route.ts` | Ambos GET y PUT envueltos en try/catch → devuelven 500 con `{ error }` en vez de crashear silenciosamente |
| **Refactor** | `app/api/notificaciones/[id]/route.ts` | Extrae `resolveNotif()` helper que encapsula la lógica de autorización (buscar notificación + verificar `grupoId` + verificar `destinatario`) — elimina duplicación entre PATCH y DELETE |
| **Refactor** | `app/api/sprints/[id]/route.ts` | Extrae `getSprintIfAllowed()` helper que hace access check + fetch en una sola query — reutilizado por GET y PUT |
| **Tests** | `tests/v257-features.test.ts` | 45 nuevos tests cubriendo todas las funcionalidades anteriores |
| **Tests** | `tests/api-sprints.test.ts` | Actualiza fixtures (`grupoId`, fechas como `Date`) y añade mocks de `getSprintById` a los tests de PUT que requieren el sprint existente |
| **Tests** | `tests/api-historias.test.ts` | Actualiza tests GET de `historias/[id]` para mockear `prisma.historiaUsuario.findUnique` en lugar de `getHistoriaById` (la ruta ya no delega en el service para el GET) |

#### Decisiones de diseño documentadas

- **Rate limit por usuario en `/api/auth/password`**: usar solo la IP bloquearía a todos los usuarios de una empresa con NAT compartido. La clave `ip:ruta:userId` aísla el límite por cuenta — alguien intentando adivinar la contraseña de otro usuario solo se bloquea a sí mismo.
- **`Retry-After` en todos los 429**: sin este header el cliente no sabe cuánto esperar y puede hacer polling agresivo (thundering herd). El valor es `ceil((resetAt - now) / 1000)` calculado en el momento de la respuesta, no un valor fijo.
- **`getHistoriaIfAllowed` vs. mantener double-query**: la query de acceso (`select { grupoId }`) era un subconjunto de la query completa. Al fusionar en `findUnique({ include: { casos } })` el acceso y los datos se obtienen en un único roundtrip. El único caso donde se hace la query selectiva (sin include) es DELETE, donde los datos completos no se necesitan.
- **Bug de fechas parciales**: el `if (fechaInicio && fechaFin && ...)` original validaba solo si ambas fechas estaban presentes en el request. Enviar solo `fechaInicio: "2030-01-01"` no disparaba el check y el sprint quedaba con `fechaInicio > fechaFin`. La corrección usa los valores actuales como fallback antes de comparar.

**611 tests · 45 suites · 0 fallos**

---

### v2.56 — Seguridad y calidad: rate limiter por endpoint, límites en sync, tipos Prisma y cobertura de sync

#### Cambios

| Área | Archivo | Cambio |
|---|---|---|
| **Rate limiter** | `lib/backend/middleware/rate-limit.ts` | Nueva función `rlKey(ip, route)` que devuelve `"ip:ruta"`. Todos los callers usan `rlKey` → cada endpoint tiene contador independiente. Un usuario no puede agotar el límite de `/api/export` haciendo peticiones a `/api/historias/sync` |
| **Rate limiter** | `lib/backend/middleware/rate-limit.ts` | `cleanup()` renombrado a `maybeCleanup()` y solo se ejecuta cuando `store.size >= 500` — elimina el O(N) en el hot path de cada request |
| **Sync limits** | `app/api/historias/sync/route.ts` | Schema Zod añade `.max(500)` en el array de historias → HTTP 400 si se superan 500 items en una sola llamada de sync |
| **Sync limits** | `app/api/casos/sync/route.ts` | Schema Zod añade `.max(1000)` en el array de casos |
| **Sync limits** | `app/api/tareas/sync/route.ts` | Schema Zod añade `.max(2000)` en el array de tareas |
| **Tipos Prisma** | `app/api/historias/sync/route.ts` | Elimina todos los `as any[]` — usa `Prisma.HistoriaUsuarioUncheckedCreateInput[]` y `Prisma.HistoriaUsuarioUncheckedUpdateInput` |
| **Tipos Prisma** | `app/api/casos/sync/route.ts` | Usa `Prisma.CasoPruebaUncheckedCreateInput[]` y `Prisma.CasoPruebaUncheckedUpdateInput` |
| **Tipos Prisma** | `app/api/tareas/sync/route.ts` | Usa `Prisma.TareaUncheckedCreateInput[]` y `Prisma.TareaUncheckedUpdateInput` |
| **DB index** | `prisma/schema.prisma` | `Notificacion @@index([destinatario, leida])` — acelera la query más frecuente de notificaciones no leídas |
| **Build** | `next.config.mjs` | Elimina `typescript: { ignoreBuildErrors: true }` — los errores de tipos ahora bloquean el build de producción |
| **Tests** | `tests/v256-features.test.ts` | 24 nuevos tests cubriendo todas las funcionalidades anteriores |

#### Decisiones de diseño documentadas

- **Clave `ip:route` en el rate limiter**: la clave anterior era solo la IP, lo que significa que un usuario podía hacer 30 syncs + 20 exports en el mismo minuto sin que ninguno lo bloqueara. Con `ip:route` cada endpoint tiene su propio bucket. El costo es memoria adicional (tantas entradas por IP como endpoints rate-limitados), pero el store se limpia automáticamente al superar 500 entradas.
- **Umbral 500 para cleanup**: con 5 endpoints rate-limitados y tráfico típico de una organización pequeña, el store raramente supera 500 entradas. El umbral evita que cada request sea O(N) sin necesitar un `setInterval` (que en serverless no sobrevive entre invocaciones).
- **Límites de sync asimétricos (500/1000/2000)**: histórias son el objeto más pesado (JSON con bloqueos, historial, comentarios); casos son más livianos; tareas son los más numerosos. Los límites reflejan la relación típica 1 HU → 2-4 casos → 4-8 tareas.
- **Eliminar `ignoreBuildErrors`**: este flag existía para unblock el despliegue durante el desarrollo. Con el backend completamente conectado y los tipos Prisma usados correctamente en los services y sync routes, mantenerlo solo ocultaría regresiones de tipos en producción.

**566 tests · 44 suites · 0 fallos** *(antes de v2.57)*

---

### v2.55 — Rendimiento y robustez: índices DB, límites de payload, paginación completa, N+1 y hooks

#### Cambios

| Área | Archivo | Cambio |
|---|---|---|
| **DB indexes** | `prisma/schema.prisma` | `User @@index([grupoId])` y `@@index([rol])` para acelerar las queries de listing y workspace scoping |
| **Validator limits** | `lib/backend/validators/historia.validator.ts` | Añade `.max()` en todos los campos de texto y arrays: `titulo` ≤500, `codigo` ≤50, `descripcion` ≤10000, `criteriosAceptacion` ≤5000, `casosIds` ≤500, `bloqueos` ≤100, `comentarios` ≤200, `historial` ≤1000 |
| **Validator limits** | `lib/backend/validators/caso.validator.ts` | `titulo` ≤500, `descripcion` ≤10000, `archivosAnalizados` ≤100 items, arrays de bloqueos/comentarios/resultados/tareas acotados |
| **Validator limits** | `lib/backend/validators/tarea.validator.ts` | `titulo` ≤500, `descripcion` ≤5000, `horasEstimadas` ≤9999, `bloqueos` ≤100 |
| **Validator fix** | `lib/backend/validators/auth.validator.ts` | `loginSchema.password` cambia de `min(1)` a `min(8)` — coherente con `createUserSchema` y los mensajes de error ya existentes |
| **Batch limit** | `app/api/casos/batch/route.ts` | Schema Zod añade `.max(1000)` en `ids` — previene procesar más de 1000 casos en una sola petición → 400 si se supera |
| **Export limit** | `app/api/export/route.ts` | Nuevo parámetro `?limit=N` (máx. 5000, default 5000) añadido al `findMany` de historias y casos — evita dumps completos sin paginación |
| **N+1 fix** | `lib/backend/services/grupo.service.ts` | `getMetricasGlobales`: reemplaza el bucle `for…of` secuencial por `Promise.all(grupos.map(g => getMetricasGrupo(g.id)))` — N grupos ahora generan N×7 queries concurrentes en vez de N×7 secuenciales |
| **Paginación** | `GET /api/notificaciones` | Acepta `?page=N&limit=N` (máx. 200, default 50); devuelve `{ notificaciones, total, page, limit, pages }` |
| **Paginación** | `GET /api/sprints` | Acepta `?page=N&limit=N` (máx. 200, default 50); devuelve `{ sprints, total, page, limit, pages }` |
| **Paginación** | `GET /api/grupos` | Acepta `?page=N&limit=N` (máx. 100, default 50); devuelve `{ grupos, total, page, limit, pages }` |
| **Paginación** | `GET /api/users` | Acepta `?page=N&limit=N` (máx. 200, default 50); devuelve `{ users, total, page, limit, pages }` |
| **Hooks — AbortController** | `lib/hooks/useApiMirroredState.ts` | La firma del `fetcher` pasa a `(signal?: AbortSignal) => Promise<T>`; el efecto de carga inicial crea un `AbortController` y cancela el fetch al desmontar el componente |
| **Hooks — AbortController** | `lib/hooks/useNotificaciones.ts` | Añade `AbortController` al efecto de carga inicial; comprueba `controller.signal.aborted` antes de actualizar estado |
| **Hooks — AbortController** | `lib/hooks/useConfig.ts` | Añade `AbortController` a los efectos de carga de sprints y config; expone `syncError` para surfacear errores de sincronización |
| **Tests** | `tests/v255-features.test.ts` | 34 nuevos tests cubriendo todas las funcionalidades anteriores |

#### Decisiones de diseño documentadas

- **Índices en `User`**: `grupoId` y `rol` son los campos más frecuentes en las cláusulas `where` del listing de usuarios (workspace scoping + filtrado por admin/qa). Costo de escritura mínimo vs. ganancia en reads.
- **Límites de payload con 400 vs. 422**: errores de tamaño (`.max()` en Joi/Zod) devuelven 400 (Bad Request) porque el cliente envió datos fuera del contrato de la API — diferente al 422 de cross-entity validation donde el payload es válido pero la entidad referenciada no existe.
- **Export con `limit` en vez de paginación**: la ruta de export genera un CSV en memoria de una sola pasada; añadir un `limit` fijo (5000) es suficiente para protegerla sin cambiar el contrato de descarga-de-archivo-completo que esperan los clientes.
- **`Promise.all` en `getMetricasGlobales`**: las métricas de cada grupo son independientes entre sí — no hay ningún efecto de borde entre grupos. Ejecutarlas en paralelo es seguro y reduce la latencia percibida de O(N) a O(1) relativo al DB connection pool.
- **`AbortController` en hooks**: evita el warning `Can't perform a React state update on an unmounted component` y, más importante, previene que una respuesta tardía sobreescriba estado de una instancia nueva del componente.

**542 tests · 43 suites · 0 fallos** *(antes de v2.56)*

---

### v2.54 — Robustez backend: caché selectiva, filtros de lista, validación cruzada y rate limiting

#### Cambios

| Área | Archivo | Cambio |
|---|---|---|
| **Caché** | `lib/backend/metricas-cache.ts` | `invalidateMetricasCache(grupoId?)`: cuando se pasa `grupoId` solo elimina esa partición; sin argumento limpia todo el `Map`. Las escrituras ya no invalidan métricas de otros workspaces |
| **Filtros API** | `GET /api/historias` | Nuevos query params `?sprint=` y `?responsable=` pasados como `filters` al servicio; el service los aplica en el `where` de Prisma |
| **Paginación** | `lib/backend/services/caso.service.ts` | `getCasosByHU(huId, page, limit)` ahora devuelve `{ casos, total, page, limit, pages }` en vez de un array sin paginar |
| **Paginación** | `lib/backend/services/tarea.service.ts` | `getTareasByCaso` y `getTareasByHU` devuelven resultado paginado (default `limit=200`) |
| **Validación** | `POST /api/casos` | Cross-entity: verifica que `huId` exista en DB y pertenezca al workspace antes de crear → 422 si no |
| **Validación** | `POST /api/tareas` | Cross-entity: verifica que `casoPruebaId` exista, pertenezca al workspace y coincida con `huId` → 422 si no |
| **Rate limiting** | `GET /api/export`, `POST /api/*/sync`, `PATCH /api/casos/batch` | Añade `checkRateLimit` (30 req/min sync, 20 req/min export/batch) → HTTP 429 si se supera |
| **Logging** | Todos los catch en rutas CRUD | `console.error("[ROUTE] acción:", e)` en cada bloque catch antes de construir el mensaje de error |
| **Tests** | `tests/v254-features.test.ts` | 23 nuevos tests cubriendo todas las funcionalidades anteriores |

#### Decisiones de diseño documentadas

- **Caché por partición vs. invalidación global**: invalidar solo el workspace afectado evita que escrituras de un grupo pongan stale el caché de otros grupos. El Owner (sin `grupoId`) usa la clave `"__owner__"` y solo se invalida si se llama sin argumento.
- **Rate limiting en rutas de alto tráfico**: las rutas de sync, export y batch son las más propensas a uso abusivo (pueden generar queries pesadas). Las rutas CRUD regulares no se limitan para no degradar la UX.
- **Cross-entity validation con 422**: se usa 422 (Unprocessable Entity) en vez de 400 porque el payload es sintácticamente correcto pero semánticamente inválido (referencia a entidad inexistente). El mensaje distingue "no existe" de "no pertenece a tu workspace".

**508 tests · 42 suites · 0 fallos** *(antes de v2.55)*

---

### v2.53 — Calidad de código: tipado seguro, paginación, nuevos endpoints y seed completo

#### Cambios

| Área | Archivo | Cambio |
|---|---|---|
| **Tipado** | `lib/backend/services/historia.service.ts` | `createHistoria`/`updateHistoria` usan `Prisma.HistoriaUsuarioUncheckedCreateInput` en vez de `as any` |
| **Tipado** | `lib/backend/services/caso.service.ts` | `createCaso`/`updateCaso` usan `Prisma.CasoPruebaUncheckedCreateInput` |
| **Tipado** | `lib/backend/services/tarea.service.ts` | `createTarea`/`updateTarea` usan `Prisma.TareaUncheckedCreateInput` |
| **Tipos** | `lib/types/index.ts` | Exporta `User`, `Grupo`, `Config`, `PaginatedResult<T>` |
| **Paginación** | `GET /api/historias` | Acepta `?page=N&limit=N` (máx 200), devuelve `{ historias, total, page, limit, pages }` |
| **Paginación** | `GET /api/casos` | Ídem; rutas filtradas por `huId` mantienen comportamiento sin paginar |
| **Paginación** | `GET /api/tareas` | Ídem + nuevo `?asignado=nombre` para filtrar por responsable |
| **Error handling** | Todas las rutas CRUD | Todos los handlers tienen `try/catch` que devuelve `{ error }` con 500 en vez de lanzar |
| **Nuevo endpoint** | `DELETE /api/notificaciones/[id]` | Elimina notificación propia (mismo control de workspace/destinatario que PATCH) |
| **Nuevo endpoint** | `PATCH /api/casos/batch` | Aprueba o rechaza múltiples casos (`{ ids, accion, motivo? }`); aplica aislamiento de workspace; solo actualiza casos en estado `pendiente_aprobacion` |
| **Seed** | `prisma/seed.ts` | Config inicial completa: etapas web/api/mobile, 4 resultados base, 5 tipos de aplicación, 5 ambientes, 7 tipos de prueba, 4 aplicaciones de ejemplo. Re-ejecutable: `update` refresca la config |
| **Seed** | `prisma/seed.ts` | Crea Sprint 1 y Sprint 2 de ejemplo en el grupo predeterminado |
| **Workspace** | `GET /api/users` | Owner ya no se ve a sí mismo en el listado (`NOT: { id: payload.sub }`) |
| **Tests** | 4 nuevos archivos | +42 tests: paginación de rutas, paginación de servicios, DELETE notif, batch approval |

#### Decisiones de diseño documentadas

- **`responsable` y `asignado` como strings de nombre (no FKs)**: intencional. Los campos de auditoría almacenan el nombre en el momento del evento para preservar el historial aunque el usuario sea eliminado. El indicador `UserX` (v2.52) cubre la visibilidad del estado actual sin romper el historial.
- **Joi + Zod coexisten**: los validators de dominio (historias, casos, tareas, auth) usan Joi; las rutas más nuevas (sprints, grupos, sync, batch) usan Zod inline. Migración completa postergada — el costo de romper el comportamiento existente supera el beneficio de uniformidad.
- **`Tarea.huId` sin FK explícita**: campo denormalizado para evitar el JOIN Tarea→CasoPrueba→HistoriaUsuario en queries frecuentes. Mantenido en sincronía por la lógica de creación.

**485 tests · 41 suites · 0 fallos** *(antes de v2.54)*

---

### v2.52 — Mejora UX: conteo de asignaciones e indicador de responsable sin workspace

#### Motivación

Cuando el Owner quita a un usuario del workspace, sus HUs y tareas asignadas no se reasignan automáticamente (los campos `responsable` y `asignado` son strings de nombre sin FK). Esto podía dejar responsables "fantasma" sin que los demás miembros del equipo lo supieran.

#### Cambios

| Archivo | Cambio |
|---|---|
| `app/api/users/[id]/asignaciones/route.ts` | Nuevo endpoint `GET /api/users/:id/asignaciones` — devuelve `{ historias: N, tareas: N }` para el usuario indicado. Solo accesible para Admin y Owner |
| `lib/utils/asignaciones.ts` | Nueva utilidad `isResponsableActivo(nombre, users)` — devuelve `true` si el nombre corresponde a un usuario activo en la lista del workspace |
| `components/dashboard/usuarios/user-management.tsx` | El diálogo "Quitar del workspace" llama al nuevo endpoint al abrirse y muestra el conteo de HUs y tareas pendientes de reasignar antes de confirmar la acción |
| `components/dashboard/historias/historias-kanban.tsx` | Muestra ícono `UserX` naranja junto al responsable si ya no está activo en el workspace |
| `components/dashboard/historias/historias-table.tsx` | Muestra ícono `UserX` naranja en la celda de responsable si ya no está activo |
| `components/dashboard/historias/historia-usuario-detail.tsx` | Muestra ícono `UserX` naranja en el encabezado del detalle si el responsable ya no está activo |
| `components/dashboard/casos/caso-prueba-card.tsx` | Muestra ícono `UserX` naranja junto al asignado de cada tarea si ya no está activo en el workspace |
| `tests/api-users-asignaciones.test.ts` | 8 nuevos tests: auth, permisos, usuario sin workspace, usuario inexistente, conteos correctos, filtros Prisma correctos |
| `tests/asignaciones-utils.test.ts` | 7 nuevos tests: activo, inactivo, desconocido, vacío, array vacío, case-sensitive, múltiples activos |

#### Comportamiento

- **Diálogo "Quitar del workspace"**: al abrir el diálogo se hace fetch a `/api/users/:id/asignaciones`. Si el usuario tiene asignaciones, se muestra un aviso naranja con el conteo exacto de HUs y tareas que quedarán sin responsable activo. Si no tiene ninguna, se muestra un mensaje confirmando que no hay asignaciones pendientes.
- **Ícono `UserX` naranja**: aparece en las 4 ubicaciones donde se muestra un responsable/asignado (kanban de HUs, tabla de HUs, encabezado del detalle de HU, tarjeta de tarea dentro del caso). Se basa en la lista `users` del contexto de autenticación — si el nombre no corresponde a ningún usuario activo del workspace, se renderiza el ícono con tooltip "Responsable sin workspace activo" / "Usuario sin workspace activo".

**443 tests · 37 suites · 0 fallos**

---

### v2.51 — Fix: seguridad SIN_WORKSPACE — usuarios sin workspace ya no pueden acceder al sistema

#### Problema corregido

**Agujero de seguridad: usuario sin workspace veía datos de todos los workspaces**

Cuando el Owner quitaba a un usuario de su workspace (`grupoId → null`), el usuario podía seguir iniciando sesión y recibía un JWT sin campo `grupoId`. Como los endpoints de API aplican el filtro de workspace solo `if (payload.grupoId)`, un JWT sin `grupoId` omitía el filtro y el usuario veía los datos de **todos** los workspaces del sistema.

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/backend/services/auth.service.ts` | `loginService` rechaza con 403 `SIN_WORKSPACE` a cualquier usuario con `rol !== "owner"` y `grupoId === null`, impidiendo que obtenga un token |
| `lib/backend/middleware/auth.middleware.ts` | `requireAuth` devuelve 403 `SIN_WORKSPACE` para tokens sin `grupoId` de usuarios no-owner en rutas de negocio (excluye `/api/auth/*`); esto invalida sesiones activas cuando el workspace es retirado mientras el usuario está logueado |
| `components/dashboard/usuarios/user-management.tsx` | El diálogo "Quitar del workspace" ahora advierte explícitamente que el usuario perderá acceso inmediato al sistema |

#### Flujo resultante

1. **Usuario quitado del workspace mientras está logueado**: en la próxima verificación de sesión (o llamada de API), el backend devuelve 403 → el frontend dispara `setSessionExpired(true)` → el usuario es redirigido a login.
2. **Usuario intenta hacer login de nuevo**: `loginService` detecta `grupoId === null` y devuelve `{ error: "Tu cuenta no tiene workspace asignado. Contacta al administrador.", code: "SIN_WORKSPACE" }` → el usuario ve el mensaje de error en la pantalla de login.
3. **Cuando el Owner le asigna un nuevo workspace**: el usuario puede volver a iniciar sesión normalmente.

---

### v2.50 — Fix: notificaciones y bloqueos correctamente segmentados por workspace

#### Problemas corregidos

**1. Notificaciones del flujo de aprobación no incluían `grupoId`**

Todos los `addNotificacion(...)` en `casoHandlers.ts` enviaban la notificación al backend sin `grupoId`. El backend infería el grupoId del JWT para usuarios normales, pero para el Owner (que tiene `grupoId = null`) la petición fallaba con 400. Además, si algún usuario enviaba una notificación sin grupoId, era rechazada o quedaba sin workspace en DB.

**2. Los bloqueos (HU, caso, tarea) no generaban ninguna notificación**

`bloqueoHandlers.ts` no tenía `addNotificacion` en su destructuring de `DomainCtx`. Al bloquear o resolver un bloqueo, solo se actualizaba el estado local y se emitía un toast — ningún admin/qa_lead recibía notificación.

**3. Tipos frontend desincronizados con el backend**

`TipoNotificacion` en `lib/types/index.ts` no incluía `"bloqueo_reportado"` ni `"bloqueo_resuelto"`, aunque el backend (schema Zod) ya los aceptaba. La interfaz `Notificacion` tampoco tenía el campo `grupoId`.

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/types/index.ts` | Añadidos `"bloqueo_reportado"` y `"bloqueo_resuelto"` a `TipoNotificacion`; añadido `grupoId?: string` a la interfaz `Notificacion` |
| `lib/hooks/domain/types.ts` | `AddNotificacionFn.extra` ahora incluye `grupoId` en el `Pick<Notificacion, ...>` |
| `lib/hooks/useDomainData.ts` | Firma local de `addNotificacion` actualizada con `grupoId` en `extra` |
| `lib/hooks/useNotificaciones.ts` | Firma de `addNotificacion` actualizada; `grupoId` se pasa al body del POST a `/api/notificaciones` |
| `lib/hooks/domain/casoHandlers.ts` | Los 5 `addNotificacion(...)` ahora pasan `grupoId: user?.grupoId ?? undefined` en el `extra` |
| `lib/hooks/domain/bloqueoHandlers.ts` | Añadido `addNotificacion` al destructuring; los 4 handlers ahora emiten notificaciones: `handleAddBloqueo` → `bloqueo_reportado` → `"admin"`; los 3 resolve handlers → `bloqueo_resuelto` → `"qa"` |
| `tests/bloqueoHandlers.test.ts` | +2 tests: verifica que `handleResolverBloqueoTarea` emite `bloqueo_resuelto` con `grupoId`; verifica que `handleAddBloqueo` emite `bloqueo_reportado` hacia `"admin"` con `grupoId` |

#### Flujo resultante

| Acción | Notificación | Destinatario | Con grupoId |
|---|---|---|---|
| QA envía caso(s) a aprobación | `aprobacion_enviada` | admin | ✅ |
| Admin aprueba casos | `caso_aprobado` | qa | ✅ |
| Admin rechaza casos | `caso_rechazado` | qa | ✅ |
| QA solicita modificación de caso | `modificacion_solicitada` | admin | ✅ |
| Admin habilita modificación | `modificacion_habilitada` | qa | ✅ |
| Usuario reporta bloqueo en HU | `bloqueo_reportado` | admin | ✅ |
| Usuario resuelve bloqueo de HU | `bloqueo_resuelto` | qa | ✅ |
| Usuario resuelve bloqueo de caso | `bloqueo_resuelto` | qa | ✅ |
| Usuario resuelve bloqueo de tarea | `bloqueo_resuelto` | qa | ✅ |

**428 tests · 35 suites · 0 fallos**

---

### v2.49 — Fix: sesión activa no se cerraba al desactivar cuenta o grupo

#### Problema

El verificador periódico de sesión (`/api/auth/me` cada 5 min) y el restaurador de sesión al recargar solo manejaban `status 401` (JWT expirado). Desde v2.48, `requireAuth` devuelve **403** con códigos `CUENTA_INACTIVA` y `GRUPO_INACTIVO` cuando la cuenta o el grupo se desactivan. Esto causaba que:

- Un usuario con sesión activa cuya cuenta fuera desactivada continuara "logueado" hasta que el JWT expirara (máx. 8 h)
- Al recargar la página con la cookie aún válida pero la cuenta desactivada, la app quedaba en estado de carga indefinido

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/contexts/auth-context.tsx` | Verificador periódico: añadido bloque `else if (status === 403)` — desconecta y activa `sessionExpired` igual que un 401 |
| `lib/contexts/auth-context.tsx` | Restaurador de sesión (al recargar): el `catch` silencioso ahora detecta 403 y activa `sessionExpired` antes de finalizar la carga |

#### Comportamiento resultante

- Si un admin desactiva una cuenta, el usuario afectado es desconectado en el siguiente ciclo de verificación (≤ 5 min)
- Si el owner desactiva un grupo, todos los miembros activos de ese grupo son desconectados en ≤ 5 min
- Al recargar la página con una cookie válida pero cuenta/grupo desactivado, se muestra el banner de sesión expirada inmediatamente en lugar de quedar en carga

---

### v2.48 — Auditoría de seguridad: 5 fixes de autenticación y aislamiento

#### Problemas corregidos

| # | Archivo | Problema | Fix |
|---|---|---|---|
| 1 | `auth.middleware.ts` | `requireAuth` no verificaba si la cuenta del usuario estaba activa — solo verificaba el grupo | Añadida query `user.findUnique({ activo })` antes de la comprobación de grupo. Devuelve 403 con `code: "CUENTA_INACTIVA"` |
| 2 | `casos/sync/route.ts` | Al crear casos nuevos en sync, no se validaba que las HUs padre pertenecieran al workspace del caller | Pre-validación de `huId` contra `historiaUsuario.grupoId` antes del `createMany`. Lanza 500 con "Acceso denegado" si hay violación |
| 3 | `notificaciones/route.ts` | POST usaba `"grupo-default"` como fallback cuando el caller era Owner sin `grupoId` en JWT — las notificaciones iban al grupo equivocado | Eliminado fallback. Owner debe proveer `grupoId` en el body. Devuelve 400 si falta |
| 4 | `sprints/route.ts` | El Owner no podía crear sprints porque `grupoId` no estaba en el schema de Zod | Añadido `grupoId: z.string().optional()` al schema. Owner lo provee en el body |
| 5 | `grupo.service.ts` | `deleteGrupo` no comprobaba sprints antes de eliminar → error de integridad referencial en Prisma. Tampoco eliminaba notificaciones en la transacción | Añadida comprobación de `sprint.count` con mensaje de error. Transacción ampliada para eliminar notificaciones + config + grupo |

#### Tests añadidos / actualizados

- `tests/grupo-activo.test.ts` — añadido `user.findUnique.mockResolvedValue({ activo: true })` en `beforeEach` para reflejar la nueva comprobación de cuenta activa en `requireAuth`
- `tests/grupos.test.ts` — añadidos mocks de `sprint.count` y `notificacion.deleteMany`; nuevo test "rechaza eliminar si tiene sprints"
- Todos los demás test files de API (`api-historias`, `api-casos`, `api-tareas`, `api-sprints`, `api-notificaciones`, `api-historial`, `api-export`, `api-auth-endpoints`, `api-users`, `metricas-cache`) — actualizados con `user.findUnique.mockResolvedValue({ activo: true })` para el nuevo check de `requireAuth`

**426 tests · 35 suites · 0 fallos**

---

### v2.47 — Fix crítico: caché de métricas particionado por workspace

#### Problema

El caché en memoria de `/api/metricas` era una variable global sin distinción de workspace. Con el caché activo, la primera petición (ej. grupo-A) almacenaba sus métricas globalmente. La siguiente petición de cualquier otro usuario (ej. grupo-B) servía los datos de grupo-A desde caché, ignorando el aislamiento de workspace.

#### Causa raíz

`metricas-cache.ts` usaba una sola entrada `let cache = null`. La función `getMetricasCache()` no recibía `grupoId` y devolvía la única entrada independientemente del caller.

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/backend/metricas-cache.ts` | Cache reemplazado de variable única → `Map<string, entry>` particionado por `grupoId`. Clave `"__owner__"` para el Owner. `getMetricasCache(grupoId?)` y `setMetricasCache(data, grupoId?)` reciben el workspace. `invalidateMetricasCache()` limpia todo el Map. |
| `app/api/metricas/route.ts` | Pasa `payload.grupoId` a `getMetricasCache()` y `setMetricasCache()` |
| `tests/metricas-cache.test.ts` | +5 tests: particiones independientes grupo-A/B, invalidación total de todas las particiones, aislamiento en hit/miss por workspace; prisma mock añadido para `requireAuth` con grupoId |

#### Auditoría completa de endpoints (todo correcto antes de esta versión)

| Endpoint | Aislamiento |
|---|---|
| `GET /api/metricas` | `getMetricas(payload.grupoId)` — servicio filtra todas las queries |
| `GET /api/grupos/[id]/metricas` | Solo accesible por `rol === "owner"` |
| `GET/PUT/DELETE /api/historias/[id]` | `checkHistoriaAccess()` — valida `grupoId` de la HU |
| `GET/PUT/DELETE /api/casos/[id]` | `checkCasoAccess()` — valida vía `caso → hu → grupoId` |
| `GET/PUT/DELETE /api/tareas/[id]` | `checkTareaAccess()` — valida vía `tarea → caso → hu → grupoId` |
| `GET /api/historias/[id]/historial` | Verifica `grupoId` de la HU antes de devolver historial |
| `GET /api/export` | `grupoId` en `where` de historias; `hu.grupoId` en `where` de casos |

---

### v2.46 — Aislamiento de workspace completo en todos los endpoints API

#### Problema

Cinco endpoints carecían de validación de workspace para usuarios no-owner, permitiendo que un usuario de un grupo accediera a recursos de otro grupo si conocía el ID del recurso.

#### Endpoints corregidos

| Endpoint | Tipo de acceso faltante | Fix aplicado |
|---|---|---|
| `GET /api/historias/[id]/historial` | Historial de HU de otro workspace | Verifica `grupoId` de la HU antes de devolver historial |
| `GET /api/casos?huId=X` | Casos de prueba de HU ajena | Verifica `grupoId` de la HU antes de listar casos |
| `GET /api/tareas?casoPruebaId=X` | Tareas de caso de prueba ajeno | Verifica `grupoId` vía `caso.hu.grupoId` antes de listar tareas |
| `GET /api/tareas?huId=X` | Tareas de HU ajena | Verifica `grupoId` de la HU antes de listar tareas |
| `POST /api/tareas/sync` | Sync de tareas de otro workspace | Filtra `existing` por workspace; valida nuevas tareas contra `casoPrueba.hu.grupoId` |
| `GET /api/export` | Exportación CSV sin filtro de grupo | Añade `grupoId` al `where` de historias; añade `hu: { grupoId }` al `where` de casos |

#### Patrón de aislamiento

```
Owner (grupoId = undefined) → accede a todo sin restricción
No-owner (grupoId definido) → el recurso solicitado debe pertenecer al mismo grupoId
                             → mismatch o recurso no encontrado → 404 / array vacío
```

#### Tests añadidos

| Archivo | Tests nuevos | Qué verifican |
|---|---|---|
| `tests/api-historial.test.ts` | +4 | 404 para historia de otro grupo; 404 si no existe; 200 para historia propia; owner sin restricción |
| `tests/api-casos.test.ts` | +4 | Array vacío para HU de otro grupo; HU inexistente; casos propios OK; owner sin restricción |
| `tests/api-tareas.test.ts` | +8 | Workspace isolation en `?casoPruebaId` (3 casos) + `?huId` (3 casos) + sync denegado (1) |
| `tests/api-export.test.ts` | +4 | `grupoId` en `where` de historias; sin `grupoId` para owner; `hu.grupoId` en `where` de casos; sin filtro para owner |

---

### v2.45 — Owner Panel: layout más ancho y responsive

#### Cambios

| Archivo | Cambio |
|---|---|
| `components/dashboard/owner/owner-panel.tsx` | Eliminado `max-w-6xl` del contenedor → el panel usa el ancho completo del `container` de la página |
| `components/dashboard/owner/owner-panel.tsx` | Layout principal cambiado de `flex` fijo a `flex-col md:flex-row`: en mobile el sidebar se convierte en una fila horizontal con scroll, en desktop mantiene la columna lateral |
| `components/dashboard/owner/owner-panel.tsx` | Sidebar ampliado de `w-52` a `md:w-60` en desktop |
| `components/dashboard/owner/owner-panel.tsx` | Skeleton de carga también adaptado a `flex-col md:flex-row` + items del skeleton horizontales en mobile |
| `components/dashboard/owner/owner-panel.tsx` | KPIs en skeleton: `grid-cols-4` → `grid-cols-2 sm:grid-cols-4` para mobile |

#### Comportamiento responsive

| Vista | Sidebar | Panel detalle |
|---|---|---|
| Mobile (< md) | Fila horizontal scrollable en la parte superior | Ocupa todo el ancho debajo |
| Desktop (≥ md) | Columna vertical fija `w-60` a la izquierda | Ocupa el ancho restante |

---

### v2.44 — Fix: skeleton de carga + color de pestaña Grupos

#### Cambios

| Archivo | Cambio |
|---|---|
| `app/page.tsx` — `DashboardSkeleton` | Rediseñado para parecerse a la pantalla de login (card centrada con campos simulados) en vez de mostrar tarjetas de dashboard que confundían al usuario |
| `app/page.tsx` — tab "grupos" | Color activo cambiado de `bg-yellow-500` (#eab308 — demasiado brillante) a `bg-amber-600` (#d97706) que funciona bien en modo oscuro y claro |

**Skeleton antes**: 4 tarjetas + 2 rectángulos grandes → parecía el dashboard cargando.
**Skeleton ahora**: ícono + título + card centrada con campos → coherente con la pantalla de login que aparece a continuación.

**Pestaña Grupos antes**: `yellow-500` se veía saturado en modo claro y poco legible en oscuro.
**Pestaña Grupos ahora**: `amber-600` es un dorado más oscuro y equilibrado en ambos modos.

---

### v2.43 — Fix: pantalla negra al cambiar de usuario entre sesiones

#### Problema

Al iniciar sesión con un usuario no-owner (admin, qa, viewer) después de haber usado una sesión de owner en la pestaña "grupos" (o "admin" para roles sin `canManageUsers`), la pantalla se mostraba completamente negra y solo se veía la barra de pestañas.

#### Causa raíz

`tabActiva` es un estado de `useState("inicio")` dentro de `useHUModals`. El componente `DashboardPage` **nunca se desmonta** entre sesiones (logout → login ocurre dentro del mismo componente). Al hacer logout, `tabActiva` quedaba con el valor de la pestaña anterior ("grupos", "admin", etc.). Al iniciar sesión como un nuevo usuario que no tiene acceso a esa pestaña, el `TabsContent` correspondiente no se renderizaba (`{isOwner && ...}`, `{canManageUsers && ...}`), dejando el área de contenido vacía sobre el fondo oscuro del tema.

#### Cambios

| Archivo | Cambio |
|---|---|
| `app/page.tsx` | Añadido `useRef` + `useEffect` que detecta cambio de `user?.id` y resetea `tabActiva` a `"inicio"` cuando cambia el usuario activo |

**Antes**: `tabActiva = "grupos"` persistía entre logout/login causando pantalla negra para no-owners.
**Ahora**: Al cambiar de usuario, `tabActiva` se resetea a `"inicio"` garantizando contenido visible siempre.

---

### v2.42 — Filtro de workspace para Owner

El Owner ahora puede filtrar todas las vistas del dashboard (Inicio, Historias, Casos, Analytics, Carga, Bloqueos) por workspace específico, además de conservar la vista global.

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/types/index.ts` | Agregado `grupoId?: string \| null` a `HistoriaUsuario` — Prisma ya retornaba el campo, faltaba en la interfaz TypeScript |
| `app/page.tsx` | Nuevo estado `filtroGrupoOwner` + `gruposDisponibles`; `useEffect` que carga `/api/grupos` al montar (solo owner); `historiasFiltradas` derivado con `useMemo`; selector de workspace en la UI |
| `app/page.tsx` | `useHistoriasVisibles` ahora recibe `historiasFiltradas` en lugar de `domain.historias`, lo que cascadea el filtro a `casosVisibles` y `tareasVisibles` automáticamente |

#### Comportamiento del filtro

- Selector visible **solo para Owner**, arriba de las tabs, con ícono Globe
- Opciones: **"Todos los workspaces"** (ver todo) + un ítem por cada grupo existente
- Al seleccionar un workspace, se muestra un badge amarillo con el nombre del workspace activo
- El filtro afecta en cascada: HUs → Casos → Tareas → Analytics → Carga → Bloqueos
- Sin selección = comportamiento anterior (ve todo)
- No requiere cambios en el backend — el filtrado es client-side sobre los datos ya cargados

### v2.41 — Admin puede quitar usuarios de su workspace + fix carga inicial de usuarios

#### Cambios

| Archivo | Cambio |
|---|---|
| `components/dashboard/usuarios/user-management.tsx` | La opción **"Quitar del workspace"** en el dropdown ahora también aparece para Admin (no solo para Owner). Condición cambiada de `isOwner && ...` a `(isOwner \|\| isAdmin) && ... && !isOwnerUser(u)`. Admin no puede quitar usuarios Owner del workspace. |
| `components/dashboard/usuarios/user-management.tsx` | Añadido `useEffect(() => { refreshUsers() }, [])` al montar el componente para garantizar que `users` venga de la API (con `grupoId` real) y no de localStorage (donde los datos pueden estar desactualizados). |

#### Comportamiento

| Acción | Owner | Admin |
|---|---|---|
| Quitar usuario del workspace | ✅ cualquier no-owner | ✅ cualquier no-owner en su workspace |
| Eliminar usuario (permanente) | ✅ cualquier no-owner | ✅ usuarios en su workspace |

**Backend**: el endpoint `PUT /api/users/[id]` ya soportaba `{ grupoId: null }` para admin con `checkWorkspaceAccess(..., allowNullGrupo: true)`. Solo faltaba exponer la acción en el frontend.

---

### v2.40 — Fix: eliminar usuarios desde el frontend ahora llama a la API

#### Cambio

| Archivo | Cambio |
|---|---|
| `components/dashboard/usuarios/user-management.tsx` | `handleDelete` era síncrono y solo llamaba a `deleteUser` del contexto (modificación de estado local/localStorage únicamente). Ahora llama a `DELETE /api/users/[id]` y hace `refreshUsers()` al confirmar. El backend ya soportaba el endpoint correctamente con aislamiento de workspace. |

**Antes**: el usuario desaparecía de la UI momentáneamente pero volvía al hacer cualquier `refreshUsers()` porque nunca se eliminaba de la BD.
**Ahora**: DELETE real en BD → `refreshUsers()` sincroniza el estado con la fuente de verdad.

---

### v2.39 — Workspace isolation completo en todos los endpoints

#### Cambios

| Archivo | Cambio |
|---|---|
| `app/api/historias/[id]/route.ts` | GET ahora verifica workspace con `checkHistoriaAccess` antes de devolver el recurso. |
| `app/api/casos/[id]/route.ts` | GET ahora verifica workspace con `checkCasoAccess` (vía `hu.grupoId`). |
| `app/api/tareas/[id]/route.ts` | GET ahora verifica workspace con `checkTareaAccess` (vía `caso.hu.grupoId`). |
| `app/api/sprints/[id]/route.ts` | GET, PUT y DELETE ahora verifican workspace con `checkSprintAccess`. Usuario de otro grupo recibe 404. |
| `app/api/notificaciones/[id]/route.ts` | PATCH verifica que la notificación pertenezca al `grupoId` y `destinatario` del llamante antes de marcarla como leída. |

#### Gaps cerrados

- Todos los endpoints de recursos individuales (HU, caso, tarea, sprint, notificación) ahora aplican la misma regla: **Owner siempre tiene acceso; cualquier otro rol solo puede acceder a recursos de su propio workspace**.
- `historialConexiones`: ya estaba implementado en `loginService` (push de entrada) y `logoutService` (registro de salida). El único gap era que el `select` de `GET /api/users` no lo incluía — corregido en v2.38.
- Config (`/api/config`): ya estaba aislado por workspace a nivel de servicio. Sin cambios necesarios.
- Notificaciones listado y marcar-todas: ya filtraban por `grupoId`. Solo el PATCH individual necesitaba el check.

---

### v2.38 — Historial conexiones fix + asignación workspace con confirmación + selector de workspace para Owner

#### Cambios

| Archivo | Cambio |
|---|---|
| `app/api/users/route.ts` | GET incluye `historialConexiones` en el select — el panel de actividad de conexiones del Owner volvía vacío porque el campo no se retornaba desde la API. |
| `components/dashboard/usuarios/user-management.tsx` | **Asignación con confirmación**: el botón "Asignar" abre un Dialog antes de ejecutar. **Owner**: el diálogo muestra un selector de workspace (usando el `gruposMap` ya cargado) y el botón dice "Asignar a workspace...". **Admin**: el diálogo pide confirmación mostrando el nombre de su workspace. **Fix**: `handleAsignarWorkspace` ya no hace early return para el Owner (antes retornaba por `!currentUser?.grupoId`). |

---

### v2.37 — Workspace isolation completo en recursos + role escalation fix + Quitar del workspace

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/backend/services/tarea.service.ts` | `getAllTareas` acepta `grupoId` y filtra tareas vía `caso → hu → grupoId`. |
| `app/api/tareas/route.ts` | GET pasa `payload.grupoId` a `getAllTareas`; usuarios sin workspace ya no ven tareas ajenas. |
| `app/api/historias/[id]/route.ts` | PUT/DELETE verifican que la historia pertenezca al workspace del llamante. Owner siempre tiene acceso. |
| `app/api/casos/[id]/route.ts` | PUT/DELETE verifican workspace vía `hu.grupoId`. |
| `app/api/tareas/[id]/route.ts` | PUT/DELETE verifican workspace vía `caso.hu.grupoId`. |
| `app/api/users/[id]/route.ts` | PUT bloquea a nivel backend que un admin eleve un rol a `admin` u `owner` (whitelist `ROLES_ADMIN_PUEDE_ASIGNAR`). |
| `components/dashboard/usuarios/user-management.tsx` | Owner ve nueva opción "Quitar del workspace" en el menú de acciones de cada usuario. Llama PUT con `grupoId: null`, dejando al usuario disponible para que un admin lo reclame. Incluye diálogo de confirmación. **Fix**: sección "Usuarios Disponibles" ahora visible también para Owner (antes solo Admin la veía por condición `!isOwner && isAdmin`). `workspaceUsers` del Owner excluye usuarios sin workspace para evitar duplicados. |

#### Comportamiento de "Quitar del workspace" (Owner)

- El Owner puede quitar a cualquier usuario de su workspace sin eliminarlo de la BD.
- El usuario queda con `grupoId = null` y aparece en la sección **Usuarios Disponibles** del Admin.
- Si se quita a un **Admin**, ese admin queda sin workspace. Su cuenta sigue activa pero sin acceso efectivo hasta que sea re-asignado.
- Esta acción es reversible: cualquier Admin puede reclamarlo o el Owner puede re-asignarlo.

---

### v2.36 — Workspaces: aislamiento completo + visibilidad role-based + sin equipoIds

#### Motivación

El sistema anterior usaba `equipoIds` (lista manual de usuarios asignados por cada admin/lead) para controlar la visibilidad. Esto era frágil, incorrecto y no escalable. La nueva arquitectura usa roles y workspaces de forma nativa: el workspace filtra en la API y el rol define qué se ve dentro del workspace.

#### Cambios

| Archivo | Cambio |
|---|---|
| `app/api/users/route.ts` | **GET**: admin solo recibe usuarios de su workspace (`grupoId`) + usuarios sin workspace (`null`) para poder reclamarlos. **POST**: admin solo puede crear roles `qa_lead`, `qa`, `viewer` — bloquea la creación de `admin`/`owner` a nivel backend. |
| `app/api/users/[id]/route.ts` | **PUT**: admin puede editar usuarios de su workspace y usuarios sin workspace (para asignarlos). **DELETE**: admin solo puede eliminar usuarios de su propio workspace (no sin-workspace). Refactorizado con `checkWorkspaceAccess` helper. |
| `lib/contexts/auth-context.tsx` | Elimina `equipoIds` de la interfaz `User`. |
| `lib/hooks/useHistoriasVisibles.ts` | Reescrito con lógica role-based pura. Elimina `equipoIds`. Admin ve todo el workspace. Lead ve sus HUs + las de todos los usuarios `qa` del workspace. QA ve solo las propias. Viewer ve todo. `filtroNombresCarga` actualizado acorde. |
| `components/dashboard/usuarios/user-form-modal.tsx` | Elimina el selector de "Miembros del equipo" (equipoIds). Simplifica el body del PUT (sin equipoIds). |
| `components/dashboard/usuarios/user-management.tsx` | Elimina `esRolConEquipo`, badges de equipo y lógica `equipoIds`. Separa usuarios en `workspaceUsers` y `sinWorkspaceUsers`. Agrega sección "Usuarios Disponibles" con botón "Asignar a mi workspace" para admin. |
| `tests/useHistoriasVisibles.test.ts` | Reescritos para la nueva lógica: admin ve todo, lead ve qa, sin `equipoIds`. |
| `tests/api-users.test.ts` | Añade tests de workspace filter en GET, role restriction en POST, workspace isolation en PUT/DELETE. |
| `tests/user-form-modal.test.tsx` | Actualizado: sin `equipoIds` en tests, añade test que confirma que no se renderiza selector de equipo. |

#### Reglas de visibilidad (nueva implementación)

| Rol | HUs visibles | Carga ocupacional |
|---|---|---|
| Owner | Todo el sistema | Todos los workspaces |
| Admin | Todo el workspace | Todos los miembros del workspace |
| QA Lead | Sus HUs + HUs de todos los usuarios `qa` del workspace | Lead + todos los qa |
| QA (verSoloPropios) | Solo las propias | Solo las propias |
| Viewer | Todo el workspace (solo lectura) | Todos los miembros del workspace |

#### Flujo "Usuarios sin Workspace"

1. Owner crea un usuario → `grupoId = null`
2. `GET /api/users` para cualquier admin incluye usuarios con `grupoId = null`
3. En `UserManagement`, admin ve sección "Usuarios Disponibles" con botón "Asignar a mi workspace"
4. Al asignar: `PUT /api/users/[id]` con `{ grupoId: admin.grupoId }` → `refreshUsers()`

---

### v2.35 — Fix: tabla de usuarios no se actualizaba + cambio de contraseña primer login

#### Causa raíz

**Tabla sin actualizar tras crear usuario:** `UserManagement` lee `users` del estado en localStorage (`usePersistedState`). Al crear un usuario via `POST /api/users`, el modal llamaba a `addUser()` del contexto — una función localStorage-only que generaba IDs falsos y tenía guards de permisos que podían fallar silenciosamente. El Owner Panel sí veía al nuevo usuario porque hace fetch directo a la API. El estado local nunca se refrescaba.

**Cambio de contraseña no funcionaba en primer login:** `cambiarPassword` era sincrónica y buscaba al usuario en el estado local (`users.find(u => u.id === user.id)`). Los usuarios creados por API existen en la BD pero no en localStorage → `"Usuario no encontrado"` → la pantalla de cambio nunca avanzaba. La API `PUT /api/auth/password` existía pero nunca se usaba.

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/contexts/auth-context.tsx` | Añade `refreshUsers()`: función async que llama a `GET /api/users` y reemplaza el estado local con los datos reales de la BD. Cambia `cambiarPassword` de síncrona a `async`, llama a `PUT /api/auth/password` en lugar de comparar localmente. Expone `refreshUsers` en el contexto. |
| `components/dashboard/usuarios/user-form-modal.tsx` | Reemplaza `addUser()` / `updateUser()` por `await refreshUsers()` tras crear o editar correctamente. |
| `components/auth/login-screen.tsx` | `await cambiarPassword(...)` — flujo primer login ahora espera la respuesta de la API. |
| `components/dashboard/usuarios/perfil-dialog.tsx` | `await cambiarPassword(...)` — cambio de contraseña desde perfil también usa la API. |
| `tests/user-form-modal.test.tsx` | Actualiza mocks y assertions: `mockAddUser`/`mockUpdateUser` → `mockRefreshUsers`. |

---

### v2.34 — Fix: visibilidad por rol corregida + error al crear usuario

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/hooks/useHistoriasVisibles.ts` | Admin **sin equipo** ahora ve solo sus **propias HUs** (antes veía todas). QA Lead **sin equipo** también ve solo sus propias HUs. `filtroNombresCarga` para admin sin equipo devuelve `[user.nombre]` en lugar de `undefined`. |
| `tests/useHistoriasVisibles.test.ts` | Actualizados 3 tests para reflejar el nuevo comportamiento. |
| `app/api/users/route.ts` | Añade `try/catch` alrededor de `createUserService` para que errores internos devuelvan JSON 500 en lugar de respuesta vacía. |
| `components/dashboard/usuarios/user-form-modal.tsx` | Uso de `.catch(() => ({}))` al leer el body de error — evita `SyntaxError: Unexpected end of JSON input` cuando el servidor devuelve una respuesta sin cuerpo JSON. |

#### Visibilidad correcta por rol

| Rol | HUs visibles | Carga ocupacional |
|---|---|---|
| Owner | Todas | Todos |
| Admin con equipo | Propias + equipo | Propios + equipo |
| Admin sin equipo | Solo propias | Solo propias |
| QA Lead con equipo | Propias + equipo | Propios + equipo |
| QA Lead sin equipo | Solo propias | Solo propias |
| QA / verSoloPropios | Solo propias | Solo propias |

> El aislamiento por grupo ya funcionaba en la capa API (`grupoId` en JWT → filtro en la query). Este fix afina el filtrado frontend dentro del grupo.

---

### v2.33 — Fix: admin sin equipo no veía las HUs que creaba

#### Causa raíz

`useHistoriasVisibles` filtraba las HUs del admin sin equipo configurado (`equipoIds: []`) al solo mostrar aquellas donde `hu.responsable === user.nombre`. Dado que el nombre del admin no aparece en el selector "QA Responsable" del formulario de HU (ese selector solo muestra usuarios con permiso `canEdit`), todas las HUs quedaban ocultas para el admin aunque el owner las viera sin problema.

#### Cambios

| Archivo | Cambio |
|---|---|
| `lib/hooks/useHistoriasVisibles.ts` | Admin **sin equipo** ahora ve **todas** las HUs del grupo (igual que owner). Admin **con equipo** sigue viendo solo las de su equipo + las propias. `filtroNombresCarga` pasa a ser `undefined` cuando admin no tiene equipo → ve toda la carga ocupacional. |
| `tests/useHistoriasVisibles.test.ts` | Actualizados 2 tests: "admin sin equipo ve todas las HUs del grupo" y "admin sin equipo tiene filtroNombresCarga undefined". |

#### Visibilidad actualizada por rol

| Rol | HUs visibles | Carga ocupacional |
|---|---|---|
| Owner | Todas | Todos |
| Admin con equipo | Propias + equipo | Propios + equipo |
| **Admin sin equipo** | **Todas del grupo** | **Todos del grupo** |
| QA Lead con equipo | Propias + equipo | Propios + equipo |
| QA Lead sin equipo | Todas | Todos |
| QA / verSoloPropios | Solo propias | Solo propias |

> Los dos bugs anteriores también incidían: el 500 en sync (v2.32) hacía que las HUs se perdieran al recargar la página porque nunca llegaban a guardarse en la base de datos.

---

### v2.32 — Fix: error 500 al crear HU / caso / tarea (sync routes)

#### Causa raíz

`POST /api/historias/sync` lanzaba un error 500 sin capturar al intentar crear una nueva Historia de Usuario en la base de datos. El campo `grupoId` es obligatorio (`String` no nullable) en el modelo Prisma `HistoriaUsuario`, pero la interfaz TypeScript `HistoriaUsuario` del frontend no lo incluye, por lo que nunca se enviaba en el payload.

#### Cambios

| Archivo | Cambio |
|---|---|
| `app/api/historias/sync/route.ts` | Inyecta `grupoId` desde el JWT del usuario al crear HUs nuevas. Añade guarda 403 si el usuario no tiene `grupoId`. Añade `try/catch` para devolver JSON con el mensaje de error en lugar de un 500 sin cuerpo. Usa `skipDuplicates: true` en `createMany`. |
| `app/api/casos/sync/route.ts` | Añade `try/catch` para devolver error 500 como JSON. Usa `skipDuplicates: true` en `createMany` para tolerar condiciones de carrera con `historias/sync` (ambos se disparan casi simultáneamente al crear una HU). |
| `app/api/tareas/sync/route.ts` | Mismo patrón que `casos/sync`: `try/catch` + `skipDuplicates`. |
| `tests/api-historias.test.ts` | El test de sync ahora usa un token con `grupoId` para pasar la nueva guarda. Añade `prisma.grupo` al mock para soportar `requireAuth`. |

---

### v2.31 — Formulario de usuario conectado a la API + badge de grupo en tabla de usuarios

#### `UserFormModal` — integración con API

`components/dashboard/usuarios/user-form-modal.tsx` reescrito como formulario asíncrono:

- **Crear usuario**: llama a `POST /api/users` sin enviar `grupoId` en el body — el servidor lo hereda automáticamente del JWT del admin.
  Tras la respuesta exitosa, llama a `addUser({ nombre, email, rol, grupoId: newUser.grupoId })` para sincronizar el estado local (localStorage).
- **Editar usuario**: llama a `PUT /api/users/[id]` con los datos modificados.
  Tras la respuesta exitosa, llama a `updateUser(...)` para sincronizar el estado local.
- **Errores inline**: si la API devuelve un error (ej. email duplicado → 409), se muestra debajo del formulario con icono `AlertCircle` sin cerrar el modal.
- **Loading state**: los botones muestran "Creando..." / "Guardando..." durante la petición.

#### Gestión de Usuarios — badge de grupo en tabla

`components/dashboard/usuarios/user-management.tsx`:
- Cada fila de usuario muestra un badge con el nombre del grupo al que pertenece (junto al rol).
- **Owner**: obtiene todos los grupos vía `GET /api/grupos` al montar el componente y construye un mapa `grupoId → nombre` para mostrar el grupo correcto de cada usuario.
- **Admin/Lead/QA**: obtiene solo su propio grupo vía `GET /api/grupos/[id]` y muestra ese nombre para los usuarios de su misma workspace.

#### `addUser` — soporte de `grupoId`

`lib/contexts/auth-context.tsx`: la función `addUser` ahora acepta `grupoId?: string | null` en su argumento, permitiendo que el frontend sincronice el `grupoId` real asignado por la base de datos.

#### Nuevos tests (20 en 2 archivos)

| Archivo | Tests añadidos | Qué cubre |
|---|---|---|
| `tests/user-form-modal.test.tsx` | 14 (nuevo) | POST/PUT vía API, body sin grupoId, grupoId del response, errores inline, cierre de modal, sincronización addUser/updateUser |
| `tests/api-users.test.ts` | +5 | grupoId heredado del token (admin con/sin grupo, owner con/sin body), PUT parcial con grupoId, desasignación con grupoId null |

---

### v2.30 — Gestión de miembros por grupo desde el Panel del Owner

#### Panel del Owner — rediseño completo (segunda iteración)

`components/dashboard/owner/owner-panel.tsx` reescrito con un layout de dos columnas (sidebar + panel de detalle):

- **Sidebar de grupos**: lista desplazable con indicador de estado (punto verde/gris), nombre, cantidad de miembros y resaltado del grupo seleccionado.
- **Panel de detalle**: header del grupo con acciones (editar, activar/desactivar, eliminar), KPIs en grid 2×2, barra de progreso de HUs y tabla de miembros completa.
- **Gestión de miembros desde el Owner**:
  - "Añadir miembro" → crea un nuevo usuario asignado al grupo (`POST /api/users` con `grupoId`).
  - "Asignar existente" → asigna un usuario sin grupo al workspace seleccionado (`PUT /api/users/[id]` con `grupoId`).
  - "Editar datos" → edita nombre, email y rol de un miembro (`PUT /api/users/[id]`).
  - "Remover del grupo" → desasigna al usuario del grupo (`PUT /api/users/[id]` con `grupoId: null`).

#### Vista Admin — banner de workspace

`components/dashboard/usuarios/user-management.tsx`:
- Muestra un banner "Workspace actual: [Nombre Grupo]" al inicio de la sección de usuarios para cualquier usuario no-owner con `grupoId`, resolviendo el nombre vía `GET /api/grupos/[id]`.

#### Backend — soporte de `grupoId` en usuarios

| Archivo | Cambio |
|---|---|
| `lib/backend/validators/auth.validator.ts` | `grupoId` opcional añadido a `createUserSchema` y `updateUserSchema`; campos de update ahora opcionales |
| `app/api/users/route.ts` | `grupoId` incluido en el `select` del GET |
| `app/api/users/[id]/route.ts` | `grupoId` soportado en PUT con actualización parcial (solo los campos enviados se actualizan) |
| `app/api/grupos/[id]/route.ts` | GET ahora accesible para cualquier usuario autenticado sobre su propio grupo (`payload.grupoId === id`) |

---

### v2.29 — Rediseño del Panel de Grupos (Owner)

Reescritura completa de `components/dashboard/owner/owner-panel.tsx` para modernizar el diseño y mejorar la experiencia en dispositivos móviles:

- **Tailwind CSS + shadcn/ui**: eliminados todos los estilos en línea (`style={{}}`); sustituidos por clases Tailwind y componentes `Card`, `Button`, `Badge`, `Dialog`, `Progress`, `Input`, `Textarea`, `Separator`.
- **Responsive mobile-first**: grid de tarjetas con `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`; resumen global con `grid-cols-2 sm:grid-cols-4`.
- **Tarjeta de grupo mejorada**: franja de color superior indicadora de estado, badge Activo/Inactivo con color semántico (verde/gris), botones de acción con `variant="ghost"` y colores de hover condicionales (ámbar para desactivar, verde para activar, rojo para eliminar).
- **Skeleton de carga**: animación `animate-pulse` mientras se obtienen los datos de la API, consistente con el resto de la aplicación.
- **Modales con Dialog**: `GrupoFormDialog` y `DeleteConfirmDialog` usan el componente `Dialog` de shadcn/ui con `DialogHeader`, `DialogFooter` y animaciones de apertura/cierre.
- **Estado vacío mejorado**: diseño centrado con icono en contenedor `bg-muted` y botón de acción primario.
- **Barra de progreso**: usa el componente `Progress` en lugar de un `div` manual.
- **Fecha de creación**: se muestra en cada tarjeta.
- **Error inline**: reemplaza el banner rojo con fondo destructivo por un `div` con `bg-destructive/10 border-destructive/30` más sutil.
- Sin cambios en la lógica de negocio ni en los tests existentes.

---

### v2.28 — Seguridad: bloqueo real por grupo inactivo (login + sesiones en curso) + 12 nuevos tests

Implementa los dos niveles de enforcement cuando el Owner desactiva un grupo:

#### Nivel A — `lib/backend/services/auth.service.ts`
`loginService` verifica `user.grupo.activo` tras las comprobaciones de cuenta (`activo`, `bloqueado`). Si el grupo está inactivo retorna `{ success: false, error: "Tu grupo de trabajo está desactivado. Contacta al Owner." }` sin llegar a verificar la contraseña ni actualizar intentos fallidos. El Owner (sin grupo) nunca es afectado.

#### Nivel B — `lib/backend/middleware/auth.middleware.ts`
`requireAuth` añade una consulta `prisma.grupo.findUnique` tras verificar el JWT. Si `payload.grupoId` existe y el grupo está inactivo (o fue eliminado), retorna `403` con `{ error: "...", code: "GRUPO_INACTIVO" }`. Esto invalida sesiones activas inmediatamente, sin esperar a que el token expire. El Owner no tiene `grupoId` en el token, por lo que nunca llega a consultar la DB.

#### `prisma/seed.ts`
Actualiza el seed para crear primero el grupo predeterminado "Equipo Principal", asignar los usuarios no-owner a ese grupo, y crear la `Config` vinculada al grupo (`grupoId`) en lugar del patrón singleton (`id: "singleton"`).

#### `tests/grupo-activo.test.ts` (12 tests · node)

#### Corrección de tests existentes (0 fallas en suite completa)

Siete archivos de test tenían fallas introducidas por la migración de grupos de v2.27:

| Archivo | Causa | Corrección |
|---|---|---|
| `tests/grupos.test.ts` | `mockPrisma` en TDZ al hoistear `vi.mock` | Migrado a `vi.hoisted()` + `beforeEach(() => vi.clearAllMocks())` |
| `tests/auth-login.test.ts` | El efecto `/api/auth/me` al montar sobreescribía el user con `undefined` post-login | Fetch mock devuelve 401 para `/api/auth/me`, el catch de auth-context lo ignora |
| `tests/api-sprints.test.ts` | Token de test sin `grupoId`; POST sprint lo requiere | `grupoId: "grupo-default"` añadido al `signToken` de `beforeAll` |
| `app/api/notificaciones/route.ts` | `"bloqueo_reportado"` no estaba en el enum Zod | Añadidos `"bloqueo_reportado"` y `"bloqueo_resuelto"` al enum |
| `tests/useConfig-sprints.test.ts` | `useConfig()` sin `isAuthenticated:true`; el efecto de carga de sprints nunca ejecuta | 5 `renderHook` actualizados a `useConfig({ isAuthenticated: true })` |
| `tests/csv-import-casos.test.tsx` | `getByText("1 caso válido")` fallaba porque el componente renderiza `"1 caso válido · 0 con errores"` como texto combinado | Todos los selectores de conteo cambiados a regex `/X casos? válido/` |
| `tests/resultados-config.test.tsx` | `getByPlaceholderText(/Nombre del estado/i)` encontraba múltiples inputs (los existentes + el de agregar) | Cambiado a `getByPlaceholderText(/ej: Incompleto/i)` que es único |

---

### v2.27 — Multi-equipo: Grupos (workspaces) + Panel del Owner + 46 nuevos tests

Implementa aislamiento de datos por equipo. Cada admin gestiona su propio grupo (workspace) con HUs, casos, sprints, configuración y notificaciones completamente independientes. El Owner tiene acceso global y un panel dedicado para gestionar todos los grupos.

#### `prisma/schema.prisma` — nuevo modelo `Grupo` + campo `grupoId`
Nueva tabla `grupos` con id, nombre, descripción y activo. Relaciones: `User.grupoId?` (nullable para owner), `HistoriaUsuario.grupoId`, `Sprint.grupoId`, `Notificacion.grupoId`, `Config.grupoId @unique`. Los constraints únicos `historias_usuario.codigo` y `sprints.nombre` se convierten en compuestos `(codigo, grupoId)` y `(nombre, grupoId)` respectivamente, permitiendo el mismo código en grupos diferentes.

#### `prisma/migrations/20260323000000_add_grupos/migration.sql`
Migración con compatibilidad hacia atrás: crea la tabla `grupos`, inserta el grupo por defecto "Equipo Principal", añade las columnas `grupoId` como nullable, asigna todos los datos existentes al grupo por defecto, hace NOT NULL las columnas de contenido, recrea los índices únicos como compuestos y añade las foreign keys. El owner queda con `grupoId = null`.

#### `lib/backend/middleware/auth.middleware.ts`
Añade `grupoId?: string` al `JWTPayload`. El owner no tiene `grupoId` en el token (ve todo); admin y demás roles lo tienen.

#### `lib/backend/services/auth.service.ts`
`loginService` incluye `grupoId` al firmar el token. `createUserService` acepta `grupoId` opcional — admin hereda el suyo, owner puede asignarlo manualmente.

#### `lib/backend/services/grupo.service.ts` (nuevo)
CRUD completo: `getAllGrupos`, `getGrupoById`, `createGrupo` (crea config vacía automáticamente), `updateGrupo`, `deleteGrupo` (guarda contra eliminación si tiene usuarios o historias). Métricas: `getMetricasGrupo` (totales + distribuciones por estado) y `getMetricasGlobales` para el panel del Owner.

#### Servicios actualizados con filtro `grupoId`
Todos los servicios aceptan `grupoId?: string` — cuando es `undefined` (owner) retornan todos los datos; cuando es un string filtran al grupo:
- `historia.service.ts` — `getAllHistorias`, `getHistoriasBySprint`, `getHistoriasByResponsable`
- `caso.service.ts` — `getAllCasos` (join via `hu.grupoId`)
- `sprint.service.ts` — `getAllSprints`, `getSprintActivo`, `createSprint` (requiere `grupoId`)
- `config.service.ts` — `getConfig(grupoId)` y `updateConfig(grupoId, data)` por grupo
- `notificacion.service.ts` — `getNotificacionesByDestinatario`, `createNotificacion` (incluye `grupoId`), `marcarTodasLeidas`
- `metricas.service.ts` — todas las agregaciones con filtro de grupo

#### `app/api/grupos/` (nuevas rutas — owner only)
- `GET /api/grupos` · `POST /api/grupos` — listar y crear grupos
- `GET/PUT/DELETE /api/grupos/[id]` — CRUD individual
- `GET /api/grupos/[id]/metricas` — métricas de un grupo específico

#### API routes existentes actualizadas
Todas las rutas leen `payload.grupoId` del JWT y lo pasan a sus servicios: `/api/historias`, `/api/casos`, `/api/sprints`, `/api/config`, `/api/notificaciones`, `/api/metricas`, `/api/auth/me`. Los sync routes (`/historias/sync`, `/casos/sync`) filtran el upsert al grupo del usuario autenticado para no pisar datos de otros equipos.

#### `components/dashboard/owner/owner-panel.tsx` (nuevo)
Panel dedicado al Owner con:
- **Resumen global** (grupos activos, HUs, casos, miembros totales)
- **Tarjetas por grupo** con KPIs (historias, casos, tareas, miembros) y barra de progreso de HUs
- Badge "INACTIVO" en grupos desactivados
- **Crear grupo** — modal con nombre y descripción
- **Editar grupo** — mismo modal pre-rellenado
- **Activar/desactivar** — toggle sin confirmación
- **Eliminar grupo** — modal de confirmación; rechaza si tiene usuarios o historias asignadas
- Estado vacío con CTA para crear el primer grupo
- Manejo de errores de API con banner dismissable
- Diseño responsive (`auto-fill minmax(280px, 1fr)`)

#### `app/page.tsx`
Importa `OwnerPanel`. Añade tab "Grupos" visible solo para `isOwner` con icono `Layers` y color amarillo (`bg-yellow-500`) diferenciado. El `tabCount` suma +1 para el owner.

#### `lib/contexts/auth-context.tsx`
Añade `grupoId?: string | null` al interface `User` y `UserSafe`.

#### `tests/grupos.test.ts` (20 tests · node)
#### `tests/owner-panel.test.tsx` (26 tests · jsdom)

---

### v2.26 — Importación masiva de Casos de Prueba desde CSV + 26 nuevos tests

#### `components/dashboard/casos/csv-import-casos-modal.tsx` (nuevo)
Modal de importación en 3 fases (Cargar → Preview → Importar) para casos de prueba, con la misma estética que el modal de importación de HUs. Soporta arrastrar & soltar o seleccionar archivo. Parsea el CSV validando que el Código HU exista en el sistema, que el título no esté vacío y que haya columnas suficientes. En la vista Preview muestra un resumen (n válidos / n errores) y una tabla por fila con estado OK o mensaje de error. Al importar genera objetos `CasoPrueba` con `estadoAprobacion: "borrador"` y los vincula automáticamente a sus HUs. Valores por defecto: `complejidad=media`, `entorno=test`, `horasEstimadas=1`.

Columnas CSV: `Código HU * | Título * | Descripción | Tipo de Prueba | Complejidad | Horas Estimadas | Entorno`

#### `lib/hooks/domain/casoHandlers.ts` — `handleImportarCasos`
Nuevo handler que recibe `CasoPrueba[]`, los agrega al estado global de casos y actualiza el `casosIds` de cada HU afectada, registrando un evento en el historial por cada HU. Integrado en `useDomainData` vía spread.

#### `components/dashboard/casos/casos-table.tsx` — botón Importar
Nuevo prop `onImportCSV?: () => void`. Cuando se provee, aparece el botón **Importar** junto al contador de casos en la barra de KPI pills. Visible solo para usuarios con permiso `canCreateHU`.

#### `app/page.tsx` — integración
Importa `CSVImportCasosModal`, añade estado `importCasosModalOpen` y pasa `onImportCSV={() => setImportCasosModalOpen(true)}` a `<CasosTable>`. El modal recibe `historias`, `tiposPrueba` y `currentUser` del contexto.

#### `tests/csv-import-casos.test.tsx` (26 tests · jsdom)
Cubre: renderizado (open=false no monta, título visible, 7 columnas en formato, Cancelar llama onClose); parseo (fila válida → "OK", HU no encontrada → error, título vacío → error, código vacío → error, múltiples filas con conteo); importación (onImport recibe casos correctos con huId/complejidad/creadoPor, sin botón Importar cuando hay 0 válidos, "Cambiar archivo" vuelve a upload, IDs únicos); valores por defecto (complejidad→media, entorno→test, horas→1, estadoAprobacion→borrador).

---

### v2.25 — Fix: "Máx. ret." en móvil + 51 nuevos tests (4 áreas sin cobertura)

#### `components/dashboard/config/resultados-config.tsx` — fix layout "Máx. ret." en móvil
El bloque "Máx. ret." (label + input de retesteos) aparecía en la misma línea que el resto de controles del Grupo 2 (toggle, colores, badge), desbordándose hacia la derecha en pantallas estrechas. Se añade `className="w-full sm:w-auto"` al div contenedor: en móvil ocupa el 100 % del ancho dentro del flex-wrap de Grupo 2, bajando a su propia fila; en escritorio recupera ancho automático y convive en la misma línea que los demás controles.

#### Nuevos tests (51 tests, 4 archivos)

**`tests/labelToId.test.ts`** (15 tests · jsdom)
Cubre `labelToId` (lowercase, tildes, espacios → guión bajo, caracteres especiales, vacío, combinaciones) y el hook `useListConfig` (agregar item, prevenir duplicados, rechazar label vacío, eliminar por índice, mover con guard de límites, `hayDiferencias` en ambos casos, `restaurar` con verificación de copia).

**`tests/useHistoriasFilters.test.ts`** (16 tests · jsdom)
Cubre el hook `useHistoriasFilters` completo: filtros por estado, prioridad, responsable, tipo de aplicación, sprint (cadena y `__sin_sprint__`), ambiente; filtros combinados (condición AND); `limpiarFiltros`; contador `filtrosActivos`; ordenamiento por código asc/desc y cambio de campo (reset a asc); valores únicos calculados para responsables y sprints.

**`tests/rate-limit.test.ts`** (10 tests · node)
Cubre `checkRateLimit` (primera petición, peticiones hasta el límite todas permitidas, superación del límite → `allowed=false`, aislamiento entre IPs, `resetAt` en el futuro, expiración de ventana con fake timers) y `getClientIp` (`x-forwarded-for` con múltiples IPs, `x-real-ip` como fallback, `"unknown"` sin headers, precedencia de `x-forwarded-for`).

**`tests/resultados-config.test.tsx`** (10 tests · jsdom)
Cubre el componente `ResultadosConfig`: renderiza los labels de los resultados recibidos; campo "Máx. ret." visible solo para `!esAceptado`; ausencia de botón Eliminar en estados base; presencia y flujo de confirmación en personalizados; toggle aceptado en ambas direcciones; agregar estado custom via formulario; botón Restaurar condicional.

---

### v2.24 — UX: diseño responsive en Configuración → Etapas y Resultados

#### `components/dashboard/config/etapas-config.tsx`
En pantallas móviles la fila de cada etapa se dividía en una sola línea con muchos controles (flechas de orden, input de nombre, selector de colores, badge de vista previa y botón de eliminar), desbordando el contenedor horizontal. Se reorganizan los controles en **dos grupos**:
- **Grupo 1** (ancho completo): flechas de orden + número + input de nombre — se estira hasta ocupar el ancho disponible.
- **Grupo 2** (baja a segunda línea en móvil): selector de colores + badge de vista previa + botón de eliminar — con `flex-wrap` pasa a la siguiente línea cuando no hay espacio.

También se ocultan los badges de vista previa de la cabecera del acordeón en móvil (clase `hidden sm:flex`), evitando desbordamiento horizontal al haber muchas etapas. El formulario de "Agregar nueva etapa" agrupa el selector de color y el botón juntos, de modo que el input ocupa el ancho disponible y los controles se ajustan debajo en pantallas pequeñas.

#### `components/dashboard/config/resultados-config.tsx`
Cada fila de resultado concentraba en una sola línea: ID monospace, input de nombre, toggle Aceptado/No aceptado, selector de colores, badge, campo de máx. retesteos y botón de eliminar. Se aplica el mismo patrón de **dos grupos**:
- **Grupo 1**: ID monospace + input de nombre, en fila expandible.
- **Grupo 2**: toggle + selector de colores + badge + máx. retesteos + eliminar — con `flex-wrap` baja a línea siguiente en móvil.

El Grupo 1 usa `w-full sm:flex-1` (Tailwind) en lugar de `flex: 1` inline: en móvil toma el 100 % del ancho forzando al Grupo 2 a la siguiente línea siempre; en pantallas `sm:` (≥ 640 px) recupera el comportamiento `flex: 1` para que ambos grupos quepan en una sola línea. Sin este cambio, las filas con IDs cortos (como `exitoso` o `bloqueado`) no generaban el salto de línea porque Grupo 1 + Grupo 2 juntos aún cabían horizontalmente, aplastando el input.

La vista de escritorio no se ve afectada: ambos grupos caben en una sola línea con el ancho habitual.

---

### v2.23 — Fix: labels vacíos no se sincronizan + tests para expiración de sesión y reuso de etapas

#### `lib/hooks/useConfig.ts` — filtro de labels vacíos antes de PUT /api/config
El efecto de sincronización enviaba el array completo de `tiposAplicacion`, `ambientes`, `tiposPrueba` y `aplicaciones` sin validar. Si el usuario borraba el texto de un ítem mientras editaba, el debounce (600 ms) disparaba un PUT con `label: ""`, que el validador Joi rechazaba con HTTP 400. Añadido `.filter(t => t.label.trim() !== "")` en cada array antes de enviar, de modo que los estados transitorios (campo vacío durante la edición) no se propagan a la API.

#### Nuevos tests (13 tests, 3 archivos)

**`tests/auth-session-expiry.test.ts`** (5 tests · jsdom)
Cubre el polling periódico de `auth-context`: estado inicial, detección de JWT expirado (polling 401 → `sessionExpired=true`, `user=null`), reset tras login exitoso, ausencia de intervalo cuando no hay usuario autenticado, y comportamiento sin cambios cuando el polling responde 200.

**`tests/etapas-reuse.test.tsx`** (5 tests · jsdom)
Cubre la nueva fila "Reusar etapa existente" de `EtapasConfig`: oculta cuando no hay sugerencias, visible con el badge correcto cuando hay etapas disponibles, filtrado de etapas ya presentes en el tipo actual, deduplicación de etapas repetidas en varios tipos, y acción correcta al hacer clic (`onChange` con el payload esperado).

**`tests/useConfig-sync.test.ts`** (3 tests · jsdom)
Verifica el filtro de labels vacíos con fake timers: `tiposAplicacion` vacío excluido del PUT, `ambientes` vacío excluido, labels válidos transmitidos sin modificar.

---

### v2.22 — Seguridad: expiración automática de sesión tras 8 horas

#### `lib/contexts/auth-context.tsx`
Se añade un intervalo de verificación que llama a `GET /api/auth/me` cada 5 minutos mientras el usuario está autenticado. Si el endpoint responde con HTTP 401 (JWT expirado o inválido), el contexto limpia el estado del usuario (`setUser(null)`) y activa el flag `sessionExpired`. Al hacer login exitosamente, `sessionExpired` se resetea a `false`.

#### `components/auth/login-screen.tsx`
Cuando `sessionExpired` es `true`, se muestra un aviso visible dentro de la tarjeta de login, antes del formulario. El aviso incluye un icono de reloj, el título **"Tu sesión ha expirado"** y la descripción **"Por seguridad, vuelve a ingresar para continuar."** Adapta sus colores al tema claro/oscuro activo. El aviso se oculta automáticamente al completar el login.

---

### v2.21 — UX: reusar etapas existentes al configurar un tipo de aplicación

#### `etapas-config.tsx`
Al expandir un tipo de aplicación en la sección Configuración → Etapas, ahora se muestra una fila de sugerencias **"Reusar etapa existente"** con todas las etapas que ya existen en otros tipos pero aún no están en el tipo actual. Cada sugerencia se presenta como un badge clickeable con el nombre y el color de la etapa original; al hacer clic se añade directamente a la lista sin necesidad de escribir el nombre manualmente. La fila solo aparece cuando hay etapas disponibles para reutilizar.

---

### v2.20.1 — Fix: Owner excluido del selector de equipo y de updateUser

#### `user-form-modal.tsx` — Selector "Miembros del equipo"
La lista de usuarios seleccionables para el equipo de un admin/lead filtraba solo `u.activo && u.id !== userToEdit.id`, dejando visible al usuario Owner. Añadido `&& !getRoleDef(u.rol)?.permisos.includes("isSuperAdmin")` al filtro: los usuarios con rol Owner no aparecen en el selector bajo ninguna circunstancia para usuarios no-owner.

#### `auth-context.tsx` — Guard en `updateUser`
Si un no-owner llamaba a `updateUser` con un objeto de usuario cuyo rol actual era Owner (p.ej. desde localStorage), la función lo procesaba sin restricción. Añadido guard que detecta si el usuario target es Owner (`targetIsOwnerUser`) y retorna `{ success: false, error: "No encontrado" }` cuando `!currentIsOwner`, consistente con el 404 del backend.

---

### v2.20 — UX: confirmación inline antes de eliminar en todas las configuraciones

#### `components/dashboard/config/delete-confirm-button.tsx` (nuevo)
Componente reutilizable `DeleteConfirmButton`. Al hacer clic en el icono de papelera, el botón se transforma en una confirmación inline `¿Eliminar? ✓ ✗` sin abrir ningún modal. El ✓ ejecuta la acción; el ✗ cancela y vuelve al estado inicial. Soporta `disabled` (botón inactivo con opacidad reducida) y `stopPropagation` (necesario para botones dentro de contenedores clickeables como el acordeón de roles).

#### Archivos actualizados
- `generic-list-config.tsx` — Ambientes, Tipos de Aplicación, Tipos de Prueba: ítems personalizados
- `resultados-config.tsx` — Estados de resultado no-base
- `etapas-config.tsx` — Etapas personalizadas (no predeterminadas)
- `aplicaciones-config.tsx` — Aplicaciones/sistemas personalizadas
- `roles-config.tsx` — Roles personalizados (respeta el `disabled` cuando el rol tiene usuarios asignados y usa `stopPropagation` por estar dentro del header del acordeón)

---

### v2.19.2 — Fix: aplicaciones predeterminadas no editables ni eliminables

#### `aplicaciones-config.tsx`
`AplicacionesConfig` usa `string[]` en lugar de objetos con `id`, por lo que la detección de ítem predeterminado se hace por contenido: `APLICACIONES_PREDETERMINADAS.includes(app)`. Mismo patrón que v2.18: `Input` en `readOnly` con fondo secundario y spacer en lugar del botón de eliminar para las aplicaciones predeterminadas.

---

### v2.19.1 — Fix: Owner también oculto en cards de stats y lista de roles

#### `user-management.tsx` — Cards de estadísticas por rol
La grilla de cards iteraba sobre todos los roles con `roles.map(...)` sin excluir el rol `owner`. Para usuarios no-owner, el card "Owner" era visible aunque la lista de usuarios ya lo filtraba. Añadido `.filter(r => isOwner || !r.permisos.includes("isSuperAdmin"))` antes del `map`.

#### `roles-config.tsx` — Lista de gestión de roles
La lista de roles en la sección Configuración → Roles también mostraba la entrada "Owner" para todos los usuarios (con "1 usuario"). Añadido `isOwner` al destructuring de `useAuth` y el mismo filtro `isSuperAdmin` antes del `map`.

---

### v2.19 — Seguridad: usuario Owner invisible para no-owners

El usuario con rol `owner` representa al super-administrador del sistema. Ningún otro usuario debe conocer su existencia para evitar ataques dirigidos a esa cuenta.

#### `GET /api/users` — filtro en capa de base de datos
Cuando el requester no tiene `rol === "owner"`, la query agrega `where: { NOT: { rol: "owner" } }` al `prisma.user.findMany`. Los usuarios Owner nunca aparecen en la lista de ningún otro rol.

#### `PUT /api/users/[id]` — 404 al intentar editar un Owner
Antes de ejecutar el `update`, si el requester no es Owner, se hace un `findUnique` del target. Si el target tiene `rol === "owner"`, se retorna **404** (no 403) para no revelar que el usuario existe.

#### `DELETE /api/users/[id]` — 404 al intentar eliminar un Owner
Misma lógica que PUT: `findUnique` + 404 si target es Owner y requester no lo es.

#### `POST /api/users` — 403 al intentar crear usuario con rol Owner
Si el body incluye `rol: "owner"` y el requester no es Owner, se retorna 403 antes de llamar a `createUserService`. Complementa la protección ya existente en el formulario frontend (el selector de rol no muestra "Owner" para no-owners).

#### `user-management.tsx` — filtro en frontend
`usersVisibles` ahora calcula primero `usersBase`: si el usuario activo no es Owner, filtra todos los usuarios con `isSuperAdmin` en sus permisos. Este filtro cubre también el caso en que localStorage tenga usuarios Owner cacheados de una sesión anterior de Owner.

**243/243 tests en verde.**

---

### v2.18 — UX configuración: ítems predeterminados no editables ni eliminables

#### `generic-list-config.tsx` — Ambientes, Tipos de Aplicación y Tipos de Prueba
Los ítems predeterminados (aquellos cuyo `id` existe en el array `defaults` del componente) ahora son de solo lectura: el campo de texto muestra fondo secundario y cursor por defecto, y el botón de eliminar es reemplazado por un spacer para mantener el layout. Solo se puede modificar el texto y eliminar ítems personalizados (agregados por el usuario).

#### `resultados-config.tsx` — Estados de Resultado base
Los estados base (`esBase: true`: Exitoso, Fallido, Error preexistente, Bloqueado) ya no permiten editar la etiqueta — el `Input` es `readOnly` con estilo de fondo secundario. El selector de color y el toggle de "Aceptado" siguen siendo editables. El banner informativo fue actualizado para reflejar el nuevo comportamiento.

#### `etapas-config.tsx` — Etapas predeterminadas por tipo de aplicación
Las etapas cuyo `id` existe en `ETAPAS_PREDETERMINADAS[tipo]` ahora tienen el `Input` de nombre en `readOnly` y sin botón de eliminar (spacer en su lugar). El selector de color permanece activo para permitir personalización visual sin alterar el nombre. Las etapas personalizadas (agregadas por el usuario) mantienen el comportamiento completo.

---

### v2.17 — Optimizaciones: IDs únicos, validación Zod en sprints, `api.get()` en auth y metricas groupBy

#### `lib/utils/domain.ts` — `crearEvento` usa `crypto.randomUUID()`
El ID de evento se generaba como `` `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` ``. El sufijo aleatorio de 4 caracteres reducía la entropía y no garantizaba unicidad real. Reemplazado por `crypto.randomUUID()`, consistente con el resto de IDs del sistema.

#### `POST /api/sprints` — Validación con Zod
La ruta validaba el body manualmente con `if (!nombre || !fechaInicio || !fechaFin)`. Reemplazado por `CreateSprintSchema` Zod que valida campos requeridos con `min(1)` y el campo opcional `objetivo`, consistent con el resto de rutas POST del sistema.

#### `PUT /api/sprints/[id]` — Validación con Zod
La extracción de campos se hacía directamente con destructuring sin validación. Reemplazado por `UpdateSprintSchema` Zod con todos los campos opcionales y `nombre` validado con `min(1)`, previniendo actualizaciones con nombre vacío que antes llegaban a la BD.

#### `lib/contexts/auth-context.tsx` — `fetch` raw reemplazado por `api.get()`
La llamada a `GET /api/auth/me` usaba `fetch` directamente, bypasseando el reviver `revivirFechas` del cliente HTTP. El campo `fechaCreacion` del usuario llegaba como string en lugar de `Date`. Ahora usa `api.get<{ user: UserSafe }>("/api/auth/me")` para restaurar automáticamente las fechas.

#### `lib/backend/services/metricas.service.ts` — Dos `tarea.count()` fusionados en un `groupBy`
`getMetricas` ejecutaba dos queries separadas para el total de tareas y el conteo de tareas con resultado "fallido". Reemplazado por un único `prisma.tarea.groupBy({ by: ["resultado"] })` que devuelve ambos valores en una sola round-trip a la BD. El post-procesamiento extrae el total con `reduce` y el conteo de fallidos con `find`.

#### Nuevos tests — cobertura de `crearEvento` y validación de sprints
- `tests/crearEvento.test.ts` — 4 tests: tipo/descripción/usuario correctos, fecha `instanceof Date`, ID con prefijo `ev-`, 100 IDs únicos en llamadas sucesivas.
- `tests/api-sprints.test.ts` — 2 tests adicionales: `nombre: ""` en POST → 400, `nombre: ""` en PUT → 400.

**237/237 tests en verde.**

---

### v2.16 — Optimizaciones: useConfig, validación notificaciones y cobertura de tests

#### `useConfig.ts` — IDs temporales de sprint con `crypto.randomUUID()`
`addSprint` generaba el ID optimista como `` `sprint-${Date.now()}` ``. El mismo patrón de colisión corregido en v2.15 para comentarios. Reemplazado por `crypto.randomUUID()`.

#### `useConfig.ts` — Debounce de 600 ms en el PUT de configuración
El `useEffect` que sincroniza la config con `PUT /api/config` se disparaba de forma inmediata en cada cambio de cualquier campo. Ahora usa el mismo patrón de debounce (600 ms con `clearTimeout` + cleanup) que `useApiMirroredState`, evitando ráfagas de peticiones al editar campos de texto en la pantalla de configuración.

#### `useConfig.ts` — Errores de carga expuestos en lugar de `null` hardcodeado
El campo `error` retornaba siempre `null`. Si `GET /api/config` o `GET /api/sprints` fallaba, el error se descartaba silenciosamente. Ahora se capturan en `configError` y `sprintsError` y se exponen como `error: configError ?? sprintsError ?? null`, en línea con el comportamiento de `useDomainData`.

#### `POST /api/notificaciones` — Validación con Zod
La ruta validaba el body manualmente con condiciones `if (!campo)`, sin whitelist de valores. Un `tipo` o `destinatario` inválido pasaba sin error y llegaba a la BD. Reemplazado por un schema Zod que valida los enums `tipo` (6 valores) y `destinatario` (`"admin" | "qa"`), consistente con el resto de rutas POST.

#### Nuevos tests — cobertura de huHandlers, comentarioHandlers y gaps de casoHandlers
- `tests/huHandlers.test.ts` — 21 tests: `handleIniciarHU` (transición, historial, guard estado), `handleCancelarHU` y `handleFallarHU` (estado, motivo, fechaCierre, historial), `handleBulkCambiarEstado/Responsable` (aislamiento), `handleImportarHUs` (deduplicación por código), `handleAvanzarEtapa` (guard bloqueos, guard etapa incompleta, avance, cierre exitoso, guard HU completada).
- `tests/comentarioHandlers.test.ts` — 7 tests: aislamiento entre HUs y casos, autor del usuario activo, unicidad de IDs con `crypto.randomUUID()`.
- `tests/casoHandlers.test.ts` — 5 tests adicionales: `handleRetestearCaso` (historial síncrono, guard caso inexistente), `handleCompletarCasoEtapa` (guard tareas bloqueadas, guard caso inexistente, historial síncrono).
- `tests/notificacion-service.test.ts` — 5 tests: `rolToDestinatario` para cada rol posible (`owner`, `admin`, `qa_lead`, `qa`, `viewer`).

**231/231 tests en verde.**

---

### v2.15 — Optimizaciones: casoHandlers, import estático y IDs de comentarios

#### Patrón `huIdAfectada = ""` eliminado en `casoHandlers.ts`
`handleCompletarCasoEtapa` y `handleRetestearCaso` usaban el mismo anti-patrón corregido en v2.14 para `tareaHandlers` y `bloqueoHandlers`: declaraban `let huIdAfectada = ""` y lo asignaban con una mutación de variable libre dentro del updater de `setCasos`. El fix lee el caso directamente del array `casos` del contexto antes de llamar a `setCasos`, eliminando la mutación y haciendo la actualización del historial de HU completamente síncrona. Adicionalmente se añadió un guard de retorno temprano si el caso no existe.

#### `await import()` innecesario eliminado en `GET /api/casos`
`app/api/casos/route.ts` importaba `getAllCasos` y `createCaso` estáticamente desde `caso.service`, pero cargaba `getCasosByHU` con `await import(...)` dentro del handler. Al ser el mismo módulo, el dynamic import solo añadía latencia async sin ningún beneficio. Ahora `getCasosByHU` se importa estáticamente junto a los demás.

#### IDs de comentarios con `crypto.randomUUID()` en lugar de `Date.now()`
`comentarioHandlers.ts` generaba IDs como `` `com-${Date.now()}` ``, lo que produce colisiones si dos comentarios se crean en el mismo milisegundo (doble-click, tests rápidos, etc.). Reemplazado por `crypto.randomUUID()` que garantiza unicidad sin riesgo de colisión.

**193/193 tests en verde.**

---

### v2.14 — Optimizaciones: handlers, caché con invalidación, login y config

#### `setTimeout(50ms)` eliminados en handlers
`handleBloquearTarea`, `handleDesbloquearTarea` (en `tareaHandlers.ts`) y `handleResolverBloqueoTarea` (en `bloqueoHandlers.ts`) usaban un `setTimeout(..., 50)` para diferir la actualización del historial de la HU, capturando `huId` dentro del updater de React. Era un patrón frágil: si React tardaba más de 50 ms, `huId` llegaba vacío y el historial no se registraba. El fix: leer `huId` directamente del array `tareas` del contexto antes de mutar el estado, eliminando la necesidad de espera artificial.

#### Delay artificial de 600 ms en login eliminado
`login-screen.tsx` añadía `await new Promise(resolve => setTimeout(resolve, 600))` antes de llamar a `login()`. No tenía propósito funcional — el spinner ya se mostraba al activar `isLoading`. Se eliminó: el login ahora inicia inmediatamente.

#### `getConfig()` ya no escribe en cada lectura
`config.service.ts` usaba `prisma.config.upsert({ update: {} })` para leer la configuración, lo que disparaba un `UPDATE` innecesario en cada `GET /api/config`. Reemplazado por `findUnique` con un `create` fallback solo cuando la fila no existe.

#### Caché de métricas con invalidación explícita
El caché en memoria de `GET /api/metricas` se invalidaba solo por TTL (60 s). Ahora todas las rutas de escritura (POST/PUT/DELETE en `/api/historias`, `/api/casos`, `/api/tareas` y sus rutas `/sync`) llaman a `invalidateMetricasCache()` desde el módulo compartido `lib/backend/metricas-cache.ts`, garantizando que el dashboard refleje cambios de inmediato.

#### Nuevos tests
- `tests/tareaHandlers.test.ts` — 11 tests para `handleBloquearTarea` y `handleDesbloquearTarea`: comportamiento síncrono del historial, guard de tarea inexistente, estado tras desbloqueo parcial.
- `tests/bloqueoHandlers.test.ts` — 7 tests para `handleResolverBloqueoTarea`: actualización síncrona del historial, guard, estado residual con múltiples bloqueos.
- `tests/metricas-cache.test.ts` — 7 tests: módulo de caché (get/set/invalidate) y comportamiento de cache hit/miss en `GET /api/metricas`.

**193/193 tests en verde.**

---

### v2.13 — Optimizaciones: multi-usuario, caché, errores y limpieza

#### Corrección crítica — pérdida de datos en multi-usuario
Las rutas `/api/historias/sync`, `/api/casos/sync` y `/api/tareas/sync` ejecutaban `deleteMany({ id: { notIn: ids } })`, lo que borraba registros de otros usuarios cuando cualquiera sincronizaba su estado local. Se eliminó ese `deleteMany` de las tres rutas. Los borrados ahora son **explícitos**: los handlers `handleEliminarHUConfirmado`, `handleBulkEliminarConfirmado`, `handleEliminarCaso` y `handleEliminarTarea` llaman directamente a `DELETE /api/historias/[id]`, `DELETE /api/casos/[id]` y `DELETE /api/tareas/[id]`.

#### Caché en métricas
`GET /api/metricas` lanzaba 8 queries en paralelo en cada petición. Se añadió un caché en memoria con TTL de 60 s — los requests posteriores retornan el resultado cacheado sin tocar la BD.

#### Estado de error propagado desde `useApiMirroredState`
`useApiMirroredState` devolvía `[state, setState, loaded]`; los errores de carga se descartaban silenciosamente. Ahora devuelve `[state, setState, loaded, error]`. `useDomainData` expone `error = historiasError ?? casosError ?? tareasError ?? null` — los componentes pueden mostrar un aviso si la API no está disponible.

#### `isLoading` real en `useConfig`
`isLoading` estaba hardcodeado a `false`. Ahora refleja la carga inicial desde `/api/sprints` y `/api/config` — es `true` hasta que ambos efectos resuelven (o fallan).

#### `revivirFechas` deduplicada
La función existía idéntica en `lib/storage.ts` y `lib/services/api/client.ts`. Se exporta desde `storage.ts` y `client.ts` la importa — una sola fuente de verdad.

**168/168 tests en verde.**

---

### v2.12 — Eliminación de código legado (servicios localStorage)

Los siguientes archivos fueron eliminados por no tener ningún importador en el proyecto:

- `lib/services/index.ts` — punto de entrada de servicios nunca importado
- `lib/services/interfaces.ts` — contratos IHistoriaService, ICasoService, ITareaService, IConfigService, INotificacionService
- `lib/services/localStorage/historia.service.ts`
- `lib/services/localStorage/caso.service.ts`
- `lib/services/localStorage/tarea.service.ts`
- `lib/services/localStorage/config.service.ts`
- Directorio `lib/services/localStorage/`

Toda la persistencia real corre a través de los hooks de dominio (`useDomainData`, `useConfig`, `useNotificaciones`) que llaman directamente a `api.*` de `lib/services/api/client.ts`. La sección "Swap frontend → backend" del README fue eliminada porque el swap ya estaba completo a nivel de hooks.

**168/168 tests en verde.**

---

### v2.11 — Sprints conectados a PostgreSQL

`useConfig.ts` completó la conexión del último recurso que persistía solo en localStorage.

- **Carga inicial**: `GET /api/sprints` al montar — reemplaza el estado local con los sprints de la BD; fallback a localStorage si la API no está disponible.
- **`addSprint`**: inserción optimista con ID temporal + `POST /api/sprints`; el ID temporal se reemplaza con el CUID real devuelto por el servidor.
- **`updateSprint`**: actualización local inmediata + `PUT /api/sprints/[id]` en background.
- **`deleteSprint`**: eliminación local inmediata + `DELETE /api/sprints/[id]` en background.
- **`lib/services/index.ts`** y `lib/services/localStorage/*.ts` son código legado no utilizado — el sistema usa `useApiMirroredState` y llamadas directas a `api.*` en todos los hooks de dominio.
- **10 tests nuevos** en `tests/useConfig-sprints.test.ts`: carga inicial, fallback de red, duplicado de nombre, inserción optimista, reemplazo de ID, update, delete.
- **168/168 tests en verde.**

---

### v2.10 — Seguridad y rendimiento

#### Seguridad

- **XSS en exportación PDF** (`auditoria-panel.tsx`, `bloqueos-panel.tsx`) — los campos del usuario (descripciones, títulos, notas) se interpolaban directamente en HTML sin escapar antes de escribirlos con `document.write()`. Un usuario malicioso podía guardar `<script>...</script>` en cualquier campo de texto y ejecutarlo en el navegador de otro usuario al generar el reporte. Corregido con función `esc()` que escapa `&`, `<`, `>`, `"`, `'` en todos los valores interpolados.

- **Borrado masivo silencioso en endpoints de sync** (`/api/historias/sync`, `/api/casos/sync`, `/api/tareas/sync`) — el guard `if (ids.length === 0) return` ya existía pero se ejecutaba *después* del `deleteMany({ id: { notIn: ids } })`. Enviando `{ historias: [] }` se borraba toda la tabla antes de que el guard pudiera detenerlo. Corregido moviendo el check *antes* de la operación destructiva.

#### Rendimiento

- **`useMemo` en `page.tsx`** — `qaUsers`, `casosVisibles`, `tareasVisibles` y `totalBloqueoActivos` se recalculaban en cada render del componente raíz (cambios de tab, búsquedas, toasts). Todos envueltos en `useMemo` con sus dependencias correctas.
- **Filtro duplicado eliminado** — `CasosTable` recibía `domain.casos.filter(c => historiasVisibles.some(...))` inline, calculando la misma lista ya disponible en `casosVisibles`. Reemplazado por la variable memoizada.

#### Sin cambios en lógica de roles

Los endpoints de sync mantienen `requireAuth` (cualquier usuario autenticado puede sincronizar). La lógica de permisos por rol no fue alterada.

---

### v2.9 — Guardias de bloqueos en cadena (tarea → caso → HU)

#### Lógica de negocio

- **`DomainCtx`** ahora expone `tareas: Tarea[]` como array legible, disponible para todos los módulos de handlers de dominio.
- **`handleCompletarCasoEtapa`** (`casoHandlers.ts`) — antes de completar cualquier etapa de un caso de prueba, verifica que ninguna de sus tareas tenga bloqueos activos (`resuelto: false`). Si los hay, lanza toast de error y aborta sin mutar el estado.
- **`handleAvanzarEtapa`** (`huHandlers.ts`) — antes de avanzar o completar una HU, verifica que ninguno de sus casos de prueba tenga bloqueos activos. Si los hay, lanza toast de error y aborta sin mutar el estado.
- Los mensajes de error indican la cantidad de elementos afectados con concordancia de número (singular/plural).

#### Tests

- **12 tests nuevos** en `tests/bloqueo-guards.test.ts`: tarea bloqueada impide completar caso, tarea de otro caso no interfiere, bloqueo resuelto permite continuar, caso sin bloqueos permite continuar, mensajes en singular y plural — para ambas guardias (caso y HU).
- **`casoHandlers.test.ts`** actualizado: `makeCtx` incluye `tareas: []` para cumplir con el nuevo campo en `DomainCtx`.
- **158/158 tests en verde.**

---

### v2.8 — Log de auditoría paginado para Historias de Usuario

#### Nueva API

- **`GET /api/historias/[id]/historial`** — expone el campo `historial` (JSON embebido en `HistoriaUsuario`) como endpoint paginado. Parámetros opcionales: `page` (default `1`) y `limit` (default `20`, máx `100`). Los eventos se ordenan por `fecha` descendente (más reciente primero). Devuelve `{ historial, total, page, limit, pages }`. Protegido con `requireAuth`. No requiere cambio de schema ni dependencias nuevas.

#### Tests

- **8 tests nuevos** en `tests/api-historial.test.ts`: 401 sin token, 404 historia inexistente, estructura completa de respuesta, orden descendente por fecha, paginación `page=2&limit=2`, límite máximo clampado a 100, historial vacío (total 0, pages 1), página fuera de rango (array vacío).
- **`pnpm tsc --noEmit` → 0 errores.**
- **146/146 tests en verde.**

---

### v2.7 — APIs de Métricas, Sprints y Export CSV

#### Nuevas APIs

- **`GET /api/metricas`** — endpoint de agregaciones para el dashboard QA. Devuelve en una sola llamada: historias por estado, historias por sprint, casos por `estadoAprobacion`, tareas por estado, tareas pendientes/bloqueadas agrupadas por asignado, velocidad por sprint (puntos de historias "exitosas") y tasa de defectos (% de tareas con resultado fallido). Protegido con `requireAuth`.
- **`GET /api/sprints`** — lista todos los sprints ordenados por `fechaInicio` desc. Acepta `?activo=true` para devolver solo el sprint cuyo rango `[fechaInicio, fechaFin]` incluye la fecha actual.
- **`POST /api/sprints`** — crea un nuevo sprint. Valida que `nombre`, `fechaInicio` y `fechaFin` estén presentes y que `fechaInicio < fechaFin`.
- **`GET/PUT/DELETE /api/sprints/[id]`** — CRUD individual de sprints.
- **`GET /api/export`** — exporta historias o casos a CSV. Parámetros: `tipo=historias|casos` (requerido), `sprint` (filtro opcional, solo historias), `estado` (filtro opcional). Devuelve `Content-Type: text/csv` con `Content-Disposition: attachment`. No requiere dependencias externas — generación CSV nativa.

#### Nuevos servicios backend

- **`lib/backend/services/metricas.service.ts`** — `getMetricas()` usando `prisma.groupBy` y `prisma.count` en paralelo con `Promise.all`.
- **`lib/backend/services/sprint.service.ts`** — `getAllSprints`, `getSprintById`, `getSprintActivo`, `createSprint`, `updateSprint`, `deleteSprint`.

#### Tests

- **39 tests nuevos** en 4 archivos: `api-metricas.test.ts` (5), `api-sprints.test.ts` (13), `api-notificaciones.test.ts` (11), `api-export.test.ts` (10).
- **`pnpm tsc --noEmit` → 0 errores.**
- **138/138 tests en verde.**

---

### v2.6 — Reorganización de carpetas

- **`components/layout/`** — nueva carpeta para componentes de layout global. Movidos desde `components/`: `error-boundary.tsx`, `theme-provider.tsx`, `theme-switcher.tsx`.
- **`lib/hooks/`** — todos los hooks en un único lugar. Movidos desde la raíz `hooks/`: `use-mobile.ts`, `use-toast.ts`. Extraído `useIsHydrated` de `lib/storage.ts` a `lib/hooks/useIsHydrated.ts`.
- **`lib/contexts/`** — todos los contextos React en un único lugar. Movidos desde `lib/`: `auth-context.tsx`, `theme-context.tsx` (junto al existente `hu-detail-context.tsx`).
- **Carpetas eliminadas**: `hooks/` (raíz, redundante) y `styles/` (redundante con `app/globals.css`).
- **Imports actualizados** en 17 archivos para reflejar las nuevas rutas.
- **`pnpm tsc --noEmit` → 0 errores.**
- **99/99 tests en verde.**

### v2.5 — Actualización de seguridad: Next.js 16.2.1

- **`next` actualizado de `16.1.6` → `16.2.1`** — parcha 5 vulnerabilidades reportadas por `pnpm audit`:
  - HTTP request smuggling en `rewrites` (moderate — GHSA-ggv3-7p47-pfv8)
  - Crecimiento ilimitado del cache de `next/image` — DoS de disco (moderate — GHSA-3x4c-7xq6-9pq8)
  - Buffering ilimitado en `postponed resume` — DoS (moderate — GHSA-h27x-g6w4-24gq)
  - `null origin` bypasea CSRF checks en Server Actions (moderate — GHSA-mq59-m269-xvcx)
  - `null origin` bypasea CSRF del WebSocket HMR en dev (low — GHSA-jcc7-9wpm-mj36)
- **`pnpm audit` → 0 vulnerabilidades conocidas.**
- **`pnpm tsc --noEmit` → 0 errores.**
- **99/99 tests en verde.**

### v2.4 — Optimizaciones de rendimiento y corrección de bugs (optimizaciones)

- **Debounce en `useApiMirroredState`** (`lib/hooks/useApiMirroredState.ts`): el sync a la API ahora espera 600 ms desde el último cambio de estado antes de enviar la petición. localStorage se actualiza de inmediato (sin delay). Esto reduce ~90 % las llamadas a `/sync` durante edición de texto.
- **Fix stale closure en `useNotificaciones`** (`lib/hooks/useNotificaciones.ts`): `addNotificacion` usaba el valor capturado de `notificaciones` en el closure del `.then()`, provocando que `guardarEnStorage` escribiera el array desactualizado tras reemplazar el id temporal. Corregido usando el setter funcional de `setNotificaciones` para leer el estado más reciente.
- **`isLoading` real en `useDomainData`** (`lib/hooks/useDomainData.ts`): el hook ahora lee el tercer valor (`loaded`) de los tres `useApiMirroredState` y expone `isLoading = !historiasLoaded || !casosLoaded || !tareasLoaded`. Antes siempre era `false`. Eliminados `setIsLoading` y `setError` del retorno (no eran usados externamente).
- **Rutas `/sync` en batch** (`app/api/*/sync/route.ts`): los tres endpoints de sincronización reemplazaron el loop secuencial de `upsert` por una estrategia de 4 queries fijas: `deleteMany` + `findMany` (IDs existentes) + `createMany` (nuevos) + `Promise.all(updates)` (paralelo). De `O(n)` queries secuenciales a consultas paralelas independientes del tamaño del array.
- **Validación Zod en rutas `/sync`**: los tres endpoints ahora validan el payload con un schema Zod antes de tocar la BD. Payload inválido retorna HTTP 400 con detalles del error. No requirió instalar dependencias (Zod ya estaba en el proyecto).
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.3 — Backend PostgreSQL, seguridad y notificaciones

#### Backend inicial (Prisma + MVC + Joi)

- **Prisma v5** con 8 modelos: `User`, `Role`, `HistoriaUsuario`, `CasoPrueba`, `Tarea`, `Sprint`, `Notificacion`, `Config`. Campos complejos como `Json`.
- **`lib/backend/middleware/auth.middleware.ts`** — `signToken`, `verifyToken`, `requireAuth`, `requireAdmin` con `jose` (JWT HS256, 8h). Token en cookie `httpOnly` o header `Authorization: Bearer`.
- **Validators Joi**: `auth.validator.ts`, `historia.validator.ts`, `caso.validator.ts`, `tarea.validator.ts`, `config.validator.ts`.
- **Services**: `auth.service.ts` (login con bcrypt, bloqueo por intentos, historial de sesiones), `historia.service.ts`, `caso.service.ts`, `tarea.service.ts`, `config.service.ts`.
- **13 API Routes**: CRUD completo para `auth`, `users`, `historias`, `casos`, `tareas`, `config`. Params como `Promise<{id}>` — compatible con Next.js 16.
- **`prisma/seed.ts`** — 7 usuarios iniciales, 5 roles base y config vacía. Ejecutar con `pnpm db:seed`.

#### Conexión frontend → backend

- `login()` en `auth-context.tsx` ahora es `async` — llama a `POST /api/auth/login`. JWT en cookie `httpOnly`, sesión válida 8h.
- **`useApiMirroredState`** — carga desde API en mount, sincroniza a BD en cada cambio, fallback a `localStorage`.
- **Endpoints bulk sync**: `POST /api/*/sync` — upsert completo del array.
- **`lib/services/api/client.ts`** — helper `apiFetch` con revisor de fechas ISO → `Date` y helpers `api.get/post/put/delete/patch`.

#### Hardening de seguridad

- **Rate limiting**: 10 intentos de login por IP cada 15 minutos → HTTP 429 + `Retry-After`.
- **`JWT_SECRET` obligatorio en producción** — error explícito al arrancar si no está definido.
- **Whitelist de roles** con `Joi.valid()` en validadores de usuario.
- **Prevención de enumeración**: login devuelve "Credenciales inválidas" tanto para email inexistente como para contraseña incorrecta.
- **Headers HTTP** en `next.config.mjs`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS 2 años, CSP, `Referrer-Policy`, `Permissions-Policy`.
- Contraseña mínima 8 caracteres.

#### Notificaciones persistentes

- **`lib/backend/services/notificacion.service.ts`** — `getNotificacionesByDestinatario`, `createNotificacion`, `marcarLeida`, `marcarTodasLeidas`, `rolToDestinatario`.
- `GET/POST /api/notificaciones`, `PATCH /api/notificaciones/[id]`, `PATCH /api/notificaciones/marcar-todas`.
- `useNotificaciones` reescrito: carga localStorage → reemplaza con API en mount → actualización optimista → fallback silencioso.
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.2 — Límite de retesteos y aviso de etapa mid-flight (opt18)
- **Límite configurable de retesteos** (`ResultadoDef.maxRetesteos?: number`): campo opcional en cada resultado no aceptado. Si se configura, el botón "Solicitar Retesteo" muestra el contador `(N/max)` y, al alcanzar el límite, se reemplaza por un aviso "Límite de retesteos alcanzado" bloqueando nuevos intentos.
  - Tipo actualizado en `lib/types/index.ts`.
  - Input numérico (vacío = ilimitado) visible para cada resultado `!esAceptado` en **Admin → Configuración → Resultados**.
  - Guard en `caso-prueba-card.tsx`: `resDef.maxRetesteos !== undefined && intentos >= maxRetesteos`.
- **Aviso de nueva etapa en HU en progreso** (`etapas-config.tsx`): cuando se expande la configuración de etapas para un tipo de aplicación que tiene HUs con `estado === "en_progreso"`, se muestra un banner de advertencia indicando cuántas HUs existen y que sus casos no tendrán resultados para la nueva etapa hasta que inicien ejecución en ella.
  - Nuevo prop `historias?: HistoriaUsuario[]` en `EtapasConfig`.
  - `app/page.tsx` pasa `historias={domain.historias}` al componente.
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.2 — Estado `bloqueado` y resultados de ejecución configurables (opt16)
- **Nuevo tipo `ResultadoDef`** (`lib/types/index.ts`): interfaz con campos `id`, `label`, `esAceptado`, `esBase`, `cls` e `icono`. Define qué resultados existen y su comportamiento en el flujo de ejecución.
- **`ResultadoEjecucion` ahora es `string`**: abierto a cualquier ID de `ResultadoDef`; `IntentoEjecucion.resultado` también es `string`. Compatibilidad total con datos existentes.
- **Cuatro resultados predeterminados** (`RESULTADOS_PREDETERMINADOS` en `lib/constants/index.ts`):
  - `exitoso` — aceptado, base, icono ✓
  - `fallido` — **no aceptado** (requiere retesteo o declarar HU fallida), base, icono ✗
  - `error_preexistente` — aceptado, base, icono ⚠
  - `bloqueado` — aceptado (bloqueado por dependencia externa, no impide avanzar), base, icono ⊘
- **`etapaCompletada` actualizada** (`lib/utils/domain.ts`): acepta `configResultados?: ResultadoDef[]` como tercer parámetro y usa `esAceptado` para determinar si la etapa puede avanzar. Con fallback a los IDs hardcodeados para retrocompatibilidad.
- **Panel de configuración "Resultados"** (`components/dashboard/config/resultados-config.tsx`):
  - Visible solo para **Admin** y **Owner** (dentro del panel de Administración → Configuración).
  - Permite editar label, color y `esAceptado` de cada estado (incluidos los base).
  - Permite agregar estados personalizados y eliminar los no-base.
  - Botón "Restaurar predeterminados".
- **`configResultados`** propagado por toda la pila: `STORAGE_KEYS`, `IConfigService`, `configStorageService`, `useConfig`, `DomainCtx`, `useDomainData`, `HUDetailCtxType`, `HUDetailProvider` en `page.tsx`.
- **`caso-prueba-card.tsx` refactorizado**: los botones de ejecución se generan dinámicamente desde `configResultados`; resultados `esAceptado=true` son de un clic, los `!esAceptado` abren el formulario de comentario. Badges, historial de intentos y `casoCompletado` también usan `configResultados`.
- **`historia-usuario-detail.tsx`**: `hayFallidos` y `todosAceptados` calculados con `esAceptado` del config en lugar de strings hardcodeados. El texto de avance muestra el desglose genérico ("N aceptados no exitosos").
- **Retesteo**: disponible para cualquier resultado con `!esAceptado`; `handleRetestearCaso` simplificado (cualquier resultado completado puede re-ejecutarse).
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.2 — Resultado error_preexistente, Fallar HU y criterio QA en ejecución (opt15)
- **Nuevo resultado `error_preexistente`**: los tipos `ResultadoEjecucion` e `IntentoEjecucion.resultado` ahora incluyen `"error_preexistente"` además de `exitoso` / `fallido`. Permite al QA marcar un caso como error conocido sin bloquear el avance de etapa.
- **Botón "Error preexistente"** en `caso-prueba-card.tsx` (junto a Exitoso/Fallido): aplica cuando el defecto existía antes del cambio y el QA decide que no impide el avance. Se muestra en color ámbar (`--chart-3`).
- **Re-ejecutar por etapa**: al avanzar de etapa los casos aprobados reciben entradas `ResultadoEtapa` con `estado: "pendiente"` para la nueva etapa, permitiendo iniciar y ejecutar la ejecución de nuevo (botón "Iniciar ejecución" habilitado en cada caso).
- **`etapaCompletada` actualizada** (`lib/utils/domain.ts`): `exitosa: true` cuando todos los resultados son `exitoso` **o** `error_preexistente`; `fallida: true` solo cuando alguno es `fallido`.
- **Panel de avance ajustado** (`HUCasosPanel`):
  - Renombrada variable interna `todosExitosos` → `todosAceptados` para reflejar el nuevo criterio.
  - Si hay errores preexistentes: muestra el desglose (`N exitosos, M error preexistente`) con nota "criterio del QA".
  - Si hay fallidos y todos están completados: aparece botón "Declarar cambio fallido" (rojo) junto al botón de avanzar.
- **`handleFallarHU(huId, motivo)`** (nuevo en `huHandlers.ts`): marca la HU como `fallida` / `cambio_cancelado`, guarda `motivoCancelacion` y `fechaCierre`, registra evento `hu_fallida` en el historial.
- **`onFallarHU`** añadido a `HUDetailCtxType` y conectado en el `HUDetailProvider` de `page.tsx`.
- **Retesteo extendido**: `handleRetestearCaso` y el gatillo en la tarjeta de caso ahora también aplican a casos `error_preexistente` (no solo `fallido`), por si el QA quiere reclasificar.
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.2 — Flujo de ejecución por etapas manual con panel de avance (opt14)
- **Avance de etapa manual**: eliminado el `setTimeout` en `handleCompletarCasoEtapa` que avanzaba la etapa automáticamente al completar el último caso. El avance ahora es explícito mediante `handleAvanzarEtapa`.
- **`handleAvanzarEtapa(huId)`** (nuevo en `huHandlers.ts`): valida con `etapaCompletada` que todos los casos aprobados de la etapa actual estén en estado `exitoso`; si hay siguiente etapa crea entradas `pendiente` para ella y actualiza `hu.etapa`; si es la etapa final marca la HU como `exitosa`/`completada`.
- **`onAvanzarEtapa`** añadido a `HUDetailCtxType` y conectado en el `HUDetailProvider` de `page.tsx`.
- **Panel "Avance de etapa"** en `HUCasosPanel` (debajo de la lista de casos): muestra el progreso de la etapa actual en tiempo real:
  - **Todos exitosos** → botón "Avanzar a [etapa siguiente]" o "Completar HU" (etapa final), en verde.
  - **Hay fallidos** → alerta naranja "X caso/s fallido/s — aplica retesteo" con instrucción de solicitar retesteo antes de avanzar.
  - **En curso** → contador "X de Y casos completados · N en ejecución".
- Cuando la HU pasa a `exitosa` (`huCerrada = true`) el panel desaparece y todos los controles quedan bloqueados (comportamiento ya existente).
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.2 — HUDetailContext: eliminación de prop drilling (opt13)
- **`lib/contexts/hu-detail-context.tsx`** (nuevo): contexto `HUDetailCtxType` con 29 campos — permisos del usuario (`isAdmin`, `isQALead`, `isQA`, `currentUser`), config (`configEtapas`, `tiposAplicacion`, `ambientes`, `tiposPrueba`) y todos los domain handlers de HU / Caso / Tarea. Expone `HUDetailProvider` y el hook `useHUDetail()`.
- **`app/page.tsx`**: el bloque de 40 líneas con 35+ props pasadas a `HistoriaUsuarioDetail` se reemplaza por `<HUDetailProvider value={...}>` + `<HistoriaUsuarioDetail open onClose hu casos tareas />` (5 props). Los handlers se inyectan una sola vez en el provider.
- **`historia-usuario-detail.tsx`**: interfaz `Props` reducida de 35 campos a 5 (`open`, `onClose`, `hu`, `casos`, `tareas`). El componente principal y los subcomponentes locales (`HUBloqueos`, `HUCasosPanel`) consumen `useHUDetail()` directamente en lugar de recibir callbacks como props.
- **`caso-prueba-card.tsx`**: `CasoPruebaCardProps` reducida de 17 campos a 4 (`caso`, `hu`, `tareasCaso`, `onAbrirEditar`). `TareaItemProps` reducida de 9 a 4. Handlers y permisos se obtienen desde `useHUDetail()`. El tipo `HUDetailCtxType` importado queda como fuente única de verdad para toda la jerarquía HU → Caso → Tarea.
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.2 — Skeletons, ErrorBoundary y useReducer en filtros (opt12)
- **Skeleton de carga** (`useIsHydrated` en `lib/storage.ts`): durante la hidratación SSR → cliente se muestra un `DashboardSkeleton` de cuatro tarjetas + dos bloques `animate-pulse` en lugar de un flash de datos de fallback vacíos. `useIsHydrated` devuelve `false` en el primer render (server + cliente) y `true` tras el primer `useEffect`, eliminando la discrepancia de hidratación.
- **ErrorBoundary global** (`components/error-boundary.tsx`): componente de clase con `getDerivedStateFromError` + `componentDidCatch` (loguea `error.message` y `componentStack` a consola). Envuelve todo el árbol en `app/layout.tsx`. Si un componente hijo lanza, muestra una pantalla con icono, mensaje de error y botón "Reintentar" que restaura el estado sin recargar la página.
- **`useReducer` en `useHistoriasFilters`**: los 10 `useState` independientes (9 filtros + `filtrosVisibles`) se consolidaron en un único `useReducer` con estado atómico (`FiltersState`) y 13 acciones tipadas (`FiltersAction`). Beneficios: `RESET_FILTROS` es atómico (antes era 9 `setState` secuenciales), `TOGGLE_SORT` y los filtros de paginación resetean `pagina: 1` de forma garantizada en el mismo dispatch, y el estado es fácilmente serializable para deep linking. La API pública del hook (`setFiltroEstado`, `toggleSort`, `limpiarFiltros`, etc.) no cambió — ningún consumidor requirió modificación.
- **Fix oculto**: `guardarEnStorage` no estaba exportada desde `lib/storage.ts` aunque 4 servicios en `lib/services/localStorage/` la importaban, lo que causaba errores TS silenciosos. Corregido con `export`.

### v2.2 — Suite de tests con Vitest (opt11) — ampliada con cobertura de API Routes
- **Stack de testing**: Vitest 3 + React Testing Library 16 + jsdom (UI) / node (API routes). Compatible con React 19 y con el path alias `@/` del proyecto. Scripts disponibles: `pnpm test` (watch), `pnpm test:run` (CI), `pnpm test:ui` (interfaz visual).
- **Total: 99 tests — 9 archivos — 0 fallos**

#### Tests de UI / Hooks (jsdom)
- **`tests/casoHandlers.test.ts`** — 14 tests sobre el flujo de aprobación de casos de prueba: `handleEnviarAprobacion` (borrador/rechazado → pendiente, aprobado intacto, HUs ajenas intactas), `handleAprobarCasos` (metadatos `aprobadoPor`/`fechaAprobacion`), `handleRechazarCasos` (motivo de rechazo), `handleSolicitarModificacionCaso`, `handleHabilitarModificacionCaso` (reset a borrador), `handleAddCaso`, `handleEliminarCaso` e `handleRetestearCaso`. Todos verifican también que `addNotificacion` se dispare con el destinatario correcto (`admin` vs `qa`).
- **`tests/useHistoriasVisibles.test.ts`** — 12 tests de scoping por rol: Owner ve todo / `filtroNombresCarga` undefined; QA solo ve sus HUs; Admin sin equipo solo las propias; Admin con equipo ve equipo+sí mismo; QA Lead ídem. También tests de búsqueda por título, código y responsable.
- **`tests/auth-login.test.ts`** — 12 tests de lógica de autenticación y permisos: login con usuario inexistente / inactivo / bloqueado, contador de intentos fallidos con mensaje de intentos restantes, bloqueo en el 5.° intento, generación de `pendingBlockEvents`, y guards de `addUser`/`deleteUser` (admin no puede crear admin, no puede existir segundo owner, email duplicado, no puede eliminarse a sí mismo).

#### Tests de API Routes (node) — Prisma y servicios mockeados, JWT real con `signToken`
- **`tests/api-auth-endpoints.test.ts`** — 7 tests: `GET /api/auth/me` (sin token→401, usuario válido→200, usuario no en DB→404), `POST /api/auth/logout` (sin token→401, con token→200 + cookie borrada), `PUT /api/auth/password` (sin token→401, contraseña corta→400, actual incorrecta→400, cambio exitoso→200).
- **`tests/api-historias.test.ts`** — 10 tests: listar (sin token→401, con token→200), crear (body inválido→400, exitoso→201), obtener por id (no existe→404, existe→200), actualizar→200, eliminar→200, sync (sin token→401, array completo→200+count).
- **`tests/api-casos.test.ts`** — 11 tests: listar todos→200, filtrar por `huId`→200, crear (inválido→400, exitoso→201), obtener por id (no existe→404, existe→200), actualizar→200, eliminar→200, sync (array vacío→count 0, con casos→count correcto).
- **`tests/api-tareas.test.ts`** — 12 tests: listar todos→200, filtrar por `casoPruebaId`→200, filtrar por `huId`→200, crear (inválido→400, exitoso→201), obtener por id (no existe→404, existe→200), actualizar→200, eliminar→200, sync (sin token→401, con tareas→count correcto).
- **`tests/api-users.test.ts`** — 16 tests: listar (QA→403, admin→200), crear (sin email→400, email duplicado→409, exitoso→201), actualizar→200, reset-password→200, desbloquear→200, eliminar propia cuenta→400, eliminar otro→200; owner invisibility: GET (admin→`where NOT owner`, owner→`where {}`), POST (admin crea owner→403), PUT (admin edita owner→404), DELETE (admin elimina owner→404).
- **`tests/api-config.test.ts`** — 7 tests: leer (sin token→401, autenticado→200), actualizar (QA→403, body inválido→400, aplicaciones→200, etapas con formato correcto→200).

### v2.2 — Refactorización de componentes grandes y consolidación de config (opt10)
- **`user-management.tsx` dividido**: Dialog de creación/edición extraído a `user-form-modal.tsx` (~160 líneas) con estado de formulario propio y sync vía `useEffect`. Los 3 AlertDialogs de confirmación (eliminar, resetear contraseña, desbloquear) extraídos a `user-confirm-dialogs.tsx` (~80 líneas). El componente principal redujo de 830 a ~480 líneas.
- **`home-dashboard.tsx` dividido**: `MiniCalendario` extraído a `analytics/mini-calendario.tsx` (~130 líneas) con interfaz explícita `MiniCalendarioProps`. El componente principal redujo de 670 a ~360 líneas.
- **`historia-usuario-detail.tsx` dividido**: panel de casos de prueba (7 variables de estado + 4 handlers + JSX completo) extraído como sub-componente interno `HUCasosPanel`. El componente principal redujo de 760 a ~620 líneas.
- **Config wrappers consolidados**: `ambientes-config.tsx`, `tipos-aplicacion-config.tsx` y `tipos-prueba-config.tsx` (3 × 26 líneas) fusionados en un único archivo `config/list-configs.tsx` (~70 líneas). Las 3 funciones exportadas mantienen sus nombres originales; ningún consumidor requirió cambios.

### v2.2 — Sprints como entidad y notificaciones filtradas por rol (opt9)
- **Sprints como entidad de primera clase**: nuevo tipo `Sprint` con `id`, `nombre`, `fechaInicio`, `fechaFin` y `objetivo`. Se persisten en localStorage (`tcs_sprints`). CRUD disponible en Admin → Configuración → Sprints.
- **Selector de sprint en HUForm**: cuando existen sprints configurados, el campo "Sprint / Versión" cambia de texto libre a un `Select` con las opciones definidas. Si no hay sprints configurados, sigue funcionando como campo libre (retrocompatibilidad).
- **SprintPanel enriquecido**: las tarjetas de sprint muestran rango de fechas, días restantes (en rojo si quedan ≤ 3), estado (Activo / Próximo / Finalizado) y velocidad en puntos completados/total. Los tabs resaltan en verde el sprint actualmente activo.
- **Notificaciones filtradas por rol**: el header solo muestra las notificaciones del destinatario correspondiente al rol del usuario activo — Admin/Owner ven notificaciones de tipo `admin` (ej. cuenta bloqueada, caso enviado a aprobación); QA/Lead ven las de tipo `qa` (caso aprobado/rechazado, modificación habilitada).

### v2.2 — Notificación de cuenta bloqueada, visibilidad correcta y UX móvil (opt8)
- **Notificación automática al admin/owner cuando un usuario se bloquea**: al superar 5 intentos fallidos de login, el sistema despacha automáticamente una notificación "Cuenta bloqueada" hacia todos los usuarios con rol Admin u Owner. Se muestra en la campana del header con ícono de candado en rojo.
- **Badge de Bloqueos correcto**: el contador en la pestaña "Bloqueos" ahora deriva de `casosVisibles` y `tareasVisibles` (datos ya filtrados por rol/equipo) en lugar del conjunto global, por lo que un Admin sin equipo verá 0 hasta que tenga HUs o equipo asignado.
- **Pestaña Inicio muestra ceros cuando corresponde**: `HomeDashboard` recibe `casosVisibles`/`tareasVisibles`; KPIs como "Casos de Prueba" y "Bloqueos" ahora reflejan únicamente los datos visibles para el usuario activo.
- **Gestión de Usuarios con scope de seguridad**: un Admin sin equipo asignado solo ve su propia cuenta en la tabla y en las estadísticas de la sección Usuarios. Con equipo asignado, ve a sí mismo y a los miembros de su equipo. El Owner sigue viendo todos los usuarios.
- **Calendario de Entregas: fix de overflow en móvil**: la cabecera del mini calendario usa `flexWrap: "wrap"` y `minWidth: 90` (antes 140) para que en pantallas estrechas el selector de mes salte a una segunda línea en lugar de desbordar el contenedor.

### v2.2 — Bloqueo de cuenta y scoping completo de datos (opt7)
- **Bloqueo por intentos fallidos**: tras 5 contraseñas incorrectas consecutivas la cuenta se bloquea automáticamente. El login muestra cuántos intentos restan antes del bloqueo. Al iniciar sesión correctamente el contador se resetea.
- **Desbloqueo por Admin/Owner**: en la pantalla de Gestión de Usuarios se muestra el badge "Bloqueado" en la columna Estado y aparece la opción "Desbloquear cuenta" en el menú de acciones. Resetear la contraseña también desbloquea la cuenta.
- **Scoping completo de auditoría y casos**: el panel de Auditoría y la pestaña Casos ahora filtran datos usando la misma lógica de visibilidad que el resto del dashboard (`historiasVisibles`). Admin/Lead sin equipo, usuarios QA y visualizadores solo ven los registros de sus propias HUs; antes recibían todos los datos.

### v2.2 — Control de acceso por equipo (opt6)
- **Owner único**: solo puede existir un usuario con rol Owner en el sistema. La creación y la promoción a Owner quedan bloqueadas si ya existe uno (`addUser` y `updateUser` en `lib/auth-context.tsx`).
- **Admin scoped por equipo**: un Administrador sin equipo asignado ahora solo ve sus propias HUs y métricas (antes veía todo el sistema igual que el Owner). Con equipo asignado sigue viendo los datos de todos sus miembros. Corrección aplicada en `lib/hooks/useHistoriasVisibles.ts` (tanto `filtroNombresCarga` como `historiasVisibles`).
- **UI coherente**: el selector de rol en "Nuevo Usuario / Editar Usuario" oculta la opción Owner cuando ya existe uno, eliminando el intento de crear un segundo antes de llegar a la validación del backend. El hint de carga ocupacional para el rol Admin refleja el nuevo comportamiento.

### v2.2 — Optimizaciones de código (opt5)
- Migración de estilos inline a Tailwind CSS puro en los componentes de mayor impacto: `app/page.tsx`, `components/dashboard/shared/header.tsx`, `components/dashboard/historias/hu-stats-cards.tsx`, `components/dashboard/shared/nav-tab-group.tsx`.
- Responsividad mejorada: breakpoints `sm:` / `lg:` añadidos en grids de stats cards, header y TabsList. El buscador colapsa a ícono en móvil y se expande al pulsarlo.
- Modo oscuro más robusto: transición suave de tema (`transition: background-color 0.2s`), `color-scheme: dark` para inputs nativos, media query de modales compactos para móvil.

### v2.2 — Optimizaciones de código (opt4)
- **`historia-usuario-detail.tsx`**: se extrajeron `HUBloqueos` (con su propio estado de formulario) y `HUHistorialPanel` como sub-componentes. El componente principal redujo ~80 líneas y 4 variables de estado.
- **`historias-table.tsx`**: se extrajo `HUFiltersPanel` (~130 líneas). El panel de filtros tiene una interfaz explícita y vive al final del mismo archivo.
- **`caso-prueba-card.tsx`**: se extrajo `TareaItem` (~80 líneas) con su propio estado de bloqueo (`showBloqueoForm`, `bloqueoTexto`). El componente principal eliminó 2 variables de estado y simplificó el `.map()`.

### v2.2 — Optimizaciones de código (opt3)
- **`NavTabGroup` badge**: prop `badge?: number` en `NavTabItem` para mostrar contadores en items del sidebar de administración.
- **`COMPLEJIDAD_CFG` unificado**: `casos-table.tsx` ahora importa `COMPLEJIDAD_CFG` de `@/lib/types` en lugar de redefinirlo localmente (alinea con `caso-prueba-card.tsx`).

### v2.2 — Optimizaciones de código (opt2)
- **`lib/utils/user-utils.tsx`**: centraliza `getInitials` y `getRoleIcon`, eliminando duplicados en `header.tsx` y `perfil-dialog.tsx`.
- **`lib/utils/date-utils.ts`**: centraliza `fmtFecha` (formato relativo de fechas), antes definida inline en `header.tsx`.
- **`components/ui/paginator.tsx`**: componente `Paginador` compartido, elimina la función idéntica que estaba duplicada en 4 archivos (`casos-table`, `historias-table`, `bloqueos-panel`, `auditoria-panel`).
- **`labelToId` unificado**: `etapas-config.tsx` ahora importa `labelToId` de `useListConfig` en lugar de redefinirlo inline.

### v2.2 — Optimizaciones de código (opt)
- **Organización por módulos**: `components/dashboard/` reorganizado en 6 subdirectorios por dominio (`shared/`, `historias/`, `casos/`, `analytics/`, `usuarios/`, `config/`), cada uno con barrel `index.ts`. Los 21 imports individuales en `page.tsx` quedaron en 6 imports agrupados.
- **`GenericListConfig`**: componente reutilizable que reemplaza la lógica CRUD duplicada en `tipos-aplicacion-config`, `ambientes-config` y `tipos-prueba-config` (~280 líneas eliminadas).
- **`useListConfig`**: hook genérico que encapsula agregar, eliminar, reordenar, editar y restaurar para listas `{ id, label }[]`.
- **`NavTabGroup`**: componente de navegación lateral reutilizable que reemplaza los bloques de botones duplicados en el panel de administración (~50 líneas eliminadas).
- **`lib/constants/badge-paleta.ts`**: paleta de colores compartida, elimina la constante duplicada en `etapas-config` y `roles-config`.
- **`lib/export/`**: módulo de exportación separado (`hu-export.ts`, `analytics-export.ts`, `utils.ts`) con `export-utils.ts` como barrel de compatibilidad.

### v2.2
- **Panel de Riesgos** en el tab Inicio: detecta automáticamente HUs vencidas, por vencer, bloqueadas y casos sin ejecutar. Cada alerta es clickeable para navegar a la HU afectada.
- **Vista por Sprint** en Historias: barra de tabs por sprint con card de resumen (progreso %, distribución de estados, story points) que aparece al asignar el campo sprint a las HUs.
- **Importación CSV**: modal de 3 pasos (cargar → preview → confirmar) para crear HUs masivamente desde archivos CSV. Compatible con el formato de exportación del propio sistema. Detecta y omite códigos duplicados.
- **Plantillas de HU**: botón "Usar plantilla" en el formulario de nueva HU con 5 plantillas predefinidas (Despliegue, Rollback, Infraestructura, Base de Datos, Proceso Batch) que autocompletan tipo, prioridad, puntos, ambiente y criterios de aceptación.
- **Diseño responsive completo**: todos los grids, tablas y paneles se adaptan correctamente a móvil, tablet y escritorio. La tabla de casos de prueba usa un layout de tarjetas en móvil y grid en escritorio. Las etapas de ejecución usan CSS Grid auto-fit para distribuirse sin scroll horizontal en pantallas pequeñas.
- **Arquitectura de servicios**: la capa de persistencia se extrajo a `lib/services/` con contratos explícitos (interfaces) y una capa de implementación intercambiable. Para conectar un backend basta con reemplazar los imports en `lib/services/index.ts` sin tocar ningún componente.

### v2.1
- Configuración dinámica de etapas por tipo de aplicación.
- Gestión de equipos asignados a Admin y QA Lead.
- Selección múltiple de HUs con acciones masivas.
- Exportación PDF y CSV de HUs y resultados de prueba.
- Vista kanban de Historias.

### v2.0
- Reescritura completa con Next.js App Router + React 19.
- Sistema de roles con control de acceso granular.
- Notificaciones internas entre roles.
- Persistencia completa en localStorage.

---

## Sistema de Roles

| Rol | Permisos |
|---|---|
| **Owner** | Acceso total. Solo puede existir **uno** en el sistema. Único que puede crear/asignar roles Admin. Ve todos los datos sin filtro |
| **Administrador** | Gestiona HUs, usuarios, aprobaciones y configuración. Ve su equipo asignado; sin equipo, ve solo sus propias HUs |
| **Lead** | Crea HUs, gestiona su equipo QA y aprueba casos de prueba. Ve solo su equipo |
| **User (QA)** | Crea y ejecuta casos de prueba sobre las HUs asignadas. Ve solo sus propias HUs |
| **Visualizador** | Solo lectura. Ve todos los datos pero no puede modificar nada |

---

## Persistencia de datos

El sistema usa **PostgreSQL como fuente de verdad** a través de Prisma ORM. Todos los cambios (HUs, casos, tareas, config) se sincronizan en tiempo real con la base de datos.

Como fallback de disponibilidad, `useApiMirroredState` mantiene una copia en `localStorage` y la usa si la API no responde. Esto garantiza que el frontend no quede bloqueado ante una interrupción temporal de red.

La capa de acceso a datos está abstraída en `lib/services/interfaces.ts`. Las implementaciones API viven en `lib/services/api/` y las de localStorage en `lib/services/localStorage/`. Para cambiar la fuente de datos basta con editar los imports en `lib/services/index.ts` — ningún componente requiere modificación.

---

## Tema claro / oscuro

El sistema de colores está construido sobre el espacio de color **OKLCH**, con paletas ajustadas para garantizar contraste y armonía en ambos modos. La alternancia se gestiona mediante la clase `.dark` en el `<html>`. Las variables de color (`--primary`, `--secondary`, `--muted`, etc.) comparten la misma familia de hue en modo oscuro para una apariencia cohesiva.

---

## Requisitos previos

- Node.js 18 o superior
- pnpm (`npm install -g pnpm`)

---

## Instalación y desarrollo local

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPO>
cd dashboard_v22

# 2. Instalar dependencias
pnpm install

# 3. Iniciar servidor de desarrollo
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Comandos disponibles

```bash
# Desarrollo
pnpm dev           # Servidor de desarrollo con hot-reload
pnpm build         # Build de producción
pnpm start         # Servidor de producción (requiere build previo)
pnpm lint          # Linting con ESLint

# Tests
pnpm test          # Modo watch (desarrollo)
pnpm test:run      # Ejecución única (CI / pre-push)
pnpm test:ui       # Interfaz visual de Vitest

# Base de datos
pnpm db:migrate    # Aplica migraciones Prisma a la DB
pnpm db:seed       # Carga usuarios y config iniciales
pnpm db:studio     # Abre Prisma Studio (explorador visual de la DB)

# Datos demo
pnpm demo:seed     # Pobla la app con HUs, casos, tareas y usuarios de ejemplo
pnpm demo:clean    # Elimina todos los datos demo (marcados con [DEMO])
```

---

## Despliegue en Vercel

### Requisitos previos

El sistema requiere **PostgreSQL accesible desde la nube**. Se recomienda [Neon](https://neon.tech) (serverless PostgreSQL con tier gratuito). Neon provee dos URLs: una para el connection pooler (app) y otra directa (migraciones).

### Variables de entorno requeridas en Vercel

Configurar en **Settings → Environment Variables** del proyecto en Vercel:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL del connection pooler de Neon (o PostgreSQL en producción) |
| `DIRECT_URL` | URL directa de Neon (para migraciones Prisma; igual a `DATABASE_URL` si no usas pooler) |
| `JWT_SECRET` | String aleatorio largo (mín. 32 caracteres) — **obligatorio en producción** |

> Si `JWT_SECRET` no está definido, el servidor lanza un error explícito al arrancar. No es posible deployar accidentalmente con el secret por defecto.

### Opción 1 — Importar desde GitHub (recomendado)

1. Subir el repositorio a GitHub
2. Ir a [vercel.com/new](https://vercel.com/new) e importar el repositorio
3. Vercel detecta Next.js automáticamente
4. Configurar las 3 variables de entorno antes del primer deploy
5. Cada `git push` a `main` despliega automáticamente a producción

### Opción 2 — Vercel CLI

```bash
npm install -g vercel
vercel          # Primera vez (configura el proyecto)
vercel --prod   # Despliegues posteriores a producción
```

> El paquete `@vercel/analytics` ya está instalado. Para activar Analytics, habilitar la integración desde el dashboard de Vercel.

---

## Estructura del proyecto

`components/dashboard/` está organizado por **módulos de dominio**. Cada módulo tiene un `index.ts` barrel que centraliza los exports, permitiendo imports agrupados desde `page.tsx`.

```
dashboard_v22/
├── app/
│   ├── globals.css           # Variables de tema OKLCH y estilos globales
│   ├── layout.tsx            # Layout raíz con ThemeProvider
│   └── page.tsx              # Página principal — navegación y lógica de estado
├── components/
│   ├── error-boundary.tsx        # ErrorBoundary global (clase) ← v2.2opt12
│   ├── auth/
│   │   └── login-screen.tsx
│   ├── dashboard/
│   │   ├── shared/           # Componentes compartidos entre módulos
│   │   │   ├── header.tsx
│   │   │   ├── toast-container.tsx
│   │   │   ├── confirm-delete-modal.tsx
│   │   │   ├── bloqueos-panel.tsx
│   │   │   ├── comment-thread.tsx
│   │   │   ├── auditoria-panel.tsx
│   │   │   ├── audit-log-viewer.tsx  # Visor de audit log con React Query ← v2.67
│   │   │   ├── command-palette.tsx   # Paleta de comandos Ctrl+K ← v2.66
│   │   │   ├── sprint-panel.tsx
│   │   │   ├── panel-riesgos.tsx
│   │   │   ├── nav-tab-group.tsx   # Navegación lateral reutilizable ← v2.2opt
│   │   │   └── index.ts
│   │   ├── historias/        # Módulo Historias de Usuario
│   │   │   ├── historias-table.tsx
│   │   │   ├── historias-kanban.tsx
│   │   │   ├── historia-usuario-detail.tsx  # Componente principal (344 LOC) ← v2.68
│   │   │   ├── hu-detail-shared.ts          # PNL, SLBL, fmt() compartidos ← v2.68
│   │   │   ├── hu-bloqueos.tsx              # Sub-componente HUBloqueos ← v2.68
│   │   │   ├── hu-historial.tsx             # Sub-componente HUHistorialPanel ← v2.68
│   │   │   ├── hu-casos-panel.tsx           # Sub-componente HUCasosPanel + CasoFormFields ← v2.68
│   │   │   ├── hu-form.tsx
│   │   │   ├── hu-stats-cards.tsx
│   │   │   ├── hu-templates.tsx
│   │   │   ├── csv-import-modal.tsx
│   │   │   └── index.ts
│   │   ├── casos/            # Módulo Casos de Prueba
│   │   │   ├── casos-table.tsx
│   │   │   ├── caso-prueba-card.tsx
│   │   │   ├── csv-import-casos-modal.tsx
│   │   │   └── index.ts
│   │   ├── analytics/        # Módulo Analíticas
│   │   │   ├── home-dashboard.tsx
│   │   │   ├── mini-calendario.tsx     # Calendario de entregas ← v2.2opt10
│   │   │   ├── analytics-kpis.tsx
│   │   │   ├── carga-ocupacional.tsx
│   │   │   └── index.ts
│   │   ├── usuarios/         # Módulo Usuarios
│   │   │   ├── user-management.tsx          # Componente principal (530 LOC) ← v2.68
│   │   │   ├── user-management-shared.ts    # Helpers: formatFecha, getRoleIcon ← v2.68
│   │   │   ├── user-stats-cards.tsx         # Cards de estadísticas por rol ← v2.68
│   │   │   ├── user-connections-panel.tsx   # Panel de conexiones (Owner) ← v2.68
│   │   │   ├── user-form-modal.tsx          # Dialog crear/editar usuario ← v2.2opt10
│   │   │   ├── user-confirm-dialogs.tsx     # AlertDialogs de confirmación ← v2.2opt10
│   │   │   ├── perfil-dialog.tsx
│   │   │   └── index.ts
│   │   └── config/           # Módulo Configuración
│   │       ├── generic-list-config.tsx  # CRUD genérico de listas ← v2.2opt
│   │       ├── list-configs.tsx         # Ambientes + TiposApp + TiposPrueba ← v2.2opt10
│   │       ├── etapas-config.tsx
│   │       ├── roles-config.tsx
│   │       ├── aplicaciones-config.tsx
│   │       └── index.ts
│   └── ui/                   # Componentes base de shadcn/ui
├── lib/
│   ├── types.ts              # Tipos e interfaces del dominio
│   ├── auth-context.tsx      # Contexto de autenticación y lógica de roles
│   ├── storage.ts            # Helpers de localStorage y claves tcs_*
│   ├── constants/
│   │   └── badge-paleta.ts   # Paleta de colores compartida para badges ← v2.2opt
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useConfig.ts
│   │   ├── useDomainData.ts        # Facade que compone hooks de dominio ← v2.67
│   │   ├── useHistoriasData.ts     # Hook independiente: historias ← v2.67
│   │   ├── useCasosData.ts         # Hook independiente: casos ← v2.67
│   │   ├── useTareasData.ts        # Hook independiente: tareas ← v2.67
│   │   ├── useAuditLog.ts          # React Query hook para audit log ← v2.67
│   │   ├── useHistoriasVisibles.ts
│   │   ├── useHUModals.ts
│   │   ├── useListConfig.ts        # Hook CRUD genérico para listas ← v2.2opt
│   │   ├── useNotificaciones.ts
│   │   ├── usePersistedState.ts
│   │   └── useToast.ts
│   └── export/
│       ├── hu-export.ts            # Exportación de HUs
│       ├── analytics-export.ts     # Exportación de Analíticas
│       └── utils.ts
├── tests/                        # Suite de tests (Vitest + RTL) — 904 tests
│   ├── setup.ts                  # Mock de localStorage + jest-dom
│   ├── casoHandlers.test.ts      # Tests del flujo de aprobación (jsdom)
│   ├── useHistoriasVisibles.test.ts # Tests de scoping por rol (jsdom)
│   ├── auth-login.test.ts        # Tests de login, bloqueo y permisos (jsdom)
│   ├── api-auth-endpoints.test.ts   # Tests /api/auth/me, logout, password (node)
│   ├── api-historias.test.ts     # Tests CRUD + sync historias (node)
│   ├── api-casos.test.ts         # Tests CRUD + sync casos (node)
│   ├── api-tareas.test.ts        # Tests CRUD + sync tareas (node)
│   ├── api-users.test.ts         # Tests CRUD + acciones usuarios (node)
│   └── api-config.test.ts        # Tests GET/PUT configuración (node)
├── public/
├── vitest.config.ts
├── next.config.mjs
├── tsconfig.json
└── package.json
```

---

## Credenciales de demo

| Email | Contraseña | Rol |
|---|---|---|
| `owner@empresa.com` | `owner2024` | Owner |
| `admin@empresa.com` | `admin123` | Administrador |
| `lead@empresa.com` | `lead123` | Lead |
| `qa@empresa.com` | `qa123` | User (QA) |
| `viewer@empresa.com` | `viewer123` | Visualizador |

> Estas credenciales son solo para demostración local. No usar en entornos productivos con datos reales.

---

## Variables de entorno

Ver la sección [Variables de entorno requeridas en producción](#variables-de-entorno-requeridas-en-producción) para las variables necesarias (`DATABASE_URL`, `JWT_SECRET`, etc.). Para desarrollo local, copiar `.env.example` a `.env` y ajustar las credenciales de PostgreSQL.

