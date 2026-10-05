import { LOWER_NANCE_TEETH, NANCE_ARCHES, UPPER_NANCE_TEETH, widthOf, widthPath } from "./nance";

/** Piezas de Bolton, de 1er molar a 1er molar, de derecha (R) a izquierda (L) del paciente. */
export const UPPER_BOLTON_TEETH = [16, ...UPPER_NANCE_TEETH, 26] as const;
export const LOWER_BOLTON_TEETH = [46, ...LOWER_NANCE_TEETH, 36] as const;

/** Primeros molares e incisivos: propios de Bolton (revisión clínica del usuario). */
export const FIRST_MOLARS = [16, 26, 46, 36] as const;
export const BOLTON_INCISORS = [12, 11, 21, 22, 42, 41, 31, 32] as const;
/** Caninos y premolares: el mismo dato que en Nance (editable desde cualquiera de los dos). */
export const SHARED_WITH_NANCE = [15, 14, 13, 23, 24, 25, 45, 44, 43, 33, 34, 35] as const;

const includes = (list: readonly number[], tooth: number) => list.includes(tooth);
export const isSharedWithNance = (tooth: number) => includes(SHARED_WITH_NANCE, tooth);

/** Texto del aviso bajo la grilla de Bolton (revisión del usuario). */
export const BOLTON_SHARED_NOTE =
  "Las piezas sombreadas (caninos y premolares) se comparten con el análisis de Nance: si cambias una aquí, cambiará allá. Los incisivos y los primeros molares corresponden exclusivamente al cálculo de Bolton.";

export interface BoltonRatioDef {
  key: "total" | "anterior";
  label: string;
  /** Piezas por arcada (12 o 6). */
  count: number;
  /** Media (%) y rango normal. */
  mean: number;
  range: readonly [number, number];
  upper: readonly number[];
  lower: readonly number[];
}

/** Relación total (o global) y anterior de Bolton, con su media y su rango (pág. 9 del PDF). */
export const BOLTON_RATIOS: readonly BoltonRatioDef[] = [
  { key: "total", label: "Relación total", count: 12, mean: 91.3, range: [87.5, 94.8], upper: UPPER_BOLTON_TEETH, lower: LOWER_BOLTON_TEETH },
  { key: "anterior", label: "Relación anterior", count: 6, mean: 77.2, range: [74.5, 80.4], upper: [13, 12, 11, 21, 22, 23], lower: [43, 42, 41, 31, 32, 33] },
];

/**
 * Ruta del formulario del ancho de una pieza de Bolton: molares e incisivos son de Bolton; caninos
 * y premolares, de Nance. Una pieza fuera de las 24 es un error de programación.
 */
export function boltonWidthPath(tooth: number) {
  if (includes(FIRST_MOLARS, tooth)) return `content.models.bolton.firstMolars.tooth${tooth as (typeof FIRST_MOLARS)[number]}` as const;
  if (includes(BOLTON_INCISORS, tooth)) return `content.models.bolton.incisors.tooth${tooth as (typeof BOLTON_INCISORS)[number]}` as const;
  if (isSharedWithNance(tooth)) {
    return widthPath(includes(UPPER_NANCE_TEETH, tooth) ? NANCE_ARCHES[0] : NANCE_ARCHES[1], tooth);
  }
  throw new Error(`La pieza ${tooth} no forma parte del análisis de Bolton.`);
}

/** Lo que Bolton necesita leer de los análisis de modelos para sus anchos. */
export interface BoltonSources {
  nance?: { upperWidths?: object | null; lowerWidths?: object | null } | null;
  bolton?: { firstMolars?: object | null; incisors?: object | null } | null;
}

/** Ancho registrado de una pieza de Bolton (de Bolton si es molar o incisivo; si no, de Nance). */
export function boltonWidth(models: BoltonSources | null | undefined, tooth: number): number | null | undefined {
  if (includes(FIRST_MOLARS, tooth)) return widthOf(models?.bolton?.firstMolars, tooth);
  if (includes(BOLTON_INCISORS, tooth)) return widthOf(models?.bolton?.incisors, tooth);
  if (isSharedWithNance(tooth)) {
    return widthOf(includes(UPPER_NANCE_TEETH, tooth) ? models?.nance?.upperWidths : models?.nance?.lowerWidths, tooth);
  }
  throw new Error(`La pieza ${tooth} no forma parte del análisis de Bolton.`);
}
