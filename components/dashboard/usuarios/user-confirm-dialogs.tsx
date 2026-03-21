"use client"

import { type User, PASSWORD_GENERICA } from "@/lib/auth-context"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { KeyRound, Unlock } from "lucide-react"

interface UserConfirmDialogsProps {
  deleteDialogOpen: boolean
  userToDelete: User | null
  onConfirmDelete: () => void
  onCancelDelete: () => void

  resetDialogOpen: boolean
  userToReset: User | null
  onConfirmReset: () => void
  onCancelReset: () => void

  unlockDialogOpen: boolean
  userToUnlock: User | null
  onConfirmUnlock: () => void
  onCancelUnlock: () => void
}

export function UserConfirmDialogs({
  deleteDialogOpen, userToDelete, onConfirmDelete, onCancelDelete,
  resetDialogOpen,  userToReset,  onConfirmReset,  onCancelReset,
  unlockDialogOpen, userToUnlock, onConfirmUnlock, onCancelUnlock,
}: UserConfirmDialogsProps) {
  return (
    <>
      {/* Eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={open => { if (!open) onCancelDelete() }}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que deseas eliminar a <strong>{userToDelete?.nombre}</strong>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resetear contraseña */}
      <AlertDialog open={resetDialogOpen} onOpenChange={open => { if (!open) onCancelReset() }}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Resetear Contraseña</AlertDialogTitle>
            <AlertDialogDescription>
              La contraseña de <strong>{userToReset?.nombre}</strong> será cambiada a la
              genérica (<strong>{PASSWORD_GENERICA}</strong>). Deberá cambiarla en su próximo inicio de sesión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelReset}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmReset} className="bg-primary hover:bg-primary/90">
              <KeyRound className="h-4 w-4 mr-2" />
              Resetear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Desbloquear cuenta */}
      <AlertDialog open={unlockDialogOpen} onOpenChange={open => { if (!open) onCancelUnlock() }}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Desbloquear Cuenta</AlertDialogTitle>
            <AlertDialogDescription>
              La cuenta de <strong>{userToUnlock?.nombre}</strong> está bloqueada por demasiados intentos
              fallidos. Al desbloquearla podrá volver a iniciar sesión normalmente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelUnlock}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmUnlock} className="bg-chart-2 hover:bg-chart-2/90 text-white">
              <Unlock className="h-4 w-4 mr-2" />
              Desbloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
