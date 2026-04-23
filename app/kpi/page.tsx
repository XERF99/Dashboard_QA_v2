// ═══════════════════════════════════════════════════════════
//  /kpi — React Server Component (v2.77) — OWNER ONLY
//
//  Desde v2.79 usa el RscShell compartido.
// ═══════════════════════════════════════════════════════════

import { redirect } from "next/navigation"
import Link from "next/link"
import { getRscAuth } from "@/lib/backend/rsc-auth"
import { prisma } from "@/lib/backend/prisma"
import { RscShell } from "@/components/rsc/rsc-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface WorkspaceKPI {
  grupoId:            string
  nombre:             string
  totalHistorias:     number
  historiasCerradas:  number
  totalCasos:         number
  casosAprobados:     number
  totalTareas:        number
  usuariosActivos:    number
}

async function loadGlobalKPIs(): Promise<WorkspaceKPI[]> {
  const notDeleted = { deletedAt: null }
  const grupos = await prisma.grupo.findMany({
    where: { activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  })
  return Promise.all(grupos.map(async g => {
    const [h, hCerradas, c, cAprobados, t, u] = await Promise.all([
      prisma.historiaUsuario.count({ where: { ...notDeleted, grupoId: g.id } }),
      prisma.historiaUsuario.count({
        where: { ...notDeleted, grupoId: g.id, estado: { in: ["exitosa", "fallida", "cancelada"] } },
      }),
      prisma.casoPrueba.count({ where: { ...notDeleted, hu: { grupoId: g.id } } }),
      prisma.casoPrueba.count({
        where: { ...notDeleted, hu: { grupoId: g.id }, estadoAprobacion: "aprobado" },
      }),
      prisma.tarea.count({ where: { ...notDeleted, caso: { hu: { grupoId: g.id } } } }),
      prisma.user.count({ where: { grupoId: g.id, activo: true } }),
    ])
    return {
      grupoId: g.id, nombre: g.nombre,
      totalHistorias: h, historiasCerradas: hCerradas,
      totalCasos: c, casosAprobados: cAprobados,
      totalTareas: t, usuariosActivos: u,
    }
  }))
}

export default async function KpiPage() {
  const payload = await getRscAuth()
  if (!payload) redirect("/")

  if (payload.grupoId) {
    return (
      <RscShell user={payload} eyebrow="Acceso restringido" title="KPIs globales">
        <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 16 }}>
          La vista global de KPIs está disponible sólo para el owner del sistema.
        </p>
        <Link href="/home" style={{ color: "var(--primary)", fontSize: 13 }}>← Volver al inicio</Link>
      </RscShell>
    )
  }

  const workspaces = await loadGlobalKPIs()
  const totals = workspaces.reduce(
    (acc, w) => ({
      historias: acc.historias + w.totalHistorias,
      cerradas:  acc.cerradas  + w.historiasCerradas,
      casos:     acc.casos     + w.totalCasos,
      aprobados: acc.aprobados + w.casosAprobados,
      tareas:    acc.tareas    + w.totalTareas,
      usuarios:  acc.usuarios  + w.usuariosActivos,
    }),
    { historias: 0, cerradas: 0, casos: 0, aprobados: 0, tareas: 0, usuarios: 0 },
  )

  const pctCompletadas = totals.historias > 0 ? Math.round((totals.cerradas / totals.historias) * 100) : 0
  const pctAprobados   = totals.casos > 0     ? Math.round((totals.aprobados / totals.casos) * 100) : 0

  return (
    <RscShell
      user={payload}
      eyebrow="KPIs globales · Owner"
      title={`${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""} activo${workspaces.length !== 1 ? "s" : ""}`}
    >
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 10 }}>
          Totales agregados
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          <Stat label="Historias"        value={totals.historias} />
          <Stat label="% completadas"    value={`${pctCompletadas}%`} tone="primary" />
          <Stat label="Casos"            value={totals.casos} />
          <Stat label="% aprobados"      value={`${pctAprobados}%`} tone="primary" />
          <Stat label="Tareas"           value={totals.tareas} />
          <Stat label="Usuarios activos" value={totals.usuarios} />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 10 }}>
          Desglose por workspace
        </h2>
        <div style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--secondary)", textAlign: "left" }}>
                <Th>Workspace</Th>
                <Th align="right">HUs</Th>
                <Th align="right">% cerradas</Th>
                <Th align="right">Casos</Th>
                <Th align="right">% aprobados</Th>
                <Th align="right">Tareas</Th>
                <Th align="right">Usuarios</Th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map(w => {
                const pctHU = w.totalHistorias > 0 ? Math.round((w.historiasCerradas / w.totalHistorias) * 100) : 0
                const pctC  = w.totalCasos > 0     ? Math.round((w.casosAprobados     / w.totalCasos) * 100) : 0
                return (
                  <tr key={w.grupoId} style={{ borderTop: "1px solid var(--border)" }}>
                    <Td><strong>{w.nombre}</strong></Td>
                    <Td align="right">{w.totalHistorias}</Td>
                    <Td align="right">{pctHU}%</Td>
                    <Td align="right">{w.totalCasos}</Td>
                    <Td align="right">{pctC}%</Td>
                    <Td align="right">{w.totalTareas}</Td>
                    <Td align="right">{w.usuariosActivos}</Td>
                  </tr>
                )
              })}
              {workspaces.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--muted-foreground)" }}>
                    No hay workspaces activos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </RscShell>
  )
}

type Tone = "default" | "primary"

function Stat({ label, value, tone = "default" }: { label: string; value: string | number; tone?: Tone }) {
  const c = tone === "primary"
    ? { fg: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 8%, var(--card))" }
    : { fg: "var(--foreground)", bg: "var(--card)" }
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10,
      border: "1px solid var(--border)", background: c.bg,
    }}>
      <p style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.15, color: c.fg }}>
        {typeof value === "number" ? value.toLocaleString("es-ES") : value}
      </p>
      <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
        {label}
      </p>
    </div>
  )
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{
      padding: "10px 14px", textAlign: align, fontSize: 10,
      textTransform: "uppercase", letterSpacing: "0.06em",
      color: "var(--muted-foreground)", fontWeight: 700,
    }}>
      {children}
    </th>
  )
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td style={{
      padding: "10px 14px", textAlign: align,
      color: "var(--foreground)", fontSize: 13,
    }}>
      {children}
    </td>
  )
}
