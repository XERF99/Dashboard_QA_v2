// ═══════════════════════════════════════════════════════════
//  SCRIPT DE DATOS DEMO — TCS Dashboard
//
//  Crea un conjunto realista de datos de prueba en el grupo
//  predeterminado ("grupo-default").  Todo está marcado con
//  el prefijo [DEMO] para poder borrarlo en masa.
//
//  CREAR datos demo:
//    npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/demo-data.ts
//    — o —
//    pnpm demo:seed
//
//  BORRAR todos los datos demo:
//    npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/demo-data.ts --clean
//    — o —
//    pnpm demo:clean
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
const GRUPO_ID   = "grupo-default"
const DEMO_TAG   = "[DEMO]"
const DEMO_EMAIL = "@demo.tcs"

// ── Helper: ¿modo limpieza? ─────────────────────────────────
const isClean = process.argv.includes("--clean")

// ═══════════════════════════════════════════════════════════
//  LIMPIEZA
// ═══════════════════════════════════════════════════════════

async function limpiar() {
  console.log("\n🗑️  Eliminando datos demo...\n")

  // Tareas → por HUs demo (cascade de casos no aplica en deleteMany filtrado)
  const husDemoIds = (await prisma.historiaUsuario.findMany({
    where:  { grupoId: GRUPO_ID, titulo: { contains: DEMO_TAG } },
    select: { id: true },
  })).map(h => h.id)

  const casosDemoIds = husDemoIds.length
    ? (await prisma.casoPrueba.findMany({
        where:  { huId: { in: husDemoIds } },
        select: { id: true },
      })).map(c => c.id)
    : []

  // Eliminar en orden: tareas → casos → HUs → usuarios demo
  if (casosDemoIds.length) {
    const t = await prisma.tarea.deleteMany({ where: { casoPruebaId: { in: casosDemoIds } } })
    console.log(`  ✓ ${t.count} tareas eliminadas`)
    const c = await prisma.casoPrueba.deleteMany({ where: { id: { in: casosDemoIds } } })
    console.log(`  ✓ ${c.count} casos de prueba eliminados`)
  } else {
    console.log("  — No hay tareas ni casos demo")
  }

  if (husDemoIds.length) {
    const h = await prisma.historiaUsuario.deleteMany({ where: { id: { in: husDemoIds } } })
    console.log(`  ✓ ${h.count} historias de usuario eliminadas`)
  } else {
    console.log("  — No hay HUs demo")
  }

  // Usuarios demo (identificados por el email @demo.tcs)
  const u = await prisma.user.deleteMany({
    where: { email: { contains: DEMO_EMAIL } },
  })
  console.log(`  ✓ ${u.count} usuarios demo eliminados`)

  console.log("\n✅ Limpieza completada.\n")
}

// ═══════════════════════════════════════════════════════════
//  CREACIÓN
// ═══════════════════════════════════════════════════════════

async function poblar() {
  console.log("\n🌱 Creando datos demo...\n")

  // ── 1. Usuarios demo ──────────────────────────────────────
  const passwordHash = await bcrypt.hash("Demo1234!", 10)

  const usuarios = await Promise.all([
    prisma.user.upsert({
      where:  { email: `qa.sofia${DEMO_EMAIL}` },
      update: {},
      create: {
        nombre: "Sofía Romero [DEMO]", email: `qa.sofia${DEMO_EMAIL}`,
        passwordHash, rol: "qa", grupoId: GRUPO_ID,
        debeCambiarPassword: false, activo: true,
      },
    }),
    prisma.user.upsert({
      where:  { email: `qa.daniel${DEMO_EMAIL}` },
      update: {},
      create: {
        nombre: "Daniel Vega [DEMO]", email: `qa.daniel${DEMO_EMAIL}`,
        passwordHash, rol: "qa", grupoId: GRUPO_ID,
        debeCambiarPassword: false, activo: true,
      },
    }),
    prisma.user.upsert({
      where:  { email: `lead.rosa${DEMO_EMAIL}` },
      update: {},
      create: {
        nombre: "Rosa Ibáñez [DEMO]", email: `lead.rosa${DEMO_EMAIL}`,
        passwordHash, rol: "qa_lead", grupoId: GRUPO_ID,
        debeCambiarPassword: false, activo: true,
      },
    }),
    prisma.user.upsert({
      where:  { email: `viewer.pedro${DEMO_EMAIL}` },
      update: {},
      create: {
        nombre: "Pedro Alves [DEMO]", email: `viewer.pedro${DEMO_EMAIL}`,
        passwordHash, rol: "viewer", grupoId: GRUPO_ID,
        debeCambiarPassword: false, activo: true,
      },
    }),
  ])
  const [sofia, daniel, rosa] = usuarios
  console.log(`  ✓ ${usuarios.length} usuarios demo creados`)

  // ── 2. Sprint demo ────────────────────────────────────────
  const sprintDemo = await prisma.sprint.upsert({
    where:  { nombre_grupoId: { nombre: "[DEMO] Sprint Demo Q2-2026", grupoId: GRUPO_ID } },
    update: {},
    create: {
      nombre:      "[DEMO] Sprint Demo Q2-2026",
      grupoId:     GRUPO_ID,
      fechaInicio: new Date("2026-04-01"),
      fechaFin:    new Date("2026-04-30"),
      objetivo:    "Sprint de demostración — datos de ejemplo",
    },
  })
  console.log("  ✓ Sprint demo creado")

  // ── 3. Historias de Usuario ───────────────────────────────
  const huDefs = [
    {
      codigo: "DEMO-001",
      titulo: `${DEMO_TAG} Login y autenticación de usuarios`,
      descripcion: "Implementar el flujo completo de autenticación: login, logout, recuperación de contraseña y bloqueo por intentos fallidos.",
      criteriosAceptacion: "- El usuario puede iniciar sesión con email y contraseña válidos\n- Tras 5 intentos fallidos la cuenta se bloquea\n- El admin puede desbloquear cuentas",
      estado: "en_progreso",
      prioridad: "alta",
      tipoAplicacion: "web",
      aplicacion: "Portal Web",
      ambiente: "test",
      tipoPrueba: "funcional",
      responsable: sofia.nombre,
      requiriente: "Gerencia TI",
      areaSolicitante: "Seguridad",
      puntos: 8,
      sprint: sprintDemo.nombre,
      numCasos: 3,
    },
    {
      codigo: "DEMO-002",
      titulo: `${DEMO_TAG} API de gestión de pedidos`,
      descripcion: "Validar los endpoints REST de creación, consulta, actualización y cancelación de pedidos.",
      criteriosAceptacion: "- POST /pedidos retorna 201 con el pedido creado\n- GET /pedidos/:id retorna 404 para pedidos inexistentes\n- DELETE solo disponible para admins",
      estado: "sin_iniciar",
      prioridad: "alta",
      tipoAplicacion: "api",
      aplicacion: "API Core",
      ambiente: "dev",
      tipoPrueba: "integracion",
      responsable: daniel.nombre,
      requiriente: "Producto",
      areaSolicitante: "Backend",
      puntos: 13,
      sprint: sprintDemo.nombre,
      numCasos: 2,
    },
    {
      codigo: "DEMO-003",
      titulo: `${DEMO_TAG} Módulo de reportes y exportación`,
      descripcion: "Verificar la generación correcta de reportes en CSV y PDF con los filtros aplicados.",
      criteriosAceptacion: "- El reporte CSV incluye todas las columnas esperadas\n- El reporte PDF respeta el rango de fechas seleccionado\n- Los filtros de estado y responsable funcionan correctamente",
      estado: "completada",
      prioridad: "media",
      tipoAplicacion: "web",
      aplicacion: "Portal Web",
      ambiente: "staging",
      tipoPrueba: "funcional",
      responsable: rosa.nombre,
      requiriente: "Dirección",
      areaSolicitante: "Operaciones",
      puntos: 5,
      sprint: sprintDemo.nombre,
      numCasos: 2,
    },
    {
      codigo: "DEMO-004",
      titulo: `${DEMO_TAG} App mobile — carrito de compras`,
      descripcion: "Pruebas de regresión sobre el flujo de carrito de compras en la app iOS y Android.",
      criteriosAceptacion: "- Agregar y quitar ítems no produce errores\n- El total se actualiza en tiempo real\n- El proceso de checkout llega hasta el pago sin errores",
      estado: "sin_iniciar",
      prioridad: "media",
      tipoAplicacion: "mobile",
      aplicacion: "App Mobile",
      ambiente: "test",
      tipoPrueba: "regresion",
      responsable: daniel.nombre,
      requiriente: "eCommerce",
      areaSolicitante: "Mobile",
      puntos: 8,
      sprint: undefined,
      numCasos: 2,
    },
    {
      codigo: "DEMO-005",
      titulo: `${DEMO_TAG} Smoke test — despliegue a producción`,
      descripcion: "Suite de smoke tests para validar el despliegue a producción: servicios críticos, login, carga de datos.",
      criteriosAceptacion: "- Todos los endpoints críticos responden en < 2s\n- Login funciona con credenciales de producción\n- No hay errores 500 en el dashboard principal",
      estado: "en_progreso",
      prioridad: "critica",
      tipoAplicacion: "web",
      aplicacion: "Portal Web",
      ambiente: "produccion",
      tipoPrueba: "smoke",
      responsable: rosa.nombre,
      requiriente: "DevOps",
      areaSolicitante: "Infraestructura",
      puntos: 3,
      sprint: sprintDemo.nombre,
      numCasos: 1,
    },
  ]

  // Plantillas de casos de prueba por tipo
  const plantillasCasos: Record<string, { titulo: string; descripcion: string; entorno: string; complejidad: string; horasEstimadas: number }[]> = {
    "funcional": [
      { titulo: "Flujo feliz — escenario principal", descripcion: "Verificar que el flujo principal funciona con datos válidos en condiciones normales.", entorno: "test", complejidad: "media", horasEstimadas: 2 },
      { titulo: "Validación de campos requeridos", descripcion: "Confirmar que el sistema rechaza correctamente entradas vacías o inválidas.", entorno: "test", complejidad: "baja", horasEstimadas: 1 },
      { titulo: "Manejo de errores y mensajes al usuario", descripcion: "Verificar que los mensajes de error son claros y la UI se recupera correctamente.", entorno: "test", complejidad: "media", horasEstimadas: 1.5 },
    ],
    "integracion": [
      { titulo: "Integración con base de datos — persistencia", descripcion: "Verificar que los datos se persisten y recuperan correctamente desde la DB.", entorno: "dev", complejidad: "alta", horasEstimadas: 3 },
      { titulo: "Contrato de API — request y response", descripcion: "Validar que el contrato de la API (campos, tipos, status codes) es el esperado.", entorno: "dev", complejidad: "media", horasEstimadas: 2 },
    ],
    "regresion": [
      { titulo: "Regresión — funcionalidad previa no afectada", descripcion: "Confirmar que las funcionalidades existentes no fueron impactadas por los últimos cambios.", entorno: "test", complejidad: "media", horasEstimadas: 2 },
      { titulo: "Regresión — casos borde históricos", descripcion: "Re-ejecutar los casos borde que fallaron en sprints anteriores.", entorno: "staging", complejidad: "alta", horasEstimadas: 2.5 },
    ],
    "smoke": [
      { titulo: "Smoke — servicios críticos disponibles", descripcion: "Verificar que los servicios más críticos responden y están operativos.", entorno: "produccion", complejidad: "baja", horasEstimadas: 0.5 },
    ],
    "default": [
      { titulo: "Caso de prueba principal", descripcion: "Verificar el comportamiento esperado del sistema.", entorno: "test", complejidad: "media", horasEstimadas: 2 },
      { titulo: "Caso de prueba secundario", descripcion: "Verificar escenarios alternativos y casos borde.", entorno: "test", complejidad: "baja", horasEstimadas: 1 },
    ],
  }

  // Plantilla de tareas
  const plantillasTareas = [
    { titulo: "Preparar entorno y datos de prueba", tipo: "preparacion", horasEstimadas: 0.5 },
    { titulo: "Ejecutar casos de prueba", tipo: "ejecucion", horasEstimadas: 1 },
    { titulo: "Documentar resultados y evidencias", tipo: "documentacion", horasEstimadas: 0.5 },
  ]

  const estadosCaso: Record<string, string> = {
    "completada":  "aprobado",
    "en_progreso": "pendiente",
    "sin_iniciar": "borrador",
  }

  let totalHUs = 0, totalCasos = 0, totalTareas = 0

  for (const def of huDefs) {
    // Crear HU
    const hu = await prisma.historiaUsuario.upsert({
      where:  { codigo_grupoId: { codigo: def.codigo, grupoId: GRUPO_ID } },
      update: {},
      create: {
        codigo:           def.codigo,
        grupoId:          GRUPO_ID,
        titulo:           def.titulo,
        descripcion:      def.descripcion,
        criteriosAceptacion: def.criteriosAceptacion,
        responsable:      def.responsable,
        prioridad:        def.prioridad,
        estado:           def.estado,
        tipoAplicacion:   def.tipoAplicacion,
        aplicacion:       def.aplicacion,
        ambiente:         def.ambiente,
        tipoPrueba:       def.tipoPrueba,
        requiriente:      def.requiriente,
        areaSolicitante:  def.areaSolicitante,
        puntos:           def.puntos,
        sprint:           def.sprint ?? null,
        creadoPor:        sofia.nombre,
        etapa:            def.estado === "completada" ? "despliegue" : "analisis",
        fechaFinEstimada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        historial: [
          {
            id:          `evt-${def.codigo}-1`,
            tipo:        "creacion",
            descripcion: `Historia creada por ${sofia.nombre}`,
            usuario:     sofia.nombre,
            fecha:       new Date().toISOString(),
          },
        ],
        comentarios: [
          {
            id:      `cmt-${def.codigo}-1`,
            texto:   `Revisar criterios de aceptación antes de iniciar los casos. [Datos demo]`,
            autor:   rosa.nombre,
            fecha:   new Date().toISOString(),
          },
        ],
      },
    })
    totalHUs++

    // Plantilla de casos según tipoPrueba
    const casoPlantilla = plantillasCasos[def.tipoPrueba] ?? plantillasCasos["default"]!
    const casosACrear   = casoPlantilla!.slice(0, def.numCasos)
    const estadoCaso    = estadosCaso[def.estado] ?? "borrador"

    for (let ci = 0; ci < casosACrear.length; ci++) {
      const cp = casosACrear[ci]!
      const caso = await prisma.casoPrueba.create({
        data: {
          huId:             hu.id,
          titulo:           `${DEMO_TAG} ${cp.titulo}`,
          descripcion:      cp.descripcion,
          entorno:          cp.entorno as "test",
          tipoPrueba:       def.tipoPrueba,
          horasEstimadas:   cp.horasEstimadas,
          complejidad:      cp.complejidad as "baja",
          estadoAprobacion: estadoCaso as "borrador",
          aprobadoPor:      estadoCaso === "aprobado" ? rosa.nombre : null,
          fechaAprobacion:  estadoCaso === "aprobado" ? new Date() : null,
          creadoPor:        def.responsable,
          comentarios: [
            {
              id:    `cmt-caso-${hu.id}-${ci}`,
              texto: `Caso de prueba creado como datos de demostración. [DEMO]`,
              autor: def.responsable,
              fecha: new Date().toISOString(),
            },
          ],
          resultadosPorEtapa: def.estado === "completada"
            ? [{ etapa: "testing", resultado: "exitoso", fecha: new Date().toISOString(), ejecutadoPor: def.responsable }]
            : [],
        },
      })
      totalCasos++

      // Tareas para cada caso
      const numTareas = def.estado === "completada" ? 3 : def.estado === "en_progreso" ? 2 : 1
      for (let ti = 0; ti < numTareas && ti < plantillasTareas.length; ti++) {
        const tp = plantillasTareas[ti]!
        await prisma.tarea.create({
          data: {
            casoPruebaId:   caso.id,
            huId:           hu.id,
            titulo:         `${DEMO_TAG} ${tp.titulo}`,
            descripcion:    `Tarea de demo — ${tp.titulo.toLowerCase()}`,
            asignado:       [sofia.nombre, daniel.nombre][ti % 2]!,
            estado:         def.estado === "completada" ? "completada" : def.estado === "en_progreso" && ti === 0 ? "completada" : "pendiente",
            resultado:      def.estado === "completada" ? "exitoso" : "pendiente",
            tipo:           tp.tipo as "ejecucion",
            prioridad:      "media",
            horasEstimadas: tp.horasEstimadas,
            horasReales:    def.estado === "completada" ? tp.horasEstimadas * 1.1 : 0,
            creadoPor:      def.responsable,
          },
        })
        totalTareas++
      }
    }
  }

  console.log(`  ✓ ${totalHUs} historias de usuario creadas`)
  console.log(`  ✓ ${totalCasos} casos de prueba creados`)
  console.log(`  ✓ ${totalTareas} tareas creadas`)
  console.log(`\n✅ Datos demo creados exitosamente.`)
  console.log(`\n   Para eliminarlos cuando quieras:`)
  console.log(`   pnpm demo:clean\n`)
}

// ── Entry point ─────────────────────────────────────────────
async function main() {
  if (isClean) {
    await limpiar()
  } else {
    await poblar()
  }
}

main()
  .catch(e => { console.error("\n❌ Error:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
