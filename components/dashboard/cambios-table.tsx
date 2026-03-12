"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import type { Cambio, Criticidad, Esfuerzo, EstadoCambio, EntornoPruebas, FasePruebas, NivelRiesgo, TipoPrueba } from "@/lib/types"
import { calcularCriticidad, calcularEsfuerzo, calcularTiempo, calcularRiesgo } from "@/lib/types"

interface CambiosTableProps {
  cambios: Cambio[]
  onVerDetalle: (cambio: Cambio) => void
  onEditar: (cambio: Cambio) => void
  onEliminar: (id: string) => void
  canEdit?: boolean
}

function getBadgeCriticidad(criticidad: Criticidad) {
  const estilos = {
    alta: "bg-chart-4/20 text-chart-4 border-chart-4/30 hover:bg-chart-4/30",
    media: "bg-chart-3/20 text-chart-3 border-chart-3/30 hover:bg-chart-3/30",
    baja: "bg-chart-2/20 text-chart-2 border-chart-2/30 hover:bg-chart-2/30"
  }
  const labels = {
    alta: "Alta",
    media: "Media",
    baja: "Baja"
  }
  return (
    <Badge variant="outline" className={estilos[criticidad]}>
      {labels[criticidad]}
    </Badge>
  )
}

function getBadgeEsfuerzo(esfuerzo: Esfuerzo) {
  const estilos = {
    alto: "bg-chart-4/20 text-chart-4 border-chart-4/30 hover:bg-chart-4/30",
    medio: "bg-chart-3/20 text-chart-3 border-chart-3/30 hover:bg-chart-3/30",
    bajo: "bg-chart-2/20 text-chart-2 border-chart-2/30 hover:bg-chart-2/30"
  }
  const labels = {
    alto: "Alto",
    medio: "Medio",
    bajo: "Bajo"
  }
  return (
    <Badge variant="outline" className={estilos[esfuerzo]}>
      {labels[esfuerzo]}
    </Badge>
  )
}

function getBadgeEstado(estado: EstadoCambio) {
  const estilos = {
    pendiente: "bg-muted text-muted-foreground border-border",
    en_progreso: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    completado: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    bloqueado: "bg-chart-4/20 text-chart-4 border-chart-4/30"
  }
  const labels = {
    pendiente: "Pendiente",
    en_progreso: "En Progreso",
    completado: "Completado",
    bloqueado: "Bloqueado"
  }
  return (
    <Badge variant="outline" className={estilos[estado]}>
      {labels[estado]}
    </Badge>
  )
}

// Badge para Entorno de Pruebas
function getBadgeEntorno(entorno: EntornoPruebas) {
  const estilos = {
    desarrollo: "bg-muted text-muted-foreground border-border",
    qa: "bg-chart-1/20 text-chart-1 border-chart-1/30",
    staging: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    produccion: "bg-chart-4/20 text-chart-4 border-chart-4/30"
  }
  const labels = {
    desarrollo: "Desarrollo",
    qa: "QA",
    staging: "Staging",
    produccion: "Produccion"
  }
  return (
    <Badge variant="outline" className={estilos[entorno]}>
      {labels[entorno]}
    </Badge>
  )
}

// Badge para Fase de Pruebas
function getBadgeFase(fase: FasePruebas) {
  const estilos = {
    despliegue: "bg-chart-2/20 text-chart-2 border-chart-2/30",
    rollback: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    redespliegue: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    validacion: "bg-chart-1/20 text-chart-1 border-chart-1/30"
  }
  const labels = {
    despliegue: "Despliegue",
    rollback: "Rollback",
    redespliegue: "Redespliegue",
    validacion: "Validacion"
  }
  return (
    <Badge variant="outline" className={estilos[fase]}>
      {labels[fase]}
    </Badge>
  )
}

// Badge para Nivel de Riesgo (COLUMNA CALCULADA)
function getBadgeRiesgo(riesgo: NivelRiesgo) {
  const estilos = {
    critico: "bg-chart-4/30 text-chart-4 border-chart-4/50 font-semibold",
    alto: "bg-chart-4/20 text-chart-4 border-chart-4/30",
    moderado: "bg-chart-3/20 text-chart-3 border-chart-3/30",
    bajo: "bg-chart-2/20 text-chart-2 border-chart-2/30"
  }
  const labels = {
    critico: "Critico",
    alto: "Alto",
    moderado: "Moderado",
    bajo: "Bajo"
  }
  return (
    <Badge variant="outline" className={estilos[riesgo]}>
      {labels[riesgo]}
    </Badge>
  )
}

// Badge para Tipo de Prueba
function getBadgeTipo(tipo: TipoPrueba) {
  if (tipo === "funcional") {
    return (
      <Badge variant="outline" className="bg-chart-1/20 text-chart-1 border-chart-1/30">
        Funcional
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="bg-chart-3/20 text-chart-3 border-chart-3/30">
      No Funcional
    </Badge>
  )
}

function formatearFecha(fecha: Date): string {
  const dia = fecha.getUTCDate().toString().padStart(2, '0')
  const mes = fecha.getUTCMonth()
  const año = fecha.getUTCFullYear()
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${dia} ${meses[mes]} ${año}`
}

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function CambiosTable({ cambios, onVerDetalle, onEditar, onEliminar, canEdit = true }: CambiosTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground font-medium">ID</TableHead>
            <TableHead className="text-muted-foreground font-medium">Titulo</TableHead>
            <TableHead className="text-muted-foreground font-medium">Asignado</TableHead>
            <TableHead className="text-muted-foreground font-medium">Entorno</TableHead>
            <TableHead className="text-muted-foreground font-medium">Fase</TableHead>
            <TableHead className="text-muted-foreground font-medium">Tipo</TableHead>
            <TableHead className="text-muted-foreground font-medium">Esfuerzo</TableHead>
            <TableHead className="text-muted-foreground font-medium">Criticidad</TableHead>
            <TableHead className="text-muted-foreground font-medium">Riesgo</TableHead>
            <TableHead className="text-muted-foreground font-medium">Inicio</TableHead>
            <TableHead className="text-muted-foreground font-medium">Fin</TableHead>
            <TableHead className="text-muted-foreground font-medium">Tiempo</TableHead>
            <TableHead className="text-muted-foreground font-medium">Estado</TableHead>
            <TableHead className="text-muted-foreground font-medium w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cambios.length === 0 ? (
            <TableRow>
              <TableCell colSpan={14} className="h-24 text-center text-muted-foreground">
                No se encontraron cambios
              </TableCell>
            </TableRow>
          ) : (
            cambios.map((cambio) => {
              const criticidad = calcularCriticidad(cambio)
              const esfuerzo = calcularEsfuerzo(cambio)
              const riesgo = calcularRiesgo(cambio)
              const tiempo = calcularTiempo(cambio.fechaInicio, cambio.fechaFin)

              return (
                <TableRow key={cambio.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-mono text-sm text-primary">
                    {cambio.id}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[180px]">
                      <p className="font-medium text-foreground truncate">{cambio.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{cambio.descripcion}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-secondary text-foreground text-xs">
                          {getInitials(cambio.asignado)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{cambio.asignado}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getBadgeEntorno(cambio.entornoPruebas)}</TableCell>
                  <TableCell>{getBadgeFase(cambio.fasePruebas)}</TableCell>
                  <TableCell>{getBadgeTipo(cambio.tipoPrueba)}</TableCell>
                  <TableCell>{getBadgeEsfuerzo(esfuerzo)}</TableCell>
                  <TableCell>{getBadgeCriticidad(criticidad)}</TableCell>
                  <TableCell>{getBadgeRiesgo(riesgo)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatearFecha(cambio.fechaInicio)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cambio.fechaFin ? formatearFecha(cambio.fechaFin) : "-"}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm text-foreground">{tiempo}</span>
                  </TableCell>
                  <TableCell>{getBadgeEstado(cambio.estado)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onVerDetalle(cambio)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuItem onClick={() => onEditar(cambio)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onEliminar(cambio.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
