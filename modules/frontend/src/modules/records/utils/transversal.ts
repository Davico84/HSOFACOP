import type { CreateRecordRequestPatientSex } from "@/modules/core/services/generated/model";
import { INTERMOLAR_AVERAGE, type Arch } from "../config/transversal";

/** Diferencia `value − reference` redondeada a un decimal; `null` si falta el valor. */
export function difference(value: number | null | undefined, reference: number): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Math.round((value - reference) * 10) / 10;
}

/** "50,1" (mm con un decimal, coma decimal). */
export function formatMm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return value.toFixed(1).replace(".", ",");
}

/** "+0,6" / "−0,3" / "0,0": diferencia con signo explícito (signo menos tipográfico). */
export function formatSigned(diff: number | null): string {
  if (diff === null) return "";
  if (diff === 0) return "0,0";
  return `${diff > 0 ? "+" : "−"}${formatMm(Math.abs(diff))}`;
}

export interface AverageComparison {
  average: number;
  diff: number | null;
}

/**
 * Ancho molar frente al promedio de su arcada para el sexo del paciente. Sin sexo no hay
 * comparación (`null`): se muestran los dos promedios como referencia.
 */
export function intermolarComparison(
  value: number | null | undefined,
  arch: Arch,
  sex: CreateRecordRequestPatientSex | null | undefined,
): AverageComparison | null {
  if (!sex) return null;
  const average = INTERMOLAR_AVERAGE[arch][sex];
  return { average, diff: difference(value, average) };
}

/** "promedio 52,4 mm · −2,3" (o solo el promedio si aún no hay medida). */
export function formatComparison(comparison: AverageComparison | null): string {
  if (!comparison) return "";
  const signed = formatSigned(comparison.diff);
  return `promedio ${formatMm(comparison.average)} mm${signed ? ` · ${signed}` : ""}`;
}
