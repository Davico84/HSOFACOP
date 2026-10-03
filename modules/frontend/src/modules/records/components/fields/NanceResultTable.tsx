import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ComputedValue } from "@/modules/core/components/form/ComputedValue";
import { fieldError } from "@/modules/core/components/form/fieldError";
import { Input } from "@/modules/core/ui/input";
import { NumberInput } from "@/modules/core/ui/number-input";
import { SHORT_TEXT, type RecordFormValues } from "../../schemas/record";
import { NANCE_ARCHES } from "../../config/nance";
import { archTotal, discrepancy } from "../../utils/nance";
import { formatMm, formatSigned } from "../../utils/transversal";

/**
 * Resultado de Nance por arcada: SA (se escribe), ST y discrepancia SA − ST (calculados, en cajas
 * bloqueadas) y conclusión (la escribe el odontólogo).
 */
export function NanceResultTable() {
  const { control, register, formState } = useFormContext<RecordFormValues>();
  const nance = useWatch({ control, name: "content.models.nance" });
  const head = "bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground";

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Discrepancia óseo dentaria</legend>
      <div className="overflow-x-auto">
        <table className="border-collapse border border-border text-sm">
          <thead>
            <tr>
              <td className={head} />
              <th scope="col" className={head}>SA · espacio disponible (mm)</th>
              <th scope="col" className={head}>ST · espacio requerido</th>
              <th scope="col" className={head}>Discrepancia</th>
              <th scope="col" className={head}>Conclusión</th>
            </tr>
          </thead>
          <tbody>
            {NANCE_ARCHES.map((arch) => {
              const total = archTotal(nance?.[arch.widths], arch.teeth);
              const diff = discrepancy(nance?.[arch.available], total);
              const availableName = `content.models.nance.${arch.available}` as const;
              const conclusionName = `content.models.nance.${arch.conclusion}` as const;
              const availableError = fieldError(formState.errors, availableName);
              const conclusionError = fieldError(formState.errors, conclusionName);
              return (
                <tr key={arch.key} className="border-t border-border">
                  <th scope="row" className="bg-muted px-3 py-1.5 text-left font-medium">{arch.label}</th>
                  <td className="px-2 py-1.5">
                    <Controller
                      control={control}
                      name={availableName}
                      render={({ field }) => (
                        <NumberInput
                          step={0.1}
                          className="mx-auto w-24"
                          inputClassName="h-8 text-center"
                          aria-label={`SA, espacio disponible ${arch.label.toLowerCase()} (mm)`}
                          aria-invalid={availableError ? true : undefined}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      )}
                    />
                    {availableError ? <p className="text-xs text-destructive">{availableError}</p> : null}
                  </td>
                  <td className="px-2 py-1.5">
                    <ComputedValue label={`ST, espacio requerido ${arch.label.toLowerCase()}`} className="mx-auto w-24">
                      {total === null ? "" : `${formatMm(total)} mm`}
                    </ComputedValue>
                  </td>
                  <td className="px-2 py-1.5">
                    <ComputedValue label={`Discrepancia ${arch.label.toLowerCase()}`} className="mx-auto w-24">
                      {diff === null ? "" : `${formatSigned(diff)} mm`}
                    </ComputedValue>
                  </td>
                  <td className="px-2 py-1.5">
                    <Input
                      className="h-8 min-w-48"
                      maxLength={SHORT_TEXT}
                      aria-label={`Conclusión ${arch.label.toLowerCase()}`}
                      aria-invalid={conclusionError ? true : undefined}
                      {...register(conclusionName)}
                    />
                    {conclusionError ? <p className="text-xs text-destructive">{conclusionError}</p> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
