import { useMutation } from "@tanstack/react-query";
import { changeMyPassword } from "@/modules/core/services/generated/profile";
import { resetPassword } from "@/modules/core/services/generated/auth";
import type { ChangePasswordRequest, ResetPasswordRequest } from "@/modules/core/services/generated/model";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * Cambia la contraseña de la cuenta autenticada. El servidor cierra las demás sesiones y devuelve
 * una nueva para este dispositivo (y su cookie): se guarda para seguir conectado. Los errores los
 * pinta el formulario.
 */
export function useChangeMyPassword() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changeMyPassword(data),
    onSuccess: (auth) => setSession(auth.accessToken, auth.user),
  });
}

/** Fija una contraseña nueva con el token de un enlace de restablecimiento (público). */
export function useResetPassword() {
  return useMutation({ mutationFn: (data: ResetPasswordRequest) => resetPassword(data) });
}
