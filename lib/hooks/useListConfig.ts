import { useState } from "react"

export interface IdLabelItem {
  id: string
  label: string
}

/** Convierte un label de texto libre a un ID seguro (snake_case, sin tildes) */
export function labelToId(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
}

/**
 * Hook genérico para listas configurables de items con id + label.
 * Encapsula agregar, eliminar, reordenar, editar y restaurar.
 */
export function useListConfig<T extends IdLabelItem>(
  items: T[],
  onChange: (items: T[]) => void,
  defaults: T[],
) {
  const [nuevoLabel, setNuevoLabel] = useState("")

  function agregar() {
    const label = nuevoLabel.trim()
    if (!label) return
    const id = labelToId(label)
    if (!id || items.some(t => t.id === id)) return
    onChange([...items, { id, label } as T])
    setNuevoLabel("")
  }

  function eliminar(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  function mover(idx: number, dir: -1 | 1) {
    const swap = idx + dir
    if (swap < 0 || swap >= items.length) return
    const next = [...items]
    ;[next[idx], next[swap]] = [next[swap]!, next[idx]!]
    onChange(next)
  }

  function editarLabel(idx: number, label: string) {
    const next = [...items]
    next[idx] = { ...next[idx]!, label }
    onChange(next)
  }

  const hayDiferencias =
    items.length !== defaults.length ||
    items.some((t, i) =>
      t.id !== defaults[i]?.id ||
      t.label !== defaults[i]?.label
    )

  function restaurar() {
    onChange([...defaults])
  }

  return { nuevoLabel, setNuevoLabel, agregar, eliminar, mover, editarLabel, hayDiferencias, restaurar }
}
