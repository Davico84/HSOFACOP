import type { WalaToEv } from "@/modules/core/services/generated/model";

/**
 * Valores de referencia del análisis transversal (pág. 5 del PDF): única fuente para el formulario
 * y la impresión.
 */

/** Promedio del ancho inter molar por arcada y sexo (mm). */
export const INTERMOLAR_AVERAGE = {
  upper: { MALE: 54.0, FEMALE: 52.4 },
  lower: { MALE: 47.2, FEMALE: 46.1 },
} as const;

export type Arch = keyof typeof INTERMOLAR_AVERAGE;

/** Texto de referencia que acompaña a los anchos molares (como en el PDF). */
export const INTERMOLAR_NOTE = [
  "Es la distancia lineal entre la fosa mesial del molar derecho al molar izquierdo.",
  "Maxilar: en hombres, el promedio de ancho inter molar es de 54,0 mm, y en mujeres de 52,4 mm.",
  "Mandibular: en hombres, el promedio de ancho inter molar es de 47,2 mm, y en mujeres de 46,1 mm.",
] as const;

/** Distancia del borde WALA al eje vestibular (EV) de cada pieza inferior y su norma (mm). */
export const WALA_EV_NORMS: readonly { key: keyof WalaToEv; label: string; norm: number }[] = [
  { key: "canine", label: "Canino inferior", norm: 0.6 },
  { key: "firstPremolar", label: "1er premolar inferior", norm: 0.8 },
  { key: "secondPremolar", label: "2do premolar inferior", norm: 1.3 },
  { key: "firstMolar", label: "1er molar inferior", norm: 2.0 },
  { key: "secondMolar", label: "2do molar inferior", norm: 2.2 },
];
