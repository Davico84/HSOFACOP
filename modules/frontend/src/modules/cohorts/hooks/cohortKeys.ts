/** Query keys del módulo cohorts (docs/frontend.md §2.2). La lista depende del rol (ADMIN: todas; COORDINATOR: las suyas). */
export const cohortKeys = {
  all: ["cohorts"] as const,
  list: () => [...cohortKeys.all, "list"] as const,
};

/** `type` del 409 por un nombre de turma repetido. */
export const COHORT_NAME_TAKEN_TYPE = "/errors/cohort-name-taken";

/** Largo máximo del nombre de una turma (igual que el backend). */
export const COHORT_NAME_MAX = 80;
