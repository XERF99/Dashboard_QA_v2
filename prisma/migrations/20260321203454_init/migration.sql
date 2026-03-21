-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT true,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "historialConexiones" JSONB NOT NULL DEFAULT '[]',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "cls" TEXT NOT NULL DEFAULT '',
    "permisos" JSONB NOT NULL DEFAULT '[]',
    "esBase" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historias_usuario" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "criteriosAceptacion" TEXT NOT NULL DEFAULT '',
    "responsable" TEXT NOT NULL,
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "estado" TEXT NOT NULL DEFAULT 'sin_iniciar',
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "sprint" TEXT,
    "aplicacion" TEXT NOT NULL DEFAULT '',
    "tipoAplicacion" TEXT NOT NULL,
    "requiriente" TEXT NOT NULL DEFAULT '',
    "areaSolicitante" TEXT NOT NULL DEFAULT '',
    "etapa" TEXT NOT NULL DEFAULT 'sin_iniciar',
    "motivoCancelacion" TEXT,
    "ambiente" TEXT NOT NULL DEFAULT '',
    "tipoPrueba" TEXT NOT NULL DEFAULT '',
    "creadoPor" TEXT NOT NULL,
    "delegadoPor" TEXT NOT NULL DEFAULT '',
    "permitirCasosAdicionales" BOOLEAN NOT NULL DEFAULT false,
    "motivoCasosAdicionales" TEXT,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFinEstimada" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "casosIds" JSONB NOT NULL DEFAULT '[]',
    "bloqueos" JSONB NOT NULL DEFAULT '[]',
    "historial" JSONB NOT NULL DEFAULT '[]',
    "comentarios" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "historias_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "casos_prueba" (
    "id" TEXT NOT NULL,
    "huId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "entorno" TEXT NOT NULL DEFAULT 'test',
    "tipoPrueba" TEXT NOT NULL DEFAULT '',
    "horasEstimadas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complejidad" TEXT NOT NULL DEFAULT 'media',
    "estadoAprobacion" TEXT NOT NULL DEFAULT 'borrador',
    "aprobadoPor" TEXT,
    "fechaAprobacion" TIMESTAMP(3),
    "motivoRechazo" TEXT,
    "creadoPor" TEXT NOT NULL,
    "modificacionHabilitada" BOOLEAN NOT NULL DEFAULT false,
    "motivoModificacion" TEXT,
    "modificacionSolicitada" BOOLEAN NOT NULL DEFAULT false,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivosAnalizados" JSONB NOT NULL DEFAULT '[]',
    "resultadosPorEtapa" JSONB NOT NULL DEFAULT '[]',
    "tareasIds" JSONB NOT NULL DEFAULT '[]',
    "bloqueos" JSONB NOT NULL DEFAULT '[]',
    "comentarios" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casos_prueba_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tareas" (
    "id" TEXT NOT NULL,
    "casoPruebaId" TEXT NOT NULL,
    "huId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "asignado" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "resultado" TEXT NOT NULL DEFAULT 'pendiente',
    "tipo" TEXT NOT NULL DEFAULT 'ejecucion',
    "prioridad" TEXT NOT NULL DEFAULT 'media',
    "horasEstimadas" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "horasReales" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "evidencias" TEXT NOT NULL DEFAULT '',
    "creadoPor" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "bloqueos" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprints" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "objetivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "destinatario" TEXT NOT NULL,
    "casoId" TEXT,
    "huId" TEXT,
    "huTitulo" TEXT,
    "casoTitulo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config" (
    "id" TEXT NOT NULL,
    "etapas" JSONB NOT NULL DEFAULT '{}',
    "resultados" JSONB NOT NULL DEFAULT '[]',
    "tiposAplicacion" JSONB NOT NULL DEFAULT '[]',
    "ambientes" JSONB NOT NULL DEFAULT '[]',
    "tiposPrueba" JSONB NOT NULL DEFAULT '[]',
    "aplicaciones" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "historias_usuario_codigo_key" ON "historias_usuario"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "sprints_nombre_key" ON "sprints"("nombre");

-- AddForeignKey
ALTER TABLE "casos_prueba" ADD CONSTRAINT "casos_prueba_huId_fkey" FOREIGN KEY ("huId") REFERENCES "historias_usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_casoPruebaId_fkey" FOREIGN KEY ("casoPruebaId") REFERENCES "casos_prueba"("id") ON DELETE CASCADE ON UPDATE CASCADE;
