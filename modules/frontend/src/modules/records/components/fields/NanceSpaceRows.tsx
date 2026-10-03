import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ComputedValue } from "@/modules/core/components/form/ComputedValue";
import { fieldError } from "@/modules/core/components/form/fieldError";
import { NumberInput } from "@/modules/core/ui/number-input";
import type { RecordFormValues } from "../../schemas/record";
import { NANCE_ARCHES } from "../../config/nance";
import { archTotal } from "../../utils/nance";
import { formatMm } from "../../utils/transversal";

/**
 * Puntos 1 y 2 de la ficha de Nance & Carey, como en el PDF: 1. SA (espacio disponible o longitud
 * de arco, se escribe por arcada) y 2. ST (espacio requerido, el total de los anchos, calculado).
 */
export function NanceSpaceRows() {
  const { control, formState } = useFormContext<RecordFormValues>();
  const nance = useWatch({ control, name: "content.models.nance" });
  const head = "bg-muted px-3 py-1.5 text-left font-medium";

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse border border-border text-sm">
        <tbody>
          <tr className="border-b border-border">
            <th scope="row" className={head}>1. SA · espacio disponible o longitud de arco</th>
            {NANCE_ARCHES.map((arch) => {
              const name = `content.models.nance.${arch.available}` as const;
              const error = fieldError(formState.errors, name);
              return [
                <th key={`${arch.key}-label`} scope="col" className="bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {arch.label}
                </th>,
                <td key={arch.key} className="px-2 py-1.5">
                  <Controller
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <NumberInput
                        step={0.1}
                        className="w-24"
                        inputClassName="h-8 text-center"
                        aria-label={`SA, espacio disponible ${arch.label.toLowerCase()} (mm)`}
                        aria-invalid={error ? true : undefined}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        ref={field.ref}
                      />
                    )}
                  />
                  {error ? <p className="text-xs text-destructive">{error}</p> : null}
                </td>,
              ];
            })}
          </tr>
          <tr>
            <th scope="row" className={head}>2. ST · espacio requerido, ancho m-d de los mesiales al 1er molar</th>
            {NANCE_ARCHES.map((arch) => {
              const total = archTotal(nance?.[arch.widths], arch.teeth);
              return [
                <th key={`${arch.key}-label`} scope="col" className="bg-muted px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  {arch.label}
                </th>,
                <td key={arch.key} className="px-2 py-1.5">
                  <ComputedValue label={`ST, espacio requerido ${arch.label.toLowerCase()}`} className="w-24">
                    {total === null ? "" : `${formatMm(total)} mm`}
                  </ComputedValue>
                </td>,
              ];
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
