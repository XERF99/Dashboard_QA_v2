"use client"

import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TIPO_TAREA_LABEL, type TipoTarea, type PrioridadTarea } from "@/lib/types"

// Formulario compartido para crear / editar tareas. Extraído de
// caso-prueba-card.tsx (v2.75).
export interface TareaFormFieldsProps {
  titulo:     string;         onTitulo:     (v: string) => void
  desc:       string;         onDesc:       (v: string) => void
  tipo:       TipoTarea;      onTipo:       (v: TipoTarea) => void
  prioridad:  PrioridadTarea; onPrioridad:  (v: PrioridadTarea) => void
  horas:      number;         onHoras:      (v: number) => void
}

export function TareaFormFields({
  titulo, onTitulo, desc, onDesc, tipo, onTipo, prioridad, onPrioridad, horas, onHoras,
}: TareaFormFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5 mb-1.5">
      <div style={{ gridColumn: "1/-1" }}>
        <Input value={titulo} onChange={e => onTitulo(e.target.value)}
          placeholder="Título de la tarea *" style={{ fontSize: 11 }} />
      </div>
      <div style={{ gridColumn: "1/-1" }}>
        <Input value={desc} onChange={e => onDesc(e.target.value)}
          placeholder="Descripción (opcional)" style={{ fontSize: 11 }} />
      </div>
      <div>
        <Select value={tipo} onValueChange={(v: TipoTarea) => onTipo(v)}>
          <SelectTrigger style={{ height: 28, fontSize: 10 }}><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(TIPO_TAREA_LABEL) as TipoTarea[]).map(k => (
              <SelectItem key={k} value={k}>{TIPO_TAREA_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Select value={prioridad} onValueChange={(v: PrioridadTarea) => onPrioridad(v)}>
          <SelectTrigger style={{ height: 28, fontSize: 10 }}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Input type="number" min={1} value={horas} onChange={e => onHoras(parseInt(e.target.value) || 1)}
          placeholder="Horas" style={{ height: 28, fontSize: 10 }} />
      </div>
    </div>
  )
}
