import { useFormContext, useWatch, type FieldErrors } from "react-hook-form";
import type { RecordFormValues } from "../schemas/record";
import { RECORD_STEPS, stepOfField } from "../config/recordSteps";
import { fieldHasData, STEP_FIELDS } from "../utils/filledSteps";

export type StepStatus = "error" | "filled" | "empty";

export interface StepStatusResult {
  /** Por número de paso (1–8). */
  steps: Record<number, { status: StepStatus; hasData: boolean; hasErrors: boolean }>;
  /** Pasos con algún dato, tengan o no errores (0–8). */
  withData: number;
  /** "N de 8 pasos con datos". */
  progressText: string;
}

const FIELDS = STEP_FIELDS;

/** Rutas de los campos con error (`content.diagnosis.problemList`, `patientName`…). */
export function errorPaths(errors: FieldErrors | Record<string, unknown> | undefined, prefix = ""): string[] {
  if (!errors || typeof errors !== "object") return [];
  return Object.entries(errors).flatMap(([key, value]) => {
    if (!value || typeof value !== "object" || key === "ref") return [];
    const path = prefix ? `${prefix}.${key}` : key;
    const node = value as Record<string, unknown>;
    const own = typeof node.message === "string" || typeof node.type === "string" ? [path] : [];
    return [...own, ...errorPaths(node, path).filter((p) => p !== path)];
  });
}

/**
 * Estado de cada paso del formulario (con errores > con datos > vacío) y progreso general. Vigila
 * los valores de todos los pasos: úsalo solo en la navegación (`RecordStepNav`), nunca en el
 * formulario ni en los pasos, para que escribir no redibuje el formulario entero.
 */
export function useStepStatus(): StepStatusResult {
  const { control, formState } = useFormContext<RecordFormValues>();
  const values = useWatch({ control, name: FIELDS.map((f) => f.field) }) as unknown[];
  const failing = new Set(errorPaths(formState.errors).map((p) => stepOfField(p)?.number).filter((n) => n !== undefined));

  const steps: StepStatusResult["steps"] = {};
  for (const step of RECORD_STEPS) {
    const hasData = FIELDS.some((f, i) => f.step === step.number && fieldHasData(f.field, values[i]));
    const hasErrors = failing.has(step.number);
    steps[step.number] = { status: hasErrors ? "error" : hasData ? "filled" : "empty", hasData, hasErrors };
  }
  const withData = Object.values(steps).filter((s) => s.hasData).length;
  return { steps, withData, progressText: `${withData} de ${RECORD_STEPS.length} pasos con datos` };
}
