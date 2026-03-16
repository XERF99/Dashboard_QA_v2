"use client"

import { useState } from "react"
import { Search, Bell, LogOut, Shield, FlaskConical, Eye, Check, CheckCheck, Clock, X, UserCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge" 
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useAuth } from "@/lib/auth-context"
import { PerfilDialog } from "@/components/dashboard/perfil-dialog"
import type { Notificacion, TipoNotificacion } from "@/lib/types"

interface HeaderProps {
  busqueda: string
  onBusquedaChange: (value: string) => void
  notificaciones: Notificacion[]
  onMarcarLeida: (id: string) => void
  onMarcarTodasLeidas: () => void
}

// ── colores / íconos por tipo de notificación ────────────
const NOTIF_CFG: Record<TipoNotificacion, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  aprobacion_enviada:      { color:"var(--primary)",  bg:"color-mix(in oklch, var(--primary) 10%, transparent)",  label:"Enviado a aprobación", icon:<Clock size={13}/> },
  modificacion_solicitada: { color:"var(--chart-3)",  bg:"color-mix(in oklch, var(--chart-3) 10%, transparent)",  label:"Solicitud de modificación", icon:<Bell size={13}/> },
  caso_aprobado:           { color:"var(--chart-2)",  bg:"color-mix(in oklch, var(--chart-2) 10%, transparent)",  label:"Caso aprobado", icon:<Check size={13}/> },
  caso_rechazado:          { color:"var(--chart-4)",  bg:"color-mix(in oklch, var(--chart-4) 10%, transparent)",  label:"Caso rechazado", icon:<X size={13}/> },
  modificacion_habilitada: { color:"var(--chart-1)",  bg:"color-mix(in oklch, var(--chart-1) 10%, transparent)",  label:"Modificación habilitada", icon:<Check size={13}/> },
}

function fmtFecha(d: Date) {
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return d.toLocaleDateString("es", { day:"2-digit", month:"short" })
}

export function Header({ busqueda, onBusquedaChange, notificaciones, onMarcarLeida, onMarcarTodasLeidas }: HeaderProps) {
  const { user, logout, roles } = useAuth()
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const noLeidas = notificaciones.filter(n => !n.leida).length

  const getRoleIcon = (rol: string) => {
    switch (rol) {
      case "admin":   return <Shield className="h-3 w-3" />
      case "qa":      return <FlaskConical className="h-3 w-3" />
      case "viewer":  return <Eye className="h-3 w-3" />
      default:        return null
    }
  }

  const getRoleBadgeStyle = (rol: string) => {
    const found = roles.find(r => r.id === rol)
    return found?.cls ?? "bg-muted text-muted-foreground border-border"
  }

  const getRoleLabel = (rol: string) => {
    return roles.find(r => r.id === rol)?.label ?? rol
  }

  const getInitials = (nombre: string) => {
    return nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  // Función de búsqueda compartida para reutilizar en móvil y desktop
  const searchInput = (autoFocus?: boolean) => (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Buscar por código, título, responsable, caso..."
        value={busqueda}
        onChange={(e) => onBusquedaChange(e.target.value)}
        autoFocus={autoFocus}
        className={`pl-10 bg-secondary border-border ${busqueda ? "pr-8" : ""}`}
      />
      {busqueda && (
        <button
          onClick={() => onBusquedaChange("")}
          title="Limpiar búsqueda"
          style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", display:"flex", color:"var(--muted-foreground)", padding:2 }}
          className="hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          {/* Logo — se oculta si el search móvil está abierto */}
          <div className={`flex items-center gap-4 ${searchOpen ? "hidden sm:flex" : "flex"}`}>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">QA</span>
              </div>
              <span className="text-lg font-semibold text-foreground">QAControl</span>
            </div>
          </div>

          {/* Search expandido en móvil */}
          {searchOpen && (
            <div className="flex sm:hidden flex-1 mx-2">
              {searchInput(true)}
            </div>
          )}

          {/* Search desktop — siempre visible en sm+ */}
          <div className="hidden sm:flex flex-1 items-center justify-center px-8">
            {searchInput()}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Botón search móvil */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-muted-foreground hover:text-foreground"
              onClick={() => { setSearchOpen(v => !v); if (searchOpen) onBusquedaChange("") }}
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* ── Campana de notificaciones ── */}
            <Popover open={notifOpen} onOpenChange={setNotifOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                  <Bell className="h-5 w-5" />
                  {noLeidas > 0 && (
                    <span style={{
                      position:"absolute", top:6, right:6,
                      width:16, height:16, borderRadius:"50%",
                      background:"var(--chart-4)", color:"#fff",
                      fontSize:9, fontWeight:700,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      border:"2px solid var(--background)",
                    }}>
                      {noLeidas > 9 ? "9+" : noLeidas}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-0 w-[calc(100vw-2rem)] sm:w-90" style={{ maxHeight:480, display:"flex", flexDirection:"column" }}>
                {/* Cabecera */}
                <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <Bell size={15} style={{ color:"var(--primary)" }}/>
                    <span style={{ fontSize:14, fontWeight:700, color:"var(--foreground)" }}>Notificaciones</span>
                    {noLeidas > 0 && (
                      <Badge variant="outline" style={{ fontSize:10, padding:"0px 6px", color:"var(--chart-4)", borderColor:"var(--chart-4)", background:"color-mix(in oklch, var(--chart-4) 10%, transparent)" }}>
                        {noLeidas} nueva{noLeidas !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {noLeidas > 0 && (
                    <button
                      onClick={onMarcarTodasLeidas}
                      style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontSize:11, color:"var(--primary)", fontWeight:600, padding:0 }}
                    >
                      <CheckCheck size={13}/> Marcar todas
                    </button>
                  )}
                </div>

                {/* Lista */}
                <div style={{ overflowY:"auto", flex:1 }}>
                  {notificaciones.length === 0 ? (
                    <div style={{ padding:32, textAlign:"center" }}>
                      <Bell size={28} style={{ margin:"0 auto 10px", opacity:0.25, display:"block" }}/>
                      <p style={{ fontSize:13, color:"var(--muted-foreground)" }}>Sin notificaciones</p>
                    </div>
                  ) : notificaciones.map(n => {
                    const cfg = NOTIF_CFG[n.tipo]
                    return (
                      <div
                        key={n.id}
                        onClick={() => onMarcarLeida(n.id)}
                        style={{
                          padding:"12px 16px",
                          borderBottom:"1px solid var(--border)",
                          background: n.leida ? "transparent" : "color-mix(in oklch, var(--primary) 4%, transparent)",
                          cursor: n.leida ? "default" : "pointer",
                          display:"flex", gap:10, alignItems:"flex-start",
                          transition:"background 0.15s",
                        }}
                      >
                        {/* Ícono */}
                        <div style={{
                          width:30, height:30, borderRadius:"50%", flexShrink:0,
                          background:cfg.bg, color:cfg.color,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          border:`1px solid ${cfg.color}`,
                          opacity: n.leida ? 0.55 : 1,
                        }}>
                          {cfg.icon}
                        </div>

                        {/* Contenido */}
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                            <span style={{ fontSize:11, fontWeight:700, color:cfg.color, opacity: n.leida ? 0.7 : 1 }}>
                              {cfg.label}
                            </span>
                            {!n.leida && (
                              <span style={{ width:6, height:6, borderRadius:"50%", background:cfg.color, flexShrink:0, display:"inline-block" }}/>
                            )}
                          </div>
                          <p style={{ fontSize:12, fontWeight:600, color:"var(--foreground)", marginBottom:3, opacity: n.leida ? 0.7 : 1 }}>
                            {n.titulo}
                          </p>
                          <p style={{ fontSize:11, color:"var(--muted-foreground)", lineHeight:1.4, wordBreak:"break-word" }}>
                            {n.descripcion}
                          </p>
                          <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:4, opacity:0.7 }}>
                            {fmtFecha(n.fecha)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <ThemeSwitcher />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user ? getInitials(user.nombre) : "?"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                {user && (
                  <>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm font-medium text-foreground">{user.nombre}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <Badge variant="outline" className={`${getRoleBadgeStyle(user.rol)} w-fit flex items-center gap-1`}>
                          {getRoleIcon(user.rol)}
                          {getRoleLabel(user.rol)}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => setPerfilOpen(true)}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Mi Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setConfirmLogoutOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <PerfilDialog open={perfilOpen} onClose={() => setPerfilOpen(false)} />

      {/* Confirmación de cierre de sesión */}
      <AlertDialog open={confirmLogoutOpen} onOpenChange={setConfirmLogoutOpen}>
        <AlertDialogContent className="max-w-sm p-0 overflow-hidden">
          <div style={{ background:"var(--card)", borderRadius:"inherit", overflow:"hidden" }}>
            {/* Gradiente superior */}
            <div style={{ height:3, background:"linear-gradient(90deg, var(--chart-4), var(--destructive))" }} />
            <div style={{ padding:"24px" }}>
              {/* Ícono + Título */}
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
                <div style={{
                  width:44, height:44, borderRadius:"50%", flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  background:"color-mix(in oklch, var(--destructive) 12%, transparent)",
                  border:"1px solid color-mix(in oklch, var(--destructive) 25%, transparent)"
                }}>
                  <LogOut size={20} style={{ color:"var(--destructive)" }} />
                </div>
                <div>
                  <AlertDialogTitle className="text-base font-semibold leading-tight">
                    ¿Cerrar sesión?
                  </AlertDialogTitle>
                  <p style={{ fontSize:12, color:"var(--muted-foreground)", marginTop:2 }}>
                    Tu sesión actual será finalizada
                  </p>
                </div>
              </div>

              {/* Info del usuario */}
              <div style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"10px 14px", borderRadius:10,
                background:"var(--secondary)", border:"1px solid var(--border)", marginBottom:20
              }}>
                <div style={{
                  width:32, height:32, borderRadius:"50%", flexShrink:0,
                  background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, fontWeight:700, color:"var(--primary-foreground)"
                }}>
                  {user?.nombre?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2)}
                </div>
                <div>
                  <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)" }}>{user?.nombre}</p>
                  <p style={{ fontSize:11, color:"var(--muted-foreground)" }}>{user?.email}</p>
                </div>
              </div>

              <AlertDialogDescription className="sr-only">
                Confirmación de cierre de sesión para {user?.nombre}
              </AlertDialogDescription>

              <AlertDialogFooter className="gap-2 sm:gap-2">
                <AlertDialogCancel className="flex-1">Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={logout}
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <LogOut size={14} className="mr-1.5" />
                  Cerrar sesión
                </AlertDialogAction>
              </AlertDialogFooter>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
