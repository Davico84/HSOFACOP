import { Controller, useFormContext, type FieldValues, type Path, type PathValue } from "react-hook-form";
import { Info, PencilLine } from "lucide-react";
import { NumberInput } from "@/modules/core/ui/number-input";
import { FormField } from "./FormField";
import { fieldError, fieldId } from "./fieldError";

interface SuggestedMeasureFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  unit: string;
  /** Valor calculado de otros datos; `null` si no se puede calcular. Nunca se escribe en el formulario. */
  suggestedValue: number | null;
  /** De dónde sale el valor calculado ("Tomada de los incisivos de Moyers."). */
  suggestedNote: string;
  /** Qué completar cuando no hay valor calculado. */
  missingNote: string;
  /** Fuente corta para "Usar el de …" ("Moyers"). */
  sourceLabel: string;
  /** Cómo mostrar un número ("23,0"). */
  formatValue: (value: number) => string;
  step?: number;
  min?: number;
  max?: number;
  className?: string;
}

/**
 * Medida con un valor sugerido: vacía (`null`) usa la sugerencia, que se ve como marcador y en la
 * nota; escribir fija un valor propio y "Usar el de …" lo quita (vuelve a `null`). La sugerencia se
 * deriva al pintar: abrir el formulario no lo marca como modificado ni dispara el autoguardado.
 */
export function SuggestedMeasureField<T extends FieldValues>({
  name,
  label,
  unit,
  suggestedValue,
  suggestedNote,
  missingNote,
  sourceLabel,
  formatValue,
  step = 0.1,
  min,
  max,
  className,
}: SuggestedMeasureFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const id = fieldId(name);
  const noteId = `${id}-note`;
  const error = fieldError(formState.errors, name);
  return (
    <FormField id={id} label={label} error={error} className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const written = field.value as number | null | undefined;
          const hasWritten = written !== null && written !== undefined;
          const suggested = suggestedValue === null ? null : `${formatValue(suggestedValue)} ${unit}`;
          return (
            <>
              <div className="flex items-center gap-2">
                <NumberInput
                  id={id}
                  step={step}
                  min={min}
                  max={max}
                  className="w-28"
                  placeholder={suggestedValue === null ? undefined : formatValue(suggestedValue)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={noteId}
                  value={written}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
                <span className="text-sm text-muted-foreground">{unit}</span>
              </div>
              <div id={noteId} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {hasWritten ? (
                  <>
                    <PencilLine className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      Valor escrito por ti{suggested ? ` · ${sourceLabel} da ${suggested}` : ""}.
                    </span>
                    {suggested ? (
                      <button
                        type="button"
                        className="rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Usar la suma calculada de ${sourceLabel} (${suggested})`}
                        onClick={() => field.onChange(null as PathValue<T, Path<T>>)}
                      >
                        Usar el de {sourceLabel}
                      </button>
                    ) : null}
                  </>
                ) : (
                  <>
                    <Info className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{suggested ? `Se usa ${suggested}. ${suggestedNote}` : missingNote}</span>
                  </>
                )}
              </div>
            </>
          );
        }}
      />
    </FormField>
  );
}
