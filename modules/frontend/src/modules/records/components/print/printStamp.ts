import { createContext } from "react";
import { formatDate } from "../../utils/recordDisplay";

/** Datos de la marca de avance: pasos clínicos (1–7) con datos y fecha de impresión (`2026-10-05`). */
export interface PrintStamp {
  clinicalFilledSteps: number;
  printedOn: string;
}

/** Marca de las hojas; nula = sin marca (historia completa o sin datos). */
export const PrintStampContext = createContext<PrintStamp | null>(null);

export const CLINICAL_STEPS = 7;

/** "AVANCE · 4 de 7 pasos clínicos con datos · impreso el 05/10/2026"; nulo si está completa. */
export function stampText(stamp: PrintStamp | null): string | null {
  if (!stamp || stamp.clinicalFilledSteps >= CLINICAL_STEPS) return null;
  return `AVANCE · ${stamp.clinicalFilledSteps} de ${CLINICAL_STEPS} pasos clínicos con datos · impreso el ${formatDate(stamp.printedOn)}`;
}
