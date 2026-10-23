import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Label } from "@/modules/core/ui/label";
import { Button } from "@/modules/core/ui/button";
import { PasswordInput } from "@/modules/core/ui/password-input";
import { cn } from "@/modules/core/utils/cn";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas/password";
import { PasswordStrengthBar } from "./PasswordStrengthBar";

interface ResetPasswordFormProps {
  pending: boolean;
  onSubmit: (newPassword: string) => void;
}

const FIELDS: { name: keyof ResetPasswordValues; label: string }[] = [
  { name: "newPassword", label: "Nueva contraseña" },
  { name: "confirmPassword", label: "Confirmar contraseña" },
];

/** Nueva contraseña (con su fortaleza) y confirmación; las reglas están en el schema. */
export function ResetPasswordForm({ pending, onSubmit }: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { newPassword: "", confirmPassword: "" },
  });
  const newPassword = useWatch({ control: form.control, name: "newPassword" });
  const { errors } = form.formState;

  return (
    <form
      noValidate
      onSubmit={(e) => void form.handleSubmit((values) => onSubmit(values.newPassword))(e)}
      className="flex flex-col gap-4"
    >
      {FIELDS.map(({ name, label }) => {
        const id = `reset-${name}`;
        const error = errors[name]?.message;
        return (
          <div key={name} className="flex flex-col gap-1.5">
            <Label htmlFor={id} className="text-sm font-medium">
              {label}
            </Label>
            <div className="[&_input]:h-11 [&_input]:rounded-lg [&_input]:text-sm">
              <PasswordInput
                id={id}
                autoComplete="new-password"
                placeholder={name === "newPassword" ? "Mínimo 8 caracteres" : "Repite la contraseña"}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
                className={cn(error && "border-destructive focus-visible:ring-destructive")}
                {...form.register(name)}
              />
            </div>
            {name === "newPassword" ? <PasswordStrengthBar password={newPassword ?? ""} /> : null}
            {error ? (
              <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
      <Button type="submit" disabled={pending} className="h-11">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
        Guardar contraseña
      </Button>
    </form>
  );
}
