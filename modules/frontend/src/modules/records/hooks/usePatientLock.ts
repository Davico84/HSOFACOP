import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  discardPatientUnlockRequest,
  requestPatientUnlock,
  unlockPatient,
} from "@/modules/core/services/generated/orthodontic-records";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { dashboardKeys } from "@/modules/dashboard/hooks/dashboardKeys";
import { recordKeys } from "./recordKeys";

/** Tras cambiar el bloqueo o la solicitud: la historia, el listado (candado) y el Inicio del ADMIN. */
function useRefresh() {
  const queryClient = useQueryClient();
  return (id: number) => {
    void queryClient.invalidateQueries({ queryKey: recordKeys.detail(id) });
    void queryClient.invalidateQueries({ queryKey: recordKeys.lists() });
    void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
}

/** El tratante solicita el desbloqueo de los datos del paciente, con un motivo. */
export function useRequestPatientUnlock(id: number) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (reason: string) => requestPatientUnlock(id, { reason }),
    onSuccess: () => toast.success("Solicitud de desbloqueo enviada al administrador"),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => refresh(id),
  });
}

/** El ADMIN desbloquea los datos del paciente (queda registrado). */
export function useUnlockPatient(id: number) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: () => unlockPatient(id),
    onSuccess: () => toast.success("Datos del paciente desbloqueados"),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => refresh(id),
  });
}

/** El ADMIN descarta la solicitud de desbloqueo (queda registrado). */
export function useDiscardPatientUnlockRequest(id: number) {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: () => discardPatientUnlockRequest(id),
    onSuccess: () => toast.success("Solicitud descartada"),
    onError: (error) => toast.error(getUserFriendlyError(error)),
    onSettled: () => refresh(id),
  });
}
