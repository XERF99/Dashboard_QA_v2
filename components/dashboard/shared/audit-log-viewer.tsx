"use client"

import { useState, useEffect } from "react"
import { History, Search, ChevronDown, RefreshCw, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Paginador } from "@/components/ui/paginator"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuditLog } from "@/lib/hooks/useAuditLog"

const ACTION_STYLES: Record<string, { color: string; label: string }> = {
  CREATE:           { color: "var(--chart-2)", label: "Crear" },
  UPDATE:           { color: "var(--chart-1)", label: "Actualizar" },
  DELETE:           { color: "var(--chart-4)", label: "Eliminar" },
  LOGIN:            { color: "var(--primary)",  label: "Login" },
  LOGOUT:           { color: "var(--muted-foreground)", label: "Logout" },
  LOGIN_FAILED:     { color: "var(--chart-4)", label: "Login fallido" },
  ACCOUNT_LOCKED:   { color: "var(--chart-4)", label: "Cuenta bloqueada" },
  PASSWORD_CHANGED: { color: "var(--chart-3)", label: "Password cambiado" },
  BULK_APPROVE:     { color: "var(--chart-2)", label: "Aprobacion masiva" },
  BULK_REJECT:      { color: "var(--chart-4)", label: "Rechazo masivo" },
}

const RESOURCE_LABELS: Record<string, string> = {
  auth: "Auth",
  historia: "Historia",
  caso: "Caso",
  tarea: "Tarea",
  user: "Usuario",
  config: "Config",
  sprint: "Sprint",
  grupo: "Grupo",
  notificacion: "Notificacion",
}

function getActionStyle(action: string) {
  return ACTION_STYLES[action] ?? { color: "var(--muted-foreground)", label: action }
}

const SELECT_CLS = "h-8 text-xs pl-2 pr-6 border border-border rounded-md bg-card text-foreground cursor-pointer outline-none appearance-none"

export function AuditLogViewer() {
  const [page, setPage] = useState(1)
  const [filterAction, setFilterAction] = useState("")
  const [filterResource, setFilterResource] = useState("")
  const [search, setSearch] = useState("")

  const { data, isLoading, error, refetch, isFetching } = useAuditLog({
    page,
    action: filterAction || undefined,
    resource: filterResource || undefined,
  })

  useEffect(() => { setPage(1) }, [filterAction, filterResource, search])

  const entries = data?.entries ?? []
  const total = data?.total ?? 0

  const filteredEntries = search
    ? entries.filter(e =>
        e.userName.toLowerCase().includes(search.toLowerCase()) ||
        (e.details ?? "").toLowerCase().includes(search.toLowerCase()) ||
        e.resourceId.toLowerCase().includes(search.toLowerCase())
      )
    : entries

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })
  const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center">
            <History size={18} className="text-primary" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-foreground m-0">Audit Log</h2>
            <p className="text-xs text-muted-foreground m-0">
              {total} entrada{total !== 1 ? "s" : ""} registrada{total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-[1_1_200px] min-w-45">
          <Search size={13} className="absolute left-2.25 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por usuario, detalle, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-7.5 h-8 text-xs"
          />
        </div>

        <div className="relative">
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className={SELECT_CLS}>
            <option value="">Todas las acciones</option>
            {Object.entries(ACTION_STYLES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>

        <div className="relative">
          <select value={filterResource} onChange={e => setFilterResource(e.target.value)} className={SELECT_CLS}>
            <option value="">Todos los recursos</option>
            {Object.entries(RESOURCE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
        </div>

        {(filterAction || filterResource || search) && (
          <button
            onClick={() => { setFilterAction(""); setFilterResource(""); setSearch("") }}
            className="h-8 text-xs px-2.5 rounded-md border border-border bg-transparent text-muted-foreground cursor-pointer"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-chart-4 bg-chart-4/8">
          <AlertCircle size={16} className="text-chart-4 shrink-0" />
          <span className="text-[13px] text-chart-4">No se pudo cargar el audit log</span>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filteredEntries.length === 0 && !error && (
        <div className="text-center py-10 px-4 text-muted-foreground">
          <History size={32} className="opacity-30 mx-auto mb-2.5" />
          <p className="text-[13px]">No hay entradas en el audit log</p>
        </div>
      )}

      {/* Table */}
      {filteredEntries.length > 0 && (
        <div className="overflow-x-auto">
          <div className="flex flex-col gap-0 border border-border rounded-[10px] overflow-hidden min-w-137.5">
            <div
              className="grid gap-0 px-3.5 py-1.5 bg-muted border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              style={{ gridTemplateColumns: "110px 100px 100px 1fr 130px" }}
            >
              <span>Fecha</span>
              <span>Accion</span>
              <span>Recurso</span>
              <span>Detalle</span>
              <span>Usuario</span>
            </div>

            {filteredEntries.map((entry, idx) => {
              const style = getActionStyle(entry.action)
              return (
                <div
                  key={entry.id}
                  className={`grid gap-0 px-3.5 py-2.5 border-b border-border items-center ${idx % 2 === 1 ? "bg-muted/30" : "bg-card"}`}
                  style={{
                    gridTemplateColumns: "110px 100px 100px 1fr 130px",
                    borderLeft: `3px solid ${style.color}`,
                  }}
                >
                  <div className="flex flex-col gap-px">
                    <span className="text-[11px] font-semibold text-foreground">{fmtDate(entry.timestamp)}</span>
                    <span className="text-[11px] text-muted-foreground">{fmtTime(entry.timestamp)}</span>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-[10px] font-semibold w-fit"
                    style={{
                      background: `color-mix(in oklch, ${style.color} 14%, transparent)`,
                      color: style.color,
                      border: `1px solid color-mix(in oklch, ${style.color} 30%, transparent)`,
                    }}
                  >
                    {style.label}
                  </Badge>

                  <span className="text-[11px] text-muted-foreground">
                    {RESOURCE_LABELS[entry.resource] ?? entry.resource}
                  </span>

                  <div className="text-xs text-foreground overflow-hidden text-ellipsis whitespace-nowrap pr-3">
                    {entry.details ?? entry.resourceId}
                  </div>

                  <span className="text-[11px] text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap">
                    {entry.userName}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Paginador pagina={page} total={total} pageSize={30} onCambiar={setPage} />
    </div>
  )
}
