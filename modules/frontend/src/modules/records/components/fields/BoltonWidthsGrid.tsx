import { Controller, useFormContext } from "react-hook-form";
import { ScrollableX } from "@/modules/core/components/ScrollableX";
import { FieldHint } from "@/modules/core/components/form/FieldHint";
import { fieldError } from "@/modules/core/components/form/fieldError";
import { NumberInput } from "@/modules/core/ui/number-input";
import { cn } from "@/modules/core/utils/cn";
import { MAX_TOOTH_MM, MIN_TOOTH_MM, type RecordFormValues } from "../../schemas/record";
import { BOLTON_SHARED_NOTE, LOWER_BOLTON_TEETH, UPPER_BOLTON_TEETH, boltonWidthPath, isSharedWithNance } from "../../config/bolton";

/**
 * Anchos mesiodistales de Bolton (de 1er molar a 1er molar, R…L). Caninos y premolares usan los
 * mismos campos que Nance (sombreados): escribir aquí cambia allá y al revés. Incisivos y primeros
 * molares son propios de Bolton.
 */
export function BoltonWidthsGrid() {
  const { control, formState } = useFormContext<RecordFormValues>();
  const errors = [...UPPER_BOLTON_TEETH, ...LOWER_BOLTON_TEETH].flatMap((t) => {
    const error = fieldError(formState.errors, boltonWidthPath(t));
    return error ? [`Pieza ${t}: ${error}`] : [];
  });

  const header = (teeth: readonly number[]) => (
    <tr className="bg-muted text-xs text-muted-foreground">
      <th scope="row" className="sticky left-0 z-10 bg-muted px-2 py-1 font-semibold">R</th>
      {teeth.map((t) => (
        <th key={t} scope="col" className="px-1 py-1 text-center font-medium">{t}</th>
      ))}
      <th className="px-2 py-1 font-semibold">L</th>
    </tr>
  );
  const inputs = (teeth: readonly number[]) => (
    <tr>
      <td className="sticky left-0 z-10 bg-background" />
      {teeth.map((t) => (
        <td key={t} className={cn("px-1 py-1.5", isSharedWithNance(t) && "bg-muted/40")}>
          <Controller
            control={control}
            name={boltonWidthPath(t)}
            render={({ field }) => (
              <NumberInput
                compact
                step={0.1}
                min={MIN_TOOTH_MM}
                max={MAX_TOOTH_MM}
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
      <ScrollableX>
        <table className="border-collapse border border-border text-sm">
          <tbody>
            {header(UPPER_BOLTON_TEETH)}
            {inputs(UPPER_BOLTON_TEETH)}
            {inputs(LOWER_BOLTON_TEETH)}
            {header(LOWER_BOLTON_TEETH)}
          </tbody>
        </table>
      </ScrollableX>
      <FieldHint>{BOLTON_SHARED_NOTE}</FieldHint>
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
