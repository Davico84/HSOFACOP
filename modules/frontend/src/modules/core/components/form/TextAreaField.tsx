import type { ReactNode } from "react";
import { useFormContext, useWatch, type FieldValues, type Path } from "react-hook-form";
import { Textarea } from "@/modules/core/ui/textarea";
import { FormField } from "./FormField";
import { fieldError, fieldId } from "./fieldError";

interface TextAreaFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
  hint?: ReactNode;
  /** Muestra "n / máximo" (el límite real lo valida el schema). */
  maxLength?: number;
  rows?: number;
  placeholder?: string;
  className?: string;
}

/** Texto largo con contador de caracteres. */
export function TextAreaField<T extends FieldValues>({ name, label, hint, maxLength, rows = 3, placeholder, className }: TextAreaFieldProps<T>) {
  const { register, formState, control } = useFormContext<T>();
  const value: unknown = useWatch({ control, name });
  const id = fieldId(name);
  const error = fieldError(formState.errors, name);
  const length = typeof value === "string" ? value.length : 0;
  return (
    <FormField id={id} label={label} hint={hint} error={error} className={className}>
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...register(name)}
      />
      {maxLength ? (
        <span className="self-end text-xs text-muted-foreground" aria-live="polite">
          {length} / {maxLength}
        </span>
      ) : null}
    </FormField>
  );
}
