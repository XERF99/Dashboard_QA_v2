"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus, CheckCircle2, AlertTriangle, FileText, ArrowRight,
  Lock, Pencil, XCircle, Play,
} from "lucide-react"
import {
  getEtapaHUCfg, siguienteEtapa,
  TIPOS_PRUEBA_PREDETERMINADOS,
  type HistoriaUsuario, type CasoPrueba, type Tarea,
  type EtapaEjecucion, type ResultadoEtapa, type TipoPrueba, type ComplejidadCaso, type EntornoCaso,
  type TipoPruebaDef,
} from "@/lib/types"
import { CasoPruebaCard } from "../casos/caso-prueba-card"
import { useHUDetail } from "@/lib/contexts/hu-detail-context"
import { PNL, SLBL } from "./hu-detail-shared"

interface HUCasosPanelProps {
  casosHU: CasoPrueba[]
  hu: HistoriaUsuario
  tareas: Tarea[]
  puedeAgregarCasos: boolean
  pasoPrimeraEtapa: boolean
}

export function HUCasosPanel({ casosHU, hu, tareas, puedeAgregarCasos, pasoPrimeraEtapa }: HUCasosPanelProps) {
  const {
    isQA, isAdmin, isQALead, currentUser,
    configEtapas, configResultados, tiposPrueba, onAddCaso, onEditarCaso, onAvanzarEtapa, onFallarHU,
  } = useHUDetail()

  const esAceptadoResultado = (resultado: string): boolean => {
    const def = configResultados.find(d => d.id === resultado)
    if (def) return def.esAceptado
    return resultado === "exitoso" || resultado === "error_preexistente" || resultado === "bloqueado"
  }

  const huCerrada = hu.estado === "exitosa" || hu.estado === "cancelada" || hu.estado === "fallida"

  const [showCasoForm, setShowCasoForm] = useState(false)
  const [editandoCaso, setEditandoCaso] = useState<CasoPrueba | null>(null)
  const [casoTitulo, setCasoTitulo]         = useState("")
  const [casoDesc, setCasoDesc]             = useState("")
  const [casoEntorno, setCasoEntorno]       = useState<EntornoCaso>("test")
  const [casoTipo, setCasoTipo]             = useState<TipoPrueba>("funcional")
  const [casoHoras, setCasoHoras]           = useState(8)
  const [casoArchivos, setCasoArchivos]     = useState("")
  const [casoComplejidad, setCasoComplejidad] = useState<ComplejidadCaso>("media")

  const resetCasoForm = () => {
    setCasoTitulo(""); setCasoDesc(""); setCasoEntorno("test"); setCasoTipo("funcional")
    setCasoHoras(8); setCasoArchivos(""); setCasoComplejidad("media")
  }

  const submitCaso = () => {
    if (!casoTitulo.trim()) return
    const caso: CasoPrueba = {
      id: `CP-${Date.now()}`, huId: hu.id,
      titulo: casoTitulo.trim(), descripcion: casoDesc.trim(),
      entorno: casoEntorno, tipoPrueba: casoTipo, horasEstimadas: casoHoras,
      archivosAnalizados: casoArchivos.split(",").map((s: string) => s.trim()).filter(Boolean),
      complejidad: casoComplejidad, estadoAprobacion: "borrador",
      resultadosPorEtapa: [], fechaCreacion: new Date(), tareasIds: [], bloqueos: [],
      creadoPor: currentUser || "Sistema", modificacionHabilitada: false, comentarios: [],
    }
    onAddCaso(caso)
    resetCasoForm()
    setShowCasoForm(false)
  }

  const submitEditarCaso = () => {
    if (!editandoCaso || !casoTitulo.trim()) return
    onEditarCaso({
      ...editandoCaso,
      titulo: casoTitulo.trim(), descripcion: casoDesc.trim(),
      entorno: casoEntorno, tipoPrueba: casoTipo, horasEstimadas: casoHoras,
      archivosAnalizados: casoArchivos.split(",").map((s: string) => s.trim()).filter(Boolean),
      complejidad: casoComplejidad, estadoAprobacion: "borrador",
      modificacionHabilitada: false, modificacionSolicitada: false,
    })
    setEditandoCaso(null)
    resetCasoForm()
  }

  const abrirEditarCaso = (caso: CasoPrueba) => {
    setEditandoCaso(caso)
    setCasoTitulo(caso.titulo); setCasoDesc(caso.descripcion)
    setCasoEntorno(caso.entorno); setCasoTipo(caso.tipoPrueba)
    setCasoHoras(caso.horasEstimadas)
    setCasoArchivos(caso.archivosAnalizados.join(", "))
    setCasoComplejidad(caso.complejidad)
    setShowCasoForm(false)
  }

  const etapaActualH = hu.etapa as EtapaEjecucion
  const enEjecucionActiva = !huCerrada && hu.estado === "en_progreso" &&
    hu.etapa !== "sin_iniciar" && hu.etapa !== "completada" && hu.etapa !== "cambio_cancelado"
  const aprobadosHU = casosHU.filter(c => c.estadoAprobacion === "aprobado")
  const resultadosEtapa: ResultadoEtapa[] = aprobadosHU
    .map(c => c.resultadosPorEtapa.find(r => r.etapa === etapaActualH))
    .filter((r): r is ResultadoEtapa => r !== undefined)
  const completadosEtapa     = resultadosEtapa.filter(r => r.estado === "completado")
  const exitososEtapa        = completadosEtapa.filter(r => r.resultado === "exitoso")
  const aceptadosNoExitosos  = completadosEtapa.filter(r => r.resultado !== "exitoso" && esAceptadoResultado(r.resultado))
  const fallidosEtapa        = completadosEtapa.filter(r => !esAceptadoResultado(r.resultado))
  const enEjecucionEtapa     = resultadosEtapa.filter(r => r.estado === "en_ejecucion")
  const todosCompletados     = aprobadosHU.length > 0 && completadosEtapa.length === aprobadosHU.length
  const todosAceptados       = todosCompletados && fallidosEtapa.length === 0
  const hayFallidos          = fallidosEtapa.length > 0
  const nextEtapa            = enEjecucionActiva ? siguienteEtapa(etapaActualH, hu.tipoAplicacion, configEtapas) : null

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <p style={{ ...SLBL, marginBottom:0 }}>
          <FileText size={11}/>Casos de Prueba ({casosHU.length})
        </p>
        {(isQA || isAdmin || isQALead) && puedeAgregarCasos && (
          <Button size="sm" variant="outline" onClick={() => { setShowCasoForm(true); setEditandoCaso(null); resetCasoForm() }}>
            <Plus size={12} className="mr-1"/> Nuevo Caso
          </Button>
        )}
        {pasoPrimeraEtapa && !hu.permitirCasosAdicionales && !isAdmin && !isQALead && !huCerrada && (
          <span style={{ fontSize:10, color:"var(--chart-3)", display:"flex", alignItems:"center", gap:4 }}>
            <Lock size={10}/> No se pueden agregar más casos
          </span>
        )}
      </div>

      {showCasoForm && !editandoCaso && (
        <div style={{ ...PNL, marginBottom:12, borderColor:"var(--primary)" }}>
          <p style={{ fontSize:12, fontWeight:700, color:"var(--foreground)", marginBottom:10 }}>Nuevo Caso de Prueba</p>
          <CasoFormFields
            titulo={casoTitulo} onTitulo={setCasoTitulo}
            desc={casoDesc} onDesc={setCasoDesc}
            entorno={casoEntorno} onEntorno={setCasoEntorno}
            tipo={casoTipo} onTipo={setCasoTipo}
            horas={casoHoras} onHoras={setCasoHoras}
            archivos={casoArchivos} onArchivos={setCasoArchivos}
            complejidad={casoComplejidad} onComplejidad={setCasoComplejidad}
            tiposPrueba={tiposPrueba}
          />
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Button variant="outline" size="sm" onClick={() => { setShowCasoForm(false); resetCasoForm() }}>Cancelar</Button>
            <Button size="sm" disabled={!casoTitulo.trim()} onClick={submitCaso}>Crear caso</Button>
          </div>
        </div>
      )}

      {editandoCaso && (
        <div style={{ ...PNL, marginBottom:12, borderColor:"var(--chart-1)" }}>
          <p style={{ fontSize:12, fontWeight:700, color:"var(--chart-1)", marginBottom:10 }}>
            <Pencil size={12} style={{ display:"inline", marginRight:5 }}/>Editando caso: {editandoCaso.id}
          </p>
          <CasoFormFields
            titulo={casoTitulo} onTitulo={setCasoTitulo}
            desc={casoDesc} onDesc={setCasoDesc}
            entorno={casoEntorno} onEntorno={setCasoEntorno}
            tipo={casoTipo} onTipo={setCasoTipo}
            horas={casoHoras} onHoras={setCasoHoras}
            archivos={casoArchivos} onArchivos={setCasoArchivos}
            complejidad={casoComplejidad} onComplejidad={setCasoComplejidad}
            tiposPrueba={tiposPrueba}
          />
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Button variant="outline" size="sm" onClick={() => { setEditandoCaso(null); resetCasoForm() }}>Cancelar</Button>
            <Button size="sm" disabled={!casoTitulo.trim()} onClick={submitEditarCaso}>Guardar cambios</Button>
          </div>
        </div>
      )}

      {casosHU.length === 0 && !showCasoForm && !editandoCaso && (
        <div style={{ textAlign:"center", padding:24, color:"var(--muted-foreground)", border:"1px dashed var(--border)", borderRadius:10 }}>
          <p style={{ fontSize:13 }}>Sin casos de prueba.{puedeAgregarCasos ? " Crea uno con el botón Nuevo Caso." : ""}</p>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {casosHU.map(caso => (
          <CasoPruebaCard
            key={caso.id}
            caso={caso}
            hu={hu}
            tareasCaso={tareas.filter(t => caso.tareasIds.includes(t.id))}
            onAbrirEditar={abrirEditarCaso}
          />
        ))}
      </div>

      {enEjecucionActiva && aprobadosHU.length > 0 && (
        <div style={{
          marginTop:14,
          padding:"14px 16px",
          borderRadius:10,
          border:`1px solid ${todosAceptados ? "var(--chart-2)" : hayFallidos ? "var(--chart-4)" : "var(--border)"}`,
          background: todosAceptados
            ? "color-mix(in oklch, var(--chart-2) 6%, var(--background))"
            : hayFallidos
            ? "color-mix(in oklch, var(--chart-4) 5%, var(--background))"
            : "var(--background)",
        }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:5 }}>
                Avance de etapa — {getEtapaHUCfg(etapaActualH, configEtapas).label}
              </p>
              {todosAceptados ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <CheckCircle2 size={14} style={{ color:"var(--chart-2)", flexShrink:0 }}/>
                    <p style={{ fontSize:13, fontWeight:600, color:"var(--chart-2)" }}>
                      {exitososEtapa.length === aprobadosHU.length
                        ? `Todos los casos exitosos (${aprobadosHU.length}/${aprobadosHU.length})`
                        : `${exitososEtapa.length} exitoso${exitososEtapa.length !== 1 ? "s" : ""}${aceptadosNoExitosos.length > 0 ? `, ${aceptadosNoExitosos.length} aceptado${aceptadosNoExitosos.length !== 1 ? "s" : ""} (no exitoso)` : ""} — listo para avanzar`
                      }
                    </p>
                  </div>
                  {aceptadosNoExitosos.length > 0 && (
                    <p style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:3 }}>
                      Los casos aceptados con resultado no exitoso no bloquean el avance — criterio del QA.
                    </p>
                  )}
                </div>
              ) : hayFallidos ? (
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <AlertTriangle size={14} style={{ color:"var(--chart-4)", flexShrink:0 }}/>
                    <p style={{ fontSize:13, fontWeight:600, color:"var(--chart-4)" }}>
                      {fallidosEtapa.length} caso{fallidosEtapa.length > 1 ? "s" : ""} fallido{fallidosEtapa.length > 1 ? "s" : ""} — aplica retesteo
                    </p>
                  </div>
                  <p style={{ fontSize:11, color:"var(--muted-foreground)", marginTop:3 }}>
                    Corrige los fallos y solicita retesteo, o declara el cambio como fallido.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize:13, fontWeight:600, color:"var(--foreground)" }}>
                  {completadosEtapa.length} de {aprobadosHU.length} caso{aprobadosHU.length > 1 ? "s" : ""} completado{completadosEtapa.length !== 1 ? "s" : ""}
                  {enEjecucionEtapa.length > 0 ? ` · ${enEjecucionEtapa.length} en ejecución` : ""}
                </p>
              )}
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0, flexWrap:"wrap" }}>
              {(isQA || isAdmin || isQALead) && hayFallidos && todosCompletados && (
                <Button
                  size="sm"
                  variant="outline"
                  style={{ borderColor:"var(--chart-4)", color:"var(--chart-4)" }}
                  onClick={() => onFallarHU(hu.id, "Casos de prueba fallidos sin retesteo exitoso")}
                >
                  <XCircle size={12} className="mr-1"/>Declarar cambio fallido
                </Button>
              )}
              {(isQA || isAdmin || isQALead) && todosAceptados && (
                <Button
                  size="sm"
                  onClick={() => onAvanzarEtapa(hu.id)}
                  className={nextEtapa ? "" : "bg-chart-2 hover:bg-chart-2/90 text-white"}
                >
                  {nextEtapa
                    ? <><ArrowRight size={12} className="mr-1"/>Avanzar a {getEtapaHUCfg(nextEtapa, configEtapas).label}</>
                    : <><CheckCircle2 size={12} className="mr-1"/>Completar HU</>
                  }
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface CasoFormFieldsProps {
  titulo: string; onTitulo: (v: string) => void
  desc: string; onDesc: (v: string) => void
  entorno: EntornoCaso; onEntorno: (v: EntornoCaso) => void
  tipo: TipoPrueba; onTipo: (v: TipoPrueba) => void
  horas: number; onHoras: (v: number) => void
  archivos: string; onArchivos: (v: string) => void
  complejidad: ComplejidadCaso; onComplejidad: (v: ComplejidadCaso) => void
  tiposPrueba?: TipoPruebaDef[]
}

function CasoFormFields({ titulo, onTitulo, desc, onDesc, entorno, onEntorno, tipo, onTipo, horas, onHoras, archivos, onArchivos, complejidad, onComplejidad, tiposPrueba }: CasoFormFieldsProps) {
  const tiposPruebaOpts = tiposPrueba?.length ? tiposPrueba : TIPOS_PRUEBA_PREDETERMINADOS
  return (
    <div className="grid grid-cols-2 gap-2 mb-2">
      <div style={{ gridColumn:"1/-1" }}>
        <Input value={titulo} onChange={e => onTitulo(e.target.value)} placeholder="Título del caso de prueba *" style={{ fontSize:12 }} />
      </div>
      <div style={{ gridColumn:"1/-1" }}>
        <Textarea rows={2} value={desc} onChange={e => onDesc(e.target.value)} placeholder="Descripción..." style={{ fontSize:12, resize:"none" }} />
      </div>
      <div>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Entorno</label>
        <Select value={entorno} onValueChange={(v: EntornoCaso) => onEntorno(v)}>
          <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
            <SelectItem value="preproduccion">Pre-Producción</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Tipo de prueba</label>
        <Select value={tipo} onValueChange={(v: TipoPrueba) => onTipo(v)}>
          <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            {tipo && !tiposPruebaOpts.some(t => t.id === tipo) && (
              <SelectItem value={tipo}>{tipo}</SelectItem>
            )}
            {tiposPruebaOpts.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Complejidad</label>
        <Select value={complejidad} onValueChange={(v: ComplejidadCaso) => onComplejidad(v)}>
          <SelectTrigger style={{ height:30, fontSize:11 }}><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Horas estimadas</label>
        <Input type="number" min={1} value={horas} onChange={e => onHoras(parseInt(e.target.value)||1)} style={{ height:30, fontSize:11 }} />
      </div>
      <div style={{ gridColumn:"1/3" }}>
        <label style={{ fontSize:10, color:"var(--muted-foreground)", display:"block", marginBottom:4 }}>Archivos analizados (separados por coma)</label>
        <Input value={archivos} onChange={e => onArchivos(e.target.value)} placeholder="archivo1.ts, archivo2.tsx" style={{ fontSize:11 }} />
      </div>
    </div>
  )
}
