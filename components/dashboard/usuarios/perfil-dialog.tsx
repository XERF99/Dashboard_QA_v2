"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User, Mail, KeyRound, Check, Info } from "lucide-react"
import { useAuth } from "@/lib/contexts/auth-context"
import { getInitials, getRoleIcon } from "@/lib/utils/user-utils"

interface PerfilDialogProps {
  open: boolean
  onClose: () => void
}

export function PerfilDialog({ open, onClose }: PerfilDialogProps) {
  const { user, roles, updateProfile, cambiarPassword } = useAuth()

  // ── Sección: nombre ──
  const [nombre, setNombre] = useState(user?.nombre ?? "")
  const [nombreMsg, setNombreMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // ── Sección: contraseña ──
  const [actualPass, setActualPass] = useState("")
  const [nuevaPass, setNuevaPass] = useState("")
  const [confirmarPass, setConfirmarPass] = useState("")
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null)

  if (!user) return null

  const rolDef = roles.find(r => r.id === user.rol)

  const handleGuardarNombre = () => {
    setNombreMsg(null)
    const result = updateProfile(nombre)
    if (result.success) {
      setNombreMsg({ ok: true, text: "Nombre actualizado correctamente" })
    } else {
      setNombreMsg({ ok: false, text: result.error ?? "Error al guardar" })
    }
  }

  const handleCambiarPassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPassMsg(null)
    if (!nuevaPass) { setPassMsg({ ok: false, text: "Ingresa la nueva contraseña" }); return }
    if (nuevaPass !== confirmarPass) { setPassMsg({ ok: false, text: "Las contraseñas no coinciden" }); return }
    const result = cambiarPassword(actualPass, nuevaPass)
    if (result.success) {
      setPassMsg({ ok: true, text: "Contraseña actualizada correctamente" })
      setActualPass(""); setNuevaPass(""); setConfirmarPass("")
    } else {
      setPassMsg({ ok: false, text: result.error ?? "Error al cambiar contraseña" })
    }
  }

  const handleClose = () => {
    setNombre(user.nombre)
    setNombreMsg(null)
    setActualPass(""); setNuevaPass(""); setConfirmarPass("")
    setPassMsg(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="max-w-md p-0 overflow-hidden gap-0" aria-describedby={undefined}>
        {/* Franja de color superior */}
        <div style={{ height: 3, background: "linear-gradient(90deg, var(--primary), color-mix(in oklch, var(--primary) 60%, var(--chart-2)))" }} />

        {/* Cabecera */}
        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="sr-only">Mi Perfil</DialogTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Avatar style={{ width: 52, height: 52, flexShrink: 0 }}>
              <AvatarFallback style={{ background: "var(--primary)", color: "var(--primary-foreground)", fontSize: 18, fontWeight: 700 }}>
                {getInitials(user.nombre)}
              </AvatarFallback>
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", lineHeight: 1.2 }}>{user.nombre}</p>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2 }}>{user.email}</p>
              <div style={{ marginTop: 6 }}>
                <Badge
                  variant="outline"
                  className={`${rolDef?.cls ?? "bg-muted text-muted-foreground border-border"} text-[10px] flex items-center gap-1 w-fit`}
                  style={{ padding: "2px 8px" }}
                >
                  {getRoleIcon(user.rol, 11)}
                  {rolDef?.label ?? user.rol}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Sección: Nombre ── */}
          <section style={{ borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", gap: 8 }}>
              <User size={13} style={{ color: "var(--primary)" }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Nombre visible</p>
            </div>
            <div style={{ padding: 14, background: "var(--background)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  value={nombre}
                  onChange={e => { setNombre(e.target.value); setNombreMsg(null) }}
                  placeholder="Tu nombre completo"
                  style={{ height: 34, fontSize: 13, flex: 1 }}
                />
                <Button
                  size="sm"
                  onClick={handleGuardarNombre}
                  disabled={!nombre.trim() || nombre.trim() === user.nombre}
                  style={{ height: 34, flexShrink: 0 }}
                >
                  Guardar
                </Button>
              </div>

              {/* Email (solo lectura) */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: "var(--secondary)" }}>
                <Mail size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{user.email}</p>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--muted-foreground)", background: "var(--card)", padding: "1px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>
                  Solo lectura
                </span>
              </div>

              {nombreMsg && (
                <Mensaje ok={nombreMsg.ok} text={nombreMsg.text} />
              )}
            </div>
          </section>

          {/* ── Sección: Contraseña ── */}
          <section style={{ borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", background: "var(--card)", display: "flex", alignItems: "center", gap: 8 }}>
              <KeyRound size={13} style={{ color: "var(--primary)" }} />
              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>Cambiar contraseña</p>
            </div>
            <form onSubmit={handleCambiarPassword} style={{ padding: 14, background: "var(--background)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>Contraseña actual</p>
                <Input
                  type="password"
                  value={actualPass}
                  onChange={e => { setActualPass(e.target.value); setPassMsg(null) }}
                  placeholder="••••••••"
                  style={{ height: 34, fontSize: 13 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>Nueva contraseña</p>
                  <Input
                    type="password"
                    value={nuevaPass}
                    onChange={e => { setNuevaPass(e.target.value); setPassMsg(null) }}
                    placeholder="Mín. 6 caracteres"
                    style={{ height: 34, fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 4 }}>Confirmar</p>
                  <Input
                    type="password"
                    value={confirmarPass}
                    onChange={e => { setConfirmarPass(e.target.value); setPassMsg(null) }}
                    placeholder="Repetir"
                    style={{ height: 34, fontSize: 13 }}
                  />
                </div>
              </div>

              {passMsg && <Mensaje ok={passMsg.ok} text={passMsg.text} />}

              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!actualPass || !nuevaPass || !confirmarPass}
                style={{ alignSelf: "flex-end", height: 32 }}
              >
                <KeyRound size={12} style={{ marginRight: 5 }} />
                Actualizar contraseña
              </Button>
            </form>
          </section>

        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Componente de mensaje inline ────────────────────────
function Mensaje({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 7, padding: "7px 10px", borderRadius: 7,
      background: ok
        ? "color-mix(in oklch, var(--chart-2) 10%, transparent)"
        : "color-mix(in oklch, var(--destructive) 10%, transparent)",
      border: `1px solid ${ok
        ? "color-mix(in oklch, var(--chart-2) 25%, transparent)"
        : "color-mix(in oklch, var(--destructive) 25%, transparent)"}`,
    }}>
      {ok
        ? <Check size={12} style={{ color: "var(--chart-2)", flexShrink: 0 }} />
        : <Info size={12} style={{ color: "var(--destructive)", flexShrink: 0 }} />
      }
      <p style={{ fontSize: 12, color: ok ? "var(--chart-2)" : "var(--destructive)" }}>{text}</p>
    </div>
  )
}
