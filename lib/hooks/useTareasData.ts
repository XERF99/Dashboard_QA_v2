"use client"

import { STORAGE_KEYS } from "@/lib/storage"
import { tareasEjemplo, type Tarea } from "@/lib/types"
import { useApiQuery } from "@/lib/hooks/useApiQuery"
import { api } from "@/lib/services/api/client"
import { d, dOpt, parseBloqueo } from "@/lib/utils/parsers"
import { API } from "@/lib/constants/api-routes"

function parseTareas(raw: Tarea[]): Tarea[] {
  return raw.map(t => ({
    ...t,
    fechaCreacion: d(t.fechaCreacion),
    fechaInicio:   dOpt(t.fechaInicio),
    fechaFin:      dOpt(t.fechaFin),
    bloqueos: t.bloqueos.map(parseBloqueo),
  }))
}

export function useTareasData() {
  return useApiQuery<Tarea[]>(
    "tareas", STORAGE_KEYS.tareas, tareasEjemplo,
    (_signal) => api.get<{ tareas: Tarea[] }>(API.tareas).then(r => parseTareas(r.tareas)),
    (data) => api.post(API.tareasSync, { tareas: data }).then(() => void 0),
  )
}
