import type { NanceAnalysis } from "@/modules/core/services/generated/model";

/** Piezas que se miden en Nance, de mesial a mesial del 1er molar, en el orden de la ficha del PDF. */
export const UPPER_NANCE_TEETH = [15, 14, 13, 12, 11, 21, 22, 23, 24, 25] as const;
export const LOWER_NANCE_TEETH = [45, 44, 43, 42, 41, 31, 32, 33, 34, 35] as const;

/** Arcadas de la ficha: piezas y campos de cada una. */
export const NANCE_ARCHES = [
  {
    key: "upper",
    label: "Superior",
    teeth: UPPER_NANCE_TEETH,
    widths: "upperWidths",
    available: "availableUpper",
    conclusion: "conclusionUpper",
  },
  {
    key: "lower",
    label: "Inferior",
    teeth: LOWER_NANCE_TEETH,
    widths: "lowerWidths",
    available: "availableLower",
    conclusion: "conclusionLower",
  },
] as const satisfies readonly {
  key: string;
  label: string;
  teeth: readonly number[];
  widths: keyof NanceAnalysis;
  available: keyof NanceAnalysis;
  conclusion: keyof NanceAnalysis;
}[];

export type NanceArch = (typeof NANCE_ARCHES)[number];

type UpperTooth = (typeof UPPER_NANCE_TEETH)[number];
type LowerTooth = (typeof LOWER_NANCE_TEETH)[number];

/** Ruta del formulario del ancho de una pieza (`content.models.nance.upperWidths.tooth15`). */
export type NanceWidthPath =
  | `content.models.nance.upperWidths.tooth${UpperTooth}`
  | `content.models.nance.lowerWidths.tooth${LowerTooth}`;

export function widthPath(arch: NanceArch, tooth: number): NanceWidthPath {
  return `content.models.nance.${arch.widths}.tooth${tooth}` as NanceWidthPath;
}

/** Ancho registrado de una pieza dentro de los anchos de su arcada. */
export function widthOf(widths: object | null | undefined, tooth: number): number | null | undefined {
  return (widths as Record<string, number | null | undefined> | null | undefined)?.[`tooth${tooth}`];
}

export const NANCE_MISSING_TEETH = "Faltan piezas por medir.";
