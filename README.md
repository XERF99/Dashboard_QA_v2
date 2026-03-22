# QAControl — Dashboard de Gestión de Pruebas · v2.8

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
| Persistencia | localStorage (frontend) / PostgreSQL + Prisma (backend) |
| Tests | Vitest 3 + React Testing Library 16 |
| Package manager | pnpm |
| Despliegue | Vercel |

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
- Búsqueda global que abarca título, código, responsable, descripción y casos de prueba
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
- Filtrado automático según el rol del usuario (Owner ve todo, Admin ve su equipo, QA Lead ve su equipo, QA solo ve sus HUs)

### Carga Ocupacional
- Visualización de la distribución de trabajo por miembro del equipo
- Filtrado automático por rol: el Owner y Viewer ven a todos; Admin y QA Lead ven su equipo; QA solo se ve a sí mismo

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

#### Gestión de Usuarios
- CRUD completo de usuarios (Owner y Admin)
- Asignación de roles con descripción de permisos
- Asignación de equipos a roles Admin y QA Lead (controla visibilidad de datos)
- Activación / desactivación de cuentas
- Reseteo de contraseña a la genérica (con cambio obligatorio en próximo login)
- **Bloqueo automático** tras 5 intentos fallidos; desbloqueo manual disponible en el menú de acciones
- **Notificación automática** al Admin/Owner cuando una cuenta queda bloqueada
- **Visibilidad con scope**: Admin sin equipo solo ve su propia cuenta (seguridad); con equipo ve también a sus miembros; Owner ve todos
- Protección: solo el Owner puede crear o asignar roles de Admin u Owner

#### Configuración
- **Roles**: creación y edición de roles personalizados con permisos granulares
- **Tipos de Aplicación**: gestión de los tipos disponibles (Web, Mobile, API, etc.)
- **Aplicaciones**: lista de aplicaciones del proyecto
- **Ambientes**: entornos de prueba disponibles (Dev, QA, Staging, Prod, etc.)
- **Tipos de Prueba**: categorías de prueba disponibles (Funcional, Regresión, Smoke, etc.)
- **Etapas**: configuración de las etapas de ejecución por tipo de aplicación
- **Sprints**: gestión de sprints con nombre, fechas de inicio/fin y objetivo; las HUs se asignan a un sprint desde un selector (no texto libre)

---

## Estructura del proyecto

```
dashboard_v22/
├── app/                              ← Next.js App Router (rutas y API)
│   ├── api/                          ← API Routes (auth, users, historias, casos, tareas, config, notificaciones)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── layout/                       ← Componentes de layout global
│   │   ├── error-boundary.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-switcher.tsx
│   ├── auth/
│   │   └── login-screen.tsx
│   ├── dashboard/
│   │   ├── analytics/                ← Home, KPIs, carga ocupacional
│   │   ├── casos/                    ← Tabla y cards de casos de prueba
│   │   ├── config/                   ← Roles, etapas, resultados, sprints, etc.
│   │   ├── historias/                ← Tabla HU, detalle, formulario, CSV import
│   │   ├── shared/                   ← Header, nav tabs, panels, toast container
│   │   └── usuarios/                 ← Gestión de usuarios y perfil
│   └── ui/                           ← shadcn/ui primitives (Button, Dialog, etc.)
│
├── lib/
│   ├── backend/                      ← Código server-side exclusivo
│   │   ├── middleware/               ← auth.middleware.ts, rate-limit.ts
│   │   ├── services/                 ← auth, historia, caso, tarea, config, notificacion, sprint, metricas
│   │   ├── validators/               ← Joi: auth, historia, caso, tarea, config
│   │   └── prisma.ts
│   ├── contexts/                     ← Todos los React Contexts
│   │   ├── auth-context.tsx          ← AuthProvider, useAuth, User, permisos
│   │   ├── theme-context.tsx         ← ThemeProvider, useTheme
│   │   └── hu-detail-context.tsx     ← HUDetailProvider
│   ├── hooks/                        ← Todos los hooks (dominio + UI)
│   │   ├── domain/                   ← Handlers: huHandlers, casoHandlers, tareaHandlers
│   │   ├── useApiMirroredState.ts
│   │   ├── useConfig.ts
│   │   ├── useDomainData.ts
│   │   ├── useHistoriasFilters.ts
│   │   ├── useHistoriasVisibles.ts
│   │   ├── useHUModals.ts
│   │   ├── useIsHydrated.ts
│   │   ├── useListConfig.ts
│   │   ├── useNotificaciones.ts
│   │   ├── useTareaForm.ts
│   │   ├── useToast.ts
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   ├── services/
│   │   ├── api/                      ← client.ts + servicios API
│   │   └── localStorage/             ← Servicios localStorage (fallback)
│   ├── types/                        ← Tipos TypeScript del dominio
│   ├── utils/                        ← date-utils, domain, user-utils
│   ├── constants/                    ← badge-paleta, index
│   ├── export/                       ← Exportación a CSV/Excel
│   └── storage.ts                    ← localStorage helpers + STORAGE_KEYS
│
├── prisma/                           ← Schema Prisma + seed
├── public/
└── tests/                            ← 146 tests Vitest
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
  notificaciones/[id]/route.ts     ← PATCH /api/notificaciones/[id]  (marcar leída)
  notificaciones/marcar-todas/route.ts ← PATCH /api/notificaciones/marcar-todas
  metricas/route.ts                ← GET   /api/metricas
  sprints/route.ts                 ← GET   /api/sprints  · POST  /api/sprints
  sprints/[id]/route.ts            ← GET · PUT · DELETE  /api/sprints/[id]
  export/route.ts                  ← GET   /api/export?tipo=historias|casos[&sprint=...][&estado=...]
  historias/[id]/historial/route.ts ← GET  /api/historias/[id]/historial[?page=1&limit=20]
```

### Schema Prisma

Tablas: `users`, `roles`, `historias_usuario`, `casos_prueba`, `tareas`, `sprints`, `notificaciones`, `config`.

Los campos con arrays complejos (`bloqueos`, `historial`, `comentarios`, `resultadosPorEtapa`) se almacenan como `Json` para preservar los tipos TypeScript sin cambios en el frontend. Se pueden normalizar a tablas relacionales en fases posteriores.

### Setup inicial (requiere PostgreSQL)

```bash
# 1. Ajustar credenciales en .env
#    DATABASE_URL="postgresql://usuario:password@localhost:5432/tcs_dashboard"
#    JWT_SECRET="un-string-aleatorio-largo"

# 2. Crear la base de datos y migrar el schema
npx prisma migrate dev --name init

# 3. Generar el cliente Prisma (tipos TypeScript)
npx prisma generate
```

Una vez ejecutado `prisma generate`, los `any` temporales en los services se pueden reemplazar por los tipos generados (`Prisma.HistoriaUsuarioCreateInput`, etc.).

### Swap frontend → backend

Editar `lib/services/index.ts`:
```ts
// Cambiar esto:
export { historiaStorageService as historiaService } from "./localStorage/historia.service"
// Por esto:
export { historiaApiService as historiaService } from "./api/historia.service"
```

El resto del frontend no cambia.

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
| Rate limiting | Máximo 10 intentos de login por IP cada 15 minutos → HTTP 429 |
| Control de acceso | Guards `requireAuth` y `requireAdmin` en todos los endpoints |
| Validación de entrada | Joi en POST/PUT de auth/CRUD; Zod en rutas `/sync` — rechazan payloads inválidos con HTTP 400 |
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

El proyecto cuenta con **146 tests automatizados** en 14 archivos usando Vitest 3 + React Testing Library 16. Los tests de API routes corren en entorno `node`; los de UI/hooks en `jsdom`.

### Comandos

```bash
pnpm test        # Modo watch (desarrollo)
pnpm test:run    # Ejecución única (CI)
pnpm test:ui     # Interfaz visual de Vitest
```

### Cobertura

| Archivo | Entorno | Tests | Qué cubre |
|---|---|---|---|
| `tests/auth-login.test.ts` | jsdom | 12 | Login, bloqueo por intentos, guards de addUser/deleteUser |
| `tests/casoHandlers.test.ts` | jsdom | 15 | Flujo de aprobación, retesteo, notificaciones por rol |
| `tests/useHistoriasVisibles.test.ts` | jsdom | 14 | Scoping por rol: Owner, Admin, QA Lead, QA |
| `tests/api-auth-endpoints.test.ts` | node | 9 | GET /me · POST /logout · PUT /password |
| `tests/api-historias.test.ts` | node | 10 | CRUD + sync de historias de usuario |
| `tests/api-casos.test.ts` | node | 11 | CRUD + filtros + sync de casos de prueba |
| `tests/api-tareas.test.ts` | node | 12 | CRUD + filtros + sync de tareas |
| `tests/api-users.test.ts` | node | 10 | CRUD usuarios + reset-password + desbloquear |
| `tests/api-config.test.ts` | node | 6 | GET/PUT config con guards de rol |
| `tests/api-metricas.test.ts` | node | 5 | Agregaciones del dashboard QA |
| `tests/api-sprints.test.ts` | node | 13 | CRUD sprints + sprint activo + validaciones |
| `tests/api-notificaciones.test.ts` | node | 11 | GET/POST/PATCH notificaciones, scoping por rol |
| `tests/api-export.test.ts` | node | 10 | Export CSV historias/casos + filtros + cabecera |
| `tests/api-historial.test.ts` | node | 8 | GET historial paginado: 401, 404, orden desc, paginación, límites |

Los tests de API usan **Prisma y servicios mockeados** con `vi.mock` y generan JWTs reales con `signToken` — no requieren base de datos activa.

---

## Changelog

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

### v2.3 — Notificaciones conectadas al backend (notif-backend)
- **`lib/backend/services/notificacion.service.ts`** — nuevo service con `getNotificacionesByDestinatario`, `createNotificacion`, `marcarLeida`, `marcarTodasLeidas` y `rolToDestinatario` (mapea `owner/admin` → `"admin"`, resto → `"qa"`).
- **`GET /api/notificaciones`** — devuelve las notificaciones del usuario autenticado filtradas por su rol (destinatario). Protegido con `requireAuth`.
- **`POST /api/notificaciones`** — crea una nueva notificación en la BD. Llamado automáticamente por `addNotificacion` en el frontend.
- **`PATCH /api/notificaciones/[id]`** — marca una notificación como leída.
- **`PATCH /api/notificaciones/marcar-todas`** — marca todas las no leídas del usuario como leídas.
- **`lib/hooks/useNotificaciones.ts`** reescrito: carga desde localStorage al instante → reemplaza con datos de la API en mount → `addNotificacion` hace POST con actualización optimista (id temporal reemplazado por id real de BD) → `handleMarcarLeida`/`handleMarcarTodasLeidas` hacen PATCH en segundo plano. Fallback silencioso a localStorage si la API no responde.
- **`lib/services/api/client.ts`** — añadido método `patch` al helper `api`.
- Las notificaciones ya son persistentes entre usuarios y sesiones.
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.3 — Hardening de seguridad (security)
- **Rate limiting** (`lib/backend/middleware/rate-limit.ts`): módulo en memoria que limita a 10 intentos de login por IP cada 15 minutos. Responde HTTP 429 con header `Retry-After` si se supera el límite.
- **JWT_SECRET obligatorio en producción**: `auth.middleware.ts` lanza un error explícito al arrancar si `JWT_SECRET` no está definido en `NODE_ENV=production`. Elimina el riesgo de deployar con el secret hardcodeado del repositorio.
- **Whitelist de roles**: `createUserSchema` y `updateUserSchema` en `auth.validator.ts` limitan el campo `rol` a los valores válidos del sistema (`owner`, `admin`, `qa_lead`, `qa`, `viewer`) mediante `Joi.valid()`.
- **Prevención de enumeración de usuarios**: el login ya no distingue entre "email no existe" y "contraseña incorrecta"; ambos devuelven "Credenciales inválidas".
- **Headers de seguridad HTTP** (`next.config.mjs`): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` (HSTS 2 años), `Content-Security-Policy`, `Referrer-Policy` y `Permissions-Policy` aplicados a todas las rutas.
- **Contraseña mínima 8 caracteres**: `cambiarPasswordSchema` actualizado de `min(6)` a `min(8)`.
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.3 — Conexión completa a PostgreSQL (backend-connect)
- **Login/logout via API** (`auth-context.tsx`): `login()` ahora es `async` y llama a `POST /api/auth/login`. JWT en cookie `httpOnly`. La sesión persiste entre recargas y es válida 8h.
- **`useApiMirroredState`** (`lib/hooks/useApiMirroredState.ts`): hook que carga desde la API en mount y sincroniza a la DB en cada cambio de estado. Fallback a `localStorage` si la API no responde.
- **Datos sincronizados**: `useDomainData` usa `useApiMirroredState` para `historias`, `casos` y `tareas`. Cualquier cambio (crear, editar, eliminar HU/caso/tarea) se persiste en PostgreSQL automáticamente.
- **Config sincronizada**: `useConfig` carga la config desde `GET /api/config` en mount y la sincroniza con `PUT /api/config` en cada cambio (etapas, resultados, tipos, ambientes, etc.).
- **Endpoints bulk sync**: `POST /api/historias/sync`, `POST /api/casos/sync`, `POST /api/tareas/sync` — reciben el array completo, hacen upsert de los registros existentes y eliminan los que ya no están.
- **`prisma/seed.ts`** — script de seed con 7 usuarios iniciales, 5 roles base y config vacía. Ejecutar con `pnpm db:seed`.
- **`lib/services/api/client.ts`** — helper `apiFetch` con revisor de fechas ISO → `Date`, manejo de errores HTTP y helpers `api.get/post/put/delete`.
- **Tests actualizados**: `tests/auth-login.test.ts` reescrito con mock de `fetch` y `async/await` para adaptarse al nuevo login API.
- **`pnpm tsc --noEmit` → 0 errores.**

### v2.3 — Backend PostgreSQL + Prisma + MVC + Joi (backend-init)
- **Prisma v5** instalado (`@prisma/client`, `prisma`) — compatible con Node.js 20.11+.
- **`bcryptjs` + `jose` + `joi`** instalados para auth y validación.
- **`prisma/schema.prisma`** completo con 8 modelos: `User`, `Role`, `HistoriaUsuario`, `CasoPrueba`, `Tarea`, `Sprint`, `Notificacion`, `Config`. Campos complejos como `Json`.
- **`lib/backend/prisma.ts`** — singleton `PrismaClient` con guard para hot-reload en desarrollo.
- **`lib/backend/middleware/auth.middleware.ts`** — `signToken`, `verifyToken`, `requireAuth`, `requireAdmin` usando `jose` (JWT HS256, 8h de expiración). Token en cookie `httpOnly` o header `Authorization: Bearer`.
- **Validators Joi**: `auth.validator.ts`, `historia.validator.ts`, `caso.validator.ts`, `tarea.validator.ts`, `config.validator.ts`.
- **Services**: `auth.service.ts` (login con bcrypt, bloqueo por intentos, historial de sesiones, cambio de password), `historia.service.ts`, `caso.service.ts`, `tarea.service.ts`, `config.service.ts` (upsert singleton).
- **API Routes** (13 archivos): CRUD completo para `auth`, `users`, `historias`, `casos`, `tareas`, `config`. Params como `Promise<{id}>` — compatible con Next.js 16.
- **`.env`** actualizado con `DATABASE_URL` y `JWT_SECRET` de ejemplo.
- **README** actualizado: stack, sección de backend, instrucciones de setup.
- **El frontend no cambia** — sigue usando `localStorage` hasta que se ejecute `prisma migrate` y se haga el swap en `lib/services/index.ts`.
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
- **`tests/api-users.test.ts`** — 10 tests: listar (QA→403, admin→200), crear (sin email→400, email duplicado→409, exitoso→201), actualizar→200, reset-password→200, desbloquear→200, eliminar propia cuenta→400, eliminar otro→200.
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
│   │   │   ├── sprint-panel.tsx
│   │   │   ├── panel-riesgos.tsx
│   │   │   ├── nav-tab-group.tsx   # Navegación lateral reutilizable ← v2.2opt
│   │   │   └── index.ts
│   │   ├── historias/        # Módulo Historias de Usuario
│   │   │   ├── historias-table.tsx
│   │   │   ├── historias-kanban.tsx
│   │   │   ├── historia-usuario-detail.tsx
│   │   │   ├── hu-form.tsx
│   │   │   ├── hu-stats-cards.tsx
│   │   │   ├── hu-templates.tsx
│   │   │   ├── csv-import-modal.tsx
│   │   │   └── index.ts
│   │   ├── casos/            # Módulo Casos de Prueba
│   │   │   ├── casos-table.tsx
│   │   │   ├── caso-prueba-card.tsx
│   │   │   └── index.ts
│   │   ├── analytics/        # Módulo Analíticas
│   │   │   ├── home-dashboard.tsx
│   │   │   ├── mini-calendario.tsx     # Calendario de entregas ← v2.2opt10
│   │   │   ├── analytics-kpis.tsx
│   │   │   ├── carga-ocupacional.tsx
│   │   │   └── index.ts
│   │   ├── usuarios/         # Módulo Usuarios
│   │   │   ├── user-management.tsx
│   │   │   ├── user-form-modal.tsx     # Dialog crear/editar usuario ← v2.2opt10
│   │   │   ├── user-confirm-dialogs.tsx # AlertDialogs de confirmación ← v2.2opt10
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
│   │   ├── useDomainData.ts        # Facade de datos del dominio
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
├── tests/                        # Suite de tests (Vitest + RTL) — 99 tests
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

Actualmente el proyecto no requiere variables de entorno. Si en el futuro se conecta a una API externa, crear un archivo `.env.local` con las claves necesarias (no incluir en el repositorio).

---

## Changelog

### v2.2 — Migración Tailwind + Responsive + Dark Mode (opt5)

**Responsive (mobile / tablet)**
- `app/page.tsx`: badge de bloqueos y footer migrados a clases Tailwind; `min-h-[calc(100vh-124px)]` reemplaza inline style
- `globals.css`: media query `@media (max-width: 640px)` ajusta modales a ancho total con `border-radius: 14px`; dialogs shadcn limitados a `92vh` en móvil

**Dark mode más robusto**
- `globals.css`: `color-scheme: dark` aplicado a `input`, `select` y `textarea` en `.dark` para que los controles nativos (ej. `<input type="date">`) respeten el tema oscuro
- `globals.css`: transición suave `background-color / color 0.2s ease` al cambiar de tema
- `header.tsx`: badge de notificaciones y botón de búsqueda eliminan `color:"#fff"` y `background:"var(--...)"` hardcodeados; todo pasa por clases semánticas Tailwind (`bg-chart-4`, `text-white`, `border-background`, etc.)

**Limpieza de inline styles**
- `header.tsx`: panel de notificaciones completo (~60 líneas de `style={{...}}`) → Tailwind; diálogo de logout (~40 líneas) → Tailwind
- `hu-stats-cards.tsx`: archivo reescrito completamente en Tailwind (eliminados 3 objetos `React.CSSProperties`); colores de valores condicionales usando `text-chart-2 / text-chart-4 / text-muted-foreground`

### v2.2 — Optimizaciones de código (opt4)
- `historia-usuario-detail.tsx`: `HUBloqueos` + `HUHistorialPanel` extraídos como sub-componentes (~80 líneas, 4 variables de estado movidas)
- `historias-table.tsx`: `HUFiltersPanel` extraído (~130 líneas, 21 props con contrato tipado)
- `caso-prueba-card.tsx`: `TareaItem` extraído (~80 líneas, 2 variables de estado movidas)

### v2.2 — Optimizaciones de código (opt3)
- `nav-tab-group.tsx`: prop `badge?: number` añadida para mostrar contador visual en tabs
- `casos-table.tsx`: `COMPLEJIDAD_CFG` eliminado del archivo, importado desde `@/lib/types`
