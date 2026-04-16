"use client"

import { STORAGE_KEYS } from "@/lib/storage"
import { historiasEjemplo, type HistoriaUsuario } from "@/lib/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { api } from "@/lib/services/api/client"
import { d, dOpt, parseBloqueo } from "@/lib/utils/parsers"
import { API } from "@/lib/constants/api-routes"

function parseHistorias(raw: HistoriaUsuario[]): HistoriaUsuario[] {
  return raw.map(h => ({
    ...h,
    fechaCreacion:    d(h.fechaCreacion),
    fechaFinEstimada: dOpt(h.fechaFinEstimada),
    fechaCierre:      dOpt(h.fechaCierre),
    bloqueos:  h.bloqueos.map(parseBloqueo),
    historial: h.historial.map(e => ({ ...e, fecha: d(e.fecha) })),
  }))
}

export function useHistoriasData() {
  return useApiQuery<HistoriaUsuario[]>(
    "historias", STORAGE_KEYS.historias, historiasEjemplo,
    (_signal) => api.get<{ historias: HistoriaUsuario[] }>(API.historias).then(r => parseHistorias(r.historias)),
    (data) => api.post(API.historiasSync, { historias: data }).then(() => void 0),
  )
}
