"use client"

import { Card, CardContent } from "@/components/ui/card"
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Users
} from "lucide-react"
import type { Cambio } from "@/lib/types"

interface StatsCardsProps {
  cambios: Cambio[]
}

export function StatsCards({ cambios }: StatsCardsProps) {
  const totalCambios = cambios.length
  const enProgreso = cambios.filter(c => c.estado === "en_progreso").length
  const completados = cambios.filter(c => c.estado === "completado").length
  const bloqueados = cambios.filter(c => c.estado === "bloqueado").length
  const pendientes = cambios.filter(c => c.estado === "pendiente").length
  
  // Contar asignados únicos
  const asignadosUnicos = new Set(cambios.map(c => c.asignado)).size

  const stats = [
    {
      titulo: "Total Cambios",
      valor: totalCambios,
      icono: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      titulo: "En Progreso",
      valor: enProgreso,
      icono: Clock,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10"
    },
    {
      titulo: "Completados",
      valor: completados,
      icono: CheckCircle2,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10"
    },
    {
      titulo: "Pendientes",
      valor: pendientes,
      icono: AlertTriangle,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10"
    },
    {
      titulo: "Bloqueados",
      valor: bloqueados,
      icono: XCircle,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10"
    },
    {
      titulo: "Asignados",
      valor: asignadosUnicos,
      icono: Users,
      color: "text-chart-5",
      bgColor: "bg-chart-5/10"
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      {stats.map((stat) => (
        <Card key={stat.titulo} className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icono className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.valor}</p>
                <p className="text-xs text-muted-foreground">{stat.titulo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
