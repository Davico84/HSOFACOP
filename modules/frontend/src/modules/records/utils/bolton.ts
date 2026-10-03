import type { BoltonRatioDef } from "../config/bolton";

/** Milímetros con un decimal → décimas enteras (evita errores de coma flotante). */
const tenths = (mm: number) => Math.round(mm * 10);

const present = (v: number | null | undefined): v is number => v !== null && v !== undefined && !Number.isNaN(v);

/** Suma de los anchos de unas piezas; `null` si falta alguna. */
export function sumWidths(teeth: readonly number[], width: (tooth: number) => number | null | undefined): number | null {
  const values = teeth.map(width).filter(present);
  if (values.length < teeth.length) return null;
  return values.reduce((acc, v) => acc + tenths(v), 0) / 10;
}

export interface BoltonResult {
  mandibular: number | null;
  maxillary: number | null;
  /** Suma mandibular ÷ suma maxilar (cociente con 4 decimales, para la fórmula). */
  quotient: number | null;
  /** Relación en %, con un decimal. */
  ratio: number | null;
  inRange: boolean | null;
  /** Sobre la media → exceso mandibular; bajo la media → exceso maxilar; en la media → ninguno. */
  excess: "mandibular" | "maxillary" | null;
  actual: number | null;
  ideal: number | null;
  /** Real − ideal. */
  difference: number | null;
}

/** Relación de Bolton (total o anterior) con su real, ideal y diferencia. */
export function boltonResult(def: BoltonRatioDef, width: (tooth: number) => number | null | undefined): BoltonResult {
  const mandibular = sumWidths(def.lower, width);
  const maxillary = sumWidths(def.upper, width);
  const empty = { quotient: null, ratio: null, inRange: null, excess: null, actual: null, ideal: null, difference: null };
  if (mandibular === null || maxillary === null || maxillary === 0) return { mandibular, maxillary, ...empty };

  const mand = tenths(mandibular);
  const max = tenths(maxillary);
  const quotient = Math.round((mand / max) * 10_000) / 10_000;
  const ratio = Math.round((mand * 1000) / max) / 10;
  const inRange = ratio >= def.range[0] && ratio <= def.range[1];
  const base = { mandibular, maxillary, quotient, ratio, inRange };

  if (ratio > def.mean) {
    const ideal = Math.round((max * def.mean) / 100);
    return { ...base, excess: "mandibular", actual: mandibular, ideal: ideal / 10, difference: (mand - ideal) / 10 };
  }
  if (ratio < def.mean) {
    const ideal = Math.round((mand * 100) / def.mean);
    return { ...base, excess: "maxillary", actual: maxillary, ideal: ideal / 10, difference: (max - ideal) / 10 };
  }
  return { ...base, excess: null, actual: null, ideal: null, difference: null };
}
