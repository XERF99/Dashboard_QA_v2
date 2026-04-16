"use client"

import { useState, useRef } from "react"
import { Upload, X, CheckCircle, AlertTriangle, FileSpreadsheet, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  crearEvento,
  TIPOS_PRUEBA_PREDETERMINADOS,
  type CasoPrueba, type ComplejidadCaso, type EntornoCaso,
  type TipoPruebaDef, type HistoriaUsuario,
} from "@/lib/types"
import { parsearCSV } from "@/lib/csv-utils"

interface Props {
  open: boolean
  onClose: () => void
  onImport: (casos: CasoPrueba[]) => void
  historias: HistoriaUsuario[]
  tiposPrueba?: TipoPruebaDef[]
  currentUser?: string
}

type Fase = "upload" | "preview" | "importando"

interface FilaPreview {
  index: number
  datos: string[]
  error?: string
  caso?: Partial<CasoPrueba & { huId: string }>
}

// ── Helpers ──────────────────────────────────────────────────

const COMPLEJIDAD_MAP: Record<string, ComplejidadCaso> = {
  alta: "alta", alto: "alta", high: "alta",
  media: "media", medio: "media", medium: "media",
  baja: "baja", bajo: "baja", low: "baja",
}

const ENTORNO_MAP: Record<string, EntornoCaso> = {
  test: "test", prueba: "test", testing: "test",
  preproduccion: "preproduccion", "pre-produccion": "preproduccion",
  "pre-production": "preproduccion", preproduction: "preproduccion",
}

// ── Componente principal ──────────────────────────────────────

export function CSVImportCasosModal({ open, onClose, onImport, historias, tiposPrueba, currentUser }: Props) {
  const [fase, setFase] = useState<Fase>("upload")
  const [filas, setFilas] = useState<FilaPreview[]>([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Mapa código HU → id para resolución rápida
  const huPorCodigo = new Map(historias.map(h => [h.codigo.toLowerCase(), h]))
  const tiposDisp = tiposPrueba?.length ? tiposPrueba : TIPOS_PRUEBA_PREDETERMINADOS

  const procesarArchivo = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const texto = e.target?.result as string
      const todas = parsearCSV(texto)
      if (todas.length < 2) return
      const [, ...dataRows] = todas // skip header row

      const previews: FilaPreview[] = dataRows.map((cols, i) => {
        if (cols.length < 2) return { index: i, datos: cols, error: "Fila con columnas insuficientes" }

        // Columnas: Código HU(0) Título(1) Descripción(2) Tipo Prueba(3)
        //           Complejidad(4) Horas Estimadas(5) Entorno(6)
        const codigoHU = cols[0]?.trim()
        const titulo   = cols[1]?.trim()

        if (!codigoHU) return { index: i, datos: cols, error: "Código de HU vacío" }
        if (!titulo)   return { index: i, datos: cols, error: "Título vacío" }

        const hu = huPorCodigo.get(codigoHU.toLowerCase())
        if (!hu) return { index: i, datos: cols, error: `HU "${codigoHU}" no encontrada` }

        const complejidadRaw = cols[4]?.toLowerCase().trim() || "media"
        const entornoRaw     = cols[6]?.toLowerCase().trim() || "test"
        const tipoPruebaId   = tiposDisp.find(t => t.label.toLowerCase() === cols[3]?.toLowerCase().trim())?.id
                             ?? tiposDisp[0]?.id ?? "funcional"

        const caso: Partial<CasoPrueba> & { huId: string } = {
          huId:                 hu.id,
          titulo,
          descripcion:          cols[2]?.trim() || "",
          tipoPrueba:           tipoPruebaId,
          complejidad:          COMPLEJIDAD_MAP[complejidadRaw] ?? "media",
          horasEstimadas:       Math.max(1, parseInt(cols[5] ?? "1") || 1),
          entorno:              ENTORNO_MAP[entornoRaw] ?? "test",
          estadoAprobacion:     "borrador",
          archivosAnalizados:   [],
          resultadosPorEtapa:   [],
          tareasIds:            [],
          bloqueos:             [],
          comentarios:          [],
          modificacionHabilitada: false,
          fechaCreacion:        new Date(),
          creadoPor:            currentUser || "Importación CSV",
        }

        return { index: i, datos: cols, caso }
      })

      setFilas(previews)
      setFase("preview")
    }
    reader.readAsText(file, "utf-8")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith(".csv")) procesarArchivo(file)
  }

  const handleImport = () => {
    setFase("importando")
    const validas = filas.filter(f => f.caso && !f.error)
    const casos: CasoPrueba[] = validas.map((f, i) => ({
      ...f.caso!,
      id: `caso-import-${Date.now()}-${i}`,
    } as CasoPrueba))
    setTimeout(() => {
      onImport(casos)
      handleClose()
    }, 400)
  }

  const handleClose = () => {
    setFase("upload")
    setFilas([])
    onClose()
  }

  const filasValidas   = filas.filter(f => f.caso && !f.error).length
  const filasConError  = filas.filter(f => f.error).length

  if (!open) return null

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", padding:"16px" }} role="presentation">
      <div role="dialog" aria-modal="true" aria-label="Importar casos de prueba desde CSV" style={{
        background:"var(--card)", borderRadius:14, width:"100%", maxWidth:680,
        boxShadow:"0 20px 60px rgba(0,0,0,0.25)", overflow:"hidden", maxHeight:"90vh", display:"flex", flexDirection:"column",
      }}>
        {/* Barra de color superior */}
        <div style={{ height:4, background:"var(--chart-5)" }}/>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 22px 14px", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <FileSpreadsheet size={16} style={{ color:"var(--chart-5)" }}/>
            <div>
              <p style={{ fontSize:15, fontWeight:700, color:"var(--foreground)" }}>Importar Casos de Prueba desde CSV</p>
              <p style={{ fontSize:11, color:"var(--muted-foreground)" }}>
                {fase === "upload"     ? "Sube un archivo CSV con los casos a cargar en masa" :
                 fase === "preview"    ? `${filasValidas} caso${filasValidas !== 1 ? "s" : ""} válido${filasValidas !== 1 ? "s" : ""} · ${filasConError} con errores` :
                 "Creando casos..."}
              </p>
            </div>
          </div>
          <button onClick={handleClose} aria-label="Cerrar importación" style={{ background:"none", border:"none", cursor:"pointer", color:"var(--muted-foreground)", padding:4 }}>
            <X size={16}/>
          </button>
        </div>

        {/* Indicador de pasos */}
        <div style={{ display:"flex", padding:"10px 22px", gap:4, alignItems:"center", borderBottom:"1px solid var(--border)" }}>
          {(["upload","preview","importando"] as Fase[]).map((f, i) => {
            const labels    = ["Cargar","Preview","Importar"]
            const activo    = f === fase
            const completado = (fase === "preview" && f === "upload") || (fase === "importando" && f !== "importando")
            return (
              <div key={f} style={{ display:"flex", alignItems:"center", gap:4 }}>
                {i > 0 && <ChevronRight size={10} style={{ color:"var(--muted-foreground)" }}/>}
                <span style={{
                  fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:5,
                  background: completado ? "color-mix(in oklch, var(--chart-2) 15%, transparent)" :
                               activo    ? "color-mix(in oklch, var(--chart-5) 15%, transparent)" :
                               "var(--secondary)",
                  color: completado ? "var(--chart-2)" : activo ? "var(--chart-5)" : "var(--muted-foreground)",
                }}>{labels[i]}</span>
              </div>
            )
          })}
        </div>

        {/* Cuerpo */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 22px" }}>

          {/* ── Fase upload ── */}
          {fase === "upload" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {/* Zona de drop */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                style={{
                  border:`2px dashed ${dragOver ? "var(--chart-5)" : "var(--border)"}`,
                  borderRadius:12, padding:"36px 20px", textAlign:"center", cursor:"pointer",
                  background: dragOver ? "color-mix(in oklch, var(--chart-5) 5%, transparent)" : "var(--background)",
                  transition:"border-color 0.15s, background 0.15s",
                }}
              >
                <Upload size={28} style={{ color: dragOver ? "var(--chart-5)" : "var(--muted-foreground)", margin:"0 auto 10px" }}/>
                <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)", marginBottom:4 }}>
                  Arrastra un archivo CSV aquí
                </p>
                <p style={{ fontSize:12, color:"var(--muted-foreground)" }}>
                  o haz clic para seleccionarlo
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  style={{ display:"none" }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) procesarArchivo(f) }}
                />
              </div>

              {/* Formato esperado */}
              <div style={{ padding:"12px 14px", borderRadius:8, background:"var(--background)", border:"1px solid var(--border)" }}>
                <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:8 }}>
                  Formato esperado (columnas del CSV)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                  {[
                    "Código HU *","Título *","Descripción",
                    "Tipo de Prueba","Complejidad","Horas Estimadas","Entorno",
                  ].map((col, i) => (
                    <p key={i} style={{ fontSize:11, color:"var(--foreground)" }}>
                      <span style={{ color:"var(--muted-foreground)", marginRight:4 }}>{i + 1}.</span>{col}
                    </p>
                  ))}
                </div>
                <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:8 }}>
                  * Campos obligatorios. El Código HU debe corresponder a una historia existente.
                  Complejidad: alta / media / baja. Entorno: test / preproduccion.
                </p>
              </div>
            </div>
          )}

          {/* ── Fase preview ── */}
          {fase === "preview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-2.5">
                <div style={{ padding:"10px 14px", borderRadius:8, borderLeft:"3px solid var(--chart-2)", background:"color-mix(in oklch, var(--chart-2) 8%, var(--card))" }}>
                  <p style={{ fontSize:20, fontWeight:800, color:"var(--chart-2)", lineHeight:1 }}>{filasValidas}</p>
                  <p style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:3 }}>casos válidos a importar</p>
                </div>
                <div style={{
                  padding:"10px 14px", borderRadius:8,
                  borderLeft:`3px solid ${filasConError > 0 ? "var(--chart-3)" : "var(--border)"}`,
                  background: filasConError > 0 ? "color-mix(in oklch, var(--chart-3) 8%, var(--card))" : "var(--card)",
                }}>
                  <p style={{ fontSize:20, fontWeight:800, color: filasConError > 0 ? "var(--chart-3)" : "var(--muted-foreground)", lineHeight:1 }}>{filasConError}</p>
                  <p style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:3 }}>filas con error (se ignoran)</p>
                </div>
              </div>

              {/* Tabla de preview */}
              <div style={{ border:"1px solid var(--border)", borderRadius:8, overflow:"hidden" }}>
                <div style={{ maxHeight:280, overflowY:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                    <thead>
                      <tr style={{ background:"var(--secondary)", position:"sticky", top:0 }}>
                        <th style={{ padding:"7px 10px", textAlign:"left", color:"var(--muted-foreground)", fontWeight:700, fontSize:10 }}>Título</th>
                        <th style={{ padding:"7px 10px", textAlign:"left", color:"var(--muted-foreground)", fontWeight:700, fontSize:10 }} className="hidden sm:table-cell">HU</th>
                        <th style={{ padding:"7px 10px", textAlign:"left", color:"var(--muted-foreground)", fontWeight:700, fontSize:10 }} className="hidden sm:table-cell">Complejidad</th>
                        <th style={{ padding:"7px 10px", textAlign:"left", color:"var(--muted-foreground)", fontWeight:700, fontSize:10 }}>Resultado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map((fila, i) => (
                        <tr
                          key={i}
                          style={{
                            borderTop:"1px solid var(--border)",
                            background: fila.error ? "color-mix(in oklch, var(--chart-3) 6%, transparent)" : "transparent",
                          }}
                        >
                          <td style={{ padding:"6px 10px", color:"var(--foreground)" }}>
                            {fila.datos[1] || <span style={{ color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin título</span>}
                          </td>
                          <td style={{ padding:"6px 10px", color:"var(--muted-foreground)" }} className="hidden sm:table-cell">{fila.datos[0]}</td>
                          <td style={{ padding:"6px 10px", color:"var(--muted-foreground)" }} className="hidden sm:table-cell">{fila.datos[4] || "media"}</td>
                          <td style={{ padding:"6px 10px" }}>
                            {fila.error ? (
                              <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, color:"var(--chart-3)", fontWeight:600 }}>
                                <AlertTriangle size={9}/> {fila.error}
                              </span>
                            ) : (
                              <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:10, color:"var(--chart-2)", fontWeight:600 }}>
                                <CheckCircle size={9}/> OK
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Fase importando ── */}
          {fase === "importando" && (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, padding:"24px 0" }}>
              <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid var(--chart-5)", borderTopColor:"transparent", animation:"spin 0.8s linear infinite" }}/>
              <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)" }}>
                Creando {filasValidas} caso{filasValidas !== 1 ? "s" : ""}...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {fase !== "importando" && (
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8, padding:"14px 22px", borderTop:"1px solid var(--border)" }}>
            {fase === "preview" && (
              <button
                onClick={() => { setFase("upload"); setFilas([]) }}
                style={{ background:"none", border:"1px solid var(--border)", borderRadius:7, padding:"6px 14px", fontSize:12, cursor:"pointer", color:"var(--muted-foreground)" }}
              >
                Cambiar archivo
              </button>
            )}
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            {fase === "preview" && filasValidas > 0 && (
              <Button onClick={handleImport} style={{ background:"var(--chart-5)", color:"#fff" }}>
                <Upload size={13} className="mr-1.5"/>
                Importar {filasValidas} caso{filasValidas !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
