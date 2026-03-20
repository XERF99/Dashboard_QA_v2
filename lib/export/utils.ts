/** Utilidades compartidas para todos los módulos de exportación. */

export const APROBACION_LABEL: Record<string, string> = {
  borrador:             "Borrador",
  pendiente_aprobacion: "Pendiente aprobación",
  aprobado:             "Aprobado",
  rechazado:            "Rechazado",
}

const MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

export function fmtDate(d?: Date): string {
  if (!d) return ""
  return `${d.getDate().toString().padStart(2,"0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function csvEscape(v: string | number): string {
  const s = String(v)
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes(";")) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function downloadCSV(filename: string, rows: (string | number)[][]) {
  const content = rows.map(r => r.map(csvEscape).join(",")).join("\n")
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function openAndPrint(html: string) {
  const win = window.open("", "_blank", "width=1000,height=700")
  if (!win) {
    alert("El navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio.")
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 400)
}
