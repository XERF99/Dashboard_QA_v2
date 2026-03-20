"use client"

import { Progress } from "@/components/ui/progress"
import type { HistoriaUsuario } from "@/lib/types"

interface HUStatsCardsProps {
  historias: HistoriaUsuario[]
}

export function HUStatsCards({ historias }: HUStatsCardsProps) {
  const total       = historias.length
  const sinIniciar  = historias.filter(h => h.estado === "sin_iniciar").length
  const enProgreso  = historias.filter(h => h.estado === "en_progreso").length
  const exitosas    = historias.filter(h => h.estado === "exitosa").length
  const fallidas    = historias.filter(h => h.estado === "fallida").length
  const canceladas  = historias.filter(h => h.estado === "cancelada").length

  const porcentaje = total > 0 ? Math.round((exitosas / total) * 100) : 0

  const cardCls = "bg-card border border-border rounded-[10px] px-4 py-3.5"
  const labelCls = "text-[10px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5"
  const subCls = "text-[11px] text-muted-foreground mt-0.5"

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">

      {/* PROGRESO */}
      <div className={cardCls}>
        <p className={labelCls}>Progreso</p>
        <p className="text-[28px] font-extrabold leading-none text-primary mb-1">{porcentaje}%</p>
        <Progress value={porcentaje} className="h-1.5 my-2" />
        <p className={subCls}>{exitosas}/{total} {total === 1 ? "historia" : "historias"}</p>
      </div>

      {/* SIN INICIAR */}
      <div className={cardCls}>
        <p className={labelCls}>Sin Iniciar</p>
        <p className="text-[28px] font-extrabold leading-none text-muted-foreground mb-1">{sinIniciar}</p>
        <p className={subCls}>pendientes</p>
      </div>

      {/* EN PROGRESO */}
      <div className={cardCls}>
        <p className={labelCls}>En Progreso</p>
        <p className="text-[28px] font-extrabold leading-none text-chart-1 mb-1">{enProgreso}</p>
        <p className={subCls}>en ejecución</p>
      </div>

      {/* EXITOSAS */}
      <div className={cardCls}>
        <p className={labelCls}>Exitosas</p>
        <p className={`text-[28px] font-extrabold leading-none mb-1 ${exitosas > 0 ? "text-chart-2" : "text-muted-foreground"}`}>{exitosas}</p>
        <p className={subCls}>completadas OK</p>
      </div>

      {/* FALLIDAS */}
      <div className={cardCls}>
        <p className={labelCls}>Fallidas</p>
        <p className={`text-[28px] font-extrabold leading-none mb-1 ${fallidas > 0 ? "text-chart-4" : "text-muted-foreground"}`}>{fallidas}</p>
        <p className={subCls}>con fallo</p>
      </div>

      {/* CANCELADAS */}
      <div className={cardCls}>
        <p className={labelCls}>Canceladas</p>
        <p className={`text-[28px] font-extrabold leading-none mb-1 ${canceladas > 0 ? "text-chart-4" : "text-muted-foreground"}`}>{canceladas}</p>
        <p className={subCls}>cambio cancelado</p>
      </div>

    </div>
  )
}
