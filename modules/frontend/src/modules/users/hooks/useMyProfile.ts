import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMyProfile, updateMyProfile } from "@/modules/core/services/generated/profile";
import type { UpdateProfileRequest } from "@/modules/core/services/generated/model";
import { userKeys } from "./userKeys";

/** Datos de la cuenta autenticada ("Mis datos"). */
export function useMyProfile() {
  return useQuery({ queryKey: userKeys.profile(), queryFn: () => getMyProfile() });
}

/**
 * Guarda celular, documento y COP; la respuesta (el perfil completo) va directo a la caché. Los
 * errores los pinta el formulario (por campo o en un aviso).
 */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateMyProfile(data),
    onSuccess: (profile) => {
      queryClient.setQueryData(userKeys.profile(), profile);
      toast.success("Datos guardados");
    },
  });
}
