"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, Plus, BookOpen, AlertTriangle, Layers } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  ESTADO_HU_CFG, ETAPA_HU_CFG, PRIORIDAD_CFG, TIPO_APLICACION_LABEL, AMBIENTE_LABEL,
  type HistoriaUsuario, type CasoPrueba,
} from "@/lib/types"

interface Props {
  historias: HistoriaUsuario[]
  casos: CasoPrueba[]
  onVerDetalle: (hu: HistoriaUsuario) => void
  onEditar: (hu: HistoriaUsuario) => void
  onEliminar: (hu: HistoriaUsuario) => void
  onNueva: () => void
  canEdit?: boolean
}

export function HistoriasTable({ historias, casos, onVerDetalle, onEditar, onEliminar, onNueva, canEdit=true }: Props) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      {/* Barra superior */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <p style={{ fontSize:13, color:"var(--muted-foreground)" }}>
          {historias.length} {historias.length===1?"historia":"historias"} · clic en <strong>Ver</strong> para detalle, casos de prueba y trazabilidad
        </p>
        {canEdit && (
          <Button onClick={onNueva} size="sm">
            <Plus size={13} className="mr-1.5" /> Nueva HU
          </Button>
        )}
      </div>

      {historias.length === 0 && (
        <div style={{ textAlign:"center", padding:"48px", color:"var(--muted-foreground)" }}>
          <BookOpen size={32} style={{ margin:"0 auto 12px", opacity:0.4 }} />
          <p style={{ fontSize:14 }}>Sin historias de usuario. {canEdit && "Crea una con el botón Nueva HU."}</p>
        </div>
      )}

      {historias.map(hu => {
        const estCfg  = ESTADO_HU_CFG[hu.estado]
        const priCfg  = PRIORIDAD_CFG[hu.prioridad]
        const etaCfg  = ETAPA_HU_CFG[hu.etapa]
        const casosHU = casos.filter(c => hu.casosIds.includes(c.id))
        const tieneBloqueos = hu.bloqueos.some(b => !b.resuelto)

        // Progreso basado en casos aprobados con resultados exitosos
        const casosAprobados = casosHU.filter(c => c.estadoAprobacion === "aprobado")
        const casosCompletados = casosAprobados.filter(c =>
          c.resultadosPorEtapa.length > 0 && c.resultadosPorEtapa.every(r => r.estado === "completado")
        )
        const pct = casosAprobados.length > 0 ? Math.round((casosCompletados.length / casosAprobados.length) * 100) : 0

        return (
          <div key={hu.id} style={{
            display:"flex", alignItems:"center", gap:12,
            padding:"13px 16px", borderRadius:12,
            border: tieneBloqueos
              ? "1px solid color-mix(in oklch, var(--chart-4) 40%, var(--border))"
              : "1px solid var(--border)",
            background:"var(--card)", transition:"background 0.15s",
          }} className="hover:bg-secondary/30">

            {/* Código */}
            <p style={{ fontSize:12, fontFamily:"monospace", color:"var(--primary)", fontWeight:700, flexShrink:0, minWidth:54 }}>
              {hu.codigo}
            </p>

            {/* Título + tipo aplicación + ambiente */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                <p style={{ fontSize:14, fontWeight:600, color:"var(--foreground)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {hu.titulo}
                </p>
                {tieneBloqueos && <span title="Bloqueos activos"><AlertTriangle size={13} style={{ color:"var(--chart-4)", flexShrink:0 }} /></span>}
              </div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                  {TIPO_APLICACION_LABEL[hu.tipoAplicacion]}
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[9px]" style={{ padding:"1px 5px" }}>
                  {AMBIENTE_LABEL[hu.ambiente]}
                </Badge>
              </div>
            </div>

            {/* Meta: casos, etapa, prioridad, estado + progreso */}
            <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, flexWrap:"wrap" }}>
              <span style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:"var(--muted-foreground)" }}>
                <Layers size={11} /> {casosHU.length} caso{casosHU.length!==1?"s":""}
              </span>
              {/* Mini progreso */}
              {casosAprobados.length > 0 && (
                <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                  <Progress value={pct} className="h-1.5 w-16"/>
                  <span style={{ fontSize:10, color:"var(--muted-foreground)", fontFamily:"monospace" }}>{pct}%</span>
                </div>
              )}
              <Badge variant="outline" className={`${etaCfg.cls} text-[10px]`}>{etaCfg.label}</Badge>
              <Badge variant="outline" className={`${priCfg.cls} text-[10px]`}>{priCfg.label}</Badge>
              <Badge variant="outline" className={`${estCfg.cls} text-[10px]`}>{estCfg.label}</Badge>
            </div>

            {/* Responsable */}
            <p style={{ fontSize:12, color:"var(--muted-foreground)", flexShrink:0, minWidth:90, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {hu.responsable}
            </p>

            {/* Acciones */}
            <div style={{ display:"flex", gap:3, flexShrink:0 }}>
              <Button variant="ghost" size="sm" onClick={() => onVerDetalle(hu)}>
                <Eye size={13} className="mr-1" /> Ver
              </Button>
              {canEdit && <>
                <Button variant="ghost" size="sm" onClick={() => onEditar(hu)} title="Editar">
                  <Edit size={13} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEliminar(hu)}
                  title="Eliminar" style={{ color:"var(--chart-4)" }}>
                  <Trash2 size={13} />
                </Button>
              </>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
