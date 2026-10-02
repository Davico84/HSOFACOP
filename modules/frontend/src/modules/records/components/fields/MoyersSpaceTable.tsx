import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/modules/core/ui/input";
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
  const cell = "px-2 py-1.5 text-right tabular-nums";

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Espacio disponible, requerido y diferencia (mm)</legend>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <td />
              <th scope="colgroup" colSpan={2} className="px-2 py-1 text-center font-medium">Mandíbula</th>
              <th scope="colgroup" colSpan={2} className="px-2 py-1 text-center font-medium">Maxilar</th>
            </tr>
            <tr className="text-xs text-muted-foreground">
              <td />
              {MOYERS_SIDES.map(({ key, side, label }) => (
                <th key={key} scope="col" className="px-2 py-1 text-right font-medium" aria-label={label}>
                  {side}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-border">
              <th scope="row" className="py-1.5 pr-3 text-left font-medium">Espacio disponible</th>
              {MOYERS_SIDES.map(({ key, label }) => {
                const name = `content.models.moyers.availableSpace.${key}` as const;
                const error = fieldError(formState.errors, name);
                return (
                  <td key={key} className="px-2 py-1.5 text-right">
                    <Controller
                      control={control}
                      name={name}
                      render={({ field }) => (
                        <Input
                          type="number"
                          inputMode="decimal"
                          step={0.1}
                          className="ml-auto h-8 w-24"
                          aria-label={`Espacio disponible, ${label} (mm)`}
                          aria-invalid={error ? true : undefined}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
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
              <th scope="row" className="py-1.5 pr-3 text-left font-medium">Espacio requerido (Moyers 75 %)</th>
              {sides.map(({ key, label, required }) => (
                <td key={key} className={cell} aria-label={`Espacio requerido, ${label}`}>
                  {required === null ? "—" : formatMm(required)}
                </td>
              ))}
            </tr>
            <tr className="border-t border-border">
              <th scope="row" className="py-1.5 pr-3 text-left font-medium">Diferencia</th>
              {sides.map(({ key, label, difference }) => (
                <td key={key} className={cell} aria-label={`Diferencia, ${label}`}>
                  {formatSigned(difference) || "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
