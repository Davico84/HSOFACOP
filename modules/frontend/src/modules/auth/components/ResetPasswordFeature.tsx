import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PATHS } from "@/routes/paths";
import { getUserFriendlyError, problemType } from "@/modules/core/utils/apiError";
import { useResetPassword } from "../hooks/usePassword";
import { INVALID_PASSWORD_RESET_TYPE } from "../schemas/password";
import { AuthLayout } from "./AuthLayout";
import { ResetPasswordForm } from "./ResetPasswordForm";

const INVALID = "El enlace no es válido o venció. Pide uno nuevo al administrador.";

/**
 * "Nueva contraseña" (pública): toma el token del fragmento del enlace (`#t=…`) y lo quita de la
 * barra de direcciones; al guardar va al login con un aviso. Un enlace no válido muestra cómo
 * pedir uno nuevo.
 */
export function ResetPasswordFeature() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(hash.replace(/^#/, "")).get("t"));
  const [invalid, setInvalid] = useState(!token);
  const reset = useResetPassword();

  // El token no queda en la barra ni en el historial.
  useEffect(() => {
    if (hash) void navigate(PATHS.RESET_PASSWORD, { replace: true });
  }, [hash, navigate]);

  const submit = (newPassword: string) => {
    if (!token) return;
    reset.mutate(
      { token, newPassword },
      {
        onSuccess: () => {
          toast.success("Contraseña actualizada. Inicia sesión.");
          void navigate(PATHS.LOGIN, { replace: true });
        },
        onError: (error) => {
          if (problemType(error) === INVALID_PASSWORD_RESET_TYPE) setInvalid(true);
          else toast.error(getUserFriendlyError(error));
        },
      },
    );
  };

  return (
    <AuthLayout
      title="Nueva contraseña"
      description={invalid ? undefined : "Elige una contraseña nueva para tu cuenta."}
      footer={
        <p className="text-sm text-muted-foreground">
          <Link to={PATHS.LOGIN} className="font-medium text-primary underline-offset-4 hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      }
    >
      {invalid ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          {INVALID}
        </p>
      ) : (
        <ResetPasswordForm pending={reset.isPending} onSubmit={submit} />
      )}
    </AuthLayout>
  );
}
