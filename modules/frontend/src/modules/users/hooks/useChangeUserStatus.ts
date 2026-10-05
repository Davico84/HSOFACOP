import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changeUserStatus } from "@/modules/core/services/generated/users";
import type { ChangeUserStatusRequestStatus } from "@/modules/core/services/generated/model";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { dashboardKeys } from "@/modules/dashboard/hooks/dashboardKeys";
import { userKeys } from "./userKeys";

export interface ChangeUserStatusInput {
  id: number;
  status: ChangeUserStatusRequestStatus;
}

/**
 * Deshabilitar/reactivar una cuenta USER. Sin actualización optimista: al terminar (bien o mal)
 * se recarga el listado, así la tabla muestra siempre el estado real (también tras un 409/404).
 */
export function useChangeUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: ChangeUserStatusInput) => changeUserStatus(id, { status }),
    onSuccess: (user) =>
      toast.success(user.status === "DISABLED" ? `Cuenta de ${user.fullName} deshabilitada` : `Cuenta de ${user.fullName} activada`),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => {
      // Las métricas de Inicio del ADMIN cuentan cuentas y cupos.
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      return queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
