import { Controller, useFormContext, useWatch } from "react-hook-form";
import { ComputedValue } from "@/modules/core/components/form/ComputedValue";
import { fieldError } from "@/modules/core/components/form/fieldError";
import { NumberInput } from "@/modules/core/ui/number-input";
import type { RecordFormValues } from "../../schemas/record";
import { NANCE_ARCHES } from "../../config/nance";
import { archTotal } from "../../utils/nance";
import { formatMm } from "../../utils/transversal";

/** Fila de la grilla: bloque apilado en celular, columnas (etiqueta · Superior · Inferior) desde `sm`. */
const ROW = "grid gap-2 border-b border-border p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4";
const CELL = "flex items-center justify-between gap-2 sm:justify-start";
const SIDE = "text-xs font-medium text-muted-foreground";

/**
 * Puntos 1 y 2 de la ficha de Nance & Carey, como en el PDF: 1. SA (espacio disponible o longitud
 * de arco, se escribe por arcada) y 2. ST (espacio requerido, el total de los anchos, calculado).
 * Es una grilla con roles de tabla: en celular cada punto se apila con su etiqueta completa y los
 * campos "Superior" e "Inferior" visibles (la tabla cortaba la columna "Inferior").
 */
export function NanceSpaceRows() {
  const { control, formState } = useFormContext<RecordFormValues>();
  const nance = useWatch({ control, name: "content.models.nance" });

  return (
    <div role="table" aria-label="Espacio disponible y requerido" className="rounded-md border border-border text-sm">
      <div role="rowgroup">
        <div role="row" className={ROW}>
          <span role="rowheader" className="font-medium">1. SA · espacio disponible o longitud de arco</span>
          {NANCE_ARCHES.map((arch) => {
            const name = `content.models.nance.${arch.available}` as const;
            const error = fieldError(formState.errors, name);
            return (
              <div key={arch.key} role="cell" className="flex flex-col gap-1">
                <span className={CELL}>
                  <span className={SIDE} aria-hidden="true">{arch.label}</span>
                  <Controller
                    control={control}
                    name={name}
                    render={({ field }) => (
                      <NumberInput
                        step={0.1}
                        className="w-28"
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
                </span>
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
              </div>
            );
          })}
        </div>
        <div role="row" className={ROW}>
          <span role="rowheader" className="font-medium">2. ST · espacio requerido, ancho m-d de los mesiales al 1er molar</span>
          {NANCE_ARCHES.map((arch) => {
            const total = archTotal(nance?.[arch.widths], arch.teeth);
            return (
              <div key={arch.key} role="cell" className={CELL}>
                <span className={SIDE} aria-hidden="true">{arch.label}</span>
                <ComputedValue label={`ST, espacio requerido ${arch.label.toLowerCase()}`} className="w-28">
                  {total === null ? "" : `${formatMm(total)} mm`}
                </ComputedValue>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
