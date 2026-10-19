import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changeCohortRegistration, regenerateCohortCode } from "@/modules/core/services/generated/cohorts";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { cohortKeys } from "./cohortKeys";

/** Código nuevo de una turma (solo ADMIN): el anterior deja de servir. */
export function useRegenerateCohortCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => regenerateCohortCode(id),
    onSuccess: (cohort) => toast.success(`${cohort.name}: código nuevo generado`),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: cohortKeys.all }),
  });
}

/** Abrir o cerrar la inscripción de una turma (solo ADMIN). */
export function useChangeCohortRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, open }: { id: number; open: boolean }) => changeCohortRegistration(id, { open }),
    onSuccess: (cohort) =>
      toast.success(cohort.registrationOpen ? `${cohort.name}: inscripción abierta` : `${cohort.name}: inscripción cerrada`),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: cohortKeys.all }),
  });
}
