import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/modules/core/ui/button";
import { Label } from "@/modules/core/ui/label";
import { PasswordInput } from "@/modules/core/ui/password-input";
import { applyServerFieldErrors, getUserFriendlyError, problemType } from "@/modules/core/utils/apiError";
import { cn } from "@/modules/core/utils/cn";
import { useChangeMyPassword } from "../hooks/usePassword";
import { CHANGE_PASSWORD_FIELD_ERRORS, changePasswordSchema, type ChangePasswordValues } from "../schemas/password";
import { PasswordStrengthBar } from "./PasswordStrengthBar";

const FIELDS: { name: keyof ChangePasswordValues; label: string; autoComplete: string }[] = [
  { name: "currentPassword", label: "Contraseña actual", autoComplete: "current-password" },
  { name: "newPassword", label: "Nueva contraseña", autoComplete: "new-password" },
  { name: "confirmPassword", label: "Confirmar la nueva contraseña", autoComplete: "new-password" },
];

/**
 * "Cambiar contraseña" en "Mis datos": la actual, la nueva (con su fortaleza) y la confirmación.
 * Los rechazos del servidor (actual incorrecta, bloqueo, igual a la actual) van a su campo.
 */
export function ChangePasswordForm() {
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  const change = useChangeMyPassword();
  const newPassword = useWatch({ control: form.control, name: "newPassword" });
  const { errors } = form.formState;

  const submit = form.handleSubmit(({ currentPassword, newPassword: next }) =>
    change.mutate(
      { currentPassword, newPassword: next },
      {
        onSuccess: () => {
          form.reset();
          toast.success("Contraseña actualizada. Cerramos tus sesiones en otros dispositivos.");
        },
        onError: (error) => {
          const field = CHANGE_PASSWORD_FIELD_ERRORS[problemType(error) ?? ""];
          if (field) {
            form.setError(field, { type: "server", message: getUserFriendlyError(error) }, { shouldFocus: true });
          } else if (applyServerFieldErrors(error, form.setError) === 0) {
            toast.error(getUserFriendlyError(error));
          }
        },
      },
    ),
  );

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="font-semibold">Cambiar contraseña</h2>
        <p className="text-sm text-muted-foreground">Al cambiarla se cierran tus sesiones en otros dispositivos.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map(({ name, label, autoComplete }) => {
          const id = `pw-${name}`;
          const error = errors[name]?.message;
          return (
            <div key={name} className="flex flex-col gap-1.5">
              <Label htmlFor={id} className="text-sm font-medium">
                {label}
              </Label>
              <PasswordInput
                id={id}
                autoComplete={autoComplete}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={cn(error && "border-destructive focus-visible:ring-destructive")}
                {...form.register(name)}
              />
              {name === "newPassword" ? <PasswordStrengthBar password={newPassword ?? ""} /> : null}
              {error ? (
                <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={change.isPending}>
          {change.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}
