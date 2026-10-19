import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changeUserCohort } from "@/modules/core/services/generated/users";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { cohortKeys } from "@/modules/cohorts/hooks/cohortKeys";
import { userKeys } from "./userKeys";

export interface ChangeUserCohortInput {
  id: number;
  /** `null` = sin turma. */
  cohortId: number | null;
}

/** Asignar, cambiar o quitar la turma de un alumno; al terminar se recargan usuarios y turmas (conteos). */
export function useChangeUserCohort() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cohortId }: ChangeUserCohortInput) => changeUserCohort(id, { cohortId }),
    onSuccess: (user) =>
      toast.success(user.cohort ? `${user.fullName}: ${user.cohort.name}` : `${user.fullName} quedó sin turma`),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cohortKeys.all });
      return queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
