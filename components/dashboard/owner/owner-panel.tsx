"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, RefreshCw, Layers, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { type Grupo, type MetricasGrupo, type GrupoConMetricas, type Usuario } from "./owner-panel-shared"
import { GrupoFormDialog, ConfirmDialog } from "./owner-panel-dialogs"
import { GrupoDetail } from "./owner-panel-detail"

export function OwnerPanel() {
  const [items, setItems]           = useState<GrupoConMetricas[]>([])
  const [usuarios, setUsuarios]     = useState<Usuario[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [grupoSel, setGrupoSel]     = useState<string | null>(null)

  const [formOpen, setFormOpen]         = useState(false)
  const [editTarget, setEditTarget]     = useState<Grupo | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const gruposActivos = items.filter(i => i.grupo.activo).length
  const totales = items.reduce(
    (acc, { metricas: m }) => ({ hus: acc.hus + m.totalHUs, casos: acc.casos + m.totalCasos, usuarios: acc.usuarios + m.totalUsuarios }),
    { hus: 0, casos: 0, usuarios: 0 }
  )

  const itemSel = items.find(i => i.grupo.id === grupoSel)

  const fetchGrupos = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/grupos")
      if (!res.ok) throw new Error("Error al cargar grupos")
      const { grupos } = await res.json() as { grupos: Grupo[] }
      const conMetricas = await Promise.all(
        grupos.map(async g => {
          const mr = await fetch(`/api/grupos/${g.id}/metricas`)
          const { metricas } = await mr.json() as { metricas: MetricasGrupo }
          return { grupo: g, metricas }
        })
      )
      setItems(conMetricas)
      setGrupoSel(prev => {
        if (prev && conMetricas.some(i => i.grupo.id === prev)) return prev
        return conMetricas[0]?.grupo.id ?? null
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally { setLoading(false) }
  }, [])

  const fetchUsuarios = useCallback(async () => {
    try {
      const res = await fetch("/api/users")
      if (!res.ok) return
      const { users } = await res.json() as { users: Usuario[] }
      setUsuarios(users.filter(u => u.rol !== "owner"))
    } catch { /* silencioso */ }
  }, [])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchGrupos(), fetchUsuarios()])
  }, [fetchGrupos, fetchUsuarios])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleCreate = async (data: { nombre: string; descripcion: string }) => {
    setSaving(true)
    try {
      const res = await fetch("/api/grupos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al crear"); return }
      setFormOpen(false); await fetchAll()
    } finally { setSaving(false) }
  }

  const handleEdit = async (data: { nombre: string; descripcion: string }) => {
    if (!editTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/grupos/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error al actualizar"); return }
      setEditTarget(null); await fetchAll()
    } finally { setSaving(false) }
  }

  const handleToggle = async (id: string, activo: boolean) => {
    await fetch(`/api/grupos/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ activo }) })
    await fetchAll()
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/grupos/${id}`, { method: "DELETE" })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? "Error al eliminar"); return }
      setDeleteConfirm(null)
      if (grupoSel === id) setGrupoSel(null)
      await fetchAll()
    } finally { setSaving(false) }
  }

  return (
    <div className="w-full space-y-5 py-2">

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">Panel de Grupos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Workspaces independientes con datos, configuración y miembros propios.
          </p>
        </div>
        <Button variant="outline" size="icon-sm" onClick={fetchAll} title="Refrescar">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Grupos activos",   value: gruposActivos,      cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total grupos",     value: items.length,       cls: "text-foreground" },
          { label: "Historias total",  value: totales.hus,        cls: "text-primary" },
          { label: "Miembros total",   value: totales.usuarios,   cls: "text-sky-500" },
        ].map(({ label, value, cls }) => (
          <Card key={label} className="border shadow-none">
            <CardContent className="p-4">
              <div className={cn("text-2xl font-extrabold", cls)}>{value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="flex items-center gap-2"><AlertCircle className="h-4 w-4 shrink-0" />{error}</span>
          <Button variant="ghost" size="icon-sm" onClick={() => setError(null)} className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs">✕</Button>
        </div>
      )}

      {loading ? (
        <div className="animate-pulse overflow-hidden rounded-xl border border-border flex flex-col md:flex-row min-h-100 md:min-h-125">
          <div className="md:w-52 md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/40 p-3 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar">
            {[1,2,3].map(i => <div key={i} className="h-12 md:h-14 w-32 md:w-auto shrink-0 rounded-lg bg-muted" />)}
          </div>
          <div className="flex-1 p-5 space-y-4">
            <div className="h-12 rounded-lg bg-muted w-1/2" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{[1,2,3,4].map(i => <div key={i} className="h-14 rounded-lg bg-muted" />)}</div>
            <div className="h-px bg-muted" />
            <div className="h-40 rounded-lg bg-muted" />
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border py-24 text-center">
          <div className="rounded-2xl bg-muted p-4"><Layers className="h-10 w-10 text-muted-foreground/40" /></div>
          <div>
            <p className="font-semibold">No hay grupos creados</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">Crea el primer workspace para que los equipos puedan trabajar.</p>
          </div>
          <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" />Crear primer grupo</Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border flex flex-col md:flex-row min-h-100 md:min-h-130">

          <div className="flex flex-col md:w-60 md:shrink-0 border-b md:border-b-0 md:border-r border-border bg-muted/20">
            <div className="border-b border-border p-2.5">
              <Button size="sm" className="w-full" onClick={() => setFormOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Nuevo grupo
              </Button>
            </div>
            <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:flex-1 p-2 gap-1 md:gap-0.5 no-scrollbar">
              {items.map(item => {
                const isSelected = grupoSel === item.grupo.id
                const nMiembros = usuarios.filter(u => u.grupoId === item.grupo.id).length
                return (
                  <button
                    key={item.grupo.id}
                    onClick={() => setGrupoSel(item.grupo.id)}
                    className={cn(
                      "shrink-0 md:w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 md:py-2.5 text-left transition-colors whitespace-nowrap md:whitespace-normal",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted text-foreground",
                    )}
                  >
                    <span className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      item.grupo.activo
                        ? (isSelected ? "bg-emerald-300" : "bg-emerald-500")
                        : (isSelected ? "bg-white/40" : "bg-muted-foreground/40"),
                    )} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[13px]">{item.grupo.nombre}</p>
                      <p className={cn("text-[11px] hidden md:block", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {nMiembros} {nMiembros === 1 ? "miembro" : "miembros"}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-background">
            {!itemSel ? (
              <div className="flex h-full min-h-48 items-center justify-center text-muted-foreground text-sm">
                Selecciona un grupo para ver su detalle.
              </div>
            ) : (
              <GrupoDetail
                item={itemSel}
                usuarios={usuarios}
                onEdit={g => setEditTarget(g)}
                onDelete={id => setDeleteConfirm(id)}
                onToggle={handleToggle}
                onRefreshUsers={fetchAll}
                saving={saving}
                setSaving={setSaving}
                setError={setError}
              />
            )}
          </div>
        </div>
      )}

      <GrupoFormDialog
        open={formOpen || !!editTarget}
        initial={editTarget ?? undefined}
        onSave={editTarget ? handleEdit : handleCreate}
        onClose={() => { setFormOpen(false); setEditTarget(null) }}
        loading={saving}
      />
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Eliminar grupo"
        description="Esta acción es irreversible. Solo puedes eliminar un grupo sin usuarios ni historias."
        destructive
        confirmLabel="Eliminar grupo"
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        loading={saving}
      />
    </div>
  )
}
