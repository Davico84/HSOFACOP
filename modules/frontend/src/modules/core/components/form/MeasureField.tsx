import type { ReactNode } from "react";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { NumberInput } from "@/modules/core/ui/number-input";
import { FormField } from "./FormField";
import { fieldError, fieldId } from "./fieldError";

interface MeasureFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
  /** Unidad mostrada junto al número ("mm", "%"). */
  unit: string;
  step?: number;
  /** Rango de las flechas (la validación sigue en el schema). */
  min?: number;
  max?: number;
  className?: string;
}

/** Número con unidad. Vacío = `null`; el rango lo valida el schema. */
export function MeasureField<T extends FieldValues>({ name, label, unit, step = 0.1, min, max, className }: MeasureFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const id = fieldId(name);
  const error = fieldError(formState.errors, name);
  return (
    <FormField id={id} label={label} error={error} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className="flex items-center gap-2">
            <NumberInput
              id={id}
              step={step}
              min={min}
              max={max}
              className="w-28"
              aria-invalid={error ? true : undefined}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        )}
      />
    </FormField>
  );
}
