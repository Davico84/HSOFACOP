import { z } from "zod";
import { COHORT_NAME_MAX } from "../hooks/cohortKeys";

/** Nombre de una turma (mismas reglas que el servidor: obligatorio, hasta 80 caracteres). */
export const cohortNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indica el nombre de la turma.")
    .max(COHORT_NAME_MAX, `El nombre admite hasta ${COHORT_NAME_MAX} caracteres.`),
});

export type CohortNameValues = z.infer<typeof cohortNameSchema>;
