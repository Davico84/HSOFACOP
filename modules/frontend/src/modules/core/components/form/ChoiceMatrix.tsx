import type { ReactNode } from "react";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { fieldId } from "./fieldError";
import type { ChoiceOption } from "./choiceTypes";

interface MatrixRow<T extends FieldValues> {
  name: Path<T>;
  label: string;
}

interface ChoiceMatrixProps<T extends FieldValues> {
  label: ReactNode;
  rows: readonly MatrixRow<T>[];
  options: readonly ChoiceOption[];
}

/**
 * Varias preguntas con las mismas opciones, como tabla: una fila por pregunta y una columna por
 * opción (selección única por fila; pulsar la marcada la quita).
 */
export function ChoiceMatrix<T extends FieldValues>({ label, rows, options }: ChoiceMatrixProps<T>) {
  const { control } = useFormContext<T>();
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="py-1 pr-3 text-left font-medium" scope="col">
                <span className="sr-only">Pregunta</span>
              </th>
              {options.map((o) => (
                <th key={o.value} className="px-2 py-1 text-center font-medium" scope="col">
                  {o.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Controller
                key={row.name}
                control={control}
                name={row.name}
                render={({ field }) => (
                  <tr className="border-t border-border" role="radiogroup" aria-label={row.label}>
                    <th scope="row" className="py-1.5 pr-3 text-left font-medium">
                      {row.label}
                    </th>
                    {options.map((o) => {
                      const checked = field.value === o.value;
                      return (
                        <td key={o.value} className="px-2 py-1.5 text-center">
                          <input
                            type="radio"
                            name={fieldId(row.name)}
                            aria-label={`${row.label}: ${o.label}`}
                            checked={checked}
                            onChange={() => undefined}
                            onClick={() => field.onChange(checked ? null : o.value)}
                            onBlur={field.onBlur}
                            className="accent-primary"
                          />
                        </td>
                      );
                    })}
                  </tr>
                )}
              />
            ))}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
