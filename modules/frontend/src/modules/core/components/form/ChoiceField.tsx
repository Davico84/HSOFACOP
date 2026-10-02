import type { ReactNode } from "react";
import { Controller, useFormContext, type FieldValues, type Path } from "react-hook-form";
import { cn } from "@/modules/core/utils/cn";
import { FormField } from "./FormField";
import type { ChoiceOption } from "./choiceTypes";
import { describedBy, fieldError, fieldId } from "./fieldError";

interface ChoiceFieldProps<T extends FieldValues> {
  name: Path<T>;
  label: ReactNode;
  options: readonly ChoiceOption[];
  hint?: ReactNode;
  /** Imagen de referencia junto a las opciones (no seleccionable). */
  referenceImage?: string;
  /** Opciones en columna (textos largos). */
  vertical?: boolean;
  className?: string;
}

/**
 * Selección única. Pulsar la opción elegida la quita (el campo queda vacío). Si las opciones
 * traen imagen se pintan como tarjetas: pulsar la imagen selecciona igual que la etiqueta.
 */
export function ChoiceField<T extends FieldValues>({
  name, label, options, hint, referenceImage, vertical, className,
}: ChoiceFieldProps<T>) {
  const { control, formState } = useFormContext<T>();
  const id = fieldId(name);
  const error = fieldError(formState.errors, name);
  const withImages = options.some((o) => o.image);

  return (
    <FormField id={id} label={label} hint={hint} error={error} group className={className}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className={cn("flex gap-3", referenceImage ? "items-start" : "flex-col")}>
            {referenceImage ? (
              <img src={referenceImage} alt="" className="w-28 shrink-0 rounded-md border border-border bg-card object-contain" />
            ) : null}
            <div
              role="radiogroup"
              aria-labelledby={`${id}-label`}
              aria-describedby={describedBy(id, hint, error)}
              aria-invalid={error ? true : undefined}
              className={cn(
                withImages ? "grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2" : "flex flex-wrap gap-2",
                vertical && !withImages && "flex-col items-start",
              )}
            >
              {options.map((option) => {
                const checked = field.value === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm transition-colors",
                      "has-focus-visible:ring-2 has-focus-visible:ring-ring",
                      withImages && "flex-col p-2 text-center",
                      checked && "border-primary bg-primary/10",
                    )}
                  >
                    {option.image ? <img src={option.image} alt="" className="h-24 w-full object-contain" /> : null}
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={id}
                        value={option.value}
                        checked={checked}
                        onChange={() => undefined}
                        onClick={() => field.onChange(checked ? null : option.value)}
                        onBlur={field.onBlur}
                        className="accent-primary"
                      />
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      />
    </FormField>
  );
}
