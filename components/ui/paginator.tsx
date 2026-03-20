"use client"

interface PaginadorProps {
  pagina: number
  total: number
  pageSize: number
  onCambiar: (p: number) => void
}

export function Paginador({ pagina, total, pageSize, onCambiar }: PaginadorProps) {
  const totalPags = Math.ceil(total / pageSize)
  if (totalPags <= 1) return null
  const inicio = (pagina - 1) * pageSize + 1
  const fin    = Math.min(pagina * pageSize, total)
  const pages: (number | "...")[] = []
  for (let i = 1; i <= totalPags; i++) {
    if (i === 1 || i === totalPags || (i >= pagina - 2 && i <= pagina + 2)) pages.push(i)
    else if (pages[pages.length - 1] !== "...") pages.push("...")
  }
  const navBtn = (dis: boolean) => ({ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:28, height:28, padding:"0 8px", borderRadius:6, fontSize:14, border:"1px solid var(--border)", background:"var(--card)", color: dis ? "var(--muted-foreground)" : "var(--foreground)", cursor: dis ? "default" : "pointer", opacity: dis ? 0.4 : 1 } as const)
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:8, borderTop:"1px solid var(--border)", marginTop:2 }}>
      <span style={{ fontSize:12, color:"var(--muted-foreground)" }}>Mostrando {inicio}–{fin} de {total}</span>
      <div style={{ display:"flex", gap:4, alignItems:"center" }}>
        <button onClick={() => onCambiar(pagina - 1)} disabled={pagina === 1} style={navBtn(pagina === 1)}>‹</button>
        {pages.map((p, i) => p === "..."
          ? <span key={`e${i}`} style={{ fontSize:12, color:"var(--muted-foreground)", padding:"0 2px" }}>…</span>
          : <button key={p} onClick={() => onCambiar(p as number)} style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:28, height:28, padding:"0 6px", borderRadius:6, fontSize:12, fontWeight: p===pagina ? 700 : 400, border:`1px solid ${p===pagina ? "var(--primary)" : "var(--border)"}`, background: p===pagina ? "var(--primary)" : "var(--card)", color: p===pagina ? "var(--primary-foreground)" : "var(--foreground)", cursor: p===pagina ? "default" : "pointer" }}>{p}</button>
        )}
        <button onClick={() => onCambiar(pagina + 1)} disabled={pagina === totalPags} style={navBtn(pagina === totalPags)}>›</button>
      </div>
    </div>
  )
}
