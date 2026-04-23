// ═══════════════════════════════════════════════════════════
//  /status — React Server Component (público)
//
//  Desde v2.79 usa el RscShell compartido para mantener
//  consistencia visual con /home, /overview, /kpi.
// ═══════════════════════════════════════════════════════════

import { prisma } from "@/lib/backend/prisma"
import { getRscAuth } from "@/lib/backend/rsc-auth"
import { RscShell } from "@/components/rsc/rsc-shell"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface StatusData {
  dbReachable:    boolean
  totalHistorias: number
  totalCasos:     number
  totalTareas:    number
  totalUsuarios:  number
  error?:         string
}

async function getStatus(): Promise<StatusData> {
  try {
    const [h, c, t, u] = await Promise.all([
      prisma.historiaUsuario.count({ where: { deletedAt: null } }),
      prisma.casoPrueba.count({ where: { deletedAt: null } }),
      prisma.tarea.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { activo: true } }),
    ])
    return { dbReachable: true, totalHistorias: h, totalCasos: c, totalTareas: t, totalUsuarios: u }
  } catch (err) {
    return {
      dbReachable: false, totalHistorias: 0, totalCasos: 0, totalTareas: 0, totalUsuarios: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export default async function StatusPage() {
  // La ruta es pública pero si el usuario está logueado mostramos su shell.
  const [status, auth] = await Promise.all([getStatus(), getRscAuth()])
  const healthy = status.dbReachable

  return (
    <RscShell
      user={auth}
      eyebrow="Estado del sistema"
      title={healthy ? "Todo operativo" : "Sistema degradado"}
    >
      <section style={{
        padding: "16px 20px", borderRadius: 12, marginBottom: 24,
        background: healthy
          ? "color-mix(in oklch, var(--chart-2) 10%, var(--card))"
          : "color-mix(in oklch, var(--chart-4) 10%, var(--card))",
        border: `1px solid ${healthy ? "color-mix(in oklch, var(--chart-2) 35%, var(--border))" : "color-mix(in oklch, var(--chart-4) 35%, var(--border))"}`,
      }}>
        <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: healthy ? "var(--chart-2)" : "var(--chart-4)" }}>
          {healthy ? "✓ Base de datos alcanzable" : "✗ Base de datos no responde"}
        </p>
        <p style={{ fontSize: 13, margin: "6px 0 0", color: "var(--muted-foreground)" }}>
          {healthy
            ? "Todos los servicios responden. Conteos actualizados en tiempo real."
            : `Error: ${status.error ?? "desconocido"}.`
          }
        </p>
      </section>

      {healthy && (
        <section>
          <h2 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 12 }}>
            Indicadores globales
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <Stat label="Historias activas" value={status.totalHistorias} />
            <Stat label="Casos de prueba"   value={status.totalCasos} />
            <Stat label="Tareas abiertas"   value={status.totalTareas} />
            <Stat label="Usuarios activos"  value={status.totalUsuarios} />
          </div>
        </section>
      )}
    </RscShell>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{
      padding: "14px 16px", borderRadius: 10,
      border: "1px solid var(--border)", background: "var(--card)",
    }}>
      <p style={{ fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
        {value.toLocaleString("es-ES")}
      </p>
      <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 4 }}>
        {label}
      </p>
    </div>
  )
}
