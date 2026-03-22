"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark")
  const [mounted, setMounted] = useState(false)

  // Detectar preferencia del sistema
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("qa-dashboard-theme") as Theme | null
    if (stored) {
      setThemeState(stored)
    }
  }, [])

  // Aplicar tema
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    
    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark")
        setResolvedTheme("dark")
      } else {
        root.classList.remove("dark")
        setResolvedTheme("light")
      }
    }

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      applyTheme(mediaQuery.matches)

      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches)
      mediaQuery.addEventListener("change", handler)
      return () => mediaQuery.removeEventListener("change", handler)
    } else {
      applyTheme(theme === "dark")
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("qa-dashboard-theme", newTheme)
  }

  // Evitar flash de tema incorrecto
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "system", setTheme, resolvedTheme: "dark" }}>
        {children}
      </ThemeContext.Provider>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider")
  }
  return context
}
