import { cargarDeStorage, guardarEnStorage } from "@/lib/storage"
import { STORAGE_KEYS } from "@/lib/storage"
import type { ConfigEtapas, TipoAplicacionDef, AmbienteDef, TipoPruebaDef, ResultadoDef } from "@/lib/types/index"
import {
  ETAPAS_PREDETERMINADAS,
  RESULTADOS_PREDETERMINADOS,
  TIPOS_APLICACION_PREDETERMINADOS,
  AMBIENTES_PREDETERMINADOS,
  TIPOS_PRUEBA_PREDETERMINADOS,
} from "@/lib/constants/index"
import type { IConfigService } from "@/lib/services/interfaces"

export const configStorageService: IConfigService = {
  getEtapas(): ConfigEtapas {
    return cargarDeStorage<ConfigEtapas>(STORAGE_KEYS.configEtapas, ETAPAS_PREDETERMINADAS)
  },
  saveEtapas(config: ConfigEtapas): void {
    guardarEnStorage(STORAGE_KEYS.configEtapas, config)
  },

  getResultados(): ResultadoDef[] {
    return cargarDeStorage<ResultadoDef[]>(STORAGE_KEYS.configResultados, RESULTADOS_PREDETERMINADOS)
  },
  saveResultados(resultados: ResultadoDef[]): void {
    guardarEnStorage(STORAGE_KEYS.configResultados, resultados)
  },

  getTiposAplicacion(): TipoAplicacionDef[] {
    return cargarDeStorage<TipoAplicacionDef[]>(STORAGE_KEYS.tiposAplicacion, TIPOS_APLICACION_PREDETERMINADOS)
  },
  saveTiposAplicacion(tipos: TipoAplicacionDef[]): void {
    guardarEnStorage(STORAGE_KEYS.tiposAplicacion, tipos)
  },

  getAmbientes(): AmbienteDef[] {
    return cargarDeStorage<AmbienteDef[]>(STORAGE_KEYS.ambientes, AMBIENTES_PREDETERMINADOS)
  },
  saveAmbientes(ambientes: AmbienteDef[]): void {
    guardarEnStorage(STORAGE_KEYS.ambientes, ambientes)
  },

  getTiposPrueba(): TipoPruebaDef[] {
    return cargarDeStorage<TipoPruebaDef[]>(STORAGE_KEYS.tiposPrueba, TIPOS_PRUEBA_PREDETERMINADOS)
  },
  saveTiposPrueba(tipos: TipoPruebaDef[]): void {
    guardarEnStorage(STORAGE_KEYS.tiposPrueba, tipos)
  },

  getAplicaciones(): string[] {
    return cargarDeStorage<string[]>(STORAGE_KEYS.aplicaciones, [])
  },
  saveAplicaciones(apps: string[]): void {
    guardarEnStorage(STORAGE_KEYS.aplicaciones, apps)
  },
}
