import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ScrollableX } from "@/modules/core/components/ScrollableX";
import { NumberInput } from "@/modules/core/ui/number-input";
import { fieldError } from "@/modules/core/components/form/fieldError";
import type { RecordFormValues } from "../../schemas/record";
import { WALA_EV_NORMS } from "../../config/transversal";
import { difference, formatMm, formatSigned } from "../../utils/transversal";

/** Distancias WALA–EV de las piezas inferiores: norma, medida y diferencia calculada. */
export function WalaToEvTable() {
  const { control, formState } = useFormContext<RecordFormValues>();
  const values = useWatch({ control, name: "content.models.transversal.walaToEv" });

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Distancia WALA a EV (eje vestibular)</legend>
      <ScrollableX>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="sticky left-0 z-10 bg-background py-1 pr-3 text-left font-medium">Pieza</th>
              <th scope="col" className="px-2 py-1 text-right font-medium">Norma</th>
              <th scope="col" className="px-2 py-1 text-left font-medium">Medido (mm)</th>
              <th scope="col" className="px-2 py-1 text-right font-medium">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {WALA_EV_NORMS.map(({ key, label, norm }) => {
              const name = `content.models.transversal.walaToEv.${key}` as const;
              const error = fieldError(formState.errors, name);
              const diff = formatSigned(difference(values?.[key] ?? null, norm));
              return (
                <tr key={key} className="border-t border-border">
                  <th scope="row" className="sticky left-0 z-10 bg-background py-1.5 pr-3 text-left font-medium">{label}</th>
                  <td className="px-2 py-1.5 text-right tabular-nums">{formatMm(norm)} mm</td>
                  <td className="px-2 py-1.5">
                    <Controller
                      control={control}
                      name={name}
                      render={({ field }) => (
                        <NumberInput
                          step={0.1}
                          className="w-24"
                          inputClassName="h-8"
                          aria-label={`Distancia WALA a EV, ${label} (mm)`}
                          aria-invalid={error ? true : undefined}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      )}
                    />
                    {error ? <p className="text-xs text-destructive">{error}</p> : null}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums" aria-label={`Diferencia ${label}`}>
                    {diff || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </ScrollableX>
    </fieldset>
  );
}
