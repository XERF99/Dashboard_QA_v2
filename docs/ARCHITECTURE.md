# Arquitectura — TCS Dashboard v2.80

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Lenguaje:** TypeScript 5.7 (strict)
- **DB / ORM:** PostgreSQL + Prisma 5
- **UI:** Tailwind v4 + Radix UI + shadcn
- **Estado servidor:** TanStack Query v5
- **Validación:** Zod (APIs + forms, unificado en v2.74)
- **Auth:** JWT (jose) + bcryptjs + middleware
- **Testing:** Vitest + Testing Library + Playwright (E2E)

## Diagrama de estructura

```
dashboard_v22/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout + providers
│   ├── page.tsx                # Server wrapper (v2.80) — auth check + LoginScreen o DashboardClient
│   ├── _dashboard-client.tsx   # Body cliente interactivo (v2.80) — useDashboardState + tabs + modales
│   ├── globals.css             # Tailwind v4 tokens
│   ├── status/
│   │   └── page.tsx            # RSC (v2.76) — status público
│   ├── overview/
│   │   └── page.tsx            # RSC (v2.77) — KPIs del workspace (authed)
│   ├── kpi/
│   │   └── page.tsx            # RSC (v2.77) — KPIs globales (owner-only)
│   ├── home/
│   │   └── page.tsx            # RSC (v2.79) — landing post-login con shell
│   ├── actions/
│   │   └── auth-actions.ts     # Server Actions (v2.79) — logoutAction
│   └── api/                    # 33 endpoints REST
│       ├── auth/               # login, logout, refresh, me
│       ├── casos/              # CRUD casos de prueba
│       ├── historias/          # CRUD historias + historial
│       ├── tareas/             # CRUD tareas
│       ├── sprints/            # CRUD sprints
│       ├── users/              # usuarios + asignaciones
│       ├── grupos/             # grupos de trabajo
│       ├── metricas/           # KPIs agregados
│       ├── notificaciones/     # inbox por usuario
│       ├── audit/              # logs de auditoría
│       ├── config/             # configuración workspace
│       ├── export/             # CSV + PDF
│       └── health/             # healthcheck
│
├── components/                 # 121 componentes React
│   ├── rsc/                    # Server Components compartidos (v2.79)
│   │   └── rsc-shell.tsx            # Header + nav + logout form
│   ├── ui/                     # Primitivos shadcn (Radix)
│   │   ├── sidebar.tsx              # Sidebar + Trigger/Rail/Inset + Layout (353 LOC)
│   │   ├── sidebar-provider.tsx     # Context + useSidebar + shortcut (v2.75)
│   │   └── sidebar-menu.tsx         # Menu + 8 piezas Menu* (v2.75)
│   ├── auth/                   # Login, signup, guards
│   ├── layout/                 # Sidebar, header, wrappers
│   └── dashboard/              # Features del dashboard
│       ├── analytics/          # Charts, KPIs, cargas
│       ├── casos/              # Orquestador + sub-piezas (v2.75)
│       │   ├── casos-table.tsx              # orquestador (329 LOC)
│       │   ├── casos-row.tsx                # fila desktop memo
│       │   ├── casos-card-mobile.tsx        # card mobile memo
│       │   ├── casos-filters-panel.tsx      # panel de filtros
│       │   ├── caso-aprobacion-cfg.ts       # config visual compartida
│       │   ├── caso-prueba-card.tsx         # card detalle (431 LOC)
│       │   ├── tarea-item.tsx               # item de tarea
│       │   ├── tarea-form-fields.tsx        # form reusable
│       │   └── caso-intentos-historial.tsx  # historial de retests
│       ├── historias/          # Orquestador + sub-piezas (v2.69)
│       │   ├── historias-table.tsx          # orquestador (429 LOC)
│       │   ├── historias-row.tsx            # fila memo
│       │   ├── historias-filters-panel.tsx  # panel de filtros
│       │   ├── historias-bulk-action-select.tsx
│       │   └── historia-urgencia-badge.tsx
│       ├── tabs/               # Tabs principales
│       ├── usuarios/           # User management (v2.75)
│       │   ├── user-management.tsx          # orquestador (368 LOC)
│       │   ├── user-row.tsx                 # fila memo
│       │   └── user-workspace-dialogs.tsx   # diálogos asignar/quitar
│       ├── owner/              # Panel de owner
│       ├── shared/             # Sprint panel, bloqueos (v2.75)
│       │   ├── bloqueos-panel.tsx           # orquestador (247 LOC)
│       │   ├── bloqueos-row.tsx             # fila con resolver
│       │   └── bloqueos-export.ts           # exportar CSV + PDF
│       └── config/             # Pantallas de config
│
├── lib/                        # Lógica compartida
│   ├── backend/                # Server-only
│   │   ├── prisma.ts           # Cliente Prisma singleton
│   │   ├── logger.ts           # Logger estructurado
│   │   ├── errors.ts           # HttpError + 7 subclases (v2.71)
│   │   ├── rsc-auth.ts         # getRscAuth() — auth en Server Components (v2.77)
│   │   ├── metricas-cache.ts   # Cache in-memory de KPIs
│   │   ├── middleware/         # Auth, rate-limit, guards (v2.71)
│   │   │   ├── with-auth.ts    # withAuth/withAuthAdmin/withErrorHandler
│   │   │   ├── guards.ts       # requireRateLimit/Body/HU/Caso/Tarea
│   │   │   ├── auth.middleware.ts
│   │   │   └── rate-limit.ts
│   │   ├── services/           # Domain services (handlers)
│   │   └── validators/         # Schemas Joi por entidad
│   ├── hooks/                  # Custom hooks (client)
│   │   ├── domain/             # Handlers de dominio (patrón Command)
│   │   │   ├── pipeline.ts     # CommandResult + runCommand + defineCommand
│   │   │   ├── types.ts        # DomainCtx compartido
│   │   │   ├── casoHandlers.ts       # 13 handlers via defineCommand
│   │   │   ├── huHandlers.ts         # 11 handlers
│   │   │   ├── tareaHandlers.ts      # 6 handlers
│   │   │   ├── bloqueoHandlers.ts    # 4 handlers
│   │   │   └── comentarioHandlers.ts # 2 handlers
│   │   ├── useDashboardState   # Estado global dashboard
│   │   ├── useApiQuery         # Wrapper TanStack
│   │   └── useHistorias/Casos/Tareas…
│   ├── contexts/               # React Contexts (auth, etc.)
│   ├── providers/              # QueryClientProvider, Theme
│   ├── services/               # Clientes HTTP + parsers
│   ├── types/                  # Tipos compartidos (DTOs) — split por dominio (v2.72)
│   │   ├── index.ts            #   barrel (sólo re-exports)
│   │   ├── brand.ts            #   EntityId, HUId, CasoId, TareaId
│   │   ├── common.ts           #   Comentario, Bloqueo (discriminated)
│   │   ├── config.ts           #   Etapas, ambientes, resultados
│   │   ├── historia.ts         #   HistoriaUsuario + EventoHistorial
│   │   ├── caso.ts             #   CasoPrueba + ejecución por etapa
│   │   ├── tarea.ts            #   Tarea + estados
│   │   ├── sprint.ts / user.ts / notificacion.ts
│   │   └── api.ts              #   API_ROUTES, ApiRoute
│   ├── constants/              # Rutas, roles, estados
│   ├── data/                   # Datos semilla estáticos
│   ├── export/                 # Helpers CSV/PDF
│   ├── utils/                  # Helpers puros
│   ├── storage.ts              # LocalStorage abstraction
│   └── utils.ts                # cn() + comunes
│
├── prisma/
│   ├── schema.prisma           # Modelos: User, Historia, Caso, Tarea, Sprint, Grupo, Notificacion, Audit
│   ├── migrations/             # 8 migraciones aplicadas
│   └── seed.ts                 # Datos iniciales
│
├── tests/                      # 58 tests (Vitest)
├── scripts/
│   └── demo-data.ts            # Seed demo (pnpm demo:seed)
├── public/                     # Iconos, placeholders
├── proxy.ts                    # Auth JWT global
├── next.config.mjs             # Image opt, CSP, bundle analyzer
├── eslint.config.mjs           # Flat config + react-hooks
├── playwright.config.ts        # E2E
├── vitest.config.ts            # Unit/integration
└── docker-compose.{dev,yml}    # Postgres + app
```

## Flujo de request (petición de usuario)

```
┌─────────────┐   HTTP   ┌────────────┐   JWT    ┌──────────────┐
│   Browser   │ ───────> │  proxy.ts  │ ───────> │   withAuth   │
│  (React 19) │          │  (Edge)    │          │   wrapper    │
└─────────────┘          └─────┬──────┘          └──────┬───────┘
      ▲                        │                         │  payload
      │                        │  ensureRequestId()      │
      │                        │  → x-request-id header  │
      │                        │  + forwardedHeaders     │
      │ JSON + x-request-id    ▼                         ▼
      │                  ALS store bound:        ┌────────────────┐
      │                  runWithRequestId(id)    │   Guards       │
      │                                          │   require*()   │ ──┐
      │                                          └────────┬───────┘   │ throws
      │                                                   ▼           │ HttpError
      │                                         ┌────────────────┐   │
      │                                         │  Handler body  │   │
      │                                         │  (dominio)     │   │
      │                                         └────────┬───────┘   │
      │                                                  ▼           │
      │                                         ┌────────────────┐   │
      │                                         │  Service /     │   │
      │                                         │  handler       │   │
      │                                         └────────┬───────┘   │
      │                                                  ▼           │
      │                                         ┌────────────────┐   │
      │                                         │  Prisma ORM    │   │
      │                                         └────────┬───────┘   │
      │                                                  ▼           │
      │                                         ┌────────────────┐   │
      └─────────────────────────────────────────│   PostgreSQL   │   │
                                                └────────────────┘   │
                                                                     │
      ┌──────────────────── error path ───────────────────────────────┘
      ▼
┌─────────────────────────────┐
│  withAuth catch block       │  instance of HttpError? → toResponse()
│                             │  • body: { error, [details], requestId }
│                             │  • header: x-request-id
│                             │  otherwise → 500 + logger.error
└─────────────────────────────┘
```

## Observabilidad — request-id tracing (v2.72)

Cada petición obtiene un `x-request-id` que fluye de extremo a extremo:

1. **Edge middleware** (`proxy.ts`) — si la petición no trae el header (o es inválido, >128 chars), genera un `crypto.randomUUID()`. Lo añade a `forwardedHeaders` (que el handler recibe como su `request.headers`) y al header de respuesta.
2. **Wrappers** (`withAuth / withAuthAdmin / withErrorHandler`) — leen `x-request-id` del request y envuelven la ejecución del handler en `runWithRequestId(id, () => …)`. Esto deposita el id en el `AsyncLocalStorage` del logger.
3. **Logger** (`lib/backend/logger.ts`) — cada `logger.info/warn/error` consulta `getRequestId()` e incluye `requestId` en el JSON estructurado.
4. **Errores tipados** (`HttpError.toResponse()`) — lee `getRequestId()` y lo propaga al body (`{ error, requestId }`) y al header `x-request-id` de la respuesta.

Beneficio concreto: cuando el cliente reporta un 500, el `requestId` del body/header identifica la traza exacta en los logs del servidor.

## Bundle splitting y RSC (v2.76)

### Dynamic imports en el cliente

Los paneles pesados que se renderizan **condicionalmente** (tras un click o un cambio de vista) ya no entran al bundle inicial:

```tsx
// components/dashboard/historias/historias-table.tsx
const HistoriasKanban = dynamic(
  () => import("./historias-kanban").then(m => ({ default: m.HistoriasKanban })),
  { ssr: false, loading: () => <span>Cargando vista Kanban…</span> },
)

// app/page.tsx — modales (CSV, HUForm, HistoriaUsuarioDetail)
const CSVImportModal         = dynamic(() => import(/* ... */), { ssr: false })
const HUForm                 = dynamic(() => import(/* ... */), { ssr: false })
const HistoriaUsuarioDetail  = dynamic(() => import(/* ... */), { ssr: false })
```

Regla: `ssr: false` cuando el componente usa APIs de navegador (`window`, `File API`, `@dnd-kit`, parsers de CSV). Los tabs de analytics ya usaban este patrón desde v2.x.

### `/` como wrapper RSC (v2.80)

Desde v2.80 la ruta raíz `/` es un Server Component que decide qué renderizar según la sesión:

```tsx
// app/page.tsx — Server Component (30 LOC)
import { getRscAuth } from "@/lib/backend/rsc-auth"
import { LoginScreen } from "@/components/auth/login-screen"
import { DashboardClient } from "./_dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const payload = await getRscAuth()
  if (!payload) return <LoginScreen />         // 0 KB de bundle dashboard
  return <DashboardClient />                    // Body cliente interactivo
}
```

**Ganancia concreta**: usuarios sin sesión reciben sólo el JS de `<LoginScreen />`. El bundle pesado del dashboard (`@dnd-kit`, `recharts`, modales CSV, árbol de `CasoPruebaCard`) **no se descarga en esa rama**. El server decide antes de hidratar.

El body interactivo vive en `app/_dashboard-client.tsx` (prefijo `_` impide que Next lo sirva como ruta). Conserva toda la lógica anterior: `useDashboardState()`, TanStack Query, dynamic imports de v2.76, contextos (`HUDetailProvider`, etc.).

### Dashboard shell RSC + Server Actions (v2.79)

Primera incursión en Server Actions. Ventajas sobre endpoints `/api/*`:

- Funcionan sin JS cliente (`<form action={action}>` hace POST nativo).
- Tipos end-to-end sin DTOs manuales.
- `cookies()` + `redirect()` directo desde el servidor.

Ejemplo: [app/actions/auth-actions.ts](../app/actions/auth-actions.ts):

```ts
"use server"
export async function logoutAction() {
  const payload = await getRscAuth()
  if (payload) {
    await logoutService(payload.sub).catch(() => {})
    void audit({ actor: payload, action: "LOGOUT", resource: "auth" })
  }
  const store = await cookies()
  store.delete("tcs_token")
  store.delete({ name: "tcs_refresh", path: "/api/auth/refresh" })
  redirect("/")
}
```

Uso desde cualquier RSC:

```tsx
<form action={logoutAction}>
  <button>Cerrar sesión</button>
</form>
```

[components/rsc/rsc-shell.tsx](../components/rsc/rsc-shell.tsx) es el shell común de las 4 páginas RSC (`/home`, `/overview`, `/kpi`, `/status`): header con nav, user info, y el form de logout. Cambio del nav de todas las rutas RSC en un solo archivo.

### RSC + autenticación (v2.77)

Los Server Components no reciben `NextRequest`, usan `cookies()` de `next/headers`. El helper [lib/backend/rsc-auth.ts](../lib/backend/rsc-auth.ts) abstrae el acceso:

```ts
// app/overview/page.tsx
import { getRscAuth } from "@/lib/backend/rsc-auth"
import { redirect } from "next/navigation"

export default async function OverviewPage() {
  const payload = await getRscAuth()
  if (!payload) redirect("/")
  const data = await loadOverview(payload.grupoId)  // scope por workspace
  return <main>{/* HTML */}</main>
}
```

- **Scope por workspace**: las queries se filtran por `payload.grupoId`; el owner (`grupoId` undefined) ve agregados globales.
- **Owner-only**: páginas como `/kpi` renderizan un 403 visual si `payload.grupoId` está presente (no es owner).
- **Redirect**: si `getRscAuth()` devuelve null (cookie vacía o token inválido), `redirect("/")` lleva al login.

Rutas RSC actuales:

| Ruta | Acceso | Datos |
|---|---|---|
| `/status` | público | Health + counts totales |
| `/overview` | authed (workspace) | KPIs del workspace del usuario |
| `/kpi` | owner-only | Agregados cross-workspace |

### React Server Components — patrón base

`app/status/page.tsx` es el primer RSC del proyecto. Demuestra:

```tsx
// NO "use client" — función async server-side
export const dynamic = "force-dynamic"    // cada request consulta DB fresca

export default async function StatusPage() {
  const [historias, casos, tareas, users] = await Promise.all([
    prisma.historiaUsuario.count({ where: { deletedAt: null } }),
    // ...
  ])
  return <main>{/* HTML estático: 0 KB de JS al cliente */}</main>
}
```

Los siguientes candidatos naturales (v2.77+):

1. `components/dashboard/analytics/charts-panel` — datos precomputados en server; la vista interactiva se aísla en una hoja `"use client"`.
2. `components/dashboard/owner/global-kpi` — KPIs read-only.
3. Shell estático del dashboard: `Sidebar` sin estado, con las páginas-hojas interactivas marcadas individualmente.

El middleware ignora `/api/*` para autenticación — las rutas RSC no pasan por el matcher, así que quedan públicas por defecto. Cuando se expongan paneles con datos sensibles bajo RSC, el auth se resuelve leyendo la cookie desde el Server Component directamente.

## Validación unificada con Zod (v2.74)

Desde v2.74 toda la validación (APIs + forms + guards) usa Zod. Los DTOs se infieren del schema:

```ts
// lib/backend/validators/historia.validator.ts
export const createHistoriaSchema = z.object({
  codigo:     z.string().trim().max(50),
  titulo:     z.string().trim().max(500),
  prioridad:  z.enum(["critica", "alta", "media", "baja"]).default("media"),
  // ...
})
export type CreateHistoriaDTO = z.infer<typeof createHistoriaSchema>

// app/api/historias/route.ts
const value = await requireBody(request, createHistoriaSchema)
// value ya está tipado como CreateHistoriaDTO; no hay cast manual
```

`requireBody(request, schema, { allowUnknown? })` aplica:
- **default** — `.strict()` (rechaza claves desconocidas, matching Joi anterior)
- **allowUnknown: true** — `.passthrough()` (preserva extras, para endpoints PUT que reciben el DTO completo del cliente)

Errores Zod se mapean a `ValidationError.details[]` con formato `"path: mensaje"` (ej. `"titulo: String must contain at least 1 character(s)"`).

## Rate-limit pluggable (v2.73)

El rate-limit usa un backend abstracto vía interface `RateLimitStore`:

```
┌────────────────────┐
│  requireRateLimit  │  async guard — 30 call-sites en app/api/**
│  (guards.ts)       │
└─────────┬──────────┘
          │  await store.check(key, limit, windowMs)
          ▼
┌────────────────────┐
│ getRateLimitStore()│  factory lazy — cacheada, selecciona por env
│ (rate-limit-store) │
└─────┬──────────┬───┘
      │          │
      ▼          ▼
┌──────────┐ ┌──────────────┐
│ Memory   │ │ Redis        │
│ (default)│ │ (opcional)   │
│          │ │ INCR+PEXPIRE │
│ delega a │ │ atómico;     │
│ rate-    │ │ requiere     │
│ limit.ts │ │ @upstash/    │
│ (Map)    │ │ redis + env  │
└──────────┘ └──────────────┘
```

Activación del backend Redis:

```env
RATE_LIMIT_BACKEND=redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

Si la dep `@upstash/redis` no está instalada, o las credenciales faltan, `logger.warn` y fallback a memoria — nunca rompe el boot.

## Servicios de dominio con interfaces (v2.73)

Cada servicio expone, además de sus funciones sueltas, una interface + objeto default:

```ts
// historia.service.ts
export interface HistoriaService {
  getAll:  typeof getAllHistorias
  getById: typeof getHistoriaById
  create:  typeof createHistoria
  // ...
}
export const historiaService: HistoriaService = {
  getAll:  getAllHistorias,
  getById: getHistoriaById,
  create:  createHistoria,
  // ...
}
```

Beneficio: los handlers pueden recibir `HistoriaService` por inyección (vía `ctx`, como ya hacen los handlers de dominio de cliente con `DomainCtx`) y los tests mockean pasando un stub, sin `vi.mock` de módulo.

## Capa de errores y guards (v2.71)

La capa de API usa un *Chain of Responsibility* simplificado vía decoradores:

1. **`withAuth(handler)`** verifica el JWT y captura `HttpError` lanzados por el handler o sus guards. Convierte cada error tipado en `NextResponse` usando su método `toResponse()`.
2. **`requireRateLimit(req, route, limit, windowMs, keyExtra?)`** — lanza `RateLimitError` con headers `Retry-After` + `X-RateLimit-*`. Opcionalmente escopea el bucket por usuario (`keyExtra = payload.sub`).
3. **`requireBody(req, schema, opts?)`** — parsea JSON y valida con Joi. Lanza `ValidationError` con `details[]` detallados.
4. **`requireHU / requireCaso / requireTarea(id, grupoId, opts?)`** — carga la entidad + valida workspace. Lanza `NotFoundError` o `UnprocessableEntityError` (con `asUnprocessable: true` para POSTs que referencian recursos padre).

La jerarquía `HttpError` (`lib/backend/errors.ts`) tiene 7 subclases: `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `ConflictError`, `UnprocessableEntityError`, `RateLimitError`. Cada una define su `status` y un `toResponse()` que serializa el body + headers específicos (ej. `RateLimitError` añade `Retry-After` computado desde `resetAt`).

## Patrón Command en handlers de dominio (v2.70)

Las acciones de dominio (crear HU, aprobar casos, bloquear tarea, etc.) se expresan como un `CommandResult` declarativo ejecutado por un único dispatcher (`runCommand`). Esto desacopla *qué* sucede de *cómo* se orquesta.

```
┌────────────────────┐
│  Componente React  │  handler = createCasoHandlers(ctx).handleAprobarCasos
└──────────┬─────────┘
           │  handler("hu-42")
           ▼
┌────────────────────────────────────────────────────┐
│  defineCommand(ctx, build)                         │
│                                                    │
│  const result: CommandResult = build("hu-42") ──┐  │
│                                                  │  │
│  runCommand(ctx, result)                         │  │
└──────────┬────────────────────────────────┬──────┘  │
           │                                │         │
           ▼                                ▼         ▼
      ┌────────┐    ┌──────────┐    ┌────────┐   ┌─────────┐
      │  set   │    │  set     │    │ append │   │ toast + │
      │ Casos  │    │ Historias│    │ events │   │ notify  │
      └────┬───┘    │ (mutate +│    └────────┘   └────┬────┘
           │        │  events) │                       │
           ▼        └──────────┘                       ▼
      ┌─────────────────────────┐                ┌──────────┐
      │  fire-and-forget API    │                │ addToast │
      │  (clientWarn on error)  │                │ add…     │
      └─────────────────────────┘                └──────────┘
```

`CommandResult` declara hasta 7 slots opcionales:
- `historias`, `casos`, `tareas` — updaters inmutables sobre cada slice
- `events` — `[{ huId, tipo, texto }]` apendeado al historial de la HU correspondiente (se combina con `historias` dentro de un solo `setHistorias`)
- `toast` — notificación in-app
- `notify` — notificación persistida por rol (`admin` / `qa`)
- `api` — side-effect fire-and-forget con `clientWarn` en caso de error

Un builder que devuelve `null` aborta sin llamar a ningún setter (guardas uniformes).

## Flujo de estado en cliente

```
┌──────────────────────────────────────────────────────────────┐
│                    app/layout.tsx                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │   <QueryClientProvider>                                │  │
│  │    <ThemeProvider>                                     │  │
│  │     <AuthProvider>  ← lib/contexts/auth-context        │  │
│  │      <ToastProvider>                                   │  │
│  │       ─── children (páginas) ───                       │  │
│  │      </ToastProvider>                                  │  │
│  │     </AuthProvider>                                    │  │
│  │    </ThemeProvider>                                    │  │
│  │   </QueryClientProvider>                               │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘

Página (dashboard)
  └─ useDashboardState()          ← estado UI compartido
      ├─ useHistoriasData()       ← TanStack Query
      ├─ useCasosData()           ← TanStack Query
      ├─ useTareasData()          ← TanStack Query
      └─ useNotificaciones()      ← polling
```

## Modelo de datos (resumen)

- **User** ← pertenece a → **Grupo**
- **Historia (HU)** ← 1:N → **Caso de Prueba** ← 1:N → **Tarea**
- **Sprint** ← N:M → **Historia**
- **Notificacion** por User
- **AuditLog** global

Ver schema completo en [prisma/schema.prisma](../prisma/schema.prisma).

## Seguridad

- **JWT** rotativo (access + refresh) firmado con `jose`.
- **bcrypt** (rounds=12) para passwords.
- **Middleware** valida token en cada request fuera de rutas públicas.
- **CSP / HSTS / X-Frame-Options** definidos en `next.config.mjs`.
- **Rate-limit** en rutas sensibles (`lib/backend/middleware/`).
- **Auditoría** de mutaciones en tabla `AuditLog`.
