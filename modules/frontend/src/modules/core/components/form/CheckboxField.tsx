import type { ReactNode } from "react";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";

interface CheckboxFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
}

/** Casilla de verificación: marcada = `true`; desmarcada = `null` (sin respuesta). */
export function CheckboxField<T extends FieldValues>({ name, label }: CheckboxFieldProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="accent-primary"
            checked={field.value === true}
            onChange={(e) => field.onChange(e.target.checked ? true : null)}
            onBlur={field.onBlur}
          />
          {label}
        </label>
      )}
    />
  );
}
