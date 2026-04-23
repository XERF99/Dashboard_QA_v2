// ═══════════════════════════════════════════════════════════
//  /overview — React Server Component (v2.77)
//
//  Vista ejecutiva read-only del workspace del usuario.
//  Desde v2.79 usa el RscShell compartido.
// ═══════════════════════════════════════════════════════════

import { redirect } from "next/navigation"
import { getRscAuth } from "@/lib/backend/rsc-auth"
import { prisma } from "@/lib/backend/prisma"
import { RscShell } from "@/components/rsc/rsc-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface OverviewData {
  nombreGrupo:       string | null
  historiasTotal:    number
  historiasActivas:  number
  historiasCerradas: number
  casosTotal:        number
  casosAprobados:    number
  casosPendientes:   number
  tareasPendientes:  number
  tareasEnProgreso:  number
  tareasCompletadas: number
  bloqueosActivos:   number
}

async function loadOverview(grupoId?: string): Promise<OverviewData> {
  const scopeHU    = grupoId ? { grupoId } : {}
  const scopeCaso  = grupoId ? { hu: { grupoId } } : {}
  const scopeTarea = grupoId ? { caso: { hu: { grupoId } } } : {}
  const notDeleted = { deletedAt: null }

  const [
    grupoInfo,
    historiasTotal, historiasActivas, historiasCerradas,
    casosTotal, casosAprobados, casosPendientes,
    tareasPendientes, tareasEnProgreso, tareasCompletadas,
    historiasConBloqueos,
  ] = await Promise.all([
    grupoId ? prisma.grupo.findUnique({ where: { id: grupoId }, select: { nombre: true } }) : Promise.resolve(null),
    prisma.historiaUsuario.count({ where: { ...notDeleted, ...scopeHU } }),
    prisma.historiaUsuario.count({ where: { ...notDeleted, ...scopeHU, estado: { in: ["sin_iniciar", "en_progreso"] } } }),
    prisma.historiaUsuario.count({ where: { ...notDeleted, ...scopeHU, estado: { in: ["exitosa", "fallida", "cancelada"] } } }),
    prisma.casoPrueba.count({ where: { ...notDeleted, ...scopeCaso } }),
    prisma.casoPrueba.count({ where: { ...notDeleted, ...scopeCaso, estadoAprobacion: "aprobado" } }),
    prisma.casoPrueba.count({ where: { ...notDeleted, ...scopeCaso, estadoAprobacion: "pendiente_aprobacion" } }),
    prisma.tarea.count({ where: { ...notDeleted, ...scopeTarea, estado: "pendiente" } }),
    prisma.tarea.count({ where: { ...notDeleted, ...scopeTarea, estado: "en_progreso" } }),
    prisma.tarea.count({ where: { ...notDeleted, ...scopeTarea, estado: "completada" } }),
    prisma.historiaUsuario.findMany({
      where: { ...notDeleted, ...scopeHU },
      select: { bloqueos: true },
    }),
  ])

  let bloqueosActivos = 0
  for (const hu of historiasConBloqueos) {
    const arr = (hu.bloqueos as unknown as { resuelto?: boolean }[] | null) ?? []
    for (const b of arr) if (!b.resuelto) bloqueosActivos++
  }

  return {
    nombreGrupo:       grupoInfo?.nombre ?? null,
    historiasTotal, historiasActivas, historiasCerradas,
    casosTotal,     casosAprobados,   casosPendientes,
    tareasPendientes, tareasEnProgreso, tareasCompletadas,
    bloqueosActivos,
  }
}

export default async function OverviewPage() {
  const payload = await getRscAuth()
  if (!payload) redirect("/")

  const data = await loadOverview(payload.grupoId)

  return (
    <RscShell
      user={payload}
      workspaceName={data.nombreGrupo}
      eyebrow={`Resumen ejecutivo${!payload.grupoId ? " · Global (Owner)" : ""}`}
      title={data.nombreGrupo ?? "Todos los workspaces"}
    >
      <Section title="Historias de usuario">
        <Card label="Total"    value={data.historiasTotal} />
        <Card label="Activas"  value={data.historiasActivas}  tone="primary" />
        <Card label="Cerradas" value={data.historiasCerradas} tone="success" />
      </Section>

      <Section title="Casos de prueba">
        <Card label="Total"              value={data.casosTotal} />
        <Card label="Aprobados"          value={data.casosAprobados}   tone="success" />
        <Card label="Pendientes aprobar" value={data.casosPendientes}  tone="warn" />
      </Section>

      <Section title="Tareas">
        <Card label="Pendientes"   value={data.tareasPendientes}  tone="warn" />
        <Card label="En progreso"  value={data.tareasEnProgreso}  tone="primary" />
        <Card label="Completadas"  value={data.tareasCompletadas} tone="success" />
      </Section>

      {data.bloqueosActivos > 0 && (
        <div style={{
          marginTop: 24, padding: "14px 16px", borderRadius: 10,
          background: "color-mix(in oklch, var(--chart-4) 10%, var(--card))",
          border: "1px solid color-mix(in oklch, var(--chart-4) 35%, var(--border))",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--chart-4)", margin: 0 }}>
              {data.bloqueosActivos} bloqueo{data.bloqueosActivos !== 1 ? "s" : ""} activo{data.bloqueosActivos !== 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
              Revisa el tab de Bloqueos en el dashboard interactivo para resolver.
            </p>
          </div>
        </div>
      )}
    </RscShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 10 }}>
        {title}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {children}
      </div>
    </section>
  )
}

type Tone = "default" | "primary" | "success" | "warn"

function Card({ label, value, tone = "default" }: { label: string; value: number; tone?: Tone }) {
  const colors: Record<Tone, { fg: string; bg: string }> = {
    default: { fg: "var(--foreground)", bg: "var(--card)" },
    primary: { fg: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 8%, var(--card))" },
    success: { fg: "var(--chart-2)", bg: "color-mix(in oklch, var(--chart-2) 8%, var(--card))" },
    warn:    { fg: "var(--chart-3)", bg: "color-mix(in oklch, var(--chart-3) 8%, var(--card))" },
  }
  const c = colors[tone]
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10,
      border: "1px solid var(--border)", background: c.bg,
    }}>
      <p style={{ fontSize: 26, fontWeight: 700, margin: 0, lineHeight: 1.15, color: c.fg }}>
        {value.toLocaleString("es-ES")}
      </p>
      <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
        {label}
      </p>
    </div>
  )
}
