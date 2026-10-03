import { Controller, useFormContext, type FieldPath } from "react-hook-form";
import { FormField } from "@/modules/core/components/form/FormField";
import { fieldError, fieldId } from "@/modules/core/components/form/fieldError";
import { cn } from "@/modules/core/utils/cn";
import type { RecordFormValues } from "../../schemas/record";
import { DECIDUOUS_ROWS, isValidFdi, PERMANENT_ROWS } from "../../utils/fdi";

interface ToothPickerFieldProps {
  name: FieldPath<RecordFormValues>;
  label: string;
  /** Solo incisivos y caninos (p. ej. mordida cruzada anterior). */
  anteriorOnly?: boolean;
}

/**
 * Selector de piezas dentales en notación FDI: permanentes (11–48) y temporales (51–85), como se
 * ven de frente al paciente. Guarda los códigos ordenados.
 */
export function ToothPickerField({ name, label, anteriorOnly = false }: ToothPickerFieldProps) {
  const { control, formState } = useFormContext<RecordFormValues>();
  const id = fieldId(name);
  const error = fieldError(formState.errors, name);
  const rows = [...PERMANENT_ROWS, ...DECIDUOUS_ROWS].map((row) => row.filter((t) => isValidFdi(t, anteriorOnly)));

  return (
    <FormField id={id} label={label} error={error} group>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const selected: number[] = Array.isArray(field.value) ? (field.value as number[]) : [];
          const toggle = (tooth: number) =>
            field.onChange(
              selected.includes(tooth) ? selected.filter((t) => t !== tooth) : [...selected, tooth].sort((a, b) => a - b),
            );
          return (
            <div role="group" aria-labelledby={`${id}-label`} className="flex flex-col gap-1 overflow-x-auto">
              {rows.map((row, r) => (
                <div key={r} className={cn("flex justify-center gap-1", r === 2 && "mt-2")}>
                  {row.map((tooth, i) => {
                    const checked = selected.includes(tooth);
                    const midline = i === row.length / 2;
                    return (
                      <label
                        key={tooth}
                        className={cn(
                          "w-8 cursor-pointer rounded border border-border bg-card py-0.5 text-center text-xs tabular-nums",
                          "has-focus-visible:ring-2 has-focus-visible:ring-ring",
                          checked && "border-primary bg-primary text-primary-foreground",
                          midline && "ml-2",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          aria-label={`Pieza ${tooth}`}
                          checked={checked}
                          onChange={() => toggle(tooth)}
                          onBlur={field.onBlur}
                        />
                        {tooth}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        }}
      />
    </FormField>
  );
}
