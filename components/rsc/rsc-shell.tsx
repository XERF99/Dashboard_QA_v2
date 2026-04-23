// ═══════════════════════════════════════════════════════════
//  RSC SHELL (v2.79)
//
//  Header + nav + footer compartido para todas las páginas RSC.
//  Server Component: no lleva "use client", cero JS al cliente.
//
//  El logout usa un <form action={serverAction}> — funciona sin JS
//  (el navegador hace POST nativo al endpoint que Next auto-genera).
//
//  Uso:
//    export default async function MyPage() {
//      const auth = await getRscAuth()
//      return <RscShell user={auth} workspaceName={...}>{content}</RscShell>
//    }
// ═══════════════════════════════════════════════════════════

import Link from "next/link"
import type { ReactNode } from "react"
import { logoutAction } from "@/app/actions/auth-actions"
import type { JWTPayload } from "@/lib/backend/middleware/auth.middleware"

interface NavLink {
  href:  string
  label: string
}

interface Props {
  user?:          JWTPayload | null
  workspaceName?: string | null
  title?:         string
  eyebrow?:       string
  children:       ReactNode
}

function buildNav(user: JWTPayload | null | undefined): NavLink[] {
  if (!user) return []
  const links: NavLink[] = [
    { href: "/home",     label: "Inicio" },
    { href: "/overview", label: "Resumen" },
    { href: "/status",   label: "Estado" },
    { href: "/",         label: "Dashboard →" },
  ]
  // Owner (sin grupoId) ve la vista cross-workspace.
  if (!user.grupoId) links.splice(2, 0, { href: "/kpi", label: "KPIs globales" })
  return links
}

export function RscShell({ user, workspaceName, title, eyebrow, children }: Props) {
  const nav = buildNav(user)
  const isOwner = user && !user.grupoId

  return (
    <div style={{
      minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif",
      color: "var(--foreground)", background: "var(--background)",
    }}>
      <header style={{
        borderBottom: "1px solid var(--border)", background: "var(--card)",
        padding: "12px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <Link href={user ? "/home" : "/"} style={{
          fontSize: 14, fontWeight: 700, color: "var(--primary)", textDecoration: "none",
        }}>
          QAControl
        </Link>

        <nav style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
          {nav.map(link => (
            <Link key={link.href} href={link.href} style={{
              fontSize: 12, padding: "4px 10px", borderRadius: 6,
              color: "var(--muted-foreground)", textDecoration: "none",
            }}>
              {link.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right", fontSize: 11, color: "var(--muted-foreground)" }}>
              <p style={{ fontWeight: 600, color: "var(--foreground)", margin: 0 }}>{user.nombre}</p>
              <p style={{ margin: 0 }}>
                {isOwner ? "Owner" : workspaceName ?? user.rol}
              </p>
            </div>
            <form action={logoutAction}>
              <button type="submit" style={{
                fontSize: 11, padding: "5px 10px", borderRadius: 6,
                border: "1px solid var(--border)", background: "var(--secondary)",
                color: "var(--muted-foreground)", cursor: "pointer",
              }}>
                Cerrar sesión
              </button>
            </form>
          </div>
        ) : (
          <Link href="/" style={{
            fontSize: 11, padding: "5px 10px", borderRadius: 6,
            border: "1px solid var(--border)", background: "var(--secondary)",
            color: "var(--muted-foreground)", textDecoration: "none",
          }}>
            Iniciar sesión
          </Link>
        )}
      </header>

      <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 24px" }}>
        {(eyebrow || title) && (
          <header style={{ marginBottom: 28 }}>
            {eyebrow && (
              <p style={{
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em",
                fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 4,
              }}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>{title}</h1>
            )}
          </header>
        )}
        {children}
      </main>

      <footer style={{
        marginTop: 48, padding: "16px 24px",
        borderTop: "1px solid var(--border)",
        fontSize: 11, color: "var(--muted-foreground)",
        display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap",
      }}>
        <span>React Server Component · 0 KB de JavaScript al cliente</span>
      </footer>
    </div>
  )
}
