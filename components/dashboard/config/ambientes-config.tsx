"use client"

import { Globe } from "lucide-react"
import { AMBIENTES_PREDETERMINADOS, type AmbienteDef } from "@/lib/types"
import { GenericListConfig } from "./generic-list-config"

interface AmbientesConfigProps {
  ambientes: AmbienteDef[]
  onChange: (ambientes: AmbienteDef[]) => void
}

export function AmbientesConfig({ ambientes, onChange }: AmbientesConfigProps) {
  return (
    <GenericListConfig
      title="Ambientes de Prueba"
      icon={<Globe size={15} />}
      description="Define los ambientes disponibles al crear o editar una Historia de Usuario."
      items={ambientes}
      onChange={onChange}
      defaults={AMBIENTES_PREDETERMINADOS}
      placeholder="Nuevo ambiente (ej: Staging, QA, UAT...)"
      emptyMessage="Sin ambientes — agrega al menos uno"
    />
  )
}
