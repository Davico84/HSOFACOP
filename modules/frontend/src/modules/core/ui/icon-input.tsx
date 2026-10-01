import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";

export interface IconInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Ícono que se muestra a la izquierda del campo. */
  icon: ReactNode;
  /** Aplica estilos de error (borde rojo + ring destructivo al focus). */
  hasError?: boolean;
}

/**
 * Input de texto con ícono decorativo a la izquierda.
 * Reutilizable en cualquier formulario del proyecto.
 */
export const IconInput = forwardRef<HTMLInputElement, IconInputProps>(
  function IconInput({ icon, hasError, className, ...props }, ref) {
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          {icon}
        </span>
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm",
            "text-foreground placeholder:text-muted-foreground",
            "transition-all duration-200",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            "focus-visible:border-primary/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
