/**
 * Comprueba si un nombre de responsable/asignado corresponde a un usuario
 * activo en la lista de usuarios del workspace.
 * Devuelve false (huérfano) cuando el nombre no existe o el usuario está inactivo.
 */
export function isResponsableActivo(
  nombre: string,
  users: { nombre: string; activo: boolean }[]
): boolean {
  if (!nombre) return false
  return users.some(u => u.nombre === nombre && u.activo)
}
