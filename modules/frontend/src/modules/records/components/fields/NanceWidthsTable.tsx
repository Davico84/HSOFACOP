import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ScrollableX } from "@/modules/core/components/ScrollableX";
import { ComputedValue } from "@/modules/core/components/form/ComputedValue";
import { fieldError } from "@/modules/core/components/form/fieldError";
import { NumberInput } from "@/modules/core/ui/number-input";
import { MAX_TOOTH_MM, MIN_TOOTH_MM, type RecordFormValues } from "../../schemas/record";
import { NANCE_ARCHES, NANCE_MISSING_TEETH, widthPath } from "../../config/nance";
import { archTotal, measuredTeeth } from "../../utils/nance";
import { formatMm } from "../../utils/transversal";

/**
 * Ancho mesiodistal de las 10 piezas de cada arcada (de mesial a mesial del 1er molar) con su
 * total (ST) calculado; si falta alguna pieza, el total queda vacío y se avisa.
 */
export function NanceWidthsTable() {
  const { control, formState } = useFormContext<RecordFormValues>();
  const [upper, lower] = useWatch({ control, name: ["content.models.nance.upperWidths", "content.models.nance.lowerWidths"] });
  const values = { upper, lower };
  // Las celdas son angostas: los errores de cada pieza se listan bajo la tabla.
  const errors = NANCE_ARCHES.flatMap((arch) =>
    arch.teeth.flatMap((t) => {
      const error = fieldError(formState.errors, widthPath(arch, t));
      return error ? [`Pieza ${t}: ${error}`] : [];
    }),
  );

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Ancho mesiodistal de mesial a mesial del 1er molar (mm)</legend>
      <ScrollableX>
        <table className="border-collapse border border-border text-sm">
          <tbody>
            {NANCE_ARCHES.map((arch) => {
              const widths = values[arch.key];
              const total = archTotal(widths, arch.teeth);
              const measured = measuredTeeth(widths, arch.teeth);
              return [
                <tr key={`${arch.key}-teeth`} className="bg-muted text-xs text-muted-foreground">
                  <th scope="row" className="sticky left-0 z-10 bg-muted px-2 py-1 text-left font-semibold">O.D.</th>
                  {arch.teeth.map((t) => (
                    <th key={t} scope="col" className="px-1 py-1 text-center font-medium">{t}</th>
                  ))}
                  <th scope="col" className="px-2 py-1 text-center font-medium">Total {arch.label.toLowerCase()}</th>
                </tr>,
                <tr key={`${arch.key}-widths`} className="border-b border-border">
                  <td className="sticky left-0 z-10 bg-background" />
                  {arch.teeth.map((t) => {
                    const name = widthPath(arch, t);
                    const error = fieldError(formState.errors, name);
                    return (
                      <td key={t} className="px-1 py-1.5">
                        <Controller
                          control={control}
                          name={name}
                          render={({ field }) => (
                            <NumberInput
                              step={0.1}
                              min={MIN_TOOTH_MM}
                              max={MAX_TOOTH_MM}
                              compact
                              className="w-14"
                              inputClassName="h-8 pl-1 text-center"
                              aria-label={`Ancho mesiodistal, pieza ${t} (mm)`}
                              aria-invalid={error ? true : undefined}
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                            />
                          )}
                        />
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5">
                    <ComputedValue label={`Total ${arch.label.toLowerCase()}`} className="w-20">
                      {total === null ? "" : formatMm(total)}
                    </ComputedValue>
                    {measured > 0 && total === null ? (
                      <p className="mt-1 text-xs text-muted-foreground">{NANCE_MISSING_TEETH}</p>
                    ) : null}
                  </td>
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </ScrollableX>
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
