import type { FieldPath } from "react-hook-form";
import type { RecordFormValues } from "../schemas/record";

export interface RecordStep {
  /** 1–8, como en `?paso=`. */
  number: number;
  title: string;
  /** Páginas del PDF que cubre. */
  pages: string;
  /** Campos que valida el paso antes de guardar y avanzar. */
  fields: FieldPath<RecordFormValues>[];
}

/** Los 8 pasos del formulario, en el orden del PDF de la historia clínica. */
export const RECORD_STEPS: readonly RecordStep[] = [
  {
    number: 1,
    title: "Paciente y anamnesis",
    pages: "pág. 1",
    fields: [
      "treatingDentist", "patientName", "documentType", "documentNumber", "patientSex", "birthDate",
      "birthPlace", "address", "phone", "treatmentStartDate", "content.anamnesis",
    ],
  },
  { number: 2, title: "Análisis facial", pages: "pág. 2", fields: ["content.facial"] },
  { number: 3, title: "Análisis funcional", pages: "pág. 3", fields: ["content.functional"] },
  { number: 4, title: "Análisis oclusal y extra", pages: "págs. 3–4", fields: ["content.occlusal"] },
  { number: 5, title: "Análisis de modelos", pages: "págs. 5–6", fields: ["content.models"] },
  { number: 6, title: "Análisis radiográfico", pages: "pág. 10", fields: ["content.radiographic"] },
  { number: 7, title: "Diagnóstico y planes", pages: "págs. 11–13", fields: ["content.diagnosis"] },
  { number: 8, title: "Firmas", pages: "pág. 13", fields: ["content.signatures"] },
];

/** Paso al que pertenece un campo (p. ej. un error del servidor), o `null`. */
export function stepOfField(path: string): RecordStep | null {
  return RECORD_STEPS.find((s) => s.fields.some((f) => path === f || path.startsWith(`${f}.`))) ?? null;
}

/** Paso válido a partir del parámetro de la URL (1 si falta o no es válido). */
export function parseStep(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= RECORD_STEPS.length ? n : 1;
}
