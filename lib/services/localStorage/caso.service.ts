import { cargarDeStorage, guardarEnStorage } from "@/lib/storage"
import { STORAGE_KEYS } from "@/lib/storage"
import type { CasoPrueba } from "@/lib/types/index"
import { casosPruebaEjemplo } from "@/lib/data/seed"
import type { ICasoService } from "@/lib/services/interfaces"

export const casoStorageService: ICasoService = {
  getAll(): CasoPrueba[] {
    return cargarDeStorage<CasoPrueba[]>(STORAGE_KEYS.casos, casosPruebaEjemplo)
  },

  saveAll(casos: CasoPrueba[]): void {
    guardarEnStorage(STORAGE_KEYS.casos, casos)
  },
}
