// ════════════════════════════════���══════════════════════════
//  CSV UTILITIES — parseo y lógica compartida para importadores
// ═════════════════════════���═════════════════════════════════

export function parsearCSV(texto: string): string[][] {
  const filas: string[][] = []
  const lineas = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n")
  for (const linea of lineas) {
    if (!linea.trim()) continue
    const cols: string[] = []
    let enComillas = false
    let actual = ""
    for (let i = 0; i < linea.length; i++) {
      const c = linea[i]
      if (c === '"') {
        if (enComillas && linea[i + 1] === '"') { actual += '"'; i++ }
        else enComillas = !enComillas
      } else if (c === "," && !enComillas) {
        cols.push(actual.trim()); actual = ""
      } else {
        actual += c
      }
    }
    cols.push(actual.trim())
    filas.push(cols)
  }
  return filas
}

export function invertirCfg<T extends Record<string, { label: string }>>(cfg: T): Record<string, string> {
  return Object.entries(cfg).reduce((acc, [k, v]) => ({ ...acc, [v.label.toLowerCase()]: k }), {})
}

const MESES_CSV = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"]

export function parsearFechaCSV(s: string): Date | undefined {
  if (!s) return undefined
  const partes = s.trim().split(" ")
  if (partes.length !== 3) return undefined
  const [dia, mes, anio] = partes
  const iMes = MESES_CSV.indexOf(mes!.toLowerCase())
  if (iMes === -1) return undefined
  const fecha = new Date(parseInt(anio!), iMes, parseInt(dia!))
  return isNaN(fecha.getTime()) ? undefined : fecha
}
