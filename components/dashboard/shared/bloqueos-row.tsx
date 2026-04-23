"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, CheckCircle2, Eye, FlaskConical, ListTodo } from "lucide-react"
import { PRIORIDAD_CFG, fmtCorto } from "@/lib/types"

// Tipos compartidos con bloqueos-panel (v2.75 split).
export type NivelBloqueo = "hu" | "caso" | "tarea"

export interface BloqueoEnriquecido {
  key:              string
  id:               string
  descripcion:      string
  reportadoPor:     string
  fecha:            Date
  resuelto:         boolean
  fechaResolucion?: Date
  resueltoPor?:     string
  notaResolucion?:  string
  nivel:            NivelBloqueo
  huId:             string
  huCodigo:         string
  huTitulo:         string
  huResponsable:    string
  huPrioridad:      string
  casoId?:          string
  casoTitulo?:      string
  tareaId?:         string
  tareaTitulo?:     string
}

export const NIVEL_CFG: Record<NivelBloqueo, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  hu:    { label: "Historia de Usuario", color: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 10%, transparent)", border: "var(--primary)", icon: <BookOpen size={12}/> },
  caso:  { label: "Caso de Prueba",      color: "var(--chart-2)", bg: "color-mix(in oklch, var(--chart-2) 10%, transparent)", border: "var(--chart-2)", icon: <FlaskConical size={12}/> },
  tarea: { label: "Tarea",               color: "var(--chart-3)", bg: "color-mix(in oklch, var(--chart-3) 10%, transparent)", border: "var(--chart-3)", icon: <ListTodo size={12}/> },
}

interface Props {
  item:       BloqueoEnriquecido
  onResolver: (nota: string) => void
  onVerHU?:   () => void
  canEdit?:   boolean
}

export function BloqueoRow({ item, onResolver, onVerHU, canEdit }: Props) {
  const [resolviendo, setResolviendo] = useState(false)
  const [nota,        setNota]        = useState("")
  const cfg          = NIVEL_CFG[item.nivel]
  const prioridadCfg = PRIORIDAD_CFG[item.huPrioridad as keyof typeof PRIORIDAD_CFG]
  const activo       = !item.resuelto

  const handleConfirmar = () => {
    onResolver(nota)
    setNota("")
    setResolviendo(false)
  }

  return (
    <div
      className={`rounded-[10px] bg-card overflow-hidden ${activo ? "opacity-100" : "opacity-65"}`}
      style={{
        border: `1px solid ${activo ? "color-mix(in oklch, var(--chart-4) 40%, var(--border))" : "var(--border)"}`,
        borderLeft: `3px solid ${activo ? "var(--chart-4)" : "var(--muted-foreground)"}`,
      }}
    >
      <div className="px-3.5 py-3 flex gap-3 items-start">
        <div
          className="w-8.5 h-8.5 rounded-full shrink-0 flex items-center justify-center"
          style={{
            background: cfg.bg,
            color: cfg.color,
            border: `1px solid color-mix(in oklch, ${cfg.border} 40%, transparent)`,
          }}
        >
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <Badge
              variant="outline"
              className="text-[9px] px-1.5 py-px shrink-0"
              style={{ color: cfg.color, borderColor: `color-mix(in oklch, ${cfg.border} 50%, transparent)`, background: cfg.bg }}
            >
              {cfg.label}
            </Badge>
            <span className="text-[11px] font-bold text-primary font-mono shrink-0">
              {item.huCodigo}
            </span>
            <span className="text-xs font-semibold text-foreground overflow-hidden text-ellipsis whitespace-nowrap">
              {item.huTitulo}
            </span>
            {prioridadCfg && (
              <Badge variant="outline" className={`${prioridadCfg.cls} text-[9px] shrink-0 px-1.5 py-px`}>
                {prioridadCfg.label}
              </Badge>
            )}
          </div>

          {(item.casoTitulo || item.tareaTitulo) && (
            <p className="text-[11px] text-muted-foreground mb-1">
              {item.casoTitulo && <><span className="font-semibold">Caso:</span> {item.casoTitulo}</>}
              {item.tareaTitulo && <> · <span className="font-semibold">Tarea:</span> {item.tareaTitulo}</>}
            </p>
          )}

          <p className={`text-[13px] font-medium mb-1.5 leading-[1.4] ${activo ? "text-foreground" : "text-muted-foreground"}`}>
            {item.descripcion}
          </p>

          <div className="flex gap-3.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground">
              Reportado por <span className="font-semibold">{item.reportadoPor}</span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {fmtCorto(item.fecha)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Responsable HU: <span className="font-semibold">{item.huResponsable}</span>
            </span>
          </div>

          {item.resuelto && (item.notaResolucion || item.resueltoPor) && (
            <div
              className="mt-2 px-2.5 py-1.5 rounded-[7px]"
              style={{
                background: "color-mix(in oklch, var(--chart-2) 8%, transparent)",
                border: "1px solid color-mix(in oklch, var(--chart-2) 25%, transparent)",
              }}
            >
              <p className="text-[11px] text-chart-2 leading-normal">
                <CheckCircle2 size={11} className="inline mr-1 align-middle"/>
                {item.notaResolucion && <><span className="font-semibold">Resolución:</span> {item.notaResolucion}</>}
                {item.resueltoPor && <> · Por {item.resueltoPor}</>}
                {item.fechaResolucion && <> · {fmtCorto(item.fechaResolucion)}</>}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0 items-end">
          {item.resuelto ? (
            <div className="flex items-center gap-1 text-[11px] text-chart-2 font-semibold">
              <CheckCircle2 size={12}/> Resuelto
            </div>
          ) : (
            <>
              {onVerHU && (
                <button
                  onClick={onVerHU}
                  title="Ver Historia de Usuario"
                  className="bg-transparent border border-border rounded-md cursor-pointer px-2 py-1 text-[11px] text-muted-foreground flex items-center gap-0.75 hover:bg-secondary hover:text-foreground"
                >
                  <Eye size={11}/> Ver HU
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setResolviendo(v => !v)}
                  className="bg-transparent rounded-md cursor-pointer px-2 py-1 text-[11px] text-chart-2 font-semibold flex items-center gap-0.75 hover:bg-chart-2/10"
                  style={{ border: "1px solid color-mix(in oklch, var(--chart-2) 50%, transparent)" }}
                >
                  <CheckCircle2 size={11}/> Resolver
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {resolviendo && (
        <div className="px-3.5 pb-3 pt-2.5 border-t border-border bg-background">
          <p className="text-[11px] text-muted-foreground mb-1.5">
            Nota de resolución <span className="opacity-60">(opcional)</span>
          </p>
          <div className="flex gap-2">
            <Input
              value={nota}
              onChange={e => setNota(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleConfirmar() }}
              placeholder="Describe cómo se resolvió el bloqueo..."
              className="h-8 text-xs flex-1"
              autoFocus
            />
            <Button size="sm" onClick={handleConfirmar} className="h-8 shrink-0">
              Confirmar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setResolviendo(false)} className="h-8 shrink-0">
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
