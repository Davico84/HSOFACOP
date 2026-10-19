import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { createPasswordReset } from "@/modules/core/services/generated/users";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";

/** Genera el enlace de restablecimiento de una cuenta (solo ADMIN); el anterior sin usar queda anulado. */
export function useCreatePasswordReset() {
  return useMutation({
    mutationFn: (id: number) => createPasswordReset(id),
    onError: (error) => toast.error(getUserFriendlyError(error)),
  });
}
