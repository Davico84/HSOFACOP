import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCohort, renameCohort } from "@/modules/core/services/generated/cohorts";
import { userKeys } from "@/modules/users/hooks/userKeys";
import { cohortKeys } from "./cohortKeys";

export interface SaveCohortInput {
  /** `null` = crear; si no, renombrar esa turma. */
  id: number | null;
  name: string;
}

/**
 * Crear o renombrar una turma (solo ADMIN). Al terminar recarga las turmas y el listado de
 * usuarios (muestra los nombres). Los errores (p. ej. 409 por nombre repetido) los pinta el formulario.
 */
export function useSaveCohort() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: SaveCohortInput) => (id == null ? createCohort({ name }) : renameCohort(id, { name })),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
      return queryClient.invalidateQueries({ queryKey: cohortKeys.all });
    },
  });
}
