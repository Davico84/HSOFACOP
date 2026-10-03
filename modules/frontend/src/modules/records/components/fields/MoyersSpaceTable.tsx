import { Controller, useFormContext, useWatch } from "react-hook-form";
import { NumberInput } from "@/modules/core/ui/number-input";
import { ComputedValue } from "@/modules/core/components/form/ComputedValue";
import { fieldError } from "@/modules/core/components/form/fieldError";
import type { RecordFormValues } from "../../schemas/record";
import { MOYERS_SIDES } from "../../config/moyers";
import { moyersResult } from "../../utils/moyers";
import { formatMm, formatSigned } from "../../utils/transversal";

/**
 * Ficha de Moyers: espacio disponible por arcada y lado (se escribe), requerido (tabla al 75 %) y
 * diferencia disponible − requerido (calculados).
 */
export function MoyersSpaceTable() {
  const { control, formState } = useFormContext<RecordFormValues>();
  const [incisors, available] = useWatch({
    control,
    name: ["content.models.moyers.lowerIncisors", "content.models.moyers.availableSpace"],
  });
  const { sides } = moyersResult(incisors, available);
  // Las cuatro columnas tienen el mismo ancho y todo va centrado: la entrada, el requerido y la
  // diferencia de cada lado quedan uno debajo del otro (revisión del usuario).
  const cell = "w-28 px-2 py-1.5 text-center tabular-nums";

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Espacio disponible, requerido y diferencia (mm)</legend>
      <div className="overflow-x-auto">
        <table className="border-collapse border border-border text-sm">
          <thead>
            <tr className="bg-muted text-xs text-muted-foreground">
              <td />
              <th scope="colgroup" colSpan={2} className="px-2 py-1 text-center font-medium">Mandíbula</th>
              <th scope="colgroup" colSpan={2} className="px-2 py-1 text-center font-medium">Maxilar</th>
            </tr>
            <tr className="bg-muted text-xs text-muted-foreground">
              <td />
              {MOYERS_SIDES.map(({ key, side, label }) => (
                <th key={key} scope="col" className="w-28 px-2 py-1 text-center font-medium" aria-label={label}>
                  {side}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <th scope="row" className="bg-muted px-3 py-1.5 text-left font-medium">Espacio disponible</th>
              {MOYERS_SIDES.map(({ key, label }) => {
                const name = `content.models.moyers.availableSpace.${key}` as const;
                const error = fieldError(formState.errors, name);
                return (
                  <td key={key} className={cell}>
                    <Controller
                      control={control}
                      name={name}
                      render={({ field }) => (
                        <NumberInput
                          step={0.1}
                          className="mx-auto w-24"
                          inputClassName="h-8 text-center"
                          aria-label={`Espacio disponible, ${label} (mm)`}
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
                );
              })}
            </tr>
            <tr className="border-t border-border">
              <th scope="row" className="bg-muted px-3 py-1.5 text-left font-medium">Espacio requerido (Moyers 75 %)</th>
              {sides.map(({ key, label, required }) => (
                <td key={key} className={cell}>
                  <ComputedValue label={`Espacio requerido, ${label}`} className="mx-auto w-24">
                    {required === null ? "" : formatMm(required)}
                  </ComputedValue>
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <th scope="row" className="bg-muted px-3 py-1.5 text-left font-medium">Diferencia</th>
              {sides.map(({ key, label, difference }) => (
                <td key={key} className={cell}>
                  <ComputedValue label={`Diferencia, ${label}`} className="mx-auto w-24">
                    {formatSigned(difference)}
                  </ComputedValue>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
