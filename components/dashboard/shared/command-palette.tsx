"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  BookOpen, BarChart2, Users, ShieldAlert, ClipboardList,
  Settings, Layers, Home, Plus, Search, Moon, Sun, Monitor,
} from "lucide-react"
import { useTheme } from "next-themes"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateTab: (tab: string) => void
  onNuevaHU?: () => void
  onFocusSearch?: () => void
  canCreateHU?: boolean
  canManageUsers?: boolean
  isOwner?: boolean
}

const TAB_ITEMS: { tab: string; label: string; icon: typeof Home }[] = [
  { tab: "inicio",     label: "Inicio",    icon: Home },
  { tab: "historias",  label: "Historias",  icon: BookOpen },
  { tab: "analytics",  label: "Analytics",  icon: BarChart2 },
  { tab: "carga",      label: "Carga",      icon: Users },
  { tab: "bloqueos",   label: "Bloqueos",   icon: ShieldAlert },
  { tab: "casos",      label: "Casos",      icon: ClipboardList },
]

export function CommandPalette({
  open, onOpenChange, onNavigateTab, onNuevaHU, onFocusSearch,
  canCreateHU, canManageUsers, isOwner,
}: CommandPaletteProps) {
  const { setTheme, theme } = useTheme()
  const [search, setSearch] = useState("")

  // Reset search when closing
  useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  const go = useCallback((tab: string) => {
    onNavigateTab(tab)
    onOpenChange(false)
  }, [onNavigateTab, onOpenChange])

  const tabs = useMemo(() => {
    const items = [...TAB_ITEMS]
    if (canManageUsers) items.push({ tab: "admin", label: "Admin", icon: Settings })
    if (isOwner) items.push({ tab: "grupos", label: "Grupos", icon: Layers })
    return items
  }, [canManageUsers, isOwner])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Paleta de comandos">
      <CommandInput placeholder="Buscar comando..." value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>No se encontraron comandos.</CommandEmpty>

        {/* Actions */}
        <CommandGroup heading="Acciones">
          {canCreateHU && onNuevaHU && (
            <CommandItem onSelect={() => { onNuevaHU(); onOpenChange(false) }}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Historia de Usuario
              <span className="ml-auto text-xs text-muted-foreground">Alt+N</span>
            </CommandItem>
          )}
          {onFocusSearch && (
            <CommandItem onSelect={() => { onFocusSearch(); onOpenChange(false) }}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
              <span className="ml-auto text-xs text-muted-foreground">/</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Navegacion">
          {tabs.map(({ tab, label, icon: Icon }) => (
            <CommandItem key={tab} onSelect={() => go(tab)}>
              <Icon className="mr-2 h-4 w-4" />
              Ir a {label}
              <span className="ml-auto text-xs text-muted-foreground">Alt+{tabs.indexOf({ tab, label, icon: Icon } as never) + 1}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Theme */}
        <CommandGroup heading="Tema">
          <CommandItem onSelect={() => { setTheme("light"); onOpenChange(false) }}>
            <Sun className="mr-2 h-4 w-4" />
            Tema claro
            {theme === "light" && <span className="ml-auto text-xs text-primary">activo</span>}
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("dark"); onOpenChange(false) }}>
            <Moon className="mr-2 h-4 w-4" />
            Tema oscuro
            {theme === "dark" && <span className="ml-auto text-xs text-primary">activo</span>}
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("system"); onOpenChange(false) }}>
            <Monitor className="mr-2 h-4 w-4" />
            Tema del sistema
            {theme === "system" && <span className="ml-auto text-xs text-primary">activo</span>}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
