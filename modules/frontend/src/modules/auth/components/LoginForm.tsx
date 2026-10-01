import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { Label } from "@/modules/core/ui/label";
import { PasswordInput } from "@/modules/core/ui/password-input";
import { IconInput } from "@/modules/core/ui/icon-input";
import { loginSchema, type LoginValues } from "../schemas/auth";
import { useLogin } from "../hooks/useAuth";
import { cn } from "@/modules/core/utils/cn";

/** Formulario de inicio de sesión. La redirección por rol la maneja el RouteGuard. */
export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const login = useLogin();

  return (
    <form
      onSubmit={handleSubmit((values) => login.mutate(values))}
      className="flex flex-col gap-5"
      noValidate
    >
      {/* Campo correo */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-sm font-medium">
          Correo electrónico
        </Label>
        <IconInput
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          icon={<Mail className="size-4" />}
          hasError={!!errors.email}
          aria-invalid={errors.email ? true : undefined}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      {/* Campo contraseña */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            Contraseña
          </Label>
          <button
            type="button"
            tabIndex={-1}
            className="text-xs text-primary hover:underline underline-offset-4 transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring rounded"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div className="[&_input]:h-11 [&_input]:rounded-lg [&_input]:text-sm">
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={errors.password ? true : undefined}
            className={cn(errors.password && "border-destructive focus-visible:ring-destructive")}
            {...register("password")}
          />
        </div>
        {errors.password ? (
          <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {/* Botón submit con gradiente de marca */}
      <button
        type="submit"
        disabled={login.isPending}
        className={cn(
          "relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-lg",
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
        {login.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span>Iniciando sesión…</span>
          </>
        ) : (
          <span>Iniciar sesión</span>
        )}
      </button>

      {/* Separador decorativo */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>acceso seguro</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Badges de seguridad */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          Conexión cifrada
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-1.5 rounded-full bg-brand-start" />
          Datos protegidos
        </span>
      </div>
    </form>
  );
}
