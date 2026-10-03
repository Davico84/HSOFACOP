import { Controller, useFormContext } from "react-hook-form";
import { FieldHint } from "@/modules/core/components/form/FieldHint";
import { fieldError } from "@/modules/core/components/form/fieldError";
import { NumberInput } from "@/modules/core/ui/number-input";
import { cn } from "@/modules/core/utils/cn";
import type { RecordFormValues } from "../../schemas/record";
import { FIRST_MOLARS, LOWER_BOLTON_TEETH, UPPER_BOLTON_TEETH, boltonWidthPath } from "../../config/bolton";

const isMolar = (tooth: number) => (FIRST_MOLARS as readonly number[]).includes(tooth);

/**
 * Anchos mesiodistales de Bolton (de 1er molar a 1er molar, R…L). Las piezas 15→25 y 45→35 usan
 * los mismos campos que Nance: escribir aquí cambia allá y al revés. Los molares son de Bolton.
 */
export function BoltonWidthsGrid() {
  const { control, formState } = useFormContext<RecordFormValues>();
  const errors = [...UPPER_BOLTON_TEETH, ...LOWER_BOLTON_TEETH].flatMap((t) => {
    const error = fieldError(formState.errors, boltonWidthPath(t));
    return error ? [`Pieza ${t}: ${error}`] : [];
  });

  const header = (teeth: readonly number[]) => (
    <tr className="bg-muted text-xs text-muted-foreground">
      <th scope="row" className="px-2 py-1 font-semibold">R</th>
      {teeth.map((t) => (
        <th key={t} scope="col" className="px-1 py-1 text-center font-medium">{t}</th>
      ))}
      <th className="px-2 py-1 font-semibold">L</th>
    </tr>
  );
  const inputs = (teeth: readonly number[]) => (
    <tr>
      <td />
      {teeth.map((t) => (
        <td key={t} className={cn("px-1 py-1.5", !isMolar(t) && "bg-muted/40")}>
          <Controller
            control={control}
            name={boltonWidthPath(t)}
            render={({ field }) => (
              <NumberInput
                compact
                step={0.1}
                className="w-14"
                inputClassName="h-8 pl-1 text-center"
                aria-label={`Bolton, pieza ${t} (mm)`}
                aria-invalid={fieldError(formState.errors, boltonWidthPath(t)) ? true : undefined}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </td>
      ))}
      <td />
    </tr>
  );

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Ancho mesiodistal de las piezas (mm)</legend>
      <div className="overflow-x-auto">
        <table className="border-collapse border border-border text-sm">
          <tbody>
            {header(UPPER_BOLTON_TEETH)}
            {inputs(UPPER_BOLTON_TEETH)}
            {inputs(LOWER_BOLTON_TEETH)}
            {header(LOWER_BOLTON_TEETH)}
          </tbody>
        </table>
      </div>
      <FieldHint>
        Las piezas sombreadas (15 a 25 y 45 a 35) son las mismas del análisis de Nance: si cambias una aquí, cambia allá.
        Solo los primeros molares (16, 26, 46 y 36) son propios de Bolton.
      </FieldHint>
      {errors.length ? (
        <ul role="alert" className="text-xs text-destructive">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </fieldset>
  );
}
