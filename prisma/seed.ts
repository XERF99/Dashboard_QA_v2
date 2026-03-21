// ═══════════════════════════════════════════════════════════
//  SEED — Usuarios iniciales, roles y config predeterminada
//  Ejecutar: npx prisma db seed
// ═══════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const SALT = 10

const usuariosIniciales = [
  { id: "usr-000", nombre: "Owner Principal",  email: "owner@empresa.com",       password: "owner123",  rol: "owner",   debeCambiarPassword: false },
  { id: "usr-001", nombre: "Admin Principal",   email: "admin@empresa.com",       password: "admin123",  rol: "admin",   debeCambiarPassword: false },
  { id: "usr-002", nombre: "Laura Mendez",      email: "laura.mendez@empresa.com",password: "laura123",  rol: "qa_lead", debeCambiarPassword: false },
  { id: "usr-006", nombre: "Maria Garcia",      email: "maria.garcia@empresa.com",password: "maria123",  rol: "qa",      debeCambiarPassword: false },
  { id: "usr-003", nombre: "Carlos Lopez",      email: "carlos.lopez@empresa.com",password: "carlos123", rol: "viewer",  debeCambiarPassword: false },
  { id: "usr-004", nombre: "Ana Martinez",      email: "ana.martinez@empresa.com",password: "ana123",    rol: "qa",      debeCambiarPassword: false },
  { id: "usr-005", nombre: "Pedro Sanchez",     email: "pedro.sanchez@empresa.com",password: "pedro123", rol: "viewer",  activo: false, debeCambiarPassword: false },
]

const rolesIniciales = [
  { id: "owner",   label: "Owner",          description: "Acceso total",         cls: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",  permisos: ["isSuperAdmin","canEdit","canManageUsers","canApproveCases","canCreateHU"], esBase: true },
  { id: "admin",   label: "Administrador",  description: "Gestiona todo",        cls: "bg-chart-4/20 text-chart-4 border-chart-4/30",          permisos: ["canEdit","canManageUsers","canApproveCases","canCreateHU"],              esBase: true },
  { id: "qa_lead", label: "Lead",           description: "Crea HUs y aprueba",   cls: "bg-purple-500/20 text-purple-500 border-purple-500/30", permisos: ["canEdit","canApproveCases","canCreateHU"],                               esBase: true },
  { id: "qa",      label: "User",           description: "Ejecuta casos",        cls: "bg-chart-1/20 text-chart-1 border-chart-1/30",          permisos: ["canEdit","verSoloPropios"],                                              esBase: true },
  { id: "viewer",  label: "Visualizador",   description: "Solo lectura",         cls: "bg-chart-2/20 text-chart-2 border-chart-2/30",          permisos: [],                                                                        esBase: true },
]

async function main() {
  console.log("Iniciando seed...")

  // ── Roles ────────────────────────────────────────────────
  for (const rol of rolesIniciales) {
    await prisma.role.upsert({
      where:  { id: rol.id },
      update: { label: rol.label, description: rol.description, cls: rol.cls, permisos: rol.permisos, esBase: rol.esBase },
      create: rol,
    })
  }
  console.log(`✓ ${rolesIniciales.length} roles creados/actualizados`)

  // ── Usuarios ─────────────────────────────────────────────
  for (const u of usuariosIniciales) {
    const hash = await bcrypt.hash(u.password, SALT)
    await prisma.user.upsert({
      where:  { email: u.email },
      update: {},  // no sobreescribir si ya existe (preservar password cambiado)
      create: {
        id:                  u.id,
        nombre:              u.nombre,
        email:               u.email,
        passwordHash:        hash,
        rol:                 u.rol,
        activo:              "activo" in u ? u.activo as boolean : true,
        debeCambiarPassword: u.debeCambiarPassword,
        fechaCreacion:       new Date(),
      },
    })
  }
  console.log(`✓ ${usuariosIniciales.length} usuarios creados/actualizados`)

  // ── Config predeterminada ────────────────────────────────
  await prisma.config.upsert({
    where:  { id: "singleton" },
    update: {},
    create: {
      id:              "singleton",
      etapas:          {},
      resultados:      [],
      tiposAplicacion: [],
      ambientes:       [],
      tiposPrueba:     [],
      aplicaciones:    [],
    },
  })
  console.log("✓ Config inicializada")

  console.log("\nSeed completado exitosamente.")
}

main()
  .catch(e => { console.error("Error en seed:", e); process.exit(1) })
  .finally(() => prisma.$disconnect())
