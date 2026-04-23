"use client"

import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { UserCheck2, UserMinus } from "lucide-react"
import type { User } from "@/lib/contexts/auth-context"

// Diálogos de asignar / quitar del workspace. Extraídos de user-management.tsx (v2.75).
export interface UserWorkspaceDialogsProps {
  // Asignar
  asignarDialogOpen:  boolean
  userToAsignar:      User | null
  targetGrupoId:      string
  onTargetGrupoId:    (v: string) => void
  asignando:          boolean
  grupoNombre:        string | null
  gruposMap:          Record<string, string>
  isOwner:            boolean
  onConfirmAsignar:   () => void
  onCancelAsignar:    () => void

  // Quitar
  quitarDialogOpen:   boolean
  userToQuitar:       User | null
  quitting:           boolean
  loadingAsignaciones: boolean
  asignaciones:        { historias: number; tareas: number } | null
  onConfirmQuitar:    () => void
  onCancelQuitar:     () => void
}

export function UserWorkspaceDialogs(props: UserWorkspaceDialogsProps) {
  const {
    asignarDialogOpen, userToAsignar, targetGrupoId, onTargetGrupoId,
    asignando, grupoNombre, gruposMap, isOwner,
    onConfirmAsignar, onCancelAsignar,
    quitarDialogOpen, userToQuitar, quitting, loadingAsignaciones, asignaciones,
    onConfirmQuitar, onCancelQuitar,
  } = props

  return (
    <>
      <Dialog open={asignarDialogOpen} onOpenChange={open => { if (!open) onCancelAsignar() }}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Asignar a Workspace</DialogTitle>
            <DialogDescription>
              {isOwner
                ? <>Selecciona el workspace al que quieres asignar a <strong>{userToAsignar?.nombre}</strong>.</>
                : <>¿Confirmas que quieres incorporar a <strong>{userToAsignar?.nombre}</strong> al workspace <strong>{grupoNombre}</strong>?</>
              }
            </DialogDescription>
          </DialogHeader>
          {isOwner && (
            <Select value={targetGrupoId} onValueChange={onTargetGrupoId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar workspace..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(gruposMap).map(([id, nombre]) => (
                  <SelectItem key={id} value={id}>{nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onCancelAsignar}>
              Cancelar
            </Button>
            <Button
              disabled={asignando || (isOwner && !targetGrupoId)}
              onClick={onConfirmAsignar}
              className="bg-primary hover:bg-primary/90"
            >
              <UserCheck2 className="h-4 w-4 mr-2" />
              {asignando ? "Asignando..." : "Confirmar asignación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={quitarDialogOpen} onOpenChange={open => { if (!open) onCancelQuitar() }}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Quitar del Workspace</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">{userToQuitar?.nombre}</strong> quedará sin workspace asignado.
                  Su cuenta no se eliminará, pero <strong className="text-foreground">perderá el acceso al sistema de inmediato</strong>:
                  no podrá iniciar sesión ni ver datos hasta que se le asigne un nuevo workspace.
                </p>

                {loadingAsignaciones && (
                  <p className="text-xs text-muted-foreground">Verificando asignaciones...</p>
                )}
                {!loadingAsignaciones && asignaciones && (asignaciones.historias > 0 || asignaciones.tareas > 0) && (
                  <div className="rounded-md border border-chart-4/30 bg-chart-4/10 px-3 py-2 text-xs text-chart-4">
                    <p className="font-semibold mb-1">Asignaciones que quedarán sin responsable:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {asignaciones.historias > 0 && (
                        <li>{asignaciones.historias} Historia{asignaciones.historias !== 1 ? "s" : ""} de Usuario</li>
                      )}
                      {asignaciones.tareas > 0 && (
                        <li>{asignaciones.tareas} Tarea{asignaciones.tareas !== 1 ? "s" : ""}</li>
                      )}
                    </ul>
                    <p className="mt-1">Reasígnalas antes de continuar o hazlo después desde la lista de HUs.</p>
                  </div>
                )}
                {!loadingAsignaciones && asignaciones && asignaciones.historias === 0 && asignaciones.tareas === 0 && (
                  <p className="text-xs text-muted-foreground">Este usuario no tiene HUs ni tareas asignadas.</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelQuitar}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={quitting}
              onClick={onConfirmQuitar}
              className="bg-chart-3 hover:bg-chart-3/90 text-white"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              {quitting ? "Quitando..." : "Quitar del workspace"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
