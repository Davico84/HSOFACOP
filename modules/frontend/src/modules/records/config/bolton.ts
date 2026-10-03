import { LOWER_NANCE_TEETH, NANCE_ARCHES, UPPER_NANCE_TEETH, widthOf, widthPath } from "./nance";

/** Piezas de Bolton, de 1er molar a 1er molar, de derecha (R) a izquierda (L) del paciente. */
export const UPPER_BOLTON_TEETH = [16, ...UPPER_NANCE_TEETH, 26] as const;
export const LOWER_BOLTON_TEETH = [46, ...LOWER_NANCE_TEETH, 36] as const;

/** Primeros molares: los únicos anchos propios de Bolton (el resto son los de Nance). */
export const FIRST_MOLARS = [16, 26, 46, 36] as const;
type FirstMolar = (typeof FIRST_MOLARS)[number];
const isFirstMolar = (tooth: number): tooth is FirstMolar => (FIRST_MOLARS as readonly number[]).includes(tooth);

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

/** Ruta del formulario del ancho de una pieza: los molares son de Bolton, el resto de Nance. */
export function boltonWidthPath(tooth: number) {
  if (isFirstMolar(tooth)) return `content.models.bolton.firstMolars.tooth${tooth}` as const;
  const arch = (UPPER_NANCE_TEETH as readonly number[]).includes(tooth) ? NANCE_ARCHES[0] : NANCE_ARCHES[1];
  return widthPath(arch, tooth);
}

/** Lo que Bolton necesita leer de los análisis de modelos para sus anchos. */
export interface BoltonSources {
  nance?: { upperWidths?: object | null; lowerWidths?: object | null } | null;
  bolton?: { firstMolars?: object | null } | null;
}

/** Ancho registrado de una pieza de Bolton (de Bolton si es 1er molar; si no, de Nance). */
export function boltonWidth(models: BoltonSources | null | undefined, tooth: number): number | null | undefined {
  if (isFirstMolar(tooth)) return widthOf(models?.bolton?.firstMolars, tooth);
  const upper = (UPPER_NANCE_TEETH as readonly number[]).includes(tooth);
  return widthOf(upper ? models?.nance?.upperWidths : models?.nance?.lowerWidths, tooth);
}
