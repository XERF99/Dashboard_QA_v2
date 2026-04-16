"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertTriangle, Plus, CheckCircle2, ShieldAlert,
} from "lucide-react"
import type { HistoriaUsuario, BloqueoActivo, BloqueoResuelto } from "@/lib/types"
import { useHUDetail } from "@/lib/contexts/hu-detail-context"
import { PNL, SLBL, fmt } from "./hu-detail-shared"

interface HUBloqueosProps {
  hu: HistoriaUsuario
  blActivos: BloqueoActivo[]
  blResueltos: BloqueoResuelto[]
  huCerrada: boolean
}

export function HUBloqueos({ hu, blActivos, blResueltos, huCerrada }: HUBloqueosProps) {
  const { isQA, isAdmin, isQALead, currentUser, onAddBloqueo, onResolverBloqueo } = useHUDetail()
  const [showBloqueoForm, setShowBloqueoForm] = useState(false)
  const [nuevoBloqueo, setNuevoBloqueo] = useState("")
  const [showResolverForm, setShowResolverForm] = useState<string | null>(null)
  const [notaResolucion, setNotaResolucion] = useState("")

  return (
    <div style={PNL}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <p style={{ ...SLBL, marginBottom:0 }}><ShieldAlert size={11}/>Bloqueos de la HU</p>
        {(isQA || isAdmin || isQALead) && !huCerrada && (
          <button onClick={()=>setShowBloqueoForm(v=>!v)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:11, color:"var(--primary)", display:"flex", alignItems:"center", gap:4, fontWeight:600 }}>
            <Plus size={11}/>Reportar
          </button>
        )}
      </div>
      {showBloqueoForm && (
        <div style={{ marginBottom:10 }}>
          <Textarea rows={2} value={nuevoBloqueo} onChange={e=>setNuevoBloqueo(e.target.value)}
            placeholder="Describe el bloqueo..."
            style={{ marginBottom:8, resize:"vertical", width:"100%", maxWidth:"100%", wordBreak:"break-word" }}/>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <Button variant="outline" size="sm" onClick={()=>setShowBloqueoForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={()=>{
              if (!nuevoBloqueo.trim()) return
              onAddBloqueo(hu.id, { id:`bl-${Date.now()}`, descripcion:nuevoBloqueo.trim(), fecha:new Date(), resuelto:false, reportadoPor:currentUser||"Sistema" })
              setNuevoBloqueo(""); setShowBloqueoForm(false)
            }} disabled={!nuevoBloqueo.trim()}>Guardar</Button>
          </div>
        </div>
      )}
      {hu.bloqueos.length===0 && !showBloqueoForm && <p style={{ fontSize:12, color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin bloqueos</p>}
      <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
        {blActivos.map(b=>(
          <div key={b.id} style={{ borderRadius:8, background:"color-mix(in oklch, var(--chart-4) 6%, transparent)", border:"1px solid color-mix(in oklch, var(--chart-4) 30%, var(--border))", overflow:"hidden" }}>
            <div style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"9px 11px" }}>
              <AlertTriangle size={13} style={{ color:"var(--chart-4)", marginTop:2, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:13, color:"var(--foreground)", lineHeight:1.4, marginBottom:2 }}>{b.descripcion}</p>
                <p style={{ fontSize:11, color:"var(--muted-foreground)" }}>{fmt(b.fecha)} · {b.reportadoPor}</p>
              </div>
              {(isAdmin || isQALead || isQA) && showResolverForm !== b.id && (
                <Button variant="outline" size="sm" onClick={()=>{ setShowResolverForm(b.id); setNotaResolucion("") }} style={{ height:26, fontSize:11, flexShrink:0 }}>
                  <CheckCircle2 size={11} className="mr-1"/>Resolver
                </Button>
              )}
            </div>
            {showResolverForm === b.id && (
              <div style={{ padding:"0 11px 10px 11px", borderTop:"1px solid color-mix(in oklch, var(--chart-4) 20%, var(--border))" }}>
                <p style={{ fontSize:11, fontWeight:600, color:"var(--chart-3)", margin:"8px 0 5px" }}>¿Cómo se levantó el bloqueo? *</p>
                <Textarea rows={2} value={notaResolucion} onChange={e => setNotaResolucion(e.target.value)}
                  placeholder="Describe cómo se resolvió el bloqueo..." style={{ fontSize:11, resize:"none", marginBottom:7 }} />
                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                  <Button variant="outline" size="sm" style={{ height:24, fontSize:10 }}
                    onClick={() => { setShowResolverForm(null); setNotaResolucion("") }}>Cancelar</Button>
                  <Button size="sm" style={{ height:24, fontSize:10 }} disabled={!notaResolucion.trim()}
                    className="bg-chart-2 hover:bg-chart-2/90 text-white"
                    onClick={() => { onResolverBloqueo(hu.id, b.id, notaResolucion.trim()); setShowResolverForm(null); setNotaResolucion("") }}>
                    <CheckCircle2 size={10} className="mr-1"/>Confirmar resolución
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {blResueltos.map(b=>(
          <div key={b.id} style={{ display:"flex", gap:8, padding:"8px 11px", borderRadius:8, background:"var(--secondary)", opacity:0.7 }}>
            <CheckCircle2 size={13} style={{ color:"var(--chart-2)", flexShrink:0, marginTop:2 }}/>
            <div>
              <p style={{ fontSize:12, color:"var(--foreground)", textDecoration:"line-through" }}>{b.descripcion}</p>
              <p style={{ fontSize:10, color:"var(--muted-foreground)", marginTop:1 }}>Resuelto · {b.reportadoPor}{b.resueltoPor ? ` por ${b.resueltoPor}` : ""}</p>
              {b.notaResolucion && <p style={{ fontSize:11, color:"var(--chart-2)", marginTop:2 }}><strong>Resolución:</strong> {b.notaResolucion}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
