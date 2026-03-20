"use client"

import { FlaskConical } from "lucide-react"
import { TIPOS_PRUEBA_PREDETERMINADOS, type TipoPruebaDef } from "@/lib/types"
import { GenericListConfig } from "./generic-list-config"

interface TiposPruebaConfigProps {
  tipos: TipoPruebaDef[]
  onChange: (tipos: TipoPruebaDef[]) => void
}

export function TiposPruebaConfig({ tipos, onChange }: TiposPruebaConfigProps) {
  return (
    <GenericListConfig
      title="Tipos de Prueba"
      icon={<FlaskConical size={15} />}
      description="Define los tipos de prueba disponibles al crear o editar una Historia de Usuario o un Caso de Prueba."
      items={tipos}
      onChange={onChange}
      defaults={TIPOS_PRUEBA_PREDETERMINADOS}
      placeholder="Nuevo tipo (ej: Smoke, E2E, Accesibilidad...)"
      emptyMessage="Sin tipos — agrega al menos uno"
    />
  )
}
