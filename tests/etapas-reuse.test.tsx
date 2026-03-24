// @vitest-environment jsdom
// ═══════════════════════════════════════════════════════════
//  TESTS — EtapasConfig · reutilizar etapas existentes
//  Verifica la fila de sugerencias: visibilidad, filtrado,
//  deduplicación y acción de añadir al hacer clic.
// ═══════════════════════════════════════════════════════════

import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import React from "react"
import { EtapasConfig } from "@/components/dashboard/config/etapas-config"
import type { ConfigEtapas, TipoAplicacionDef } from "@/lib/types"

// ── Fixtures ──────────────────────────────────────────────
const TIPO_WEB:    TipoAplicacionDef = { id: "t_web",    label: "Web Test"    }
const TIPO_API:    TipoAplicacionDef = { id: "t_api",    label: "API Test"    }
const TIPO_MOBILE: TipoAplicacionDef = { id: "t_mobile", label: "Mobile Test" }
const TIPOS = [TIPO_WEB, TIPO_API, TIPO_MOBILE]

const etapaUAT    = { id: "uat",     label: "UAT",     cls: "bg-blue-500/20 text-blue-500 border-blue-500/30" }
const etapaStage  = { id: "staging", label: "Staging", cls: "bg-green-500/20 text-green-500 border-green-500/30" }

function expand(label: string) {
  fireEvent.click(screen.getByText(label))
}

// ── Tests ─────────────────────────────────────────────────

describe("EtapasConfig — reutilizar etapas existentes", () => {

  it("no muestra la fila de sugerencias cuando ningún otro tipo tiene etapas", () => {
    const config: ConfigEtapas = { t_web: [], t_api: [], t_mobile: [] }
    render(<EtapasConfig config={config} onChange={() => {}} tipos={TIPOS} />)

    expand("API Test")

    expect(screen.queryByText("Reusar etapa existente:")).not.toBeInTheDocument()
  })

  it("muestra sugerencia cuando otro tipo tiene una etapa ausente en el actual", () => {
    const config: ConfigEtapas = { t_web: [etapaUAT], t_api: [], t_mobile: [] }
    render(<EtapasConfig config={config} onChange={() => {}} tipos={TIPOS} />)

    expand("API Test")

    expect(screen.getByText("Reusar etapa existente:")).toBeInTheDocument()
    expect(screen.getByText("+ UAT")).toBeInTheDocument()
  })

  it("no sugiere etapas que ya están en el tipo actual", () => {
    const config: ConfigEtapas = {
      t_web:    [etapaUAT, etapaStage],
      t_api:    [etapaUAT],            // UAT ya está en api → no debe sugerirse
      t_mobile: [],
    }
    render(<EtapasConfig config={config} onChange={() => {}} tipos={TIPOS} />)

    expand("API Test")

    expect(screen.getByText("+ Staging")).toBeInTheDocument()
    expect(screen.queryByText("+ UAT")).not.toBeInTheDocument()
  })

  it("deduplica: etapa presente en varios tipos solo aparece una vez como sugerencia", () => {
    // UAT está en t_web y t_mobile; t_api no la tiene → debe aparecer una sola vez
    const config: ConfigEtapas = {
      t_web:    [etapaUAT],
      t_api:    [],
      t_mobile: [etapaUAT],
    }
    render(<EtapasConfig config={config} onChange={() => {}} tipos={TIPOS} />)

    expand("API Test")

    const badges = screen.getAllByText("+ UAT")
    expect(badges).toHaveLength(1)
  })

  it("clic en sugerencia llama onChange con la etapa añadida al tipo", () => {
    const config: ConfigEtapas = { t_web: [etapaUAT], t_api: [], t_mobile: [] }
    const onChange = vi.fn()
    render(<EtapasConfig config={config} onChange={onChange} tipos={TIPOS} />)

    expand("API Test")
    fireEvent.click(screen.getByText("+ UAT"))

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith({
      t_web:    [etapaUAT],
      t_api:    [etapaUAT],
      t_mobile: [],
    })
  })
})
