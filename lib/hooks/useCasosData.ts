"use client"

import { STORAGE_KEYS } from "@/lib/storage"
import { casosPruebaEjemplo, type CasoPrueba } from "@/lib/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { api } from "@/lib/services/api/client"
import { d, dOpt, parseBloqueo } from "@/lib/utils/parsers"
import { API } from "@/lib/constants/api-routes"

function parseCasos(raw: CasoPrueba[]): CasoPrueba[] {
  return raw.map(c => ({
    ...c,
    fechaCreacion:   d(c.fechaCreacion),
    fechaAprobacion: dOpt(c.fechaAprobacion),
    bloqueos:    c.bloqueos.map(parseBloqueo),
    comentarios: c.comentarios.map(cm => ({ ...cm, fecha: d(cm.fecha) })),
    resultadosPorEtapa: c.resultadosPorEtapa.map(r => ({
      ...r,
      fechaInicio: dOpt(r.fechaInicio),
      fechaFin:    dOpt(r.fechaFin),
    })),
  }))
}

export function useCasosData() {
  return useApiQuery<CasoPrueba[]>(
    "casos", STORAGE_KEYS.casos, casosPruebaEjemplo,
    (_signal) => api.get<{ casos: CasoPrueba[] }>(API.casos).then(r => parseCasos(r.casos)),
    (data) => api.post(API.casosSync, { casos: data }).then(() => void 0),
  )
}
