// ═══════════════════════════════════════════════════════════
//  /home — React Server Component (v2.79)
//
//  Landing post-login server-rendered. Reemplaza la navegación
//  ad-hoc en páginas RSC previas con el `RscShell` compartido.
//
//  Consulta Prisma directamente — el nombre del workspace, los
//  bloqueos activos y los conteos top-line llegan en el HTML
//  inicial (0 KB de JS para el shell).
// ═══════════════════════════════════════════════════════════

import { redirect } from "next/navigation"
import Link from "next/link"
import { getRscAuth } from "@/lib/backend/rsc-auth"
import { prisma } from "@/lib/backend/prisma"
import { RscShell } from "@/components/rsc/rsc-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function loadHome(grupoId?: string) {
  const scopeHU    = grupoId ? { grupoId } : {}
  const scopeCaso  = grupoId ? { hu: { grupoId } } : {}
  const scopeTarea = grupoId ? { caso: { hu: { grupoId } } } : {}
  const notDeleted = { deletedAt: null }

  const [grupoInfo, historias, casos, tareas, bloqueosRaw] = await Promise.all([
    grupoId ? prisma.grupo.findUnique({ where: { id: grupoId }, select: { nombre: true } }) : Promise.resolve(null),
    prisma.historiaUsuario.count({ where: { ...notDeleted, ...scopeHU } }),
    prisma.casoPrueba.count({ where: { ...notDeleted, ...scopeCaso } }),
    prisma.tarea.count({ where: { ...notDeleted, ...scopeTarea } }),
    prisma.historiaUsuario.findMany({
      where: { ...notDeleted, ...scopeHU },
      select: { bloqueos: true },
    }),
  ])

  let bloqueosActivos = 0
  for (const hu of bloqueosRaw) {
    const arr = (hu.bloqueos as unknown as { resuelto?: boolean }[] | null) ?? []
    for (const b of arr) if (!b.resuelto) bloqueosActivos++
  }

  return { workspaceName: grupoInfo?.nombre ?? null, historias, casos, tareas, bloqueosActivos }
}

export default async function HomePage() {
  const payload = await getRscAuth()
  if (!payload) redirect("/")

  const data = await loadHome(payload.grupoId)
  const saludo = getSaludo()

  return (
    <RscShell
      user={payload}
      workspaceName={data.workspaceName}
      eyebrow="Inicio · vista servidor"
      title={`${saludo}, ${payload.nombre.split(" ")[0]}`}
    >
      <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 24 }}>
        {!payload.grupoId
          ? "Vista global — visualiza todos los workspaces desde las tarjetas de KPIs."
          : <>Workspace actual: <strong>{data.workspaceName ?? payload.grupoId}</strong>.</>
        }
      </p>

      {/* ── Tarjetas top-line ── */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 32 }}>
        <QuickCard label="Historias activas" value={data.historias} href="/overview" />
        <QuickCard label="Casos de prueba"    value={data.casos}     href="/overview" />
        <QuickCard label="Tareas totales"     value={data.tareas}    href="/overview" />
        <QuickCard
          label="Bloqueos activos"
          value={data.bloqueosActivos}
          href="/"
          tone={data.bloqueosActivos > 0 ? "warn" : "default"}
        />
      </section>

      {/* ── Accesos rápidos ── */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 10 }}>
          Accesos rápidos
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
          <ActionLink
            href="/overview"
            title="Resumen ejecutivo"
            desc="KPIs completos del workspace, sin interactividad. Listo para compartir."
          />
          {!payload.grupoId && (
            <ActionLink
              href="/kpi"
              title="KPIs globales"
              desc="Agregados cross-workspace, sólo para owners."
            />
          )}
          <ActionLink
            href="/status"
            title="Estado del sistema"
            desc="Health check público de DB y servicios."
          />
          <ActionLink
            href="/"
            title="Dashboard interactivo →"
            desc="Vista completa con tabs, filtros, importación CSV y gestión."
            accent
          />
        </div>
      </section>

      {data.bloqueosActivos > 0 && (
        <div style={{
          padding: "14px 16px", borderRadius: 10,
          background: "color-mix(in oklch, var(--chart-4) 10%, var(--card))",
          border: "1px solid color-mix(in oklch, var(--chart-4) 35%, var(--border))",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>⚠</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--chart-4)", margin: 0 }}>
              {data.bloqueosActivos} bloqueo{data.bloqueosActivos !== 1 ? "s" : ""} activo{data.bloqueosActivos !== 1 ? "s" : ""}
            </p>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
              Entra al dashboard interactivo → tab Bloqueos para resolver.
            </p>
          </div>
          <Link href="/" style={{
            fontSize: 11, padding: "6px 12px", borderRadius: 7,
            border: "1px solid var(--chart-4)", color: "var(--chart-4)",
            textDecoration: "none", fontWeight: 600,
          }}>
            Ver bloqueos →
          </Link>
        </div>
      )}
    </RscShell>
  )
}

function getSaludo(): string {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 19) return "Buenas tardes"
  return "Buenas noches"
}

type Tone = "default" | "warn"

function QuickCard({ label, value, href, tone = "default" }: { label: string; value: number; href: string; tone?: Tone }) {
  const c = tone === "warn" && value > 0
    ? { fg: "var(--chart-4)", bg: "color-mix(in oklch, var(--chart-4) 8%, var(--card))" }
    : { fg: "var(--foreground)", bg: "var(--card)" }
  return (
    <Link href={href} style={{
      padding: "14px 16px", borderRadius: 10,
      border: "1px solid var(--border)", background: c.bg,
      textDecoration: "none", display: "block",
    }}>
      <p style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.15, color: c.fg }}>
        {value.toLocaleString("es-ES")}
      </p>
      <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
        {label}
      </p>
    </Link>
  )
}

function ActionLink({ href, title, desc, accent }: { href: string; title: string; desc: string; accent?: boolean }) {
  return (
    <Link href={href} style={{
      padding: "14px 16px", borderRadius: 10,
      border: "1px solid " + (accent ? "var(--primary)" : "var(--border)"),
      background: accent
        ? "color-mix(in oklch, var(--primary) 6%, var(--card))"
        : "var(--card)",
      textDecoration: "none", display: "block",
    }}>
      <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: accent ? "var(--primary)" : "var(--foreground)" }}>
        {title}
      </p>
      <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4, lineHeight: 1.5 }}>
        {desc}
      </p>
    </Link>
  )
}
