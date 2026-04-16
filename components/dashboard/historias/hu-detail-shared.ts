import type React from "react"

export const PNL: React.CSSProperties = { padding:"13px 15px", borderRadius:10, border:"1px solid var(--border)", background:"var(--background)" }
export const SLBL: React.CSSProperties = { fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.1em", fontWeight:700, color:"var(--muted-foreground)", marginBottom:10, display:"flex", alignItems:"center", gap:5 }

export function fmt(d: Date): string {
  const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
