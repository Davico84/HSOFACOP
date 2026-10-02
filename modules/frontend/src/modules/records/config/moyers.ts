import type { AvailableSpace } from "@/modules/core/services/generated/model";

/**
 * Tabla de probabilidades de Moyers al 75 % (tabla única, sin distinguir sexo; confirmada por el
 * usuario): suma de los incisivos inferiores → espacio requerido para canino + premolares de cada
 * lado, en mm. Única fuente para el formulario y la impresión.
 */
export const MOYERS_75: readonly { sum: number; maxilla: number; mandible: number }[] = [
  { sum: 19.5, maxilla: 20.6, mandible: 20.1 },
  { sum: 20.0, maxilla: 20.9, mandible: 20.4 },
  { sum: 20.5, maxilla: 21.2, mandible: 20.7 },
  { sum: 21.0, maxilla: 21.5, mandible: 21.0 },
  { sum: 21.5, maxilla: 21.8, mandible: 21.3 },
  { sum: 22.0, maxilla: 22.0, mandible: 21.6 },
  { sum: 22.5, maxilla: 22.3, mandible: 21.9 },
  { sum: 23.0, maxilla: 22.6, mandible: 22.2 },
  { sum: 23.5, maxilla: 22.9, mandible: 22.5 },
  { sum: 24.0, maxilla: 23.1, mandible: 22.8 },
  { sum: 24.5, maxilla: 23.4, mandible: 23.1 },
  { sum: 25.0, maxilla: 23.7, mandible: 23.4 },
  { sum: 25.5, maxilla: 24.0, mandible: 23.7 },
  { sum: 26.0, maxilla: 24.2, mandible: 24.0 },
  { sum: 26.5, maxilla: 24.5, mandible: 24.2 },
  { sum: 27.0, maxilla: 24.8, mandible: 24.5 },
  { sum: 27.5, maxilla: 25.0, mandible: 24.8 },
  { sum: 28.0, maxilla: 25.3, mandible: 25.1 },
  { sum: 28.5, maxilla: 25.6, mandible: 25.4 },
  { sum: 29.0, maxilla: 25.9, mandible: 25.7 },
];

export type MoyersArch = "mandible" | "maxilla";

/** Incisivos inferiores en el orden de la ficha del PDF. */
export const LOWER_INCISORS = [
  { key: "tooth42", label: "42" },
  { key: "tooth41", label: "41" },
  { key: "tooth31", label: "31" },
  { key: "tooth32", label: "32" },
] as const;

/** Columnas de la ficha: arcada y lado, en el orden del PDF. */
export const MOYERS_SIDES: readonly { key: keyof AvailableSpace; arch: MoyersArch; side: string; label: string }[] = [
  { key: "mandibleRight", arch: "mandible", side: "Derecho", label: "Mandíbula derecho" },
  { key: "mandibleLeft", arch: "mandible", side: "Izquierdo", label: "Mandíbula izquierdo" },
  { key: "maxillaRight", arch: "maxilla", side: "Derecho", label: "Maxilar derecho" },
  { key: "maxillaLeft", arch: "maxilla", side: "Izquierdo", label: "Maxilar izquierdo" },
];

/** Filas de la Tabla 2 del PDF ("Predisposición de apiñamiento dental"). */
export const CROWDING_ROWS = [
  { key: "positive", label: "Positivo" },
  { key: "neutral", label: "Nulo" },
  { key: "negative", label: "Negativo" },
] as const;

export const MOYERS_OUT_OF_RANGE = "Fuera de la tabla de Moyers (19,5–29,0 mm).";
