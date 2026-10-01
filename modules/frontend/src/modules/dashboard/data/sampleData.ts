import type { LucideIcon } from "lucide-react";
import { CircleCheck, ListChecks, UserPlus, Users } from "lucide-react";

/**
 * Datos ESTÁTICOS de ejemplo del dashboard de la plantilla. No vienen del
 * backend: cuando exista la capacidad `dashboard`, este archivo se sustituye por
 * un hook de dominio en `modules/dashboard/hooks/`.
 */

export interface SampleKpi {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

export interface SampleActivity {
  id: number;
  title: string;
  description: string;
  time: string;
}

export const sampleKpis: SampleKpi[] = [
  { label: "Usuarios activos", value: "128", hint: "+12 este mes", icon: Users },
  { label: "Registros nuevos", value: "34", hint: "Últimos 7 días", icon: UserPlus },
  { label: "Tareas pendientes", value: "7", hint: "3 vencen hoy", icon: ListChecks },
  { label: "Tasa de finalización", value: "92 %", hint: "+4 % vs. mes anterior", icon: CircleCheck },
];

export const sampleActivity: SampleActivity[] = [
  { id: 1, title: "Nuevo usuario registrado", description: "maria@empresa.test se unió al equipo", time: "Hace 5 min" },
  { id: 2, title: "Tarea completada", description: "Revisión del informe mensual", time: "Hace 1 h" },
  { id: 3, title: "Registro actualizado", description: "Se editaron los datos de contacto", time: "Hace 3 h" },
  { id: 4, title: "Tarea asignada", description: "Preparar presentación trimestral", time: "Ayer" },
];
