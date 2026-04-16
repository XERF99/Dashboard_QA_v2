"use client"

import { useHotkeys } from "react-hotkeys-hook"

interface ShortcutActions {
  setTabActiva: (tab: string) => void
  onNuevaHU?: () => void
  focusSearch?: () => void
  canCreateHU?: boolean
  onOpenCommandPalette?: () => void
}

/**
 * Global keyboard shortcuts for the dashboard.
 *
 * Navigation:
 *   Alt+1..8  — Switch tabs (Inicio, Historias, Analytics, ...)
 *   Alt+N     — New HU (when permitted)
 *   Alt+B or / — Focus search bar
 *   Ctrl+K / Cmd+K — Open command palette
 *   Escape    — Close modals / clear search (handled by individual components)
 */
export function useKeyboardShortcuts({ setTabActiva, onNuevaHU, focusSearch, canCreateHU, onOpenCommandPalette }: ShortcutActions) {
  const tabs = ["inicio", "historias", "analytics", "carga", "bloqueos", "casos", "admin", "grupos"]

  // Alt+1 through Alt+8 for tab navigation
  useHotkeys("alt+1", () => setTabActiva(tabs[0]!), { preventDefault: true })
  useHotkeys("alt+2", () => setTabActiva(tabs[1]!), { preventDefault: true })
  useHotkeys("alt+3", () => setTabActiva(tabs[2]!), { preventDefault: true })
  useHotkeys("alt+4", () => setTabActiva(tabs[3]!), { preventDefault: true })
  useHotkeys("alt+5", () => setTabActiva(tabs[4]!), { preventDefault: true })
  useHotkeys("alt+6", () => setTabActiva(tabs[5]!), { preventDefault: true })
  useHotkeys("alt+7", () => setTabActiva(tabs[6]!), { preventDefault: true })
  useHotkeys("alt+8", () => setTabActiva(tabs[7]!), { preventDefault: true })

  // Alt+N — New HU
  useHotkeys("alt+n", () => {
    if (canCreateHU && onNuevaHU) onNuevaHU()
  }, { preventDefault: true })

  // "/" or Alt+B — Focus search bar
  useHotkeys("/", (e) => {
    // Don't trigger when typing in an input/textarea
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
    e.preventDefault()
    focusSearch?.()
  })
  useHotkeys("alt+b", () => focusSearch?.(), { preventDefault: true })

  // Ctrl+K / Cmd+K — Open command palette
  useHotkeys("mod+k", () => onOpenCommandPalette?.(), { preventDefault: true })
}
