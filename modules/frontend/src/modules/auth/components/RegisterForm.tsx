import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Mail, ShieldCheck } from "lucide-react";
import { Label } from "@/modules/core/ui/label";
import { PasswordInput } from "@/modules/core/ui/password-input";
import { IconInput } from "@/modules/core/ui/icon-input";
import { registerSchema, type RegisterValues } from "../schemas/auth";
import { useRegister } from "../hooks/useAuth";
import { PasswordStrengthBar } from "./PasswordStrengthBar";
import { cn } from "@/modules/core/utils/cn";

/** Formulario de registro (mínimo): nombre, correo y contraseña con confirmación. */
export function RegisterForm() {
  const {
    register: field,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });
  const registerMutation = useRegister();
  const passwordValue = useWatch({ control, name: "password" });

  return (
    <form
      onSubmit={handleSubmit(({ fullName, email, password }) =>
        registerMutation.mutate({ fullName, email, password }),
      )}
      className="flex flex-col gap-4"
      noValidate
    >
      {/* Nombre completo */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-fullName" className="text-sm font-medium">
          Nombre completo
        </Label>
        <IconInput
          id="reg-fullName"
          autoComplete="name"
          placeholder="Juan García"
          icon={<User className="size-4" />}
          hasError={!!errors.fullName}
          aria-invalid={errors.fullName ? true : undefined}
          {...field("fullName")}
        />
        {errors.fullName ? (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {errors.fullName.message}
          </p>
        ) : null}
      </div>

      {/* Correo electrónico */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-email" className="text-sm font-medium">
          Correo electrónico
        </Label>
        <IconInput
          id="reg-email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          icon={<Mail className="size-4" />}
          hasError={!!errors.email}
          aria-invalid={errors.email ? true : undefined}
          {...field("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {/* Contraseña */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-password" className="text-sm font-medium">
          Contraseña
        </Label>
        <div className="[&_input]:h-11 [&_input]:rounded-lg [&_input]:text-sm">
          <PasswordInput
            id="reg-password"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            aria-invalid={errors.password ? true : undefined}
            className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
            {...field("password")}
          />
        </div>
        <PasswordStrengthBar password={passwordValue ?? ""} />
        {errors.password ? (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {/* Confirmar contraseña */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reg-confirm" className="text-sm font-medium">
          Confirmar contraseña
        </Label>
        <div className="[&_input]:h-11 [&_input]:rounded-lg [&_input]:text-sm">
          <PasswordInput
            id="reg-confirm"
            autoComplete="new-password"
            placeholder="Repite tu contraseña"
            aria-invalid={errors.confirmPassword ? true : undefined}
            className={cn(errors.confirmPassword && "border-destructive focus-visible:ring-destructive")}
            {...field("confirmPassword")}
          />
        </div>
        {errors.confirmPassword ? (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {errors.confirmPassword.message}
          </p>
        ) : null}
      </div>

      {/* Nota de privacidad */}
      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand-start" />
        Al crear tu cuenta aceptas el tratamiento de tus datos conforme a nuestra política de privacidad.
      </p>

      {/* Botón submit con gradiente de marca */}
      <button
        type="submit"
        disabled={registerMutation.isPending}
        className={cn(
          "relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg",
          "bg-linear-to-r from-brand-start to-brand-end",
          "text-sm font-semibold text-white",
          "transition-all duration-300",
          "hover:brightness-110 hover:shadow-lg hover:shadow-primary/30",
          "active:scale-[0.98]",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-60",
          "after:absolute after:inset-0 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-white/15 after:to-transparent",
          "hover:after:translate-x-full after:transition-transform after:duration-700",
        )}
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Creando cuenta…</span>
          </>
        ) : (
          <span>Crear cuenta</span>
        )}
      </button>
    </form>
  );
}
