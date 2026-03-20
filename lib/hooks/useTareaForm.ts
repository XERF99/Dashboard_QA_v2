"use client"
import { useState } from "react"
import type { Tarea, TipoTarea, PrioridadTarea } from "@/lib/types"

interface UseTareaFormOptions {
  casoPruebaId: string
  huId: string
  currentUser?: string
  onAddTarea: (tarea: Tarea) => void
  onEditarTarea: (tarea: Tarea) => void
}

export function useTareaForm({ casoPruebaId, huId, currentUser, onAddTarea, onEditarTarea }: UseTareaFormOptions) {
  const [editandoTarea, setEditandoTarea] = useState<Tarea | null>(null)
  const [showTareaForm, setShowTareaForm] = useState(false)
  const [tareaTitulo, setTareaTitulo] = useState("")
  const [tareaDesc, setTareaDesc] = useState("")
  const [tareaTipo, setTareaTipo] = useState<TipoTarea>("ejecucion")
  const [tareaPrioridad, setTareaPrioridad] = useState<PrioridadTarea>("media")
  const [tareaHoras, setTareaHoras] = useState(4)

  const resetTareaForm = () => {
    setTareaTitulo(""); setTareaDesc(""); setTareaTipo("ejecucion"); setTareaPrioridad("media"); setTareaHoras(4)
  }

  const submitTarea = () => {
    if (!tareaTitulo.trim()) return
    const tarea: Tarea = {
      id: `T-${Date.now()}`,
      casoPruebaId,
      huId,
      titulo: tareaTitulo.trim(),
      descripcion: tareaDesc.trim(),
      asignado: currentUser || "Sistema",
      estado: "pendiente",
      resultado: "pendiente",
      tipo: tareaTipo,
      prioridad: tareaPrioridad,
      horasEstimadas: tareaHoras,
      horasReales: 0,
      fechaCreacion: new Date(),
      bloqueos: [],
      evidencias: "",
      creadoPor: currentUser || "Sistema",
    }
    onAddTarea(tarea)
    resetTareaForm()
    setShowTareaForm(false)
  }

  const submitEditarTarea = () => {
    if (!editandoTarea || !tareaTitulo.trim()) return
    onEditarTarea({
      ...editandoTarea,
      titulo: tareaTitulo.trim(),
      descripcion: tareaDesc.trim(),
      tipo: tareaTipo,
      prioridad: tareaPrioridad,
      horasEstimadas: tareaHoras,
    })
    setEditandoTarea(null)
    resetTareaForm()
  }

  const abrirEditarTarea = (tarea: Tarea) => {
    setEditandoTarea(tarea)
    setTareaTitulo(tarea.titulo)
    setTareaDesc(tarea.descripcion)
    setTareaTipo(tarea.tipo)
    setTareaPrioridad(tarea.prioridad)
    setTareaHoras(tarea.horasEstimadas)
    setShowTareaForm(false)
  }

  return {
    editandoTarea, setEditandoTarea,
    showTareaForm, setShowTareaForm,
    tareaTitulo, setTareaTitulo,
    tareaDesc, setTareaDesc,
    tareaTipo, setTareaTipo,
    tareaPrioridad, setTareaPrioridad,
    tareaHoras, setTareaHoras,
    resetTareaForm,
    submitTarea,
    submitEditarTarea,
    abrirEditarTarea,
  }
}
