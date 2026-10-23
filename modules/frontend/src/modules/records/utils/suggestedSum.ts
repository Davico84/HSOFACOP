import { MAX_TOOTH_MM, MIN_TOOTH_MM } from "../schemas/record";

/** Milímetros con un decimal → décimas enteras (evita errores de coma flotante). */
export const tenths = (mm: number) => Math.round(mm * 10);

/** Redondeo al entero con la mitad alejándose de cero (−8,5 → −9; 8,5 → 9), sin el sesgo de `Math.round` en negativos. */
export const roundHalfAway = (n: number) => Math.sign(n) * Math.round(Math.abs(n));

/** Suma sugerida desde anchos ya medidos: valor, o por qué no hay. */
export type SuggestedSum =
  | { value: number; reason: "ok" }
  | { value: null; reason: "missing" | "outOfRange" };

const usable = (w: number | null | undefined): w is number =>
  typeof w === "number" && Number.isFinite(w) && w >= MIN_TOOTH_MM && w <= MAX_TOOTH_MM;

/**
 * Suma de los anchos de unas piezas, solo si todas están y dentro de 4,0–13,0 mm (un ancho histórico
 * fuera de rango no se suma ni se corrige).
 */
export function suggestedSum(widths: readonly (number | null | undefined)[]): SuggestedSum {
  if (widths.some((w) => w === null || w === undefined || Number.isNaN(w))) return { value: null, reason: "missing" };
  if (!widths.every(usable)) return { value: null, reason: "outOfRange" };
  return { value: (widths as number[]).reduce((acc, w) => acc + tenths(w), 0) / 10, reason: "ok" };
}

/** Valor que se usa: el escrito por el tratante o, si no hay, el sugerido. */
export function effectiveSum(written: number | null | undefined, suggested: SuggestedSum): number | null {
  return written ?? suggested.value;
}

/** "23,0" (coma decimal, un decimal). */
export const formatMm = (mm: number) => mm.toFixed(1).replace(".", ",");

/** "+0,5" / "−0,8" / "0,0" con su signo (menos tipográfico). */
export const formatSigned = (mm: number) => (mm > 0 ? `+${formatMm(mm)}` : mm < 0 ? `−${formatMm(-mm)}` : formatMm(0));
