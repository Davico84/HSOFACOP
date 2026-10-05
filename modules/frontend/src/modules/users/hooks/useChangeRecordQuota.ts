import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { changeRecordQuota } from "@/modules/core/services/generated/users";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { userKeys } from "./userKeys";

export interface ChangeRecordQuotaInput {
  id: number;
  /** `null` = sin límite. */
  recordQuota: number | null;
}

/** Asignar o quitar el cupo de historias de una cuenta USER; al terminar se recarga el listado. */
export function useChangeRecordQuota() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, recordQuota }: ChangeRecordQuotaInput) => changeRecordQuota(id, { recordQuota }),
    onSuccess: (user) =>
      toast.success(
        user.recordQuota == null
          ? `${user.fullName} ya no tiene límite de historias`
          : `Cupo de ${user.fullName}: ${user.recordQuota} ${user.recordQuota === 1 ? "historia" : "historias"}`,
      ),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: userKeys.all }),
  });
}
