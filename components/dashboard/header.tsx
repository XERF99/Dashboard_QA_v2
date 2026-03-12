"use client"

import { useState } from "react"
import { Search, Bell, LogOut, Shield, Edit, Eye } from "lucide-react"
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
import { useAuth, roleDescriptions, type UserRole } from "@/lib/auth-context"

interface HeaderProps {
  busqueda: string
  onBusquedaChange: (value: string) => void
}

export function Header({ busqueda, onBusquedaChange }: HeaderProps) {
  const { user, logout } = useAuth()
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)

  const getRoleIcon = (rol: UserRole) => {
    switch (rol) {
      case "admin": return <Shield className="h-3 w-3" />
      case "editor": return <Edit className="h-3 w-3" />
      case "viewer": return <Eye className="h-3 w-3" />
    }
  }

  const getRoleBadgeStyle = (rol: UserRole) => {
    switch (rol) {
      case "admin": return "bg-chart-4/20 text-chart-4 border-chart-4/30"
      case "editor": return "bg-chart-1/20 text-chart-1 border-chart-1/30"
      case "viewer": return "bg-chart-2/20 text-chart-2 border-chart-2/30"
    }
  }

  const getInitials = (nombre: string) => {
    return nombre.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-sm font-bold text-primary-foreground">QA</span>
              </div>
              <span className="text-lg font-semibold text-foreground">Dashboard QA</span>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center px-8">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cambios..."
                value={busqueda}
                onChange={(e) => onBusquedaChange(e.target.value)}
                className="pl-10 bg-secondary border-border"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </Button>

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
                          {roleDescriptions[user.rol].label}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                  </>
                )}
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
