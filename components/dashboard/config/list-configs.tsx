"use client"

import { Globe, Layers, FlaskConical } from "lucide-react"
import {
  AMBIENTES_PREDETERMINADOS, type AmbienteDef,
  TIPOS_APLICACION_PREDETERMINADOS, type TipoAplicacionDef,
  TIPOS_PRUEBA_PREDETERMINADOS, type TipoPruebaDef,
} from "@/lib/types"
import { GenericListConfig } from "./generic-list-config"

// ── Ambientes de Prueba ────────────────────────────────────────
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

// ── Tipos de Aplicación ────────────────────────────────────────
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

// ── Tipos de Prueba ────────────────────────────────────────────
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
