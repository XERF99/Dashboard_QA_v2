"use client"

import type { ReactNode } from "react"

export interface NavTabItem {
  id: string
  label: string
  icon: ReactNode
  badge?: number
}

interface NavTabGroupProps {
  items: readonly NavTabItem[]
  activeId: string
  onSelect: (id: string) => void
  size?: "normal" | "small"
}

export function NavTabGroup({ items, activeId, onSelect, size = "normal" }: NavTabGroupProps) {
  const padding = size === "small" ? "6px 10px" : "8px 12px"
  const fontSize = size === "small" ? 12 : 13
  const gap = size === "small" ? 7 : 8
  const borderRadius = size === "small" ? 7 : 8

  return (
    <>
      {items.map(item => {
        const active = activeId === item.id
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: "flex", alignItems: "center", gap,
              padding, borderRadius, fontSize,
              fontWeight: active ? 700 : 400,
              border: `1px solid ${active ? "color-mix(in oklch, var(--primary) 35%, transparent)" : "transparent"}`,
              background: active ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent",
              color: active ? "var(--primary)" : "var(--muted-foreground)",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
            className={active ? "" : "hover:bg-secondary/60 hover:text-foreground"}
          >
            {item.icon}{item.label}
            {item.badge != null && item.badge > 0 && (
              <span className="inline-flex items-center justify-center min-w-4 h-4 rounded-full text-[9px] font-bold bg-chart-4 text-white px-1 ml-0.5">
                {item.badge}
              </span>
            )}
          </button>
        )
      })}
    </>
  )
}
