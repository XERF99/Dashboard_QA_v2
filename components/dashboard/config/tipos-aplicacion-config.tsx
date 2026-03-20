"use client"

import { Layers } from "lucide-react"
import { TIPOS_APLICACION_PREDETERMINADOS, type TipoAplicacionDef } from "@/lib/types"
import { GenericListConfig } from "./generic-list-config"

interface TiposAplicacionConfigProps {
  tipos: TipoAplicacionDef[]
  onChange: (tipos: TipoAplicacionDef[]) => void
}

export function TiposAplicacionConfig({ tipos, onChange }: TiposAplicacionConfigProps) {
  return (
    <GenericListConfig
      title="Tipos de Aplicación"
      icon={<Layers size={15} />}
      description="Define los tipos de aplicación disponibles. Cada tipo determina qué etapas de ejecución aplican a sus HUs."
      items={tipos}
      onChange={onChange}
      defaults={TIPOS_APLICACION_PREDETERMINADOS}
      placeholder="Nuevo tipo (ej: Microservicio, ETL, Monolito...)"
      emptyMessage="Sin tipos — agrega al menos uno"
    />
  )
}
