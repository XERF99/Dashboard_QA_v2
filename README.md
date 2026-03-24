# QAControl — Dashboard de Gestión de Pruebas · v2.27

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
- **Etapas**: configuración de las etapas de ejecución por tipo de aplicación; al agregar nuevas etapas se muestran sugerencias de etapas ya existentes en otros tipos para poder reutilizarlas con un clic
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
│   │   ├── owner/                    ← Panel de grupos del Owner
│   │   ├── shared/                   ← Header, nav tabs, panels, toast container
│   │   └── usuarios/                 ← Gestión de usuarios y perfil
│   └── ui/                           ← shadcn/ui primitives (Button, Dialog, etc.)
│
├── lib/
│   ├── backend/                      ← Código server-side exclusivo
│   │   ├── middleware/               ← auth.middleware.ts, rate-limit.ts
│   │   ├── services/                 ← auth, historia, caso, tarea, config, notificacion, sprint, metricas, grupo
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
│   │   └── api/                      ← client.ts (apiFetch helper)
│   ├── types/                        ← Tipos TypeScript del dominio
│   ├── utils/                        ← date-utils, domain, user-utils
│   ├── constants/                    ← badge-paleta, index
│   ├── export/                       ← Exportación a CSV/Excel
│   └── storage.ts                    ← localStorage helpers + STORAGE_KEYS
│
├── prisma/                           ← Schema Prisma + seed
├── public/
└── tests/                            ← 333 tests Vitest
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
  grupos/route.ts                  ← GET   /api/grupos  · POST  /api/grupos          (owner)
  grupos/[id]/route.ts             ← GET · PUT · DELETE  /api/grupos/[id]             (owner)
  grupos/[id]/metricas/route.ts    ← GET   /api/grupos/[id]/metricas                 (owner)
```

### Schema Prisma

Tablas: `grupos`, `users`, `roles`, `historias_usuario`, `casos_prueba`, `tareas`, `sprints`, `notificaciones`, `config`.

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

El proyecto cuenta con **379 tests automatizados** en 33 archivos usando Vitest 3 + React Testing Library 16. Los tests de API routes corren en entorno `node`; los de UI/hooks en `jsdom`.

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
| `tests/casoHandlers.test.ts` | jsdom | 20 | Flujo de aprobación, retesteo, notificaciones por rol; `handleCompletarCasoEtapa` (guard bloqueos, historial síncrono) |
| `tests/useHistoriasVisibles.test.ts` | jsdom | 14 | Scoping por rol: Owner, Admin, QA Lead, QA |
| `tests/api-auth-endpoints.test.ts` | node | 9 | GET /me · POST /logout · PUT /password |
| `tests/api-historias.test.ts` | node | 10 | CRUD + sync de historias de usuario |
| `tests/api-casos.test.ts` | node | 11 | CRUD + filtros + sync de casos de prueba |
| `tests/api-tareas.test.ts` | node | 12 | CRUD + filtros + sync de tareas |
| `tests/api-users.test.ts` | node | 16 | CRUD usuarios + reset-password + desbloquear + owner invisibility |
| `tests/api-config.test.ts` | node | 6 | GET/PUT config con guards de rol |
| `tests/api-metricas.test.ts` | node | 5 | Agregaciones del dashboard QA |
| `tests/api-sprints.test.ts` | node | 15 | CRUD sprints + sprint activo + validaciones |
| `tests/api-notificaciones.test.ts` | node | 11 | GET/POST/PATCH notificaciones, scoping por rol |
| `tests/api-export.test.ts` | node | 10 | Export CSV historias/casos + filtros + cabecera |
| `tests/api-historial.test.ts` | node | 8 | GET historial paginado: 401, 404, orden desc, paginación, límites |
| `tests/bloqueo-guards.test.ts` | jsdom | 12 | Guardias: tarea bloqueada impide completar caso; caso bloqueado impide avanzar HU |
| `tests/useConfig-sprints.test.ts` | jsdom | 10 | Carga inicial desde API, addSprint (duplicado, optimista, reemplazo ID), updateSprint, deleteSprint |
| `tests/tareaHandlers.test.ts` | jsdom | 11 | `handleBloquearTarea` y `handleDesbloquearTarea`: historial síncrono, guard de tarea inexistente, estado tras desbloqueo parcial |
| `tests/bloqueoHandlers.test.ts` | jsdom | 7 | `handleResolverBloqueoTarea`: historial síncrono, guard, estado residual con múltiples bloqueos activos |
| `tests/metricas-cache.test.ts` | node | 7 | Módulo de caché (get/set/invalidate) y cache hit/miss en `GET /api/metricas` |
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

Los tests de API usan **Prisma y servicios mockeados** con `vi.mock` y generan JWTs reales con `signToken` — no requieren base de datos activa.

---

## Changelog

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
│   │   │   ├── csv-import-casos-modal.tsx
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

