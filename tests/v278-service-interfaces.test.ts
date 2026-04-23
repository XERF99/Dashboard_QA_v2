// @vitest-environment node
// ═══════════════════════════════════════════════════════════
//  TESTS — v2.78  Interfaces de servicios extendidas
//
//  Extiende el patrón de v2.73 (Historia/Caso/Tarea) a los
//  7 servicios restantes. Cada servicio debe:
//  1. Declarar una interface tipada (ej. `SprintService`)
//  2. Exportar un objeto default (`sprintService`) que la satisface
//  3. Preservar los exports individuales (compat hacia atrás)
// ═══════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest"
import fs from "fs"
import path from "path"

const read = (f: string) => fs.readFileSync(path.resolve(f), "utf-8")

interface ServiceSpec {
  file:           string
  interfaceName:  string
  instanceName:   string
  methods:        string[]
}

const SERVICES: ServiceSpec[] = [
  {
    file:          "lib/backend/services/sprint.service.ts",
    interfaceName: "SprintService",
    instanceName:  "sprintService",
    methods:       ["getAll", "getById", "getActivo", "create", "update", "delete"],
  },
  {
    file:          "lib/backend/services/grupo.service.ts",
    interfaceName: "GrupoService",
    instanceName:  "grupoService",
    methods:       ["getAll", "getById", "create", "update", "delete", "getMetricasGrupo", "getMetricasGlobales"],
  },
  {
    file:          "lib/backend/services/notificacion.service.ts",
    interfaceName: "NotificacionService",
    instanceName:  "notificacionService",
    methods:       ["rolToDestinatario", "getByDestinatario", "create", "marcarLeida", "marcarTodasLeidas"],
  },
  {
    file:          "lib/backend/services/auth.service.ts",
    interfaceName: "AuthService",
    instanceName:  "authService",
    methods:       ["login", "logout", "cambiarPassword", "createUser", "resetPassword", "desbloquearUsuario"],
  },
  {
    file:          "lib/backend/services/config.service.ts",
    interfaceName: "ConfigService",
    instanceName:  "configService",
    methods:       ["get", "update"],
  },
  {
    file:          "lib/backend/services/metricas.service.ts",
    interfaceName: "MetricasService",
    instanceName:  "metricasService",
    methods:       ["get"],
  },
  {
    file:          "lib/backend/services/audit.service.ts",
    interfaceName: "AuditService",
    instanceName:  "auditService",
    methods:       ["write"],
  },
]

describe("v2.78 — interfaces de servicios (todos declaran + exportan instancia)", () => {
  for (const svc of SERVICES) {
    it(`${svc.file}: declara ${svc.interfaceName} + instancia ${svc.instanceName}`, () => {
      const src = read(svc.file)
      expect(src).toContain(`export interface ${svc.interfaceName}`)
      expect(src).toContain(`export const ${svc.instanceName}`)
    })
  }
})

describe("v2.78 — instancias con shape completo (runtime)", () => {
  it("sprintService expone todos los métodos", async () => {
    const { sprintService } = await import("@/lib/backend/services/sprint.service")
    expect(sprintService).toBeDefined()
    for (const m of ["getAll", "getById", "getActivo", "create", "update", "delete"]) {
      expect(typeof (sprintService as unknown as Record<string, unknown>)[m]).toBe("function")
    }
  })

  it("grupoService expone todos los métodos", async () => {
    const { grupoService } = await import("@/lib/backend/services/grupo.service")
    expect(grupoService).toBeDefined()
    for (const m of ["getAll", "getById", "create", "update", "delete", "getMetricasGrupo", "getMetricasGlobales"]) {
      expect(typeof (grupoService as unknown as Record<string, unknown>)[m]).toBe("function")
    }
  })

  it("notificacionService expone todos los métodos", async () => {
    const { notificacionService } = await import("@/lib/backend/services/notificacion.service")
    expect(notificacionService).toBeDefined()
    for (const m of ["rolToDestinatario", "getByDestinatario", "create", "marcarLeida", "marcarTodasLeidas"]) {
      expect(typeof (notificacionService as unknown as Record<string, unknown>)[m]).toBe("function")
    }
    // rolToDestinatario debe mapear correctamente
    expect(notificacionService.rolToDestinatario("owner")).toBe("admin")
    expect(notificacionService.rolToDestinatario("admin")).toBe("admin")
    expect(notificacionService.rolToDestinatario("qa")).toBe("qa")
  })

  it("authService expone todos los métodos", async () => {
    const { authService } = await import("@/lib/backend/services/auth.service")
    expect(authService).toBeDefined()
    for (const m of ["login", "logout", "cambiarPassword", "createUser", "resetPassword", "desbloquearUsuario"]) {
      expect(typeof (authService as unknown as Record<string, unknown>)[m]).toBe("function")
    }
  })

  it("configService expone get + update", async () => {
    const { configService } = await import("@/lib/backend/services/config.service")
    expect(typeof configService.get).toBe("function")
    expect(typeof configService.update).toBe("function")
  })

  it("metricasService expone get", async () => {
    const { metricasService } = await import("@/lib/backend/services/metricas.service")
    expect(typeof metricasService.get).toBe("function")
  })

  it("auditService expone write", async () => {
    const { auditService } = await import("@/lib/backend/services/audit.service")
    expect(typeof auditService.write).toBe("function")
  })
})

describe("v2.78 — exports individuales preservados (compat)", () => {
  it("sprint mantiene los exports sueltos", async () => {
    const mod = await import("@/lib/backend/services/sprint.service")
    expect(mod.getAllSprints).toBe(mod.sprintService.getAll)
    expect(mod.createSprint).toBe(mod.sprintService.create)
  })

  it("grupo mantiene los exports sueltos", async () => {
    const mod = await import("@/lib/backend/services/grupo.service")
    expect(mod.getAllGrupos).toBe(mod.grupoService.getAll)
    expect(mod.getMetricasGrupo).toBe(mod.grupoService.getMetricasGrupo)
  })

  it("auth mantiene los exports sueltos", async () => {
    const mod = await import("@/lib/backend/services/auth.service")
    expect(mod.loginService).toBe(mod.authService.login)
    expect(mod.createUserService).toBe(mod.authService.createUser)
  })

  it("audit: la función audit() directa === auditService.write", async () => {
    const mod = await import("@/lib/backend/services/audit.service")
    expect(mod.audit).toBe(mod.auditService.write)
  })
})

describe("v2.78 — métrica de cobertura", () => {
  it("todos los servicios (excluyendo base-crud) tienen interface + instancia", () => {
    const servicesDir = "lib/backend/services"
    const files = fs.readdirSync(servicesDir)
      .filter(f => f.endsWith(".service.ts") && f !== "base-crud.service.ts")

    // Esperamos 10 servicios con interface/instancia: historia, caso, tarea
    // (v2.73) + sprint, grupo, notificacion, auth, config, metricas, audit (v2.78)
    for (const f of files) {
      const src = read(path.join(servicesDir, f))
      expect(src, `${f}: falta declarar una interface Service`).toMatch(/export interface \w+Service/)
      expect(src, `${f}: falta exportar una instancia Service`).toMatch(/export const \w+Service(?:\s*:\s*\w+)?\s*=/)
    }
    // Total de servicios (sanity): debemos tener exactamente 10
    expect(files.length).toBe(10)
  })
})
