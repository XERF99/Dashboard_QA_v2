"use client"

import { useState } from "react"
import { Search, Bell, LogOut, Check, CheckCheck, Clock, X, UserCircle, Lock } from "lucide-react"
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
import { PerfilDialog } from "../usuarios/perfil-dialog"
import type { Notificacion, TipoNotificacion } from "@/lib/types"
import { getInitials, getRoleIcon } from "@/lib/utils/user-utils"
import { fmtFecha } from "@/lib/utils/date-utils"

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
  cuenta_bloqueada:        { color:"var(--chart-4)",  bg:"color-mix(in oklch, var(--chart-4) 10%, transparent)",  label:"Cuenta bloqueada",         icon:<Lock size={13}/> },
}

export function Header({ busqueda, onBusquedaChange, notificaciones, onMarcarLeida, onMarcarTodasLeidas }: HeaderProps) {
  const { user, logout, roles } = useAuth()
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [perfilOpen, setPerfilOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const noLeidas = notificaciones.filter(n => !n.leida).length

  const getRoleBadgeStyle = (rol: string) => {
    const found = roles.find(r => r.id === rol)
    return found?.cls ?? "bg-muted text-muted-foreground border-border"
  }

  const getRoleLabel = (rol: string) => {
    return roles.find(r => r.id === rol)?.label ?? rol
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
          className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer flex items-center text-muted-foreground p-0.5 hover:text-foreground transition-colors"
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
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-chart-4 text-white text-[9px] font-bold flex items-center justify-center border-2 border-background">
                      {noLeidas > 9 ? "9+" : noLeidas}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="p-0 w-[calc(100vw-2rem)] sm:w-90 max-h-120 flex flex-col">
                {/* Cabecera */}
                <div className="px-4 pt-3.5 pb-2.5 border-b border-border flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <Bell size={15} className="text-primary"/>
                    <span className="text-sm font-bold text-foreground">Notificaciones</span>
                    {noLeidas > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-chart-4 border-chart-4 bg-chart-4/10">
                        {noLeidas} nueva{noLeidas !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {noLeidas > 0 && (
                    <button
                      onClick={onMarcarTodasLeidas}
                      className="bg-transparent border-0 cursor-pointer flex items-center gap-1 text-[11px] text-primary font-semibold p-0 hover:opacity-80 transition-opacity"
                    >
                      <CheckCheck size={13}/> Marcar todas
                    </button>
                  )}
                </div>

                {/* Lista */}
                <div className="overflow-y-auto flex-1">
                  {notificaciones.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell size={28} className="mx-auto mb-2.5 opacity-25 block"/>
                      <p className="text-sm text-muted-foreground">Sin notificaciones</p>
                    </div>
                  ) : notificaciones.map(n => {
                    const cfg = NOTIF_CFG[n.tipo]
                    return (
                      <div
                        key={n.id}
                        onClick={() => onMarcarLeida(n.id)}
                        className={`px-4 py-3 border-b border-border flex gap-2.5 items-start transition-[background] duration-150 ${n.leida ? "cursor-default" : "cursor-pointer"}`}
                        style={{ background: n.leida ? "transparent" : "color-mix(in oklch, var(--primary) 4%, transparent)" }}
                      >
                        {/* Ícono */}
                        <div
                          className="w-7.5 h-7.5 rounded-full shrink-0 flex items-center justify-center border"
                          style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color, opacity: n.leida ? 0.55 : 1 }}
                        >
                          {cfg.icon}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[11px] font-bold" style={{ color: cfg.color, opacity: n.leida ? 0.7 : 1 }}>
                              {cfg.label}
                            </span>
                            {!n.leida && (
                              <span className="w-1.5 h-1.5 rounded-full shrink-0 inline-block" style={{ background: cfg.color }}/>
                            )}
                          </div>
                          <p className={`text-xs font-semibold text-foreground mb-0.5 ${n.leida ? "opacity-70" : ""}`}>
                            {n.titulo}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-snug wrap-break-word">
                            {n.descripcion}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-1 opacity-70">
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
          <div className="bg-card rounded-[inherit] overflow-hidden">
            <div className="h-0.75 bg-linear-to-r from-chart-4 to-destructive" />
            <div className="p-6">
              {/* Ícono + Título */}
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center bg-destructive/10 border border-destructive/25">
                  <LogOut size={20} className="text-destructive" />
                </div>
                <div>
                  <AlertDialogTitle className="text-base font-semibold leading-tight">
                    ¿Cerrar sesión?
                  </AlertDialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tu sesión actual será finalizada
                  </p>
                </div>
              </div>

              {/* Info del usuario */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] bg-secondary border border-border mb-5">
                <div className="w-8 h-8 rounded-full shrink-0 bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  {user ? getInitials(user.nombre) : "?"}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">{user?.nombre}</p>
                  <p className="text-[11px] text-muted-foreground">{user?.email}</p>
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
