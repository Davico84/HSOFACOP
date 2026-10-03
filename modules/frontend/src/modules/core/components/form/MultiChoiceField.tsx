import type { ReactNode } from "react";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { cn } from "@/modules/core/utils/cn";
import { FormField } from "./FormField";
import type { ChoiceOption } from "./choiceTypes";
import { describedBy, fieldError, fieldId } from "./fieldError";

interface MultiChoiceFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
  options: readonly ChoiceOption[];
  hint?: ReactNode;
  /** Opción que excluye a todas las demás (p. ej. "No"): marcarla desmarca el resto y viceversa. */
  exclusiveValue?: string;
  /** Solo lectura (p. ej. fijada por otra respuesta). */
  disabled?: boolean;
  /** Pie bajo las opciones (p. ej. "2 de 3"). */
  footer?: ReactNode;
  className?: string;
}

/** Selección múltiple; el orden guardado sigue el de las opciones. */
export function MultiChoiceField<T extends FieldValues>({
  name, label, options, hint, exclusiveValue, disabled, footer, className,
}: MultiChoiceFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const id = fieldId(name);
  const error = fieldError(formState.errors, name);

  return (
    <FormField id={id} label={label} hint={hint} error={error} group className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selected: string[] = Array.isArray(field.value) ? field.value : [];
          const toggle = (value: string) => {
            let next: string[];
            if (selected.includes(value)) {
              next = selected.filter((v) => v !== value);
            } else if (value === exclusiveValue) {
              next = [value];
            } else {
              next = [...selected.filter((v) => v !== exclusiveValue), value];
            }
            field.onChange(options.map((o) => o.value).filter((v) => next.includes(v)));
          };
          return (
            <div role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy(id, hint, error)} className="flex flex-wrap gap-2">
              {options.map((option) => {
                const checked = selected.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm transition-colors",
                      "has-focus-visible:ring-2 has-focus-visible:ring-ring",
                      checked && "border-primary bg-primary/10",
                      disabled && "cursor-not-allowed opacity-60",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(option.value)}
                      onBlur={field.onBlur}
                      className="accent-primary"
                    />
                    {option.label}
                  </label>
                );
              })}
              {footer ? <span className="basis-full text-xs text-muted-foreground">{footer}</span> : null}
            </div>
          );
        }}
      />
    </FormField>
  );
}
