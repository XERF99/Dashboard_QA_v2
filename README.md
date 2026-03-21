# QAControl — Dashboard de Gestión de Pruebas · v2.2

Sistema integral de gestión de calidad para equipos QA. Permite administrar Historias de Usuario, casos de prueba, flujos de aprobación, bloqueos y carga ocupacional del equipo, con control de acceso basado en roles.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16.1 (App Router) |
| UI | React 19 + TypeScript 5.7 |
| Estilos | Tailwind CSS v4 + OKLCH color system |
| Componentes | shadcn/ui + Radix UI |
| Iconos | Lucide React |
| Gráficos | Recharts 2.15 |
| Persistencia | localStorage (sin backend) |
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

## Changelog

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

### v2.2 — Suite de tests con Vitest (opt11)
- **Stack de testing**: Vitest 3 + React Testing Library 16 + jsdom. Compatible con React 19 y con el path alias `@/` del proyecto. Scripts disponibles: `pnpm test` (watch), `pnpm test:run` (CI), `pnpm test:ui` (interfaz visual).
- **`tests/casoHandlers.test.ts`** — 14 tests sobre el flujo de aprobación de casos de prueba: `handleEnviarAprobacion` (borrador/rechazado → pendiente, aprobado intacto, HUs ajenas intactas), `handleAprobarCasos` (metadatos `aprobadoPor`/`fechaAprobacion`), `handleRechazarCasos` (motivo de rechazo), `handleSolicitarModificacionCaso`, `handleHabilitarModificacionCaso` (reset a borrador), `handleAddCaso`, `handleEliminarCaso` e `handleRetestearCaso`. Todos verifican también que `addNotificacion` se dispare con el destinatario correcto (`admin` vs `qa`).
- **`tests/useHistoriasVisibles.test.ts`** — 12 tests de scoping por rol: Owner ve todo / `filtroNombresCarga` undefined; QA solo ve sus HUs; Admin sin equipo solo las propias; Admin con equipo ve equipo+sí mismo; QA Lead ídem. También tests de búsqueda por título, código y responsable.
- **`tests/auth-login.test.ts`** — 13 tests de lógica de autenticación y permisos: login con usuario inexistente / inactivo / bloqueado, contador de intentos fallidos con mensaje de intentos restantes, bloqueo en el 5.° intento, generación de `pendingBlockEvents`, reset del contador tras login exitoso, `debeCambiarPassword`, `desbloquearUsuario`, `resetPassword`, y guards de `addUser`/`deleteUser` (admin no puede crear admin, no puede existir segundo owner, email duplicado, no puede eliminarse a sí mismo).

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

Todos los datos se almacenan en `localStorage` del navegador bajo las claves `tcs_*`. No se requiere backend ni base de datos. Al limpiar el almacenamiento del navegador se restauran los datos de ejemplo.

La capa de acceso a datos está abstraída detrás de contratos en `lib/services/interfaces.ts`. Para conectar un backend REST o una base de datos, basta con crear nuevas implementaciones del servicio y cambiar los imports en `lib/services/index.ts`. Ningún componente requiere modificación.

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
pnpm dev      # Servidor de desarrollo con hot-reload
pnpm build    # Build de producción
pnpm start    # Servidor de producción (requiere build previo)
pnpm lint     # Linting con ESLint
```

---

## Despliegue en Vercel

### Opción 1 — Vercel CLI

```bash
npm install -g vercel
vercel          # Primera vez (configura el proyecto)
vercel --prod   # Despliegues posteriores a producción
```

### Opción 2 — Importar desde GitHub (recomendado)

1. Subir el repositorio a GitHub
2. Ir a [vercel.com/new](https://vercel.com/new) e importar el repositorio
3. Vercel detecta Next.js automáticamente — no requiere configuración adicional
4. Cada `git push` a `main` despliega automáticamente a producción

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
├── tests/                        # Suite de tests (Vitest + RTL)
│   ├── setup.ts                  # Mock de localStorage + jest-dom
│   ├── casoHandlers.test.ts      # Tests del flujo de aprobación
│   ├── useHistoriasVisibles.test.ts # Tests de scoping por rol
│   └── auth-login.test.ts        # Tests de login, bloqueo y permisos
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
