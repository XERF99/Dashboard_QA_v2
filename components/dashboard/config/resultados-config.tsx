"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, RotateCcw, ClipboardCheck } from "lucide-react"
import { RESULTADOS_PREDETERMINADOS } from "@/lib/types"
import { BADGE_PALETA } from "@/lib/constants/badge-paleta"
import { labelToId } from "@/lib/hooks/useListConfig"
import { DeleteConfirmButton } from "./delete-confirm-button"
import type { ResultadoDef } from "@/lib/types"

interface ResultadosConfigProps {
  resultados: ResultadoDef[]
  onChange: (resultados: ResultadoDef[]) => void
}

export function ResultadosConfig({ resultados, onChange }: ResultadosConfigProps) {
  const [nuevoLabel, setNuevoLabel]     = useState("")
  const [nuevoCls, setNuevoCls]         = useState(BADGE_PALETA[0].cls)
  const [nuevoAceptado, setNuevoAceptado] = useState(true)

  const hayDiferencias =
    resultados.length !== RESULTADOS_PREDETERMINADOS.length ||
    resultados.some((r, i) => r.id !== RESULTADOS_PREDETERMINADOS[i]?.id || r.label !== RESULTADOS_PREDETERMINADOS[i]?.label || r.esAceptado !== RESULTADOS_PREDETERMINADOS[i]?.esAceptado)

  function agregar() {
    const label = nuevoLabel.trim()
    if (!label) return
    const id = labelToId(label)
    if (!id || resultados.some(r => r.id === id)) return
    onChange([...resultados, { id, label, esAceptado: nuevoAceptado, esBase: false, cls: nuevoCls }])
    setNuevoLabel("")
    setNuevoAceptado(true)
    setNuevoCls(BADGE_PALETA[resultados.length % BADGE_PALETA.length].cls)
  }

  function eliminar(id: string) {
    onChange(resultados.filter(r => r.id !== id))
  }

  function cambiarLabel(id: string, label: string) {
    onChange(resultados.map(r => r.id === id ? { ...r, label } : r))
  }

  function cambiarCls(id: string, cls: string) {
    onChange(resultados.map(r => r.id === id ? { ...r, cls } : r))
  }

  function toggleAceptado(id: string) {
    onChange(resultados.map(r => r.id === id ? { ...r, esAceptado: !r.esAceptado } : r))
  }

  function cambiarMaxRetesteos(id: string, value: number | undefined) {
    onChange(resultados.map(r => r.id === id ? { ...r, maxRetesteos: value } : r))
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <ClipboardCheck size={15} style={{ color: "var(--primary)" }} />
        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>Estados de Resultado</p>
      </div>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 6 }}>
        Define los posibles resultados al ejecutar un caso de prueba. Los estados <strong>aceptados</strong> permiten avanzar de etapa; los <strong>no aceptados</strong> requieren retesteo o declarar el cambio como fallido.
      </p>

      {/* Banner informativo */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "10px 14px", borderRadius: 8,
        background: "color-mix(in oklch, var(--chart-1) 10%, transparent)",
        border: "1px solid color-mix(in oklch, var(--chart-1) 30%, transparent)",
        marginBottom: 4,
      }}>
        <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>💡</span>
        <p style={{ fontSize: 12, color: "var(--foreground)", lineHeight: 1.5 }}>
          Los estados base (<strong>Exitoso</strong>, <strong>Fallido</strong>, <strong>Error preexistente</strong>, <strong>Bloqueado</strong>) no se pueden eliminar ni renombrar.
          Puedes cambiar su color y si son aceptados o no. Agrega estados personalizados según tus necesidades.
        </p>
      </div>

      {/* Lista de resultados */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
        {resultados.length === 0 && (
          <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
            Sin estados — agrega al menos uno
          </p>
        )}
        {resultados.map(r => (
          <div key={r.id} style={{
            display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, padding: "8px 10px",
            borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)",
          }}>
            {/* Grupo 1: ID + label — ancho completo en móvil, flex-1 en escritorio */}
            <div className="flex items-center w-full sm:flex-1 sm:min-w-0" style={{ gap: 8 }}>
              {/* ID monospace */}
              <span style={{
                fontSize: 9, fontFamily: "monospace", color: "var(--muted-foreground)",
                background: "var(--secondary)", padding: "2px 6px", borderRadius: 4, flexShrink: 0, minWidth: 60,
              }}>
                {r.id}
              </span>

              {/* Label editable (solo para no-base) */}
              <Input
                value={r.label}
                readOnly={r.esBase}
                onChange={r.esBase ? undefined : e => cambiarLabel(r.id, e.target.value)}
                style={{ height: 28, fontSize: 12, flex: 1, minWidth: 0, ...(r.esBase ? { background: "var(--secondary)", cursor: "default", color: "var(--muted-foreground)" } : {}) }}
                placeholder="Nombre del estado"
              />
            </div>

            {/* Grupo 2: controles — baja a segunda línea en móvil */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
              {/* Toggle Aceptado */}
              <button
                onClick={() => toggleAceptado(r.id)}
                title={r.esAceptado ? "Aceptado (permite avanzar etapa) — click para cambiar" : "No aceptado (bloquea avance) — click para cambiar"}
                style={{
                  flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, border: "1px solid",
                  cursor: "pointer",
                  background: r.esAceptado ? "color-mix(in oklch, var(--chart-2) 15%, transparent)" : "color-mix(in oklch, var(--chart-4) 15%, transparent)",
                  borderColor: r.esAceptado ? "color-mix(in oklch, var(--chart-2) 40%, transparent)" : "color-mix(in oklch, var(--chart-4) 40%, transparent)",
                  color: r.esAceptado ? "var(--chart-2)" : "var(--chart-4)",
                }}
              >
                {r.esAceptado ? "✓ Aceptado" : "✗ No aceptado"}
              </button>

              {/* Selector de color */}
              <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
                {BADGE_PALETA.map((p, pi) => (
                  <button
                    key={pi}
                    title={`Color ${pi + 1}`}
                    onClick={() => cambiarCls(r.id, p.cls)}
                    style={{
                      width: 14, height: 14, borderRadius: "50%",
                      border: r.cls === p.cls ? "2px solid var(--foreground)" : "2px solid transparent",
                      background: p.sample, cursor: "pointer", padding: 0,
                    }}
                  />
                ))}
              </div>

              {/* Preview badge */}
              <Badge variant="outline" className={`${r.cls} text-[9px]`} style={{ padding: "0px 6px", flexShrink: 0, minWidth: 80, textAlign: "center" }}>
                {r.icono ? `${r.icono} ` : ""}{r.label || "—"}
              </Badge>

              {/* maxRetesteos — solo para resultados no aceptados; ocupa fila propia en móvil */}
              {!r.esAceptado && (
                <div className="w-full sm:w-auto" style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:9, color:"var(--muted-foreground)", whiteSpace:"nowrap" }}>Máx. ret.</span>
                  <input
                    type="number"
                    min={1}
                    value={r.maxRetesteos ?? ""}
                    onChange={e => cambiarMaxRetesteos(r.id, e.target.value === "" ? undefined : Math.max(1, parseInt(e.target.value)))}
                    placeholder="∞"
                    title="Máximo de retesteos permitidos (vacío = ilimitado)"
                    style={{ width:44, height:28, fontSize:11, borderRadius:5, border:"1px solid var(--border)", background:"var(--background)", textAlign:"center", padding:"0 4px", color:"var(--foreground)" }}
                  />
                </div>
              )}

              {/* Eliminar (solo si no es base) */}
              {!r.esBase ? (
                <DeleteConfirmButton onConfirm={() => eliminar(r.id)} title="Eliminar estado" />
              ) : (
                <span style={{ width: 17, flexShrink: 0 }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Agregar nuevo estado */}
      <div style={{ padding: "12px 14px", borderRadius: 8, border: "1px dashed var(--border)", background: "var(--background)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-foreground)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Nuevo estado personalizado
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Input
            value={nuevoLabel}
            onChange={e => setNuevoLabel(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") agregar() }}
            placeholder="Nombre del estado (ej: Incompleto, Parcial...)"
            style={{ height: 30, fontSize: 12, flex: 1, minWidth: 160 }}
          />

          {/* Toggle aceptado para el nuevo */}
          <button
            onClick={() => setNuevoAceptado(v => !v)}
            style={{
              flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5, border: "1px solid",
              cursor: "pointer",
              background: nuevoAceptado ? "color-mix(in oklch, var(--chart-2) 15%, transparent)" : "color-mix(in oklch, var(--chart-4) 15%, transparent)",
              borderColor: nuevoAceptado ? "color-mix(in oklch, var(--chart-2) 40%, transparent)" : "color-mix(in oklch, var(--chart-4) 40%, transparent)",
              color: nuevoAceptado ? "var(--chart-2)" : "var(--chart-4)",
            }}
          >
            {nuevoAceptado ? "✓ Aceptado" : "✗ No aceptado"}
          </button>

          {/* Selector de color */}
          <div style={{ display: "flex", gap: 3 }}>
            {BADGE_PALETA.map((p, pi) => (
              <button
                key={pi}
                onClick={() => setNuevoCls(p.cls)}
                style={{
                  width: 14, height: 14, borderRadius: "50%",
                  border: nuevoCls === p.cls ? "2px solid var(--foreground)" : "2px solid transparent",
                  background: p.sample, cursor: "pointer", padding: 0,
                }}
              />
            ))}
          </div>

          <Button size="sm" style={{ height: 30, gap: 4 }} onClick={agregar} disabled={!nuevoLabel.trim()}>
            <Plus size={12} /> Agregar
          </Button>
        </div>
      </div>

      {/* Restaurar predeterminados */}
      {hayDiferencias && (
        <button
          onClick={() => onChange(RESULTADOS_PREDETERMINADOS)}
          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}
          className="hover:text-foreground"
        >
          <RotateCcw size={11} /> Restaurar estados predeterminados
        </button>
      )}
    </div>
  )
}
