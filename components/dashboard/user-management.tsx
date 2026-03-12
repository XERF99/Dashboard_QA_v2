"use client"

import { useState } from "react"
import { useAuth, roleDescriptions, type User, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { 
  Users, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  Eye,
  Edit as EditIcon,
  UserPlus
} from "lucide-react"

export function UserManagement() {
  const { users, user: currentUser, addUser, updateUser, deleteUser } = useAuth()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Form state
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [rol, setRol] = useState<UserRole>("viewer")

  const resetForm = () => {
    setNombre("")
    setEmail("")
    setRol("viewer")
    setUserToEdit(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setFormOpen(true)
  }

  const handleOpenEdit = (user: User) => {
    setUserToEdit(user)
    setNombre(user.nombre)
    setEmail(user.email)
    setRol(user.rol)
    setFormOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (userToEdit) {
      updateUser({
        ...userToEdit,
        nombre,
        email,
        rol
      })
    } else {
      addUser({ nombre, email, rol })
    }
    
    setFormOpen(false)
    resetForm()
  }

  const handleDelete = () => {
    if (userToDelete) {
      deleteUser(userToDelete.id)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const confirmDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const getRoleIcon = (userRol: UserRole) => {
    switch (userRol) {
      case "admin": return <Shield className="h-4 w-4" />
      case "editor": return <EditIcon className="h-4 w-4" />
      case "viewer": return <Eye className="h-4 w-4" />
    }
  }

  const getRoleBadgeStyle = (userRol: UserRole) => {
    switch (userRol) {
      case "admin": return "bg-chart-4/20 text-chart-4 border-chart-4/30"
      case "editor": return "bg-chart-1/20 text-chart-1 border-chart-1/30"
      case "viewer": return "bg-chart-2/20 text-chart-2 border-chart-2/30"
    }
  }

  // Estadisticas
  const stats = {
    total: users.length,
    admins: users.filter(u => u.rol === "admin").length,
    editors: users.filter(u => u.rol === "editor").length,
    viewers: users.filter(u => u.rol === "viewer").length
  }

  return (
    <div className="space-y-6">
      {/* Estadisticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription>Total Usuarios</CardDescription>
            <CardTitle className="text-3xl text-foreground">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Shield className="h-3 w-3" /> Administradores
            </CardDescription>
            <CardTitle className="text-3xl text-chart-4">{stats.admins}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <EditIcon className="h-3 w-3" /> Editores
            </CardDescription>
            <CardTitle className="text-3xl text-chart-1">{stats.editors}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> Visualizadores
            </CardDescription>
            <CardTitle className="text-3xl text-chart-2">{stats.viewers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Header con boton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Gestion de Usuarios</h2>
        </div>
        <Button onClick={handleOpenCreate} className="bg-primary hover:bg-primary/90">
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Tabla de usuarios */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Usuario</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Rol</TableHead>
                <TableHead className="text-muted-foreground">Permisos</TableHead>
                <TableHead className="text-muted-foreground w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className="border-border hover:bg-secondary/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {u.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {u.nombre}
                          {u.id === currentUser?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">(Tu)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getRoleBadgeStyle(u.rol)} flex items-center gap-1 w-fit`}>
                      {getRoleIcon(u.rol)}
                      {roleDescriptions[u.rol].label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {roleDescriptions[u.rol].description}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEdit(u)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {u.id !== currentUser?.id && (
                          <DropdownMenuItem 
                            onClick={() => confirmDelete(u)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de crear/editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {userToEdit ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {userToEdit 
                ? "Modifica los datos del usuario" 
                : "Agrega un nuevo usuario al sistema"
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel>Nombre completo</FieldLabel>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan Perez"
                  className="bg-secondary border-border"
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@empresa.com"
                  className="bg-secondary border-border"
                  required
                />
              </Field>

              <Field>
                <FieldLabel>Rol</FieldLabel>
                <Select value={rol} onValueChange={(value) => setRol(value as UserRole)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administrador
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <EditIcon className="h-4 w-4" />
                        Editor
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Visualizador
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {roleDescriptions[rol].description}
                </p>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                {userToEdit ? "Guardar Cambios" : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialogo de confirmacion de eliminacion */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar Usuario</AlertDialogTitle>
            <AlertDialogDescription>
              Estas seguro que deseas eliminar a <strong>{userToDelete?.nombre}</strong>?
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
