import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/modules/core/utils/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type = "text", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
        "placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Ícono del calendario (type="date"): visible en ambos temas gracias a color-scheme y clicable.
        "[&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 hover:[&::-webkit-calendar-picker-indicator]:opacity-100",
        "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive",
        // Una fecha ocupa solo lo que mide su contenido (dd/mm/aaaa + ícono), no todo el ancho.
        type === "date" && "w-fit",
        className,
      )}
      {...props}
    />
  );
});
