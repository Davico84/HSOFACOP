import type { ReactNode } from "react";
import { Label } from "@/modules/core/ui/label";
import { cn } from "@/modules/core/utils/cn";
import { FieldHint } from "./FieldHint";

interface FormFieldProps {
  /** id del control (para `htmlFor`); en grupos de opciones, el id del grupo. */
  id: string;
  label: ReactNode;
  /** Ayuda bajo la etiqueta (p. ej. un valor de referencia); el control la enlaza con `describedBy`. */
  hint?: ReactNode;
  error?: string;
  /** Grupo de opciones: la etiqueta no apunta a un único control. */
  group?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Envoltorio de un campo: etiqueta, ayuda opcional y error. Solo pinta: el error llega del
 * schema (Zod) o del servidor, nunca se calcula aquí.
 */
export function FormField({ id, label, hint, error, group, className, children }: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {group ? (
        <span id={`${id}-label`} className="text-sm font-medium">
          {label}
        </span>
      ) : (
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
      )}
      {hint ? <FieldHint id={`${id}-hint`}>{hint}</FieldHint> : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
