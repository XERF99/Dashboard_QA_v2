import { cargarDeStorage, guardarEnStorage } from "@/lib/storage"
import { STORAGE_KEYS } from "@/lib/storage"
import type { Tarea } from "@/lib/types/index"
import { tareasEjemplo } from "@/lib/data/seed"
import type { ITareaService } from "@/lib/services/interfaces"

export const tareaStorageService: ITareaService = {
  getAll(): Tarea[] {
    return cargarDeStorage<Tarea[]>(STORAGE_KEYS.tareas, tareasEjemplo)
  },

  saveAll(tareas: Tarea[]): void {
    guardarEnStorage(STORAGE_KEYS.tareas, tareas)
  },
}
