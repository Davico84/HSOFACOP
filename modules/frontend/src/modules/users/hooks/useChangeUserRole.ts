import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changeUserRole } from "@/modules/core/services/generated/users";
import type { ChangeUserRoleRequestRole } from "@/modules/core/services/generated/model";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { cohortKeys } from "@/modules/cohorts/hooks/cohortKeys";
import { dashboardKeys } from "@/modules/dashboard/hooks/dashboardKeys";
import { userKeys } from "./userKeys";

export interface ChangeUserRoleInput {
  id: number;
  role: ChangeUserRoleRequestRole;
  /** Turmas de la coordinación (al menos una); vacía al volver a alumno. */
  cohortIds: number[];
}

/**
 * Convertir una cuenta en coordinación (o cambiar sus turmas) y volverla a alumno. Sin actualización
 * optimista: al terminar se recarga el listado (también tras un 409 por historias).
 */
export function useChangeUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role, cohortIds }: ChangeUserRoleInput) => changeUserRole(id, { role, cohortIds }),
    onSuccess: (user) =>
      toast.success(
        user.role === "COORDINATOR"
          ? `${user.fullName}: coordinación de ${user.coordinatorCohorts.map((c) => c.name).join(", ")}`
          : `${user.fullName} volvió a ser alumno`,
      ),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: cohortKeys.all });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      return queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
