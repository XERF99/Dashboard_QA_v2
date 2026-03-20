import type { Comentario } from "@/lib/types"
import type { DomainCtx } from "./types"

/** Handlers de comentarios en HUs y Casos de Prueba. */
export function createComentarioHandlers({ setHistorias, setCasos, user }: DomainCtx) {
  const handleAddComentarioHU = (huId: string, texto: string) => {
    const c: Comentario = { id: `com-${Date.now()}`, texto, autor: user?.nombre || "Sistema", fecha: new Date() }
    setHistorias(p => p.map(h => h.id !== huId ? h : { ...h, comentarios: [...h.comentarios, c] }))
  }

  const handleAddComentarioCaso = (casoId: string, texto: string) => {
    const c: Comentario = { id: `com-${Date.now()}`, texto, autor: user?.nombre || "Sistema", fecha: new Date() }
    setCasos(p => p.map(caso => caso.id !== casoId ? caso : { ...caso, comentarios: [...caso.comentarios, c] }))
  }

  return { handleAddComentarioHU, handleAddComentarioCaso }
}
