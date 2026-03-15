"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, Lock, Mail, ArrowRight, Loader2, Sun, Moon, KeyRound } from "lucide-react"

export function LoginScreen() {
  const { login, pendientePassword, cambiarPassword } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [focused, setFocused] = useState<"email" | "password" | "newpass" | "confirmpass" | null>(null)
  const [isDark, setIsDark] = useState(true)

  // ── Estado para cambio de contraseña ──
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPass, setCurrentPass] = useState("")
  const [newPass, setNewPass] = useState("")
  const [confirmPass, setConfirmPass] = useState("")

  useEffect(() => {
    const html = document.documentElement
    setIsDark(html.classList.contains("dark"))
  }, [])

  useEffect(() => {
    if (pendientePassword) setShowChangePassword(true)
  }, [pendientePassword])

  const toggleTheme = () => {
    const html = document.documentElement
    if (isDark) { html.classList.remove("dark"); setIsDark(false) }
    else { html.classList.add("dark"); setIsDark(true) }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    if (!email.trim()) { setError("Ingresa tu email"); setIsLoading(false); return }
    if (!password.trim()) { setError("Ingresa tu contraseña"); setIsLoading(false); return }
    await new Promise(resolve => setTimeout(resolve, 600))
    const result = login(email, password)
    if (!result.success) setError(result.error || "Credenciales incorrectas")
    else if (result.debeCambiar) {
      setCurrentPass(password)
      setShowChangePassword(true)
    }
    setIsLoading(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!newPass.trim()) { setError("Ingresa la nueva contraseña"); return }
    if (newPass !== confirmPass) { setError("Las contraseñas no coinciden"); return }
    const result = cambiarPassword(currentPass, newPass)
    if (!result.success) setError(result.error || "Error al cambiar contraseña")
    else setShowChangePassword(false)
  }

  // ── Tokens de color ──
  const cardBg      = isDark ? "rgba(15,17,23,0.92)"        : "rgba(255,255,255,0.95)"
  const cardBorder  = isDark ? "rgba(255,255,255,0.07)"     : "rgba(0,0,0,0.08)"
  const cardShadow  = isDark
    ? "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
    : "0 8px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)"
  const titleColor  = isDark ? "#f1f5f9"   : "#0f172a"
  const subtitleColor = isDark ? "#64748b" : "#64748b"
  const labelColor  = isDark ? "#94a3b8"   : "#64748b"
  const inputBg     = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"
  const inputBorderNormal  = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.12)"
  const inputBorderFocused = isDark ? "rgba(59,130,246,0.55)"  : "rgba(37,99,235,0.6)"
  const inputColor  = isDark ? "#e2e8f0"  : "#0f172a"
  const iconColorNormal  = isDark ? "#475569" : "#94a3b8"
  const iconColorFocused = isDark ? "#3b82f6" : "#2563eb"
  const footerColor = isDark ? "#334155"   : "#94a3b8"
  const footerColor2 = isDark ? "#1e293b"  : "#cbd5e1"
  const gridColor   = isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.4)"
  const glow1       = isDark ? "rgba(59,130,246,0.12)" : "rgba(59,130,246,0.06)"
  const glow2       = isDark ? "rgba(29,78,216,0.10)"  : "rgba(37,99,235,0.05)"
  const toggleBg    = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"
  const toggleBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
  const toggleColor  = isDark ? "#94a3b8"  : "#64748b"

  const inputStyle = (field: string): React.CSSProperties => ({
    paddingLeft: "38px", background: inputBg,
    border: `1px solid ${focused === field ? inputBorderFocused : inputBorderNormal}`,
    borderRadius: "8px", color: inputColor, fontSize: "14px", height: "44px", transition: "border-color 0.2s",
  })

  const iconStyle = (field: string): React.CSSProperties => ({
    position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)",
    width: "15px", height: "15px", pointerEvents: "none",
    color: focused === field ? iconColorFocused : iconColorNormal, transition: "color 0.2s",
  })

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: isDark
        ? "linear-gradient(135deg, #0a0a0f 0%, #0f1117 40%, #111827 100%)"
        : "linear-gradient(135deg, #eef2f9 0%, #f4f6fa 40%, #e8ecf5 100%)"
      }}
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />
      <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${glow1} 0%, transparent 70%)` }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${glow2} 0%, transparent 70%)` }} />

      <button onClick={toggleTheme} aria-label="Cambiar tema" style={{
        position: "absolute", top: "20px", right: "20px", width: "36px", height: "36px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: toggleBg, border: `1px solid ${toggleBorder}`, borderRadius: "50%",
        cursor: "pointer", color: toggleColor, transition: "all 0.2s", zIndex: 20,
      }}>
        {isDark ? <Sun style={{ width: "15px", height: "15px" }} /> : <Moon style={{ width: "15px", height: "15px" }} />}
      </button>

      <div className="relative w-full max-w-sm z-10">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="flex h-14 w-14 items-center justify-center" style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)",
              borderRadius: "14px",
              boxShadow: "0 0 0 1px rgba(59,130,246,0.3), 0 8px 32px rgba(30,64,175,0.4)",
            }}>
              <span style={{ fontSize: "16px", fontWeight: "700", letterSpacing: "0.05em", color: "#93c5fd", fontFamily: "monospace" }}>
                QA
              </span>
            </div>
          </div>
          <h1 style={{ fontSize: "26px", fontWeight: "400", letterSpacing: "0.06em", color: titleColor, fontFamily: "Georgia, serif", lineHeight: 1.2, margin: 0 }}>
            QAControl
          </h1>
          <p style={{ fontSize: "11px", color: subtitleColor, marginTop: "6px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace" }}>
            Gestión de Cambios
          </p>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: "16px", padding: "36px 32px", backdropFilter: "blur(20px)", boxShadow: cardShadow }}>

          {/* ── Formulario de cambio de contraseña ── */}
          {showChangePassword ? (
            <form onSubmit={handleChangePassword}>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ width:48, height:48, borderRadius:"50%", margin:"0 auto 12px",
                  background:"rgba(59,130,246,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <KeyRound style={{ width:22, height:22, color:"#3b82f6" }}/>
                </div>
                <p style={{ fontSize:15, fontWeight:600, color:titleColor }}>Cambiar contraseña</p>
                <p style={{ fontSize:12, color:subtitleColor, marginTop:4 }}>
                  Debes establecer una nueva contraseña para continuar
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: labelColor, marginBottom: "8px", fontFamily: "monospace" }}>
                    Nueva contraseña
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock style={iconStyle("newpass")} />
                    <Input type="password" placeholder="Mínimo 6 caracteres"
                      value={newPass} onChange={e => setNewPass(e.target.value)}
                      onFocus={() => setFocused("newpass")} onBlur={() => setFocused(null)}
                      className="border-0" style={inputStyle("newpass")} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: labelColor, marginBottom: "8px", fontFamily: "monospace" }}>
                    Confirmar contraseña
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock style={iconStyle("confirmpass")} />
                    <Input type="password" placeholder="Repetir contraseña"
                      value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                      onFocus={() => setFocused("confirmpass")} onBlur={() => setFocused(null)}
                      className="border-0" style={inputStyle("confirmpass")} />
                  </div>
                </div>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px",
                    color: isDark ? "#fca5a5" : "#dc2626", fontSize: "13px" }}>
                    <AlertCircle style={{ width: "15px", height: "15px", color: isDark ? "#f87171" : "#ef4444", flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <Button type="submit" style={{
                  width: "100%", height: "44px",
                  background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                  border: "none", borderRadius: "8px", color: "#fff",
                  fontSize: "12px", letterSpacing: "0.1em", fontFamily: "monospace",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 4px 20px rgba(37,99,235,0.35)", marginTop: "4px", textTransform: "uppercase",
                }}>
                  <KeyRound style={{ width: "15px", height: "15px" }} /> Cambiar contraseña
                </Button>
              </div>
            </form>
          ) : (
            /* ── Formulario de login normal ── */
            <form onSubmit={handleLogin}>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: labelColor, marginBottom: "8px", fontFamily: "monospace" }}>
                    Correo electrónico
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail style={iconStyle("email")} />
                    <Input type="email" placeholder="usuario@empresa.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                      autoComplete="email" className="border-0" style={inputStyle("email")} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", color: labelColor, marginBottom: "8px", fontFamily: "monospace" }}>
                    Contraseña
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock style={iconStyle("password")} />
                    <Input type="password" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                      autoComplete="current-password" className="border-0" style={inputStyle("password")} />
                  </div>
                </div>

                {error && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px",
                    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px",
                    color: isDark ? "#fca5a5" : "#dc2626", fontSize: "13px" }}>
                    <AlertCircle style={{ width: "15px", height: "15px", color: isDark ? "#f87171" : "#ef4444", flexShrink: 0 }} />
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={isLoading} style={{
                  width: "100%", height: "44px",
                  background: isLoading ? "rgba(30,64,175,0.5)" : "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                  border: "none", borderRadius: "8px", color: "#fff",
                  fontSize: "12px", letterSpacing: "0.1em", fontFamily: "monospace",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  transition: "opacity 0.2s",
                  boxShadow: isLoading ? "none" : "0 4px 20px rgba(37,99,235,0.35)",
                  marginTop: "4px", textTransform: "uppercase",
                }}>
                  {isLoading
                    ? <><Loader2 style={{ width: "15px", height: "15px" }} className="animate-spin" /> Verificando...</>
                    : <><ArrowRight style={{ width: "15px", height: "15px" }} /> Ingresar</>
                  }
                </Button>
              </div>
            </form>
          )}

          <p style={{ marginTop: "24px", textAlign: "center", fontSize: "12px", color: footerColor, fontFamily: "monospace", letterSpacing: "0.04em" }}>
            ¿Sin acceso? Contacta al administrador
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", fontSize: "10px", color: footerColor2, letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "monospace" }}>
          Sistema interno · Acceso restringido
        </p>
      </div>
    </div>
  )
}
