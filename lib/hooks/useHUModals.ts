"use client"
import { useState } from "react"
import type { HistoriaUsuario } from "@/lib/types"

interface UseHUModalsOptions {
  historias: HistoriaUsuario[]
  onEliminarConfirmado: (hu: HistoriaUsuario) => void
  onBulkEliminarConfirmado: (ids: string[]) => void
}

export function useHUModals({ historias, onEliminarConfirmado, onBulkEliminarConfirmado }: UseHUModalsOptions) {
  const [tabActiva, setTabActiva] = useState("inicio")
  const [busqueda, setBusqueda] = useState("")
  const [huFormOpen, setHuFormOpen] = useState(false)
  const [huDetailOpen, setHuDetailOpen] = useState(false)
  const [huSeleccionadaId, setHuSeleccionadaId] = useState<string | null>(null)
  const [huEditar, setHuEditar] = useState<HistoriaUsuario | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; titulo: string; subtitulo?: string; fn: () => void }>({ open: false, titulo: "", fn: () => {} })
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [configSeccion, setConfigSeccion] = useState<"roles" | "tipos" | "aplicaciones" | "ambientes" | "tipos_prueba" | "etapas" | "sprints">("roles")
  const [adminSeccion, setAdminSeccion] = useState<"auditoria" | "usuarios" | "configuracion">("auditoria")

  const huSeleccionada = huSeleccionadaId ? (historias.find(h => h.id === huSeleccionadaId) ?? null) : null

  const abrirHU = (hu: HistoriaUsuario) => { setHuSeleccionadaId(hu.id); setHuDetailOpen(true) }
  const cerrarHU = () => { setHuDetailOpen(false); setHuSeleccionadaId(null) }

  const handleNuevaHU = () => { setHuEditar(null); setHuFormOpen(true) }
  const handleEditarHU = (hu: HistoriaUsuario) => { setHuEditar(hu); setHuFormOpen(true) }

  const handleEliminarHU = (hu: HistoriaUsuario) => {
    setDeleteModal({
      open: true,
      titulo: "¿Eliminar Historia de Usuario?",
      subtitulo: `"${hu.titulo}" y sus ${hu.casosIds.length} caso(s) de prueba`,
      fn: () => {
        onEliminarConfirmado(hu)
        setDeleteModal(d => ({ ...d, open: false }))
      },
    })
  }

  const handleBulkEliminar = (ids: string[]) => {
    setDeleteModal({
      open: true,
      titulo: `¿Eliminar ${ids.length} Historia${ids.length !== 1 ? "s" : ""} de Usuario?`,
      subtitulo: "Esta acción también eliminará todos sus casos de prueba asociados",
      fn: () => {
        onBulkEliminarConfirmado(ids)
        setDeleteModal(d => ({ ...d, open: false }))
      },
    })
  }

  return {
    tabActiva, setTabActiva,
    busqueda, setBusqueda,
    huFormOpen, setHuFormOpen,
    huDetailOpen, setHuDetailOpen,
    huEditar, setHuEditar,
    deleteModal, setDeleteModal,
    importModalOpen, setImportModalOpen,
    configSeccion, setConfigSeccion,
    adminSeccion, setAdminSeccion,
    huSeleccionada,
    abrirHU, cerrarHU,
    handleNuevaHU, handleEditarHU,
    handleEliminarHU, handleBulkEliminar,
  }
}
