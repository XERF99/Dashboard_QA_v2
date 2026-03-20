"use client"

import { useState } from "react"
import { LayoutTemplate, ChevronDown, Rocket, RotateCcw, Server, Database, Clock } from "lucide-react"
import type { TipoAplicacion, AmbientePrueba, PrioridadHU, TipoPrueba } from "@/lib/types"

export interface PlantillaHU {
  id: string
  nombre: string
  descripcion: string
  icono: React.ReactNode
  campos: {
    tipoAplicacion: TipoAplicacion
    tipoPrueba: TipoPrueba
    puntos: number
    prioridad: PrioridadHU
    ambiente: AmbientePrueba
    criteriosAceptacion: string
  }
}

export const PLANTILLAS_HU: PlantillaHU[] = [
  {
    id: "despliegue_app",
    nombre: "Despliegue de Aplicación",
    descripcion: "Pruebas funcionales para deploy a producción",
    icono: <Rocket size={14} />,
    campos: {
      tipoAplicacion: "aplicacion",
      tipoPrueba: "funcional",
      puntos: 8,
      prioridad: "alta",
      ambiente: "produccion",
      criteriosAceptacion: "- Despliegue completado sin errores\n- Smoke tests pasando\n- Rollback verificado\n- Monitoreo activo",
    },
  },
  {
    id: "rollback",
    nombre: "Rollback de Versión",
    descripcion: "Pruebas de rollback ante fallo en producción",
    icono: <RotateCcw size={14} />,
    campos: {
      tipoAplicacion: "aplicacion",
      tipoPrueba: "funcional",
      puntos: 5,
      prioridad: "critica",
      ambiente: "produccion",
      criteriosAceptacion: "- Versión anterior restaurada\n- Datos íntegros\n- Servicios dependientes operativos",
    },
  },
  {
    id: "infraestructura",
    nombre: "Cambio de Infraestructura",
    descripcion: "Pruebas no funcionales de infra/nube",
    icono: <Server size={14} />,
    campos: {
      tipoAplicacion: "infraestructura",
      tipoPrueba: "no_funcional",
      puntos: 13,
      prioridad: "alta",
      ambiente: "preproduccion",
      criteriosAceptacion: "- Recursos provisionados correctamente\n- Conectividad verificada\n- SLAs de rendimiento cumplidos",
    },
  },
  {
    id: "base_de_datos",
    nombre: "Migración de Base de Datos",
    descripcion: "Scripts DDL/DML en ambientes controlados",
    icono: <Database size={14} />,
    campos: {
      tipoAplicacion: "base_de_datos",
      tipoPrueba: "funcional",
      puntos: 8,
      prioridad: "critica",
      ambiente: "preproduccion",
      criteriosAceptacion: "- Script ejecutado sin errores\n- Integridad referencial mantenida\n- Backup previo verificado\n- Tiempo de ejecución dentro del RTO",
    },
  },
  {
    id: "proceso_batch",
    nombre: "Proceso Batch / Job",
    descripcion: "Validación de jobs nocturnos y schedulers",
    icono: <Clock size={14} />,
    campos: {
      tipoAplicacion: "batch",
      tipoPrueba: "funcional",
      puntos: 5,
      prioridad: "media",
      ambiente: "preproduccion",
      criteriosAceptacion: "- Job ejecuta en ventana de tiempo definida\n- Registros procesados correctamente\n- Log de ejecución sin errores\n- Alertas configuradas",
    },
  },
]

export function PlantillasSelector({ onSelect }: { onSelect: (campos: PlantillaHU["campos"]) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
          border: "1px solid color-mix(in oklch, var(--primary) 35%, transparent)",
          background: "color-mix(in oklch, var(--primary) 8%, transparent)",
          color: "var(--primary)",
        }}
      >
        <LayoutTemplate size={13} />
        Usar plantilla
        <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
            background: "var(--card)", border: "1px solid var(--border)",
            borderRadius: 10, boxShadow: "0 6px 24px rgba(0,0,0,0.14)",
            padding: 4, minWidth: 260,
          }}>
            {PLANTILLAS_HU.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onSelect(p.campos); setOpen(false) }}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10, width: "100%",
                  textAlign: "left", padding: "8px 12px", border: "none", borderRadius: 7,
                  cursor: "pointer", background: "none",
                }}
                className="hover:bg-secondary"
              >
                <div style={{ color: "var(--primary)", paddingTop: 1, flexShrink: 0 }}>{p.icono}</div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", marginBottom: 1 }}>{p.nombre}</p>
                  <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{p.descripcion}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
