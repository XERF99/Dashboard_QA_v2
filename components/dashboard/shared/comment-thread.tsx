"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import type { Comentario } from "@/lib/types"

export function CommentThread({
  comentarios, onAdd, currentUser, canComment,
}: {
  comentarios: Comentario[]
  onAdd: (texto: string) => void
  currentUser?: string
  canComment: boolean
}) {
  const [texto, setTexto] = useState("")
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
  function fmtTs(d: Date) {
    const hoy = new Date()
    const esHoy = d.getFullYear()===hoy.getFullYear() && d.getMonth()===hoy.getMonth() && d.getDate()===hoy.getDate()
    const hhmm = `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`
    return esHoy ? `hoy ${hhmm}` : `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${hhmm}`
  }
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {comentarios.length === 0 && (
        <p style={{ fontSize:12, color:"var(--muted-foreground)", fontStyle:"italic" }}>Sin comentarios aún</p>
      )}
      {comentarios.map(c => (
        <div key={c.id} style={{ display:"flex", gap:8 }}>
          <div style={{
            width:26, height:26, borderRadius:"50%", flexShrink:0,
            background:"color-mix(in oklch, var(--primary) 15%, transparent)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, fontWeight:700, color:"var(--primary)",
          }}>
            {c.autor.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--foreground)" }}>{c.autor}</span>
              <span style={{ fontSize:10, color:"var(--muted-foreground)" }}>{fmtTs(c.fecha)}</span>
            </div>
            <p style={{ fontSize:12, color:"var(--foreground)", lineHeight:1.45, wordBreak:"break-word" }}>{c.texto}</p>
          </div>
        </div>
      ))}
      {canComment && (
        <div style={{ display:"flex", gap:8, alignItems:"flex-end", marginTop:4 }}>
          <div style={{
            width:26, height:26, borderRadius:"50%", flexShrink:0,
            background:"color-mix(in oklch, var(--primary) 15%, transparent)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:10, fontWeight:700, color:"var(--primary)",
          }}>
            {(currentUser||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
          </div>
          <Textarea
            rows={2}
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && texto.trim()) {
                onAdd(texto.trim()); setTexto("")
              }
            }}
            placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
            style={{ flex:1, resize:"none", fontSize:12 }}
          />
          <button
            onClick={() => { if (!texto.trim()) return; onAdd(texto.trim()); setTexto("") }}
            disabled={!texto.trim()}
            style={{
              padding:"6px 10px", borderRadius:7, border:"none", cursor:"pointer",
              background: texto.trim() ? "var(--primary)" : "var(--secondary)",
              color: texto.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)",
              display:"flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, flexShrink:0,
            }}
          >
            <Send size={12}/> Enviar
          </button>
        </div>
      )}
    </div>
  )
}
