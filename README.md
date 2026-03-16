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
- Reseteo de contraseña a la genérica
- Protección: solo el Owner puede crear o asignar roles de Admin u Owner

#### Configuración
- **Roles**: creación y edición de roles personalizados con permisos granulares
- **Tipos de Aplicación**: gestión de los tipos disponibles (Web, Mobile, API, etc.)
- **Aplicaciones**: lista de aplicaciones del proyecto
- **Ambientes**: entornos de prueba disponibles (Dev, QA, Staging, Prod, etc.)
- **Tipos de Prueba**: categorías de prueba disponibles (Funcional, Regresión, Smoke, etc.)
- **Etapas**: configuración de las etapas de ejecución por tipo de aplicación

---

## Changelog

### v2.2
- **Panel de Riesgos** en el tab Inicio: detecta automáticamente HUs vencidas, por vencer, bloqueadas y casos sin ejecutar. Cada alerta es clickeable para navegar a la HU afectada.
- **Vista por Sprint** en Historias: barra de tabs por sprint con card de resumen (progreso %, distribución de estados, story points) que aparece al asignar el campo sprint a las HUs.
- **Importación CSV**: modal de 3 pasos (cargar → preview → confirmar) para crear HUs masivamente desde archivos CSV. Compatible con el formato de exportación del propio sistema. Detecta y omite códigos duplicados.
- **Plantillas de HU**: botón "Usar plantilla" en el formulario de nueva HU con 5 plantillas predefinidas (Despliegue, Rollback, Infraestructura, Base de Datos, Proceso Batch) que autocompletan tipo, prioridad, puntos, ambiente y criterios de aceptación.
- **Diseño responsive completo**: todos los grids, tablas y paneles se adaptan correctamente a móvil, tablet y escritorio.

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
| **Owner** | Acceso total. Único que puede crear/asignar roles Admin u Owner. Ve todos los datos sin filtro |
| **Administrador** | Gestiona HUs, usuarios, aprobaciones y configuración. Ve su equipo asignado (o todos si sin equipo) |
| **Lead** | Crea HUs, gestiona su equipo QA y aprueba casos de prueba. Ve solo su equipo |
| **User (QA)** | Crea y ejecuta casos de prueba sobre las HUs asignadas. Ve solo sus propias HUs |
| **Visualizador** | Solo lectura. Ve todos los datos pero no puede modificar nada |

---

## Persistencia de datos

Todos los datos se almacenan en `localStorage` del navegador bajo las claves `tcs_*`. No se requiere backend ni base de datos. Al limpiar el almacenamiento del navegador se restauran los datos de ejemplo.

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

```
dashboard_v22/
├── app/
│   ├── globals.css           # Variables de tema OKLCH y estilos globales
│   ├── layout.tsx            # Layout raíz con ThemeProvider
│   └── page.tsx              # Página principal — navegación y lógica de estado
├── components/
│   ├── auth/
│   │   └── login-screen.tsx  # Pantalla de inicio de sesión
│   ├── dashboard/
│   │   ├── home-dashboard.tsx          # Vista de inicio con KPIs y calendario
│   │   ├── panel-riesgos.tsx           # Panel de alertas automáticas de riesgo ← v2.2
│   │   ├── historias-table.tsx         # Tabla de HUs con filtros, sprints y acciones masivas
│   │   ├── csv-import-modal.tsx        # Modal de importación desde CSV          ← v2.2
│   │   ├── historia-usuario-detail.tsx # Modal detalle de HU con casos y tareas
│   │   ├── hu-form.tsx                 # Formulario de creación/edición de HU
│   │   ├── hu-templates.tsx            # Plantillas predefinidas para nuevas HUs ← v2.2
│   │   ├── hu-stats-cards.tsx          # Tarjetas de estadísticas de HUs
│   │   ├── casos-table.tsx             # Vista global de casos de prueba
│   │   ├── analytics-kpis.tsx          # KPIs y gráficos de analytics
│   │   ├── carga-ocupacional.tsx       # Gráficos de carga por usuario
│   │   ├── bloqueos-panel.tsx          # Panel unificado de bloqueos
│   │   ├── auditoria-panel.tsx         # Historial de auditoría
│   │   ├── user-management.tsx         # CRUD de usuarios
│   │   ├── roles-config.tsx            # Configuración de roles
│   │   ├── tipos-aplicacion-config.tsx # Tipos de aplicación
│   │   ├── aplicaciones-config.tsx     # Lista de aplicaciones
│   │   ├── ambientes-config.tsx        # Ambientes de prueba
│   │   ├── tipos-prueba-config.tsx     # Tipos de prueba
│   │   ├── etapas-config.tsx           # Etapas por tipo de aplicación
│   │   ├── header.tsx                  # Encabezado con búsqueda y notificaciones
│   │   └── perfil-dialog.tsx           # Diálogo de perfil de usuario
│   └── ui/                   # Componentes base de shadcn/ui
├── lib/
│   ├── types.ts              # Tipos, interfaces y datos de ejemplo
│   ├── auth-context.tsx      # Contexto de autenticación y lógica de roles
│   ├── storage.ts            # Hook usePersistedState y claves de localStorage
│   └── utils.ts              # Utilidad cn()
├── public/                   # Assets estáticos
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
