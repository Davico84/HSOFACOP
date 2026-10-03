import { widthOf } from "../config/nance";

/** Milímetros con un decimal → décimas enteras (evita errores de coma flotante). */
const tenths = (mm: number) => Math.round(mm * 10);

const present = (v: number | null | undefined): v is number => v !== null && v !== undefined && !Number.isNaN(v);


/** ST de una arcada: suma de los anchos de sus piezas; `null` si falta alguna. */
export function archTotal(widths: object | null | undefined, teeth: readonly number[]): number | null {
  const values = teeth.map((t) => widthOf(widths, t)).filter(present);
  if (values.length < teeth.length) return null;
  return values.reduce((acc, v) => acc + tenths(v), 0) / 10;
}

/** Discrepancia SA − ST con un decimal; `null` si falta alguno. */
export function discrepancy(available: number | null | undefined, total: number | null): number | null {
  if (!present(available) || total === null) return null;
  return (tenths(available) - tenths(total)) / 10;
}

/** Cuántas piezas de la arcada tienen ancho registrado. */
export function measuredTeeth(widths: object | null | undefined, teeth: readonly number[]): number {
  return teeth.filter((t) => present(widthOf(widths, t))).length;
}
