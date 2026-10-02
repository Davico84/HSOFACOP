import type { AvailableSpace, LowerIncisors } from "@/modules/core/services/generated/model";
import { CROWDING_ROWS, LOWER_INCISORS, MOYERS_75, MOYERS_SIDES, type MoyersArch } from "../config/moyers";

/** Milímetros con un decimal → décimas enteras (evita errores de coma flotante). */
const tenths = (mm: number) => Math.round(mm * 10);

type Measures<T> = { [K in keyof T]?: number | null };

const present = (v: number | null | undefined): v is number => v !== null && v !== undefined && !Number.isNaN(v);

/** Suma de los cuatro incisivos inferiores; `null` si falta alguno. */
export function incisorSum(incisors: Measures<LowerIncisors> | null | undefined): number | null {
  const values = LOWER_INCISORS.map(({ key }) => incisors?.[key]);
  if (!values.every(present)) return null;
  return values.reduce((acc, v) => acc + tenths(v), 0) / 10;
}

/** Suma redondeada al 0,5 mm más cercano (23,2 → 23,0; 23,3 → 23,5). */
export function roundToHalf(sum: number): number {
  return (Math.round(tenths(sum) / 5) * 5) / 10;
}

export type MoyersRequired = Record<MoyersArch, number>;

/** Espacio requerido por arcada (tabla al 75 %) o `null` si la suma redondeada no está en la tabla. */
export function requiredSpace(sum: number | null): MoyersRequired | null {
  if (sum === null) return null;
  const row = MOYERS_75.find((r) => tenths(r.sum) === tenths(roundToHalf(sum)));
  return row ? { maxilla: row.maxilla, mandible: row.mandible } : null;
}

export type Crowding = (typeof CROWDING_ROWS)[number]["key"];

export interface MoyersSideResult {
  key: keyof AvailableSpace;
  label: string;
  available: number | null;
  required: number | null;
  difference: number | null;
}

export interface MoyersResult {
  sum: number | null;
  /** Hay suma pero queda fuera de 19,5–29,0 mm. */
  outOfRange: boolean;
  sides: MoyersSideResult[];
  /** Arcada/lado agrupados por el signo de su diferencia (Tabla 2 del PDF). */
  crowding: Record<Crowding, string[]>;
}

/** Suma, requerido, diferencia (disponible − requerido) y predisposición de apiñamiento. */
export function moyersResult(
  incisors: Measures<LowerIncisors> | null | undefined,
  available: Measures<AvailableSpace> | null | undefined,
): MoyersResult {
  const sum = incisorSum(incisors);
  const required = requiredSpace(sum);
  const crowding: Record<Crowding, string[]> = { positive: [], neutral: [], negative: [] };
  const sides = MOYERS_SIDES.map(({ key, arch, label }) => {
    const value = available?.[key];
    const space = present(value) ? value : null;
    const req = required ? required[arch] : null;
    const difference = space === null || req === null ? null : (tenths(space) - tenths(req)) / 10;
    if (difference !== null) {
      crowding[difference > 0 ? "positive" : difference < 0 ? "negative" : "neutral"].push(label);
    }
    return { key, label, available: space, required: req, difference };
  });
  return { sum, outOfRange: sum !== null && required === null, sides, crowding };
}
