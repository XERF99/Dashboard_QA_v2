"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Plus, ArrowUp, ArrowDown, RotateCcw, ChevronDown, ChevronUp, Settings2, History } from "lucide-react"
import {
  ETAPAS_PREDETERMINADAS,
  TIPOS_APLICACION_PREDETERMINADOS,
  type ConfigEtapas,
  type EtapaDefinicion,
  type TipoAplicacionDef,
  type HistoriaUsuario,
} from "@/lib/types"

import { BADGE_PALETA } from "@/lib/constants/badge-paleta"
import { labelToId } from "@/lib/hooks/useListConfig"
import { DeleteConfirmButton } from "./delete-confirm-button"

interface EtapasConfigProps {
  config: ConfigEtapas
  onChange: (config: ConfigEtapas) => void
  tipos?: TipoAplicacionDef[]
  historias?: HistoriaUsuario[]
}

export function EtapasConfig({ config, onChange, tipos: tiposProp, historias }: EtapasConfigProps) {
  const [expandedTipo, setExpandedTipo] = useState<string | null>(null)
  const [nuevoLabel, setNuevoLabel] = useState<Partial<Record<string, string>>>({})
  const [nuevoCls, setNuevoCls] = useState<Partial<Record<string, string>>>({})

  const tipos = tiposProp ?? TIPOS_APLICACION_PREDETERMINADOS

  function moverEtapa(tipo: string, idx: number, dir: -1 | 1) {
    const etapas = [...(config[tipo] ?? [])]
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= etapas.length) return
    ;[etapas[idx], etapas[swapIdx]] = [etapas[swapIdx]!, etapas[idx]!]
    onChange({ ...config, [tipo]: etapas })
  }

  function eliminarEtapa(tipo: string, idx: number) {
    const etapas = (config[tipo] ?? []).filter((_, i) => i !== idx)
    onChange({ ...config, [tipo]: etapas })
  }

  function agregarEtapa(tipo: string) {
    const label = (nuevoLabel[tipo] ?? "").trim()
    if (!label) return
    const id = labelToId(label)
    if (!id || (config[tipo] ?? []).some(e => e.id === id)) return
    const cls = nuevoCls[tipo] ?? BADGE_PALETA[(config[tipo] ?? []).length % BADGE_PALETA.length]!.cls
    onChange({ ...config, [tipo]: [...(config[tipo] ?? []), { id, label, cls }] })
    setNuevoLabel(p => ({ ...p, [tipo]: "" }))
    setNuevoCls(p => ({ ...p, [tipo]: "" }))
  }

  function cambiarLabel(tipo: string, idx: number, label: string) {
    const etapas = (config[tipo] ?? []).map((e, i) => i === idx ? { ...e, label } : e)
    onChange({ ...config, [tipo]: etapas })
  }

  function cambiarCls(tipo: string, idx: number, cls: string) {
    const etapas = (config[tipo] ?? []).map((e, i) => i === idx ? { ...e, cls } : e)
    onChange({ ...config, [tipo]: etapas })
  }

  function reutilizarEtapa(tid: string, etapa: EtapaDefinicion) {
    if ((config[tid] ?? []).some(e => e.id === etapa.id)) return
    onChange({ ...config, [tid]: [...(config[tid] ?? []), etapa] })
  }

  function etapasDisponibles(tid: string): EtapaDefinicion[] {
    const idsActuales = new Set((config[tid] ?? []).map(e => e.id))
    const seen = new Set<string>()
    const result: EtapaDefinicion[] = []
    for (const [otroTid, etapas] of Object.entries(config)) {
      if (otroTid === tid) continue
      for (const e of etapas) {
        if (!idsActuales.has(e.id) && !seen.has(e.id)) {
          seen.add(e.id)
          result.push(e)
        }
      }
    }
    return result
  }

  function restaurarTipo(tipoId: string) {
    onChange({ ...config, [tipoId]: ETAPAS_PREDETERMINADAS[tipoId] ?? [] })
  }

  const hayDiferencias = (tipoId: string) => {
    const curr = config[tipoId]
    const orig = ETAPAS_PREDETERMINADAS[tipoId]
    if (!orig) return !!curr?.length  // tipo personalizado: si tiene etapas, se considera modificado
    if (!curr || curr.length !== orig.length) return true
    return curr.some((e, i) => e.id !== orig[i]!.id || e.label !== orig[i]!.label)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <Settings2 size={15} style={{ color: "var(--primary)" }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Configuración de Etapas</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>
        Personaliza las etapas de ejecución para cada tipo de aplicación. Los cambios aplican a las HUs nuevas y en progreso.
      </p>

      {/* Banner informativo */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 14px", borderRadius: 8,
        background: "color-mix(in oklch, var(--chart-3) 10%, transparent)",
        border: "1px solid color-mix(in oklch, var(--chart-3) 30%, transparent)",
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
        <p style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.5 }}>
          Las etapas se organizan por <strong>Tipo de Aplicación</strong>. Si necesitas agregar un tipo nuevo,
          ve primero a <strong>Tipos de Aplicación</strong> en el menú lateral y créalo; luego regresa aquí para configurar sus etapas.
        </p>
      </div>

      {tipos.map(tipoDef => {
        const tid = tipoDef.id
        const etapas = config[tid] ?? []
        const expanded = expandedTipo === tid
        const dirty = hayDiferencias(tid)

        return (
          <div key={tid} style={{ border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
            {/* Cabecera del tipo */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px", cursor: "pointer",
                background: expanded ? "color-mix(in oklch, var(--primary) 5%, var(--card))" : "var(--card)",
              }}
              onClick={() => setExpandedTipo(expanded ? null : tid)}
              className="hover:bg-secondary/50"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", flexShrink: 0 }}>
                  {tipoDef.label}
                </p>
                <div className="hidden sm:flex" style={{ gap: 4, flexWrap: "wrap" }}>
                  {etapas.map(e => (
                    <Badge key={e.id} variant="outline" className={`${e.cls} text-[9px]`} style={{ padding: "0px 6px" }}>
                      {e.label}
                    </Badge>
                  ))}
                </div>
                {dirty && (
                  <Badge variant="outline" className="bg-chart-3/20 text-chart-3 border-chart-3/30 text-[9px]" style={{ padding: "0px 6px", flexShrink: 0 }}>
                    Modificado
                  </Badge>
                )}
              </div>
              {expanded ? <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} /> : <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />}
            </div>

            {/* Panel expandible */}
            {expanded && (
              <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", background: "var(--background)" }}>
                {/* Aviso: HUs en progreso afectadas */}
                {(() => {
                  const huAfectadas = (historias ?? []).filter(h => h.tipoAplicacion === tid && h.estado === "en_progreso")
                  if (huAfectadas.length === 0) return null
                  return (
                    <div style={{
                      display: "flex", alignItems: "flex-start", gap: 9,
                      padding: "9px 13px", borderRadius: 8, marginBottom: 12,
                      background: "color-mix(in oklch, var(--chart-3) 8%, transparent)",
                      border: "1px solid color-mix(in oklch, var(--chart-3) 30%, transparent)",
                    }}>
                      <AlertTriangle size={13} style={{ color: "var(--chart-3)", flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 11, color: "var(--foreground)", lineHeight: 1.55 }}>
                        <strong style={{ color: "var(--chart-3)" }}>
                          {huAfectadas.length} HU{huAfectadas.length !== 1 ? "s" : ""} en progreso
                        </strong>
                        {" "}de tipo <strong>{tipoDef.label}</strong>.
                        {" "}Los casos existentes no tendrán resultados para las nuevas etapas hasta que inicien ejecución en esa etapa.
                      </p>
                    </div>
                  )
                })()}

                {/* Lista de etapas */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                  {etapas.length === 0 && (
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
                      Sin etapas — agrega al menos una
                    </p>
                  )}
                  {(() => {
                    const defaultIds = new Set((ETAPAS_PREDETERMINADAS[tid] ?? []).map(e => e.id))
                    return etapas.map((etapa, idx) => {
                      const isDefault = defaultIds.has(etapa.id)
                      return (
                      <div key={etapa.id} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}>
                        {/* Grupo 1: orden + número + label — ancho completo en móvil, flex-1 en escritorio */}
                        <div className="flex items-center w-full sm:flex-1 sm:min-w-0" style={{ gap: 8 }}>
                          {/* Orden */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
                            <button
                              onClick={() => moverEtapa(tid, idx, -1)}
                              disabled={idx === 0}
                              style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", padding: 1, opacity: idx === 0 ? 0.3 : 1 }}
                            ><ArrowUp size={11} /></button>
                            <button
                              onClick={() => moverEtapa(tid, idx, 1)}
                              disabled={idx === etapas.length - 1}
                              style={{ background: "none", border: "none", cursor: idx === etapas.length - 1 ? "default" : "pointer", padding: 1, opacity: idx === etapas.length - 1 ? 0.3 : 1 }}
                            ><ArrowDown size={11} /></button>
                          </div>

                          {/* Número de orden */}
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted-foreground)", minWidth: 14, textAlign: "center", flexShrink: 0 }}>{idx + 1}</span>

                          {/* Label (readonly si es predeterminada) */}
                          <Input
                            value={etapa.label}
                            readOnly={isDefault}
                            onChange={isDefault ? undefined : e => cambiarLabel(tid, idx, e.target.value)}
                            style={{ height: 28, fontSize: 12, flex: 1, minWidth: 0, ...(isDefault ? { background: "var(--secondary)", cursor: "default", color: "var(--muted-foreground)" } : {}) }}
                            placeholder="Nombre de la etapa"
                          />
                        </div>

                        {/* Grupo 2: color + preview + eliminar — baja a segunda línea en móvil */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          {/* Selector de color */}
                          <div style={{ display: "flex", gap: 3 }}>
                            {BADGE_PALETA.map((p, pi) => (
                              <button
                                key={pi}
                                title={`Color ${pi + 1}`}
                                onClick={() => cambiarCls(tid, idx, p.cls)}
                                style={{
                                  width: 14, height: 14, borderRadius: "50%", border: etapa.cls === p.cls ? "2px solid var(--foreground)" : "2px solid transparent",
                                  background: p.sample, cursor: "pointer", padding: 0,
                                }}
                              />
                            ))}
                          </div>

                          {/* Preview badge */}
                          <Badge variant="outline" className={`${etapa.cls} text-[9px]`} style={{ padding: "0px 6px", flexShrink: 0, minWidth: 60, textAlign: "center" }}>
                            {etapa.label || "—"}
                          </Badge>

                          {/* Eliminar (oculto si es predeterminada) */}
                          {isDefault ? (
                            <span style={{ width: 17, flexShrink: 0 }} />
                          ) : (
                            <DeleteConfirmButton onConfirm={() => eliminarEtapa(tid, idx)} title="Eliminar etapa" />
                          )}
                        </div>
                      </div>
                      )
                    })
                  })()}
                </div>

                {/* Agregar nueva etapa */}
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                  <Input
                    value={nuevoLabel[tid] ?? ""}
                    onChange={e => setNuevoLabel(p => ({ ...p, [tid]: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") agregarEtapa(tid) }}
                    placeholder="Nueva etapa (ej: UAT, Staging...)"
                    style={{ height: 30, fontSize: 12, flex: 1, minWidth: 150 }}
                  />
                  {/* Selector color + botón agregar */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", gap: 3 }}>
                      {BADGE_PALETA.map((p, pi) => (
                        <button
                          key={pi}
                          onClick={() => setNuevoCls(prev => ({ ...prev, [tid]: p.cls }))}
                          style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: (nuevoCls[tid] ?? BADGE_PALETA[etapas.length % BADGE_PALETA.length]!.cls) === p.cls
                              ? "2px solid var(--foreground)" : "2px solid transparent",
                            background: p.sample, cursor: "pointer", padding: 0,
                          }}
                        />
                      ))}
                    </div>
                    <Button size="sm" style={{ height: 30, gap: 4 }} onClick={() => agregarEtapa(tid)}
                      disabled={!(nuevoLabel[tid] ?? "").trim()}>
                      <Plus size={12} /> Agregar
                    </Button>
                  </div>
                </div>

                {/* Reusar etapas existentes de otros tipos */}
                {(() => {
                  const disponibles = etapasDisponibles(tid)
                  if (disponibles.length === 0) return null
                  return (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <History size={11} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>Reusar etapa existente:</p>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {disponibles.map(e => (
                          <button
                            key={e.id}
                            title={`Agregar "${e.label}" a este tipo`}
                            onClick={() => reutilizarEtapa(tid, e)}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                          >
                            <Badge
                              variant="outline"
                              className={`${e.cls} text-[10px] hover:opacity-80 transition-opacity`}
                              style={{ padding: "2px 8px", cursor: "pointer" }}
                            >
                              + {e.label}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* Restaurar */}
                {dirty && ETAPAS_PREDETERMINADAS[tid] && (
                  <button
                    onClick={() => restaurarTipo(tid)}
                    style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
                    className="hover:text-foreground"
                  >
                    <RotateCcw size={11} /> Restaurar predeterminadas para {tipoDef.label}
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
