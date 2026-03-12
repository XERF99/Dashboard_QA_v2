"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Filter, X } from "lucide-react"
import type { EstadoCambio, Criticidad, Esfuerzo } from "@/lib/types"

interface FiltersProps {
  filtroEstado: EstadoCambio | "todos"
  filtroCriticidad: Criticidad | "todos"
  filtroEsfuerzo: Esfuerzo | "todos"
  onFiltroEstadoChange: (value: EstadoCambio | "todos") => void
  onFiltroCriticidadChange: (value: Criticidad | "todos") => void
  onFiltroEsfuerzoChange: (value: Esfuerzo | "todos") => void
  onLimpiarFiltros: () => void
  onNuevoCambio: () => void
  hayFiltrosActivos: boolean
  canEdit?: boolean
}

export function Filters({
  filtroEstado,
  filtroCriticidad,
  filtroEsfuerzo,
  onFiltroEstadoChange,
  onFiltroCriticidadChange,
  onFiltroEsfuerzoChange,
  onLimpiarFiltros,
  onNuevoCambio,
  hayFiltrosActivos,
  canEdit = true
}: FiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>
        
        <Select
          value={filtroEstado}
          onValueChange={(value) => onFiltroEstadoChange(value as EstadoCambio | "todos")}
        >
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="en_progreso">En Progreso</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="bloqueado">Bloqueado</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filtroCriticidad}
          onValueChange={(value) => onFiltroCriticidadChange(value as Criticidad | "todos")}
        >
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Criticidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filtroEsfuerzo}
          onValueChange={(value) => onFiltroEsfuerzoChange(value as Esfuerzo | "todos")}
        >
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <SelectValue placeholder="Esfuerzo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="medio">Medio</SelectItem>
            <SelectItem value="bajo">Bajo</SelectItem>
          </SelectContent>
        </Select>

        {hayFiltrosActivos && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onLimpiarFiltros}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {canEdit && (
        <Button onClick={onNuevoCambio} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Nueva HU
        </Button>
      )}
    </div>
  )
}
