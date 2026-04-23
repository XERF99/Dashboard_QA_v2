"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

interface Props {
  label: string
  options: { value: string; label: string }[]
  onSelect: (v: string) => void
}

export function BulkActionSelect({ label, options, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:600, cursor:"pointer", border:"1px solid color-mix(in oklch, var(--primary) 35%, transparent)", background:"color-mix(in oklch, var(--primary) 10%, transparent)", color:"var(--primary)" }}
      >
        {label} <ChevronDown size={10}/>
      </button>
      {open && (
        <>
          <div style={{ position:"fixed", inset:0, zIndex:40 }} onClick={() => setOpen(false)}/>
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, zIndex:50, background:"var(--card)", border:"1px solid var(--border)", borderRadius:8, boxShadow:"0 4px 16px rgba(0,0,0,0.12)", padding:4, minWidth:170 }}>
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onSelect(opt.value); setOpen(false) }}
                style={{ display:"block", width:"100%", textAlign:"left", padding:"6px 10px", fontSize:12, border:"none", borderRadius:6, cursor:"pointer", background:"none", color:"var(--foreground)" }}
                className="hover:bg-secondary"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
