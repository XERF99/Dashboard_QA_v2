# Optimizaciones — TCS Dashboard v2.80

> Estado tras v2.80: el dashboard interactivo en `/` tiene ahora un wrapper Server Component que hace auth check server-side. La forma ambiciosa del item "RSC del shell del dashboard" queda cerrada.

## Plan por fases — estado

| Fase | Versión | Estado | Contenido |
|---|---|---|---|
| 1 | v2.72 | ✅ Completado | Request-id tracing + coverage gate + split de `lib/types` |
| 2 | v2.73 | ✅ Completado | Rate-limit pluggable (Redis opcional) + service interfaces + índices Prisma |
| 3 | v2.74 | ✅ Completado | Unificación Joi → Zod + tipos inferidos + remover dep Joi |
| 4 | v2.75 | ✅ Completado | Split de componentes > 500 LOC (5 archivos → 0) + memoización |
| 5 | v2.76 | ✅ Completado | Dynamic imports + RSC `/status` (proof-of-concept) |
| 6 | v2.77 | ✅ Completado | `proxy.ts` (Next 16) + Redis dep oficial + RSC expandido (`/overview`, `/kpi`) |
| 7 | v2.78 | ✅ Completado | Service interfaces 10/10 + guía de provisioning Redis |
| 8 | v2.79 | ✅ Completado | Dashboard shell RSC + Server Actions (logout) + `/home` landing |
| **9** | **v2.80** | ✅ **Completado** | `/` migrado a Server Component wrapper (auth check server-side) |

## Completado en v2.80

### ✅ `/` es ahora un Server Component wrapper

**Antes (v2.79)**: `app/page.tsx` era 343 LOC con `"use client"`. Todo el bundle cargaba sin importar si el usuario estaba autenticado.

**Ahora (v2.80)**: `app/page.tsx` es 30 LOC sin `"use client"`. Hace `await getRscAuth()`, y:
- Si no hay sesión → renderiza `<LoginScreen />` directamente. **El bundle del dashboard no se descarga.**
- Si hay sesión → renderiza `<DashboardClient />` (el body interactivo intacto).

### ✅ Body interactivo preservado en `_dashboard-client.tsx`

Todo el contenido anterior — `useDashboardState`, Header, Tabs, dynamic imports de modales, `HUDetailProvider`, CommandPalette — vive tal cual en [app/_dashboard-client.tsx](../app/_dashboard-client.tsx). El prefijo `_` impide que Next lo sirva como ruta.

Cambios vs original:
- `"use client"` se mantiene
- `export default function DashboardPage` → `export function DashboardClient` (named, no default)
- Sin cambios de comportamiento, sin regresiones

### ✅ Tests

- [tests/v280-dashboard-rsc-split.test.ts](../tests/v280-dashboard-rsc-split.test.ts) — 22 tests: `/` es RSC (sin use client), usa `getRscAuth`, renderiza `<LoginScreen />` sin sesión, delega a `<DashboardClient />` con sesión. Boundary validada: `page.tsx` no importa hooks cliente; `_dashboard-client.tsx` sí. Inventario final: **5 rutas RSC** (`/`, `/home`, `/overview`, `/kpi`, `/status`).
- Tests antiguos (`v266-features.test.ts`, `v276-dynamic-rsc.test.ts`) adaptados: los 6 asserts que buscaban imports en `app/page.tsx` ahora apuntan a `app/_dashboard-client.tsx`.

### Totales v2.80

- **22 tests nuevos**, **1244 tests pasando** (1222 → +22, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- `pnpm build`: `/` ahora es `ƒ` (dynamic server-rendered) en vez de `○` (static).
- Coverage gate verde.
- **Inventario RSC: 5 rutas** (`/`, `/home`, `/overview`, `/kpi`, `/status`).

## Completado en v2.79

### ✅ Shell RSC compartido

[components/rsc/rsc-shell.tsx](../components/rsc/rsc-shell.tsx) — Server Component con header + nav + logout form. Usado por las 4 páginas RSC (`/home`, `/overview`, `/kpi`, `/status`).

- **0 KB de JavaScript al cliente** — puro HTML generado en server
- Nav condicional: `/kpi` sólo aparece para owners (sin `grupoId`)
- User info (nombre + workspace) en el header de cada RSC

### ✅ Primera Server Action

[app/actions/auth-actions.ts](../app/actions/auth-actions.ts) — `logoutAction()` con directive `"use server"`. Invocable desde `<form action={logoutAction}>` — el navegador hace POST nativo al endpoint auto-generado por Next. **Funciona sin JS.**

Hace:
- Invalida refresh token en DB via `logoutService`
- Registra `action: "LOGOUT"` en audit
- Limpia cookies `tcs_token` + `tcs_refresh` (matchando el path original)
- Redirige a `/`

### ✅ Nueva `/home` — landing post-login

[app/home/page.tsx](../app/home/page.tsx) — RSC con:
- Saludo dinámico según hora del día
- 4 tarjetas top-line (historias, casos, tareas, bloqueos)
- Accesos rápidos al resto de vistas RSC + al dashboard interactivo
- Scope por `payload.grupoId` (owner ve global)

### ✅ Refactor `/status`, `/overview`, `/kpi` al shell

Los 3 RSC existentes adoptan `<RscShell user={auth} workspaceName={...}>` en vez de su header ad-hoc. Una sola fuente de verdad para el nav — cambiar un link lo propaga a las 4 rutas.

### ✅ Tests

[tests/v279-rsc-shell.test.ts](../tests/v279-rsc-shell.test.ts) — 28 tests que validan:
- Shell sin `"use client"` (la directiva como primera sentencia no-comentario)
- Shell expone nav + logout form + user info
- Server action con `"use server"`, limpia cookies, redirige, audit
- `/home` es RSC + usa Prisma + tiene scope por workspace
- Los 3 RSC existentes importan y usan el shell
- Invariante global: 4 páginas RSC, todas con shape válido

### Totales v2.79

- **28 tests nuevos**, **1222 tests pasando** (1194 → +28, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- `pnpm build` verde con 4 rutas dinámicas RSC listadas.
- Coverage gate verde.
- Riesgo sobre el dashboard interactivo en `/`: **0** (no tocado).

## Completado en v2.78

### ✅ Service interfaces — 10/10 servicios

Cada servicio en `lib/backend/services/` (excluyendo `base-crud.service.ts` que es utilitario) expone:
- `export interface XService { ... }` tipada
- `export const xService: XService = {...}` con métodos cableados
- Los exports individuales previos (compat) siguen existiendo

| Servicio | Versión | Métodos |
|---|---|---|
| `HistoriaService` | v2.73 | 7 |
| `CasoService` | v2.73 | 6 |
| `TareaService` | v2.73 | 7 |
| `SprintService` | v2.78 | 6 |
| `GrupoService` | v2.78 | 7 |
| `NotificacionService` | v2.78 | 5 |
| `AuthService` | v2.78 | 6 |
| `ConfigService` | v2.78 | 2 |
| `MetricasService` | v2.78 | 1 |
| `AuditService` | v2.78 | 1 |

Tests: [tests/v278-service-interfaces.test.ts](../tests/v278-service-interfaces.test.ts) — 19 tests (declaración, shape runtime, compat de exports, invariante global "todos los .service.ts tienen interface").

### ✅ Guía de provisioning Redis

[docs/REDIS_SETUP.md](./REDIS_SETUP.md) — paso a paso para encender el backend Redis en producción:
- Cuándo vale la pena (serverless multi-réplica)
- Crear instancia en Upstash (plan free 10k cmd/día)
- Configurar env vars en Vercel / Docker
- Verificar el flip con logs + test de carga
- Rollback seguro (flip de env var, 0 cambios de código)
- Coste estimado por nivel de tráfico
- Troubleshooting

### Totales v2.78

- **19 tests nuevos**, **1194 tests pasando** (1175 → +19, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- Coverage gate verde: **74.24 / 86.89 / 70.45 / 74.24** (sobre 70/80/70/70).
- Service interfaces: **3 → 10** (objetivo "7+" alcanzado).

## Completado en v2.77

### ✅ 1. `middleware.ts` → `proxy.ts` (Next 16)

- Rename físico + función exportada `proxy(request)` (antes `middleware(request)`).
- Matcher, lógica de auth JWT, CSRF, body-size, request-id: idénticos.
- Desaparece el warning `"middleware" file convention is deprecated` de `pnpm build`.
- Tests y docs actualizados — referencias al archivo raíz mantienen coherencia con el nuevo nombre.

### ✅ 2. `@upstash/redis` como dep oficial

- `pnpm add @upstash/redis` (^1.37.0). Antes era dep opcional con hack de `new Function()` para evitar que el bundler la resolviera.
- [rate-limit-store.ts](../lib/backend/middleware/rate-limit-store.ts) ahora usa `await import("@upstash/redis")` estático normal.
- Fallback a `MemoryRateLimitStore` preservado cuando:
  - Faltan `UPSTASH_REDIS_REST_URL` / `TOKEN`
  - Falla la inicialización (bad creds, Redis down)
- `.env.example` documenta las 3 variables necesarias para encender Redis en prod.

### ✅ 3. RSC expandido

Nuevo helper [lib/backend/rsc-auth.ts](../lib/backend/rsc-auth.ts) — `getRscAuth()` lee `cookies()` de `next/headers`, verifica JWT, devuelve payload o null.

Dos páginas RSC nuevas:

| Ruta | Acceso | Contenido |
|---|---|---|
| [`/overview`](../app/overview/page.tsx) | authed | KPIs del workspace del usuario — HUs / Casos / Tareas + bloqueos activos. Scope automático por `payload.grupoId`; el owner ve global. |
| [`/kpi`](../app/kpi/page.tsx) | owner-only | Tabla cross-workspace con totales y % completadas / % aprobados por grupo. Usuarios no-owner ven 403 visual. |

Ambas `dynamic = "force-dynamic"` — cada request consulta Prisma fresco. **0 KB de JavaScript** al cliente (sólo HTML).

### ✅ 4. Tests nuevos

- [tests/v277-features.test.ts](../tests/v277-features.test.ts) — 25 tests (proxy rename, Redis shape, RSC auth helper, `/overview`, `/kpi`, invariante global RSC).
- [tests/upstash-redis-shape.test.ts](../tests/upstash-redis-shape.test.ts) — 4 tests (compatibilidad de la interface `RedisLike` con `@upstash/redis`).

### Totales v2.77

- **29 tests nuevos**, **1175 tests pasando** (1146 → +29, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- `pnpm build` limpio — sin warning de deprecation de Next 16.
- Coverage gate verde: **73.65 / 86.98 / 78.68 / 73.65** (sobre 70/80/70/70).
- Rutas RSC en producción: **3** (`/status`, `/overview`, `/kpi`).

## Completado en v2.76 — Fase 5

### ✅ 1. Dynamic imports de componentes condicionales

| Componente | Dónde | Por qué ahora es dinámico |
|---|---|---|
| `HistoriasKanban` | [historias-table.tsx](../components/dashboard/historias/historias-table.tsx) | `@dnd-kit` (~60 KB) sólo se descarga cuando el usuario activa la vista Kanban |
| `CSVImportModal` | [app/page.tsx](../app/page.tsx) | Parser CSV + validaciones de importación sólo cuando se abre el modal |
| `CSVImportCasosModal` | [app/page.tsx](../app/page.tsx) | Idem para casos |
| `HUForm` | [app/page.tsx](../app/page.tsx) | Formulario de crear/editar HU sólo cuando se abre el drawer |
| `HistoriaUsuarioDetail` | [app/page.tsx](../app/page.tsx) | Arrastra toda la rama `CasoPruebaCard` (sub-paneles, tareas, bloqueos, comentarios) |

Todos con `ssr: false` (usan APIs de navegador) + loading placeholder donde aplica.

### ✅ 2. React Server Component: `/status`

[app/status/page.tsx](../app/status/page.tsx) — primer RSC del proyecto:

- **0 KB de JavaScript** al cliente (sólo HTML)
- Consume Prisma directamente en el servidor (sin capa API intermedia)
- `export const dynamic = "force-dynamic"` → cada request obtiene datos frescos
- Funciona como patrón de referencia para las siguientes migraciones RSC (v2.77+)

### ✅ 3. Tests nuevos

[tests/v276-dynamic-rsc.test.ts](../tests/v276-dynamic-rsc.test.ts) — 17 tests:
- Cada componente pesado se importa via `dynamic()` (no estático)
- La página `/status` es server-only (sin `"use client"`, sin hooks, usa Prisma)
- Invariantes de bundle: `app/page.tsx` no importa `@dnd-kit`, `jspdf` ni `html2canvas` estáticamente

### Totales Fase 5 / v2.76

- **17 tests nuevos**, **1146 tests pasando** (1129 → +17, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- Coverage gate verde: **73.71 / 86.83 / 78.51 / 73.71** (sobre 70/80/70/70).
- `pnpm build` exitoso con `/status` listado como ruta dinámica RSC.
- 5 componentes pesados ahora cargan a demanda (antes, todos al mount inicial del dashboard).

## Completado en v2.75 — Fase 4

### ✅ 5 componentes god partidos

| Componente | LOC antes | LOC después | Extracciones |
|---|---|---|---|
| `casos-table.tsx` | 560 | **329** | `casos-row` (memo), `casos-card-mobile` (memo), `casos-filters-panel`, `caso-aprobacion-cfg` |
| `caso-prueba-card.tsx` | 628 | **431** | `tarea-item`, `tarea-form-fields`, `caso-intentos-historial` |
| `bloqueos-panel.tsx` | 519 | **247** | `bloqueos-row`, `bloqueos-export` (CSV + PDF) |
| `user-management.tsx` | 567 | **368** | `user-row` (memo), `user-workspace-dialogs` |
| `components/ui/sidebar.tsx` | 726 | **353** | `sidebar-provider` (context + shortcut), `sidebar-menu` (9 piezas Menu*) |
| **Totales** | **3000** | **1728** (−1272) | **+14 archivos** |

### ✅ Memoización de filas de tablas

- `CasosRow`, `CasosCardMobile`, `UserRow` envueltos en `React.memo` — las filas de tablas ya no re-renderizan cuando cambia estado del orchestrador (paginación, búsqueda, filtros, selección).
- Handlers del orchestrador (`onEdit`, `onReset`, `onUnlock`, `onQuitar`, `onDelete` en user-management; `updateFiltro*` en casos-table) envueltos en `useCallback` → referencias estables que no invalidan el memo.

### ✅ Barrel preservado en sidebar

`components/ui/sidebar.tsx` sigue re-exportando los **24 símbolos originales** (`Sidebar`, `SidebarProvider`, `SidebarMenu*`, `useSidebar`, etc.). Los ~40 consumidores no cambian una sola línea.

### ✅ Tests nuevos

- [tests/v275-component-splits.test.ts](../tests/v275-component-splits.test.ts) (22 tests):
  - Cada sub-pieza extraída existe y es importada por su orchestrador
  - `React.memo` aplicado en `CasosRow`, `CasosCardMobile`, `UserRow`
  - Barrel de sidebar re-exporta los 24 símbolos
  - **Invariante global**: ningún archivo en `components/` o `lib/` supera 500 LOC

### Totales Fase 4 / v2.75

- **22 tests nuevos**, **1129 tests pasando** (1107 → +22, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- Coverage gate verde: **73.71 / 86.81 / 78.51 / 73.71** (sobre 70/80/70/70).
- **Componentes > 500 LOC: 0** (objetivo de métrica alcanzado).
- LOC totales en los 5 archivos: −1272 LOC en orquestadores (repartidos en 14 sub-archivos de UI reutilizables).

## Completado en v2.74 — Fase 3

### ✅ 1. `requireBody` acepta `ZodTypeAny`

- [guards.ts](../lib/backend/middleware/guards.ts): firma genérica `<T extends ZodTypeAny>(...) : Promise<z.infer<T>>`. Strict por defecto (`.strict()` → rechaza claves desconocidas, compatible con Joi anterior). `allowUnknown: true` usa `.passthrough()`.
- Errores de Zod mapeados a `ValidationError.details[]` con formato `"path: mensaje"` — el cliente ve exactamente qué campo falló.

### ✅ 2. Los 5 validadores migrados

- [auth.validator.ts](../lib/backend/validators/auth.validator.ts) — `loginSchema`, `cambiarPasswordSchema`, `createUserSchema`, `updateUserSchema`. Enum `rolEnum` reemplaza `Joi.valid(...)` con tipado literal. Regex de complejidad de password preservado.
- [historia.validator.ts](../lib/backend/validators/historia.validator.ts) — `createHistoriaSchema`, `updateHistoriaSchema` (vía `.extend(...).omit({grupoId:true})`). Incluye `grupoId` opcional en create para permitir owner scope.
- [caso.validator.ts](../lib/backend/validators/caso.validator.ts) — entorno/complejidad como `z.enum`. Arrays Json (`bloqueos`, `comentarios`, `resultadosPorEtapa`) como `z.array(z.any())`.
- [tarea.validator.ts](../lib/backend/validators/tarea.validator.ts) — tipo/prioridad/estado/resultado como `z.enum`.
- [config.validator.ts](../lib/backend/validators/config.validator.ts) — `z.record(z.string(), z.array(etapaDefSchema))` reemplaza `Joi.object().pattern(...)`.

### ✅ 3. DTOs inferidos

Cada validador exporta `type CreateXDTO = z.infer<typeof createXSchema>`. Fin de la duplicación entre `lib/types/` (interfaces manuales) y `lib/backend/validators/` (schemas Joi).

Tipos nuevos exportados: `LoginDTO`, `CambiarPasswordDTO`, `CreateUserDTO`, `UpdateUserDTO`, `CreateHistoriaDTO`, `UpdateHistoriaDTO`, `CreateCasoDTO`, `UpdateCasoDTO`, `CreateTareaDTO`, `UpdateTareaDTO`, `UpdateConfigDTO`.

### ✅ 4. Dependencia Joi eliminada

- `pnpm remove joi` — 8 paquetes + 0 subdeps quedan fuera del bundle server-side (~50 KB).
- **Cero** referencias a `Joi` / `from "joi"` en `lib/` (verificado con test de grep + confirmado por `pnpm typecheck`).

### ✅ 5. Migración de tests existentes

- **Mocks**: 9 ocurrencias de `{ validate: vi.fn()... }` → `{ safeParse: vi.fn()... }` en `tests/v257-features.test.ts` y `tests/v258-features.test.ts`.
- **Schemas**: 40+ calls a `.validate()` → `.safeParse()` en `tests/v255-features.test.ts`, `tests/v257-features.test.ts`, `tests/v259-features.test.ts` (shape `{ error }` se preserva).
- **backend-guards.test.ts**: import `Joi` → `z`; schema de test `Joi.object({...})` → `z.object({...})`.

### Totales Fase 3 / v2.74

- **26 tests nuevos** en [tests/validators-zod.test.ts](../tests/validators-zod.test.ts) — absence de Joi, tipos inferidos, runtime, `requireBody` con Zod.
- **1107 tests pasando** en 69 archivos (1081 → +26, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- Coverage gate verde: **73.71 / 86.81 / 78.51 / 73.71** (sobre 70/80/70/70).
- Dependencias production: **−1** (joi eliminado).

## Completado en v2.73 — Fase 2

### ✅ 1. RateLimitStore pluggable

- [lib/backend/middleware/rate-limit-store.ts](../lib/backend/middleware/rate-limit-store.ts) define `interface RateLimitStore { check(key, limit, windowMs): Promise<RateLimitResult> }`.
- `MemoryRateLimitStore` (default) delega al `checkRateLimit` in-process — preserva el contador global y los mocks existentes en tests.
- `RedisRateLimitStore` implementa `INCR + PEXPIRE` contra un `RedisLike` inyectable (desacopla de un cliente concreto → testeable con mock).
- `getRateLimitStore()` lazy + cacheada. Selección por env `RATE_LIMIT_BACKEND=redis` + `UPSTASH_REDIS_REST_URL`/`TOKEN`. Si faltan credenciales o falla la dep → fallback a memoria + `logger.warn` (no rompe el boot).
- Import de `@upstash/redis` dinámico invisible al bundler (via `new Function("p", "return import(p)")`) — dep opcional.

### ✅ 2. Guards async

- [guards.ts](../lib/backend/middleware/guards.ts): `requireRateLimit` es `async` y devuelve `Promise<void>`. Consume el store vía `getRateLimitStore()`.
- **30 call-sites** en 22 archivos de `app/api/**` actualizados a `await requireRateLimit(...)`. Sin await, la promesa quedaría colgada y el rate-limit no se aplicaría.
- Tests: `tests/backend-guards.test.ts` actualizado a firma async (`.rejects.toBeInstanceOf(RateLimitError)`).

### ✅ 3. Service interfaces (aditivas)

- [historia.service.ts](../lib/backend/services/historia.service.ts), [caso.service.ts](../lib/backend/services/caso.service.ts), [tarea.service.ts](../lib/backend/services/tarea.service.ts) añaden `interface HistoriaService / CasoService / TareaService` + objeto default (`historiaService`, etc.).
- Puramente aditivo — los exports individuales siguen existiendo, ningún call-site cambia.
- Habilita mockeo por inyección para tests futuros.

### ✅ 4. Índices Prisma v2.73

Migración [prisma/migrations/20260422000000_v2_73_performance_indexes](../prisma/migrations/20260422000000_v2_73_performance_indexes/migration.sql) — 3 índices parciales (patrón v2.65):

| Índice | Query objetivo |
|---|---|
| `audit_log_grupo_timestamp_idx` | Admin audit viewer: `WHERE grupoId = ? ORDER BY timestamp DESC LIMIT N` |
| `historias_usuario_grupo_fecha_idx` (partial, `WHERE deletedAt IS NULL`) | Dashboard principal: `WHERE grupoId = ? AND deletedAt IS NULL ORDER BY fechaCreacion DESC` |
| `tareas_asignado_estado_idx` (partial) | "Mis tareas pendientes": `WHERE asignado = ? AND estado = ? AND deletedAt IS NULL` |

Todos `CREATE INDEX IF NOT EXISTS` — idempotentes. Rollback documentado en el header.

### Totales Fase 2 / v2.73

- **51 tests nuevos** (`rate-limit-store.test.ts` 13 + `service-interfaces.test.ts` 11 + `guards-async.test.ts` 27).
- **1081 tests pasando** en 68 archivos (1030 → +51, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- Coverage gate verde: **73.65 % lines / 86.89 % branches / 78.33 % functions / 73.65 % statements** (sobre 70/80/70/70).

## Completado en v2.72 — Fase 1

### ✅ 1. Request-id tracing end-to-end

- [proxy.ts](../proxy.ts): `ensureRequestId()` genera `crypto.randomUUID()` si el header `x-request-id` no viene o es inválido. Lo propaga downstream vía `forwardedHeaders` y lo incluye en el header de respuesta + en los bodies de error (401/403/413).
- [lib/backend/middleware/with-auth.ts](../lib/backend/middleware/with-auth.ts): `withAuth`, `withAuthAdmin` y `withErrorHandler` envuelven el handler en `runWithRequestId(id, …)` (AsyncLocalStorage del logger ya existente desde v2.70).
- [lib/backend/errors.ts](../lib/backend/errors.ts): `HttpError.toResponse()` lee `getRequestId()` y añade `requestId` al body + header de todas las subclases. `ValidationError` preserva `details[]`; `RateLimitError` preserva `Retry-After` y `X-RateLimit-*`.

Beneficio concreto: cuando el cliente reporta un 500, el `requestId` del body/header identifica la traza en los logs del servidor sin necesidad de correlación por timestamp.

### ✅ 2. Coverage gate

- [vitest.config.ts](../vitest.config.ts): `include` limitado a `lib/backend/**` + `app/api/**` (scope testeado hoy). Thresholds **lines 70, functions 70, branches 80, statements 70**. Baseline actual: 73 / 77 / 87 / 73 (margen ~3 puntos para tolerar ruido).
- [package.json](../package.json): `"ci"` ejecuta `test:coverage` en vez de `test:run` — una regresión de cobertura falla el build.
- Nuevo dev-dep: `@vitest/coverage-v8`.

Los componentes quedan fuera del gate hasta Fase 4 (cuando se añadan tests por sub-componente tras los splits).

### ✅ 3. Split de `lib/types/index.ts`

El monolito de 347 LOC queda partido en 10 submódulos:

| Archivo | LOC | Contenido |
|---|---|---|
| [lib/types/brand.ts](../lib/types/brand.ts) | 11 | Branded types (`EntityId`, `HUId`, `CasoId`, `TareaId`) |
| [lib/types/common.ts](../lib/types/common.ts) | 35 | `Comentario`, `Bloqueo` (unión discriminada), `PaginatedResult` |
| [lib/types/config.ts](../lib/types/config.ts) | 58 | Etapas, ambientes, tipos de prueba, resultados, `Config` |
| [lib/types/historia.ts](../lib/types/historia.ts) | 65 | `HistoriaUsuario`, `EstadoHU`, `EventoHistorial`, `TipoEvento` |
| [lib/types/caso.ts](../lib/types/caso.ts) | 60 | `CasoPrueba`, ejecución por etapa, aprobación |
| [lib/types/tarea.ts](../lib/types/tarea.ts) | 28 | `Tarea` + estados |
| [lib/types/sprint.ts](../lib/types/sprint.ts) | 9 | `Sprint` |
| [lib/types/user.ts](../lib/types/user.ts) | 21 | `User`, `Grupo` |
| [lib/types/notificacion.ts](../lib/types/notificacion.ts) | 28 | `Notificacion` + `TipoNotificacion` |
| [lib/types/api.ts](../lib/types/api.ts) | 23 | `API_ROUTES`, `ApiRoute` |

`index.ts` queda reducido a 20 LOC (barrel de re-exports). Imports existentes no cambian — se puede pasar gradualmente a imports directos por submódulo.

### ✅ 4. ESLint limpio

- [eslint.config.mjs](../eslint.config.mjs): ignora `.claude/worktrees/**` (copias temporales de worktrees) + añade Node globals para archivos `.mjs`/`.cjs`/`.js` de config raíz (fixea `'process' is not defined` en `next.config.mjs`).
- Resuelto un `no-useless-escape` pre-existente en [auditoria-panel.tsx](../components/dashboard/shared/auditoria-panel.tsx).
- `pnpm lint`: **0 errores** (antes: 17 pre-existentes).

### Totales Fase 1 / v2.72

- **26 tests nuevos** (`request-id.test.ts` 8 + `middleware-request-id.test.ts` 10 + `types-split.test.ts` 8).
- **1030 tests pasando** en 65 archivos (1004 → +26, 0 regresiones).
- **0 errores TypeScript, 0 errores lint.**
- Coverage gate activo: lines 73 %, functions 77 %, branches 87 %, statements 73 %.

## Completado en v2.71

### ✅ 1. Jerarquía `HttpError` + `toResponse()`

Introducida en [lib/backend/errors.ts](../lib/backend/errors.ts): clase abstracta `HttpError` + 7 subclases (`UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ValidationError`, `ConflictError`, `UnprocessableEntityError`, `RateLimitError`). Cada error:

- Declara su `status` tipado.
- Serializa su body vía `toResponse()` (detalles de `ValidationError`, headers `Retry-After` / `X-RateLimit-*` en `RateLimitError`).
- `NotFoundError` aplica género gramatical correcto (`Historia no encontrada` vs `Caso no encontrado`) usando un set `ENTIDADES_FEMENINAS`.

Cobertura: **13 tests nuevos** en [tests/backend-errors.test.ts](../tests/backend-errors.test.ts).

### ✅ 2. Guards declarativos (`lib/backend/middleware/guards.ts`)

Centralizan 4 chequeos antes eran imperativos y duplicados en ~30 handlers:

| Guard | Lanza | Uso |
|---|---|---|
| `requireRateLimit(req, route, limit, windowMs, keyExtra?)` | `RateLimitError` (429) | Buckets opcionalmente escopeados por usuario |
| `requireBody(req, schema, opts?)` | `ValidationError` (400) | Parse JSON + Joi con `details[]` |
| `requireHU(id, grupoId, opts?)` | `NotFoundError` / `UnprocessableEntityError` | Workspace scope + existencia |
| `requireCaso / requireTarea` | idem | Idem para otros recursos |

La opción `asUnprocessable: true` convierte 404 → 422 en POSTs que referencian recursos padre (semántica correcta: el body es procesable sintácticamente pero el recurso referenciado no existe).

Cobertura: **16 tests nuevos** en [tests/backend-guards.test.ts](../tests/backend-guards.test.ts).

### ✅ 3. Wrappers `withAuth` / `withAuthAdmin` / `withErrorHandler`

Reescritos en [lib/backend/middleware/with-auth.ts](../lib/backend/middleware/with-auth.ts) para:

- Capturar cualquier `HttpError` lanzado por el handler o sus guards → `toResponse()`.
- Loguear y devolver 500 genérico para errores no tipados.
- `withErrorHandler` añadido para rutas públicas (login, refresh, health) que necesitan el mismo *catch* sin auth.

### ✅ 4. Migración de ~30 rutas a decorator composition

Rutas migradas (eliminan 4–8 líneas de boilerplate cada una, centralizan la semántica HTTP):

- `app/api/casos/{route,[id]/route,[id]/aprobar,[id]/comentarios}` (4)
- `app/api/historias/{route,[id]/route,[id]/historial}` (3)
- `app/api/tareas/{route,[id]/route,[id]/bloqueos,[id]/bloqueos/[bloqueoId],[id]/comentarios}` (5)
- `app/api/sprints/{route,[id]/route,[id]/historias,[id]/historias/[huId]}` (4)
- `app/api/users/{route,[id]/route,[id]/asignaciones,...}` (5)
- `app/api/grupos/{route,[id]/route,[id]/miembros}` (3)
- `app/api/auth/{login,logout,refresh,me}` (4)
- `app/api/{audit,config,metricas,notificaciones,sync,batch,export/*,health}` (8+)

Antes (patrón típico):

```ts
export async function POST(request: NextRequest) {
  const payload = getAuthFromHeaders(request.headers)
  if (!payload) return NextResponse.json({ error: "No auth" }, { status: 401 })
  const rl = checkRateLimit(...)
  if (!rl.ok) return NextResponse.json({ error: "..." }, { status: 429, headers: {...} })
  let body; try { body = await request.json() } catch { return NextResponse.json(..., 400) }
  const { error, value } = schema.validate(body, { ... })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const hu = await checkHUAccess(value.huId, payload.grupoId)
  if (!hu) return NextResponse.json({ error: "HU no existe" }, { status: 422 })
  // ... lógica de dominio ...
}
```

Después:

```ts
export const POST = withAuth(async (request, payload) => {
  requireRateLimit(request, "POST /api/...", 120, 60_000)
  const value = await requireBody(request, schema)
  const hu = await requireHU(value.huId, payload.grupoId, { asUnprocessable: true })
  // ... lógica de dominio ...
})
```

### Totales v2.71

- **29 tests nuevos** (errors + guards).
- **1004 tests pasando** en 62 archivos (0 regresiones).
- **0 errores de TypeScript.**
- Reducción estimada: **~400 líneas de boilerplate** en `app/api/`.

## Completado en v2.70

### ✅ Patrón Command + Dispatcher para handlers de dominio

Introducido [lib/hooks/domain/pipeline.ts](../lib/hooks/domain/pipeline.ts) con `CommandResult` + `runCommand` + `defineCommand<Args>()`. Los 5 archivos de handlers (`casoHandlers`, `huHandlers`, `tareaHandlers`, `bloqueoHandlers`, `comentarioHandlers`) ahora declaran cada acción como un objeto con slots `historias / casos / tareas / events / toast / notify / api`. El dispatcher centraliza:

- Combinación de mutate + append-to-historial en un solo `setHistorias` (antes repetido ~20 veces).
- Orden fijo de efectos colaterales: estado → toast → notify → API.
- `clientWarn` uniforme para errores de API fire-and-forget.
- Guardas: builder que retorna `null` aborta sin llamar a setters.

Cobertura: 10 tests nuevos en [tests/pipeline.test.ts](../tests/pipeline.test.ts). Los 80 tests de handlers existentes siguen pasando sin cambios — la firma pública se preservó.

## Completado en v2.69

### ✅ 1. Split de `historias-table.tsx` (735 → 429 LOC)

Extraído a 4 sub-componentes en [components/dashboard/historias/](../components/dashboard/historias/):

| Archivo | LOC | Responsabilidad |
|---|---|---|
| [historias-table.tsx](../components/dashboard/historias/historias-table.tsx) | 429 | Orquestador: estado, filtros, paginación |
| [historias-row.tsx](../components/dashboard/historias/historias-row.tsx) | 142 | Fila memoizada (`React.memo`) |
| [historias-filters-panel.tsx](../components/dashboard/historias/historias-filters-panel.tsx) | 135 | Panel de 8 selects + rango de fechas |
| [historias-bulk-action-select.tsx](../components/dashboard/historias/historias-bulk-action-select.tsx) | 41 | Dropdown de acciones masivas |
| [historia-urgencia-badge.tsx](../components/dashboard/historias/historia-urgencia-badge.tsx) | 36 | Badge `Vencida / Mañana / N días` |

Beneficio inmediato: rows memoizadas dejan de re-renderizar con cada cambio de selección. Cobertura: 18 tests nuevos en [tests/historias-table-split.test.tsx](../tests/historias-table-split.test.tsx).

### ✅ 2. Scripts de CI en `package.json`

```json
"format": "eslint . --fix",
"typecheck": "tsc --noEmit",
"test:coverage": "vitest run --coverage",
"ci": "pnpm typecheck && pnpm lint && pnpm test:run && pnpm build"
```

`pnpm ci` ejecuta la pipeline local end-to-end.

### ✅ 3. Migración de `console.warn` → `clientWarn`

Extendido [lib/client-logger.ts](../lib/client-logger.ts) con el nivel `warn` (JSON estructurado en producción, texto en dev). Migrados 9 usos en:
- [lib/hooks/useConfig.ts](../lib/hooks/useConfig.ts)
- [lib/hooks/useApiMirroredState.ts](../lib/hooks/useApiMirroredState.ts)
- [lib/hooks/domain/casoHandlers.ts](../lib/hooks/domain/casoHandlers.ts)
- [lib/hooks/domain/tareaHandlers.ts](../lib/hooks/domain/tareaHandlers.ts)
- [lib/hooks/domain/huHandlers.ts](../lib/hooks/domain/huHandlers.ts)

### ✅ 4. Validación de input en APIs

Auditoría confirmó que todas las rutas de mutación (`POST/PUT/PATCH/DELETE`) ya usan Zod o Joi en [lib/backend/validators/](../lib/backend/validators/). El gap reportado en v2.68 era sobredimensionado.

## Pendiente

### Prioridad alta

#### 0. ~~Decorator composition + typed errors~~ ✅ completado en v2.71

#### 1. Componentes > 500 LOC restantes

| Archivo | LOC | Acción sugerida |
|---|---|---|
| [components/ui/sidebar.tsx](../components/ui/sidebar.tsx) | 726 | Separar command-palette, workspace switcher y nav items |
| [components/dashboard/casos/caso-prueba-card.tsx](../components/dashboard/casos/caso-prueba-card.tsx) | 628 | Extraer panel de comentarios, aprobación y tareas |
| [components/dashboard/usuarios/user-management.tsx](../components/dashboard/usuarios/user-management.tsx) | 567 | Separar form de usuario y editor de asignaciones |
| [components/dashboard/casos/casos-table.tsx](../components/dashboard/casos/casos-table.tsx) | 560 | Extraer filtros e inline-edit (patrón v2.69 de historias) |

### Prioridad media

#### 2. Memoización en render caliente

Ratio actual: **0.57** (69 usos / 121 componentes — +1 tras `HistoriasRow`). Seguir aplicando:
- `React.memo` a filas de `casos-table` y `tareas-table`
- `useCallback` a handlers en `*-table.tsx` (patrón v2.69 en `historias-table`)
- `useMemo` en derivaciones de listas grandes (filtros, ordenamiento)

#### 3. Auditoría N+1 en Prisma

Revisar [app/api/users/\[id\]/asignaciones/route.ts](../app/api/users/[id]/asignaciones/route.ts) por posibles `findMany` dentro de loops. Usar `include` / `in: [...]` o `prisma.$transaction([...])` cuando aplique.

#### 4. Server Components

Todo el dashboard es `"use client"`. Candidatos a migrar a RSC:
- [components/dashboard/analytics/](../components/dashboard/analytics/) — charts de sólo-lectura
- Wrappers de [components/layout/](../components/layout/) sin interactividad
- Pantallas de KPIs precomputados

#### 5. Tests por componente

76 tests / 121 componentes (0.63, +0.15 desde v2.68). Gap aún alto en `components/dashboard/*` — priorizar `caso-prueba-card` y `casos-table` cuando se splitteen.

### Prioridad baja

#### 6. Documentación modular

- Extraer API spec a `docs/API.md`.
- Añadir `docs/DEPLOYMENT.md` (Docker / Vercel).
- Iniciar `docs/adr/` con ADR template.
- Considerar `CHANGELOG.md` generado a partir de tags semver.

#### 7. `next.config.mjs` — mejoras menores

Evaluar:
- `experimental.optimizePackageImports: ['lucide-react', 'recharts', 'date-fns']`
- `modularizeImports` para `lucide-react`
- `productionBrowserSourceMaps: false` (explícito)

#### 8. Dependencias

- `html2canvas` declarado pero sin uso real → candidato a eliminar.
- `jspdf` sólo server-side en `/api/export/pdf` (OK).
- Revisar `@types/node: ^22` contra el runtime real.

#### 9. Pre-commit robusto

Añadir `tsc --noEmit` selectivo con [tsc-files](https://github.com/gustavopch/tsc-files) al `lint-staged`.

## Ideas para v2.72+

Nuevas oportunidades descubiertas al auditar el repo tras v2.71:

### A. Unificar validadores (Joi ↔ Zod)

Hoy coexisten Joi (APIs) y Zod (forms + algunas rutas como sprints / notificaciones). Migrar todo a Zod:
- Bundle unificado (Joi pesa ~50 KB extra en el servidor).
- Infiere tipos TS automáticamente (fin de las duplicaciones `CreateHistoriaDTO` + schema).
- Integra con `requireBody` cambiando una sola firma.
- Alternativa: mantener Joi pero dejar de mezclar — decidir por dominio.

### B. Redis para rate-limit + sessions

El rate-limiter actual es `Map` in-memory — se reinicia por instancia. Al deployar en Vercel/Edge con > 1 réplica pierde eficacia. Sustituir por Upstash Redis (o Vercel KV):
- Operaciones atómicas (`INCR` + `EXPIRE`) sin race conditions.
- Misma API (`requireRateLimit` ya abstrae el backend).
- Habilita también refresh-token revocation list.

### C. Request ID tracing

Ya existe `AsyncLocalStorage` en el logger. Ampliar:
- Generar `x-request-id` en Edge middleware si no viene.
- Incluir en cada log + en el body de todos los `HttpError.toResponse()`.
- Propagar a cliente vía header — enorme ganancia en soporte.

### D. Codegen OpenAPI desde schemas

Con los guards `requireBody(schema)` unificados, se puede extraer un OpenAPI spec parcial:
- `zod-to-openapi` si se migra a Zod.
- Tipos auto-generados para el cliente (`openapi-typescript`) → elimina ~500 líneas de DTOs manuales en `lib/types/`.

### E. React Server Components — plan incremental

Empezar por 3 pantallas de sólo-lectura:
1. `analytics/charts-panel` — datos precomputados desde API.
2. `owner/global-kpi` — read-only.
3. Shell del dashboard (`<Sidebar />` sin estado cliente).

Pasar server → client con `"use client"` sólo en las hojas interactivas. Ganancia: LCP más rápido + menos JS en el cliente.

### F. Dynamic imports para chunks pesados

- `jspdf` + `html2canvas` (export/pdf) → ya server-only, OK.
- `@dnd-kit` en `historias-kanban` → cargar sólo al abrir vista Kanban (`next/dynamic`).
- `recharts` en analytics → cargar sólo cuando el tab está activo.

### G. `withValidation` + `withRateLimit` como composers reales

Hoy `requireRateLimit(...)` se llama dentro del handler. Alternativa: combinator estilo Express:

```ts
export const POST = pipe(
  withAuth,
  withRateLimit("POST /api/...", 120, 60_000),
  withBody(schema),
)(async (request, payload, body) => { ... })
```

Reduce cada handler otras 3–4 líneas. Coste: 1 util + documentar orden.

### H. Service interfaces para tests

Los handlers dominio importan servicios directamente. Extraer interfaces (`HistoriaService`, `CasoService`) y pasarlos por `ctx` permite mockear sin `vi.mock` de módulo entero → tests de handlers más rápidos.

### I. Índices Prisma adicionales

Revisar con `EXPLAIN ANALYZE`:
- `AuditLog(createdAt DESC, resource)` — paginación admin.
- `Historia(grupoId, estado, deletedAt)` — query más frecuente del dashboard.
- `Tarea(casoPruebaId, deletedAt)` — cascada soft-delete.

### J. Worker para notificaciones + audit

Notificaciones y audit-log hoy se escriben síncronos en cada mutación. Mover a una cola (BullMQ + Redis, o Vercel Cron) para responder antes y tolerar fallos de escritura secundarios.

### K. Componentes > 500 LOC (ver sección arriba — aún 4 pendientes)

## Métricas objetivo

| Métrica | v2.72 | v2.73 | v2.74 | v2.75 | v2.76 | Objetivo |
|---|---|---|---|---|---|---|
| **Componentes > 500 LOC** | 5 | 5 | 5 | 0 | 0 | 0 ✅ |
| Validadores en APIs de mutación | Joi + Zod | Joi + Zod | Zod 100 % | Zod 100 % | Zod 100 % | Zod 100 % ✅ |
| Dependencias validación (runtime) | 2 | 2 | 1 (Zod) | 1 | 1 | 1 ✅ |
| DTOs duplicados (type + schema) | ~11 | ~11 | 0 | 0 | 0 | 0 ✅ |
| `console.log/warn` sin estructura | 0 | 0 | 0 | 0 | 0 | 0 ✅ |
| Ratio memos / componente | 0.57 | 0.57 | 0.57 | 0.59 | 0.59 | ≥ 1.0 |
| **Server Components** | 0 | 0 | 0 | 0 | **1 (`/status`)** | ≥ 3 (meta v2.77+) |
| **Paneles cliente via dynamic()** | 2 (analytics tabs) | 2 | 2 | 2 | **7** (+Kanban, +4 modales) | creciente |
| Rutas API con decorator composition | ~30 | ~30 | ~30 | ~30 | ~30 | 100 % |
| Request-id propagation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Coverage gate activo | ✅ 70/80/70/70 | ✅ | ✅ | ✅ | ✅ | ≥ 80/85/80/80 |
| Archivo UI más grande (LOC) | 726 | 726 | 726 | 431 | 431 | ≤ 500 ✅ |
| Errores ESLint | 0 | 0 | 0 | 0 | 0 | 0 ✅ |
| Rate-limit multi-réplica seguro | ❌ | ✅ Redis opcional | ✅ | ✅ | ✅ | ✅ |
| Service interfaces definidas | 0 | 3 | 3 | 3 | 3 | 7+ |
| Índices Prisma (total) | 26 | 29 | 29 | 29 | 29 | — |
| Tests totales | 1030 | 1081 | 1107 | 1129 | 1146 | creciente |

### Métricas v2.77 — v2.80 (extensiones post-plan)

| Métrica | v2.76 | v2.77 | v2.78 | v2.79 | v2.80 | Objetivo |
|---|---|---|---|---|---|---|
| Server Components (páginas RSC) | 1 | 3 | 3 | 4 | **5** (`/`, `/status`, `/overview`, `/kpi`, `/home`) | ≥ 3 ✅ |
| **`/` renderizado** | client | client | client | client | **server wrapper** | server |
| Warning de deprecation en build | 1 | 0 | 0 | 0 | 0 | 0 ✅ |
| `@upstash/redis` dep oficial | ❌ | ✅ | ✅ | ✅ | ✅ | — |
| Helper RSC auth | ❌ | ✅ | ✅ | ✅ | ✅ | — |
| Service interfaces | 3/10 | 3/10 | 10/10 | 10/10 | 10/10 | ≥ 7 ✅ |
| Guía de setup Redis | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Shell RSC compartido | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Server Actions | 0 | 0 | 0 | 1 | 1 | ≥ 1 ✅ |
| **`app/page.tsx` LOC** | 291 | 291 | 291 | 343 | **30** | ≤ 100 ✅ |
| **Bundle dashboard en ruta `/` sin sesión** | full | full | full | full | **0** (LoginScreen only) | 0 ✅ |
| Tests totales | 1146 | 1175 | 1194 | 1222 | **1244** | creciente |

## Backlog para v2.81+

Items que aún no se han abordado:

| Item | Prioridad | Por qué |
|---|---|---|
| **Encender Redis en prod** (provisioning Upstash + flip de env) | Alta | Infra lista desde v2.73, dep oficial desde v2.77, guía paso a paso desde v2.78. Falta la acción manual del equipo de infra. Ver [REDIS_SETUP.md](./REDIS_SETUP.md). |
| Componentes memoizados: tests por sub-pieza (ratio 0.63 → 0.75) | Media | Objetivo de coverage por componente aún no alcanzado. |
| Subir coverage gate a 80/85/80/80 | Baja | Requiere añadir tests en services sub-cubiertos (`config`, `metricas`, `notificacion`, `sprint`). |
| Worker de notificaciones + audit (BullMQ / Vercel Cron) | Baja | Optimización de latencia del write path; no bloqueante. |
| Codegen OpenAPI desde Zod → tipos cliente | Baja | Los DTOs ya se inferen; este paso elimina también los clientes HTTP manuales. |
| Combinator `pipe(withAuth, withRateLimit, withBody)` | Baja | Azúcar sobre el patrón actual; 3–4 LOC por handler. |
| Migrar handlers a consumir `xService` por inyección | Baja | Interfaces ya listas desde v2.78. Refactor gradual: cada handler recibe el servicio por ctx. Habilita tests sin `vi.mock` de módulo. |
| Más server actions (archivar workspace desde `/overview`, marcar HU completada) | Baja | Patrón establecido en v2.79 con `logoutAction`. Buen candidato: mutaciones simples que hoy son endpoints `/api/*`. |
| Pre-hidratar AuthProvider con `payload` del server en `/` | Baja | v2.80 hace auth check server-side pero el cliente re-fetchea `/api/auth/me` para hidratar. Pasar `initialUser` al AuthProvider elimina la request y evita el flash de `sessionLoading`. |

Cada item es independiente — se pueden abordar en cualquier orden cuando se necesite.

## Historial

- **v2.68** — parsers, route constants, TS errors, splits HU/owner/user, `useDashboardState`, auth-context split, React Query migration, Tailwind canonical, test hygiene.
- **v2.69** — split `historias-table` (735→429 LOC, +4 sub-componentes con `React.memo`), scripts de CI (`typecheck`, `format`, `test:coverage`, `ci`), `clientWarn` estructurado, auditoría de validadores API (100 %), 18 tests nuevos.
- **v2.70** — patrón Command + Dispatcher en los 5 archivos de handlers de dominio, elimina 20 duplicaciones del patrón `setHistorias + historial`, 10 tests nuevos del pipeline, 80 tests existentes siguen pasando sin cambios.
- **v2.71** — jerarquía `HttpError` (7 subclases) + guards declarativos (`requireRateLimit/Body/HU/Caso/Tarea`) + wrappers `withAuth/withAuthAdmin/withErrorHandler`. Migradas ~30 rutas API a decorator composition (−400 LOC boilerplate). 29 tests nuevos, 1004 pasando.
- **v2.72** — **Fase 1 del plan incremental.** Request-id tracing end-to-end (middleware genera `x-request-id`, wrappers envuelven handler en `runWithRequestId`, `HttpError.toResponse()` lo propaga en body + header). Coverage gate activo sobre `lib/backend/**` + `app/api/**` (lines/statements 70 %, branches 80 %, functions 70 %). Split de `lib/types/index.ts` (347 LOC → 10 submódulos, máx 65 LOC). ESLint limpio (0 errores, antes 17). 26 tests nuevos, 1030 pasando.
- **v2.73** — **Fase 2 del plan incremental.** `RateLimitStore` pluggable con `MemoryRateLimitStore` (default) + `RedisRateLimitStore` (opcional, activable por env). `requireRateLimit` migrado a `async` en 30 call-sites. Service interfaces aditivas en `historia/caso/tarea.service.ts`. 3 índices Prisma parciales (migration v2_73 performance_indexes). 51 tests nuevos, 1081 pasando. Coverage sube a 73.65/86.89/78.33/73.65.
- **v2.74** — **Fase 3 del plan incremental.** Unificación de validadores Joi → Zod (`requireBody` acepta `ZodTypeAny`, 5 validadores migrados, 11 DTOs inferidos vía `z.infer<>`, dep Joi eliminada del bundle). Mocks y schemas de tests migrados (9 mocks + 40+ calls `.validate()` → `.safeParse()`). 26 tests nuevos, 1107 pasando. Coverage 73.71/86.81/78.51/73.71.
- **v2.75** — **Fase 4 del plan incremental.** Split de los 5 componentes > 500 LOC: `casos-table` (560→329), `caso-prueba-card` (628→431), `bloqueos-panel` (519→247), `user-management` (567→368), `sidebar` (726→353). **14 sub-archivos nuevos**, barrel de sidebar preservado (24 re-exports). `React.memo` en `CasosRow`, `CasosCardMobile`, `UserRow`. Invariante: **0 archivos > 500 LOC** en todo el repo. 22 tests nuevos, 1129 pasando.
- **v2.76** — **Fase 5 del plan incremental.** Dynamic imports en 5 componentes pesados (`HistoriasKanban`, `CSVImportModal`, `CSVImportCasosModal`, `HUForm`, `HistoriaUsuarioDetail`) — `@dnd-kit`, parsers CSV y árbol de detalle HU ya no entran al bundle inicial. Primer RSC del proyecto: `app/status/page.tsx` — página pública server-only que consulta Prisma directamente (0 KB de JS). 17 tests nuevos, 1146 pasando. `pnpm build` OK. **Plan incremental cerrado.**
- **v2.77** — **Extensión post-plan.** Rename `middleware.ts` → `proxy.ts` (Next 16, función exportada: `proxy(request)`). `@upstash/redis` pasa a dep oficial (elimina el hack `new Function()` del factory, `await import("@upstash/redis")` estático normal). Nuevo helper `getRscAuth()` lee `cookies()` de `next/headers`. Dos RSCs nuevos: `/overview` (KPIs del workspace del usuario, authed) y `/kpi` (agregados cross-workspace, owner-only). `.env.example` documenta `RATE_LIMIT_BACKEND` + credenciales Upstash. 29 tests nuevos, 1175 pasando. `pnpm build` sin warnings de deprecation.
- **v2.78** — **Service interfaces completas.** Añadidas interfaces + instancias a los 7 servicios restantes: `SprintService`, `GrupoService`, `NotificacionService`, `AuthService`, `ConfigService`, `MetricasService`, `AuditService`. Total: **10/10** servicios con interface + instancia (objetivo ≥ 7 alcanzado). Nueva guía [REDIS_SETUP.md](./REDIS_SETUP.md) con provisioning Upstash paso a paso, coste estimado, rollback y troubleshooting. 19 tests nuevos, 1194 pasando.
- **v2.79** — **Dashboard shell RSC + Server Actions.** Nuevo `RscShell` compartido (header + nav + logout form) usado por las 4 páginas RSC. Primera server action del proyecto: `logoutAction()` con `"use server"` que limpia cookies + invalida refresh en DB + audit + redirect. Nueva `/home` landing post-login con saludo dinámico, tarjetas top-line y accesos rápidos. Las 3 RSC existentes (`/status`, `/overview`, `/kpi`) refactorizadas al shell común. Dashboard interactivo de `/` **intocado** (riesgo 0). 28 tests nuevos, 1222 pasando.
- **v2.80** — **`/` migrado a Server Component wrapper.** `app/page.tsx` pasa de 343 LOC `"use client"` a 30 LOC Server Component que hace `getRscAuth()` y decide: sin sesión → `<LoginScreen />` directo (cero bundle dashboard), con sesión → `<DashboardClient />` (body preservado en `_dashboard-client.tsx`). Auth check ahora server-side — no hay flash de loading antes del login. `/` pasa de `○` (static) a `ƒ` (dynamic) en el build. 5 rutas RSC en total. 22 tests nuevos, 1244 pasando.
