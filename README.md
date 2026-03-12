# TCS Dashboard

Dashboard interno para la gestión de **Historias de Usuario**, seguimiento de tareas de pruebas y visualización de carga ocupacional del equipo.

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Estilos | Tailwind CSS v4 |
| Componentes | shadcn/ui + Radix UI |
| Iconos | Lucide React |
| Gráficos | Recharts |
| Package manager | pnpm |
| Despliegue | Vercel |

## Funcionalidades principales

- **Historias de Usuario** — creación, edición y eliminación con formulario completo (tareas, entornos, fases, story points)
- **Detalle de HU** — seguimiento de fases por tarea, registro de bloqueos, observaciones y línea de tiempo de eventos
- **Carga Ocupacional** — visualización de la distribución de trabajo por persona
- **Gestión de usuarios** — roles diferenciados (admin, editor, visor, solo mis tareas)
- **Tema claro / oscuro** — alternancia automática con variables CSS `oklch`
- **Toasts y modales de confirmación** — feedback visual para todas las acciones destructivas

## Requisitos previos

- Node.js 18 o superior
- pnpm (`npm install -g pnpm`)

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

## Comandos disponibles

```bash
pnpm dev      # Servidor de desarrollo con hot-reload
pnpm build    # Build de producción
pnpm start    # Servidor de producción (requiere build previo)
pnpm lint     # Linting con ESLint
```

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

## Estructura del proyecto

```
dashboard_v22/
├── app/
│   ├── globals.css       # Variables de tema y estilos globales
│   ├── layout.tsx        # Layout raíz con ThemeProvider
│   └── page.tsx          # Página principal del dashboard
├── components/
│   ├── auth/             # Pantalla de login y contexto de autenticación
│   ├── dashboard/        # Componentes principales del dashboard
│   │   ├── header.tsx
│   │   ├── historias-table.tsx
│   │   ├── historia-usuario-detail.tsx
│   │   ├── hu-form.tsx
│   │   ├── hu-stats-cards.tsx
│   │   ├── carga-ocupacional.tsx
│   │   └── user-management.tsx
│   └── ui/               # Componentes de shadcn/ui
├── lib/
│   ├── types.ts          # Tipos e interfaces globales + datos de ejemplo
│   ├── auth-context.tsx  # Contexto de autenticación y roles
│   └── utils.ts          # Utilidades (cn, etc.)
├── public/               # Assets estáticos
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Variables de entorno

Actualmente el proyecto no requiere variables de entorno. Si en el futuro se conecta a una base de datos o API externa, crear un archivo `.env.local` basado en `.env.example` (no incluido en el repositorio).

## Credenciales de demo

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Administrador |
| editor | edit123 | Editor |
| viewer | view123 | Visor |

> Estas credenciales son solo para demostración. No usar en entornos productivos con datos reales.
