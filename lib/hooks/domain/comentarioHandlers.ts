import type { Comentario } from "@/lib/types"
import type { DomainCtx } from "./types"
import { defineCommand, type CommandResult } from "./pipeline"

/** Handlers de comentarios en HUs y Casos de Prueba. */
export function createComentarioHandlers(ctx: DomainCtx) {
  const autor = ctx.user?.nombre || "Sistema"

  const handleAddComentarioHU = defineCommand(ctx, (huId: string, texto: string): CommandResult => {
    const c: Comentario = { id: `com-${crypto.randomUUID()}`, texto, autor, fecha: new Date() }
    return {
      historias: p => p.map(h => h.id !== huId ? h : { ...h, comentarios: [...h.comentarios, c] }),
    }
  })

  const handleAddComentarioCaso = defineCommand(ctx, (casoId: string, texto: string): CommandResult => {
    const c: Comentario = { id: `com-${crypto.randomUUID()}`, texto, autor, fecha: new Date() }
    return {
      casos: p => p.map(caso => caso.id !== casoId ? caso : { ...caso, comentarios: [...caso.comentarios, c] }),
    }
  })

  return { handleAddComentarioHU, handleAddComentarioCaso }
}
