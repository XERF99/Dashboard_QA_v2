// ═══════════════════════════════════════════════════════════
//  HISTORIA SERVICE — Implementación localStorage
//
//  Para conectar un backend, crear una nueva carpeta:
//    lib/services/api/historia.service.ts
//  con el mismo contrato (IHistoriaService) usando fetch/axios.
//  Luego cambiar el export en lib/services/index.ts.
// ═══════════════════════════════════════════════════════════

import { cargarDeStorage, guardarEnStorage } from "@/lib/storage"
import { STORAGE_KEYS } from "@/lib/storage"
import type { HistoriaUsuario } from "@/lib/types/index"
import { historiasEjemplo } from "@/lib/data/seed"
import type { IHistoriaService } from "@/lib/services/interfaces"

export const historiaStorageService: IHistoriaService = {
  getAll(): HistoriaUsuario[] {
    return cargarDeStorage<HistoriaUsuario[]>(STORAGE_KEYS.historias, historiasEjemplo)
  },

  saveAll(historias: HistoriaUsuario[]): void {
    guardarEnStorage(STORAGE_KEYS.historias, historias)
  },
}
