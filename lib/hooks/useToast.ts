"use client"
import { useState } from "react"

export type ToastType = "success" | "warning" | "error" | "info"
export interface ToastItem { id: number; type: ToastType; title: string; desc?: string }

let _tc = 0

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const addToast = (t: Omit<ToastItem, "id">) => {
    const id = ++_tc
    setToasts(p => [...p, { ...t, id }])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4500)
  }
  const dismissToast = (id: number) => setToasts(p => p.filter(x => x.id !== id))
  return { toasts, addToast, dismissToast }
}
