import { get } from "react-hook-form";
import type { RecordFormValues } from "../schemas/record";
import { RECORD_STEPS } from "../config/recordSteps";
import { hasAnyData } from "./filled";
import { emptyRecordValues } from "./recordForm";

/** Valores de una historia nueva: lo que trae por defecto no cuenta como dato. */
const BASELINE = emptyRecordValues();

/** Cada campo raíz del formulario con su paso (1–8). */
export const STEP_FIELDS = RECORD_STEPS.flatMap((step) => step.fields.map((field) => ({ step: step.number, field })));

/** `true` si el campo tiene algún dato distinto de los valores por defecto de una historia nueva. */
export function fieldHasData(field: string, value: unknown): boolean {
  return hasAnyData(value, get(BASELINE, field));
}

/**
 * Pasos (1–8) con algún dato: el mismo criterio que la navegación de pasos. Se envía al guardar
 * para las métricas de Inicio (el servidor cuenta siempre el paso 1).
 */
export function filledStepsOf(values: RecordFormValues): number[] {
  return RECORD_STEPS.filter((step) => step.fields.some((field) => fieldHasData(field, get(values, field)))).map(
    (step) => step.number,
  );
}
